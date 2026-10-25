// NV10.5 — Edge Function nhận Database Webhook khi có bản ghi mới (hoặc cập
// nhật, vì submit_lp_lead có thể update lead cũ trong 10 phút) trong bảng
// `leads`, gửi tin Telegram tới chat của sale phụ trách + chat admin.
//
// Secrets cần set trước khi deploy (KHÔNG để trong code / frontend):
//   supabase secrets set TELEGRAM_BOT_TOKEN=xxx
//   supabase secrets set ADMIN_TELEGRAM_CHAT_ID=xxx
// (SUPABASE_URL và SUPABASE_SERVICE_ROLE_KEY đã có sẵn tự động trong mọi
// Edge Function, không cần tự set.)
//
// Deploy: supabase functions deploy notify-lead
// Sau đó tạo Database Webhook (Supabase Dashboard → Database → Webhooks):
//   Table: leads · Events: Insert, Update · gọi HTTP POST tới URL của hàm này.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const SEG_LABEL: Record<string, string> = {
  'can-ho': 'Căn hộ',
  'nha-pho-du-an': 'Nhà phố dự án',
  'nha-pho': 'Nhà phố',
  villa: 'Villa',
};
const SCORE_LABEL: Record<string, string> = { hot: 'NÓNG', warm: 'ẤM', cold: 'LẠNH' };

function formatVnd(n: number | null | undefined): string {
  if (n == null) return '—';
  return Math.round(n).toLocaleString('vi-VN') + 'đ';
}

async function sendTelegram(botToken: string, chatId: string, text: string) {
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}

Deno.serve(async req => {
  try {
    const payload = await req.json();
    const lead = payload.record;
    if (!lead) return new Response('no record', { status: 400 });

    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const adminChatId = Deno.env.get('ADMIN_TELEGRAM_CHAT_ID');
    if (!botToken) return new Response('TELEGRAM_BOT_TOKEN chưa được set', { status: 500 });

    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    let saleChatId: string | null = null;
    if (lead.sale_code) {
      const { data: sale } = await supabaseAdmin
        .from('sales_reps')
        .select('telegram_chat_id')
        .eq('code', lead.sale_code)
        .maybeSingle();
      saleChatId = sale?.telegram_chat_id || null;
    }

    const estimate = lead.estimate || {};
    const scoreLabel = SCORE_LABEL[lead.lead_score as string] || lead.lead_score || '—';
    const segLabel = SEG_LABEL[lead.seg as string] || lead.seg || '—';
    const adminUrl = `${Deno.env.get('ADMIN_SITE_URL') || ''}/admin/landing/leads`;

    const lines = [
      `[${scoreLabel}] ${lead.name} – ${lead.phone}`,
      `${segLabel} · ${estimate.area_m2 ? estimate.area_m2 + 'm²' : '—'} · ${estimate.tier || '—'} · ${estimate.start_time || '—'}`,
      `${estimate.gia_tu ? `${formatVnd(estimate.gia_tu)} – ${formatVnd(estimate.gia_den)}` : 'Chưa tính khái toán'} · Quà: ${lead.gift || '—'} · Giờ tiện gọi: ${lead.call_time || '—'}`,
      `Nguồn: ${lead.sale_code || '—'} / ${lead.source || '—'}`,
      adminUrl,
    ];
    const text = lines.join('\n');

    const sends: Promise<void>[] = [];
    if (saleChatId) sends.push(sendTelegram(botToken, saleChatId, text));
    if (adminChatId) sends.push(sendTelegram(botToken, adminChatId, text));
    await Promise.all(sends);

    return new Response('ok');
  } catch (err) {
    console.error(err);
    return new Response('error', { status: 500 });
  }
});
