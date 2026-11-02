// "Bộ não" chung cho mọi kênh chat của DQH (Zalo qua bot Render, Zalo OA, Telegram).
// Kênh chỉ chuyển tin nhắn vào đây; trợ lý dùng đúng 10 tool của MCP (lib/core/mcp.js),
// nên app, MCP, Telegram, Zalo đều ra cùng một kết quả.
//
// An toàn: giao việc / sửa việc luôn "xem trước". Bản xem trước được lưu ở ai_chat_pending,
// chỉ khi CHÍNH người đó trả lời "ok / đồng ý" thì mới ghi. Mô hình AI không tự xác nhận được.
import { db, check, CoreError } from './db.js';
import { TOOLS, callTool } from './mcp.js';
import { resolveSender } from './people.js';
import { todayVN } from './text.js';

const YES = /^\s*(ok|oke|okay|đồng ý|dong y|đúng|dung|có|co|yes|y|xác nhận|xac nhan|chốt|chot|được|duoc)\s*[.!]*\s*$/i;
const NO = /^\s*(không|khong|ko|k|huỷ|hủy|huy|thôi|thoi|no|sai)\s*[.!]*\s*$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PENDING_TTL_MS = 20 * 60_000;
const COLUMN = { zalo: 'zalo_user_id', telegram: 'telegram_chat_id' };

/** Bỏ các trường kênh chat không cần (bot tự điền sender, tự xác nhận) và từ khoá schema Gemini không hiểu. */
function cleanSchema(schema) {
  const walk = (s) => {
    if (!s || typeof s !== 'object') return s;
    const out = {};
    for (const [k, v] of Object.entries(s)) {
      if (['pattern', 'default', 'maxLength'].includes(k)) continue;
      if (k === 'type' && Array.isArray(v)) { out.type = v.find(t => t !== 'null') || 'string'; continue; }
      if (k === 'properties') {
        out.properties = Object.fromEntries(Object.entries(v)
          .filter(([pk]) => !['sender', 'confirm', 'request_id'].includes(pk))
          .map(([pk, pv]) => [pk, walk(pv)]));
        continue;
      }
      out[k] = typeof v === 'object' && !Array.isArray(v) ? walk(v) : v;
    }
    return out;
  };
  return walk(schema);
}

export function toolDeclarations() {
  return TOOLS.map(t => ({ name: t.name, description: t.description, parametersJsonSchema: cleanSchema(t.inputSchema) }));
}

/** Gọi Gemini có function calling. Trả { text, calls:[{name,args}] }. */
export async function geminiLLM({ system, contents, tools }) {
  const key = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!key) throw new CoreError(500, 'Chưa cấu hình GEMINI_API_KEY');
  const { GoogleGenAI } = await import('@google/genai');
  const ai = new GoogleGenAI({ apiKey: key });
  const r = await ai.models.generateContent({
    model: process.env.CHAT_MODEL || 'gemini-2.5-flash',
    contents,
    config: { systemInstruction: system, temperature: 0.2, tools: [{ functionDeclarations: tools }] },
  });
  return { text: r.text || '', calls: (r.functionCalls || []).map(c => ({ name: c.name, args: c.args || {} })) };
}

function systemPrompt(person) {
  return [
    `Bạn là trợ lý dự án của DQH Architects, đang nhắn với ${person.full_name} (${person.role || 'nhân sự'}).`,
    `Hôm nay là ${todayVN()} (giờ Việt Nam). Đổi "thứ 6", "mai", "tuần sau"… ra ngày YYYY-MM-DD.`,
    'Trả lời tiếng Việt, ngắn gọn như nhắn tin, không dùng bảng, không markdown đậm.',
    '"Tôi", "em", "mình" = người đang nhắn: dùng mine=true hoặc để trống assignee khi hỏi việc của họ.',
    'Nhật ký công trình (kind=nhat_ky): tách khu vực, đội, số công, hạng mục, %, vướng mắc, kế hoạch mai vào đúng trường.',
    'Biểu mẫu giám sát: title bắt đầu bằng mã, ví dụ "GS-06 · Sự cố / phát sinh".',
    'Không bịa số liệu. Thiếu thông tin bắt buộc thì hỏi lại 1 câu.',
  ].join('\n');
}

async function getPending(channel, senderId) {
  const rows = check(await db().from('ai_chat_pending').select('*').eq('channel', channel).eq('sender_id', senderId).limit(1), 'đọc lệnh chờ xác nhận');
  const p = rows?.[0];
  if (!p) return null;
  if (Date.now() - new Date(p.created_at).getTime() > PENDING_TTL_MS) { await clearPending(channel, senderId); return null; }
  return p;
}
async function setPending(channel, senderId, tool, args, summary) {
  await clearPending(channel, senderId);
  check(await db().from('ai_chat_pending').insert({ channel, sender_id: senderId, tool, args, summary }), 'lưu lệnh chờ xác nhận');
}
async function clearPending(channel, senderId) {
  await db().from('ai_chat_pending').delete().eq('channel', channel).eq('sender_id', senderId);
}

function previewText(p) {
  const lines = Object.entries(p).filter(([k]) => !['xem_truoc', 'chua_ghi', 'huong_dan'].includes(k))
    .map(([k, v]) => `- ${k.replace(/_/g, ' ')}: ${typeof v === 'object' ? JSON.stringify(v) : v}`);
  return lines.join('\n');
}
function shortResult(r) {
  if (r && typeof r.text === 'string') return r.text;
  const s = JSON.stringify(r);
  return s.length > 6000 ? s.slice(0, 6000) + '…' : s;
}

/**
 * Xử lý 1 tin nhắn. channel: 'zalo' | 'telegram'. Trả về câu trả lời (chuỗi).
 * llm: tiêm hàm khác để kiểm thử.
 */
export async function handleChatMessage({ channel, senderId, text, llm = geminiLLM }) {
  const msg = String(text || '').trim();
  if (!channel || !senderId || !msg) throw new CoreError(400, 'Thiếu kênh, người gửi hoặc nội dung');
  const col = COLUMN[channel];
  if (!col) throw new CoreError(400, `Kênh không hỗ trợ: ${channel}`);

  // 1) Liên kết tài khoản bằng email đăng nhập app
  if (EMAIL.test(msg)) {
    const rows = check(await db().from('profiles').update({ [col]: String(senderId) }).eq('email', msg.toLowerCase()).select('full_name'), 'liên kết tài khoản');
    return rows?.length
      ? `Đã liên kết ${channel === 'zalo' ? 'Zalo' : 'Telegram'} với tài khoản ${rows[0].full_name}. Thử nhắn: "việc của tôi hôm nay".`
      : `Không tìm thấy email ${msg} trong app DQH. Kiểm tra lại email đăng nhập.`;
  }

  // 2) Nhận diện người nhắn
  let person;
  try { person = await resolveSender(`${channel}:${senderId}`); }
  catch { return 'Tài khoản này chưa liên kết với app DQH. Gửi email đăng nhập app của bạn vào đây để liên kết.'; }

  const ctx = { key_id: null, name: `${channel}-bot`, scopes: ['read', 'write', 'delegate'], actor: person };
  const sender = `${channel}:${senderId}`;

  // 3) Trả lời cho lệnh đang chờ xác nhận
  const pending = await getPending(channel, String(senderId));
  if (pending && YES.test(msg)) {
    await clearPending(channel, String(senderId));
    try {
      const r = await callTool(pending.tool, { ...pending.args, sender, confirm: true }, ctx);
      const done = pending.tool === 'create_task' ? `Đã giao: ${r.viec} → ${r.nguoi_nhan}, hạn ${r.han}. (${r.thong_bao})` : `Đã cập nhật: ${r.viec}.`;
      return done;
    } catch (e) { return `Không ghi được: ${e.message}`; }
  }
  if (pending && NO.test(msg)) { await clearPending(channel, String(senderId)); return 'Đã huỷ, không ghi gì.'; }

  // 4) Hỏi AI, cho phép tối đa 4 vòng gọi tool
  const tools = toolDeclarations();
  const contents = [{ role: 'user', parts: [{ text: msg }] }];
  for (let round = 0; round < 4; round++) {
    const out = await llm({ system: systemPrompt(person), contents, tools });
    if (!out.calls.length) return out.text || 'Mình chưa hiểu, bạn nói rõ hơn giúp mình nhé.';
    contents.push({ role: 'model', parts: out.calls.map(c => ({ functionCall: { name: c.name, args: c.args } })) });
    const responses = [];
    for (const c of out.calls) {
      const tool = TOOLS.find(t => t.name === c.name);
      if (!tool) { responses.push({ name: c.name, response: { error: 'Không có tool này' } }); continue; }
      const args = { ...c.args, sender };
      delete args.confirm;
      try {
        const r = await callTool(c.name, args, ctx);
        if (tool.confirm && r?.xem_truoc) {
          await setPending(channel, String(senderId), c.name, { ...c.args }, r);
          return `Xác nhận giúp mình:\n${previewText(r)}\n\nTrả lời OK để ghi, KHÔNG để huỷ.`;
        }
        responses.push({ name: c.name, response: { result: shortResult(r) } });
      } catch (e) {
        responses.push({ name: c.name, response: { error: e.message, details: e.details ?? null } });
      }
    }
    contents.push({ role: 'user', parts: responses.map(r => ({ functionResponse: r })) });
  }
  return 'Yêu cầu hơi dài, bạn tách nhỏ giúp mình nhé.';
}
