import { useState } from "react";
import { Info, Edit2, Check, X, ClipboardList } from "lucide-react";

type RoleType = "Chủ trì" | "Phối hợp" | "Tư vấn" | "Nhận tin" | "—";

interface ProcessRow {
  step: string;
  design: RoleType;
  drafting2d: RoleType;
  construction: RoleType;
  factory: RoleType;
  client: RoleType;
  days: string;
  input: string;
  output: string;
  isMilestone?: boolean;
}

const TABLE_DATA: ProcessRow[] = [
  { step: "① Khảo sát hiện trạng", design: "Chủ trì", drafting2d: "Phối hợp", construction: "Tư vấn", factory: "—", client: "Nhận tin", days: "2", input: "Hợp đồng + KH", output: "→ Concept" },
  { step: "② Concept – công năng", design: "Chủ trì", drafting2d: "Phối hợp", construction: "—", factory: "—", client: "Phối hợp", days: "4", input: "Hiện trạng + nhu cầu KH", output: "→ 2D layout" },
  { step: "③ Triển khai 2D layout", design: "Tư vấn", drafting2d: "Chủ trì", construction: "—", factory: "—", client: "Tư vấn", days: "3", input: "Concept đã duyệt", output: "→ Chốt 2D" },
  { step: "★ Chốt 2D layout", design: "Phối hợp", drafting2d: "Phối hợp", construction: "Nhận tin", factory: "Nhận tin", client: "Chủ trì", days: "1–2", input: "Bản vẽ 2D layout", output: "→ 3D Render", isMilestone: true },
  { step: "④ 3D Render – dựng & sửa", design: "Chủ trì", drafting2d: "Tư vấn", construction: "—", factory: "—", client: "Tư vấn", days: "6–8", input: "Layout đã chốt", output: "→ Chốt 3D" },
  { step: "★ Chốt 3D", design: "Phối hợp", drafting2d: "Nhận tin", construction: "—", factory: "Nhận tin", client: "Chủ trì", days: "1–2", input: "3D Render hoàn chỉnh", output: "→ Báo giá", isMilestone: true },
  { step: "⑤ Lập báo giá thi công", design: "Tư vấn", drafting2d: "Chủ trì", construction: "Phối hợp", factory: "Phối hợp", client: "Nhận tin", days: "3–4", input: "3D + layout đã chốt", output: "→ Chốt báo giá" },
  { step: "★ Chốt báo giá", design: "Nhận tin", drafting2d: "Phối hợp", construction: "Nhận tin", factory: "Nhận tin", client: "Chủ trì", days: "2–3", input: "Bảng báo giá", output: "→ Hồ sơ 2D", isMilestone: true },
  { step: "⑥ Hồ sơ 2D + vật liệu + TB", design: "Tư vấn", drafting2d: "Chủ trì", construction: "Tư vấn", factory: "Tư vấn", client: "Phối hợp", days: "7", input: "Báo giá đã chốt", output: "→ Chốt hồ sơ" },
  { step: "★ Chốt hồ sơ 2D", design: "Phối hợp", drafting2d: "Phối hợp", construction: "Nhận tin", factory: "Nhận tin", client: "Chủ trì", days: "1–2", input: "Hồ sơ 2D + vật liệu", output: "→ TC + Xưởng", isMilestone: true },
  { step: "⑦ Thi công tại căn hộ", design: "Tư vấn", drafting2d: "Tư vấn", construction: "Chủ trì", factory: "—", client: "Nhận tin", days: "21–28", input: "Hồ sơ đã chốt", output: "→ Lắp đặt" },
  { step: "⑦ Lên hàng nội thất (xưởng)", design: "Tư vấn", drafting2d: "Tư vấn", construction: "—", factory: "Chủ trì", client: "Nhận tin", days: "21–28", input: "Hồ sơ + spec đã chốt", output: "→ Lắp đặt" },
  { step: "⑧ Lắp đặt & hoàn thiện", design: "Tư vấn", drafting2d: "—", construction: "Phối hợp", factory: "Chủ trì", client: "Nhận tin", days: "14", input: "MB TC + hàng xưởng", output: "→ Nghiệm thu" },
  { step: "★ Nghiệm thu & bàn giao", design: "Phối hợp", drafting2d: "Nhận tin", construction: "Phối hợp", factory: "Phối hợp", client: "Chủ trì", days: "1–2", input: "Công trình hoàn thiện", output: "→ Bảo hành", isMilestone: true }
];

const ROLE_STYLE: Record<string, string> = {
  "Chủ trì": "text-amber-600 font-semibold",
  "Phối hợp": "text-blue-600 font-medium",
  "Tư vấn": "text-emerald-600",
  "Nhận tin": "text-gray-400",
};

const RoleBadge = ({ role }: { role: RoleType }) => {
  if (role === "—") return <span className="text-gray-300 text-[11px]">—</span>;
  return <span className={`text-[11px] leading-tight ${ROLE_STYLE[role] || "text-slate-400"}`}>{role}</span>;
};

interface CoordinationProcessTableProps {
  steps?: any[];
  isEditing?: boolean;
  onUpdateChecklist?: (phase: string, actions: string[]) => void;
}

export default function CoordinationProcessTable({ steps = [], isEditing, onUpdateChecklist }: CoordinationProcessTableProps) {
  const [editingPhase, setEditingPhase] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [hoveredStep, setHoveredStep] = useState<string | null>(null);

  const getChecklist = (phase: string): string[] => {
    const step = steps.find(s => s.phase === phase);
    return step?.actions || [];
  };

  const startEdit = (phase: string) => {
    setEditingPhase(phase);
    setEditValue(getChecklist(phase).join("\n"));
  };

  const saveEdit = () => {
    if (editingPhase && onUpdateChecklist) {
      const newActions = editValue.split("\n").map(s => s.trim()).filter(s => s.length > 0);
      onUpdateChecklist(editingPhase, newActions);
    }
    setEditingPhase(null);
  };

  return (
    <div className="w-full">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-3 text-[12px] px-1">
        <span><span className="text-amber-600 font-semibold">Chủ trì</span> = làm chính</span>
        <span><span className="text-blue-600 font-medium">Phối hợp</span> = tham gia</span>
        <span><span className="text-emerald-600">Tư vấn</span> = hỏi ý kiến</span>
        <span><span className="text-gray-400">Nhận tin</span> = thông báo</span>
      </div>

      <div className="rounded-xl border border-[#333] shadow-sm">
        <table className="w-full text-left border-collapse bg-[#222] table-fixed">
          <colgroup>
            <col style={{ width: '22%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '6%' }} />
            <col style={{ width: '16%' }} />
            <col style={{ width: '16%' }} />
          </colgroup>
          <thead>
            <tr className="bg-gray-800 text-gray-100 text-[11px]">
              <th className="px-2 py-2.5 font-semibold">Bước công việc</th>
              <th className="px-1.5 py-2.5 font-semibold text-center">TK</th>
              <th className="px-1.5 py-2.5 font-semibold text-center">2D</th>
              <th className="px-1.5 py-2.5 font-semibold text-center">TC</th>
              <th className="px-1.5 py-2.5 font-semibold text-center">Xưởng</th>
              <th className="px-1.5 py-2.5 font-semibold text-center">KH</th>
              <th className="px-1.5 py-2.5 font-semibold text-center">Ngày</th>
              <th className="px-2 py-2.5 font-semibold">Nhận đầu vào từ</th>
              <th className="px-2 py-2.5 font-semibold">Bàn giao cho</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {TABLE_DATA.map((row, idx) => {
              const checklist = getChecklist(row.step);
              const isEditingThis = editingPhase === row.step;
              const hasChecklist = checklist.length > 0;
              const isHovered = hoveredStep === row.step;

              return (
                <tr
                  key={idx}
                  className={`transition-colors hover:bg-[#1c1c1c] ${row.isMilestone ? 'bg-red-50/50' : ''}`}
                >
                  {/* Bước công việc — hover here to show tooltip */}
                  <td
                    className={`px-2 py-2 text-[12px] ${row.isMilestone ? 'font-bold text-red-700' : 'font-medium text-slate-50'}`}
                    style={{ position: 'relative', zIndex: isHovered ? 100 : 'auto' }}
                    onMouseEnter={() => { if (!isEditing && hasChecklist) setHoveredStep(row.step); }}
                    onMouseLeave={() => setHoveredStep(null)}
                  >
                    <div className="flex items-center gap-1">
                      <span className={`truncate ${hasChecklist && !isEditing ? 'cursor-help underline decoration-dotted decoration-purple-300 underline-offset-2' : ''}`}>
                        {row.step}
                      </span>

                      {hasChecklist && !isEditing && (
                        <span className="bg-purple-100 text-purple-700 text-[9px] w-4 h-4 rounded-full font-bold flex items-center justify-center flex-shrink-0">
                          {checklist.length}
                        </span>
                      )}

                      {isEditing && (
                        <button
                          onClick={() => startEdit(row.step)}
                          className="p-1 rounded text-purple-500 hover:text-purple-700 hover:bg-purple-100 border border-purple-200 flex-shrink-0"
                          title="Sửa checklist"
                        >
                          <Edit2 size={10} />
                        </button>
                      )}
                    </div>

                    {/* Tooltip — controlled by JS state, not CSS hover */}
                    {isHovered && hasChecklist && !isEditing && (
                      <div
                        style={{ position: 'absolute', left: 0, top: '100%', marginTop: 4, width: 320, zIndex: 9999 }}
                        className="bg-[#222] rounded-xl shadow-2xl border border-[#333] p-4"
                        onMouseEnter={() => setHoveredStep(row.step)}
                        onMouseLeave={() => setHoveredStep(null)}
                      >
                        <div className="flex items-center gap-2 mb-2 text-purple-700 font-semibold text-[13px] border-b border-purple-100 pb-2">
                          <ClipboardList size={15} />
                          Checklist đầu ra
                        </div>
                        <ul className="space-y-1">
                          {checklist.map((item, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-[11px] text-slate-200 leading-relaxed" style={{ whiteSpace: 'normal' }}>
                              <span className="text-purple-500 mt-0.5 flex-shrink-0">✓</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="absolute -top-2 left-5 w-3 h-3 bg-[#222] border-t border-l border-[#333] rotate-45" />
                      </div>
                    )}

                    {/* Inline Edit Form */}
                    {isEditingThis && (
                      <div
                        style={{ position: 'absolute', left: 0, top: '100%', marginTop: 4, width: 400, zIndex: 9999, whiteSpace: 'normal' }}
                        className="bg-[#222] rounded-xl shadow-2xl border border-purple-200 p-4"
                      >
                        <label className="block text-xs font-semibold text-purple-800 mb-1 flex items-center gap-1.5">
                          <ClipboardList size={13} /> Checklist — {row.step}
                        </label>
                        <p className="text-[10px] text-purple-500 mb-2">Mỗi dòng = 1 mục</p>
                        <textarea
                          autoFocus
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-full border border-purple-200 rounded-lg p-2.5 text-[12px] min-h-[120px] focus:outline-none focus:ring-2 focus:ring-purple-500 bg-purple-50/30"
                          placeholder="Nhập checklist..."
                        />
                        <div className="flex justify-end gap-2 mt-2">
                          <button onClick={() => setEditingPhase(null)} className="px-2.5 py-1 text-[11px] bg-[#2a2a2a] hover:bg-gray-200 text-gray-600 rounded-lg flex items-center gap-1 border border-[#333]">
                            <X size={12} /> Hủy
                          </button>
                          <button onClick={saveEdit} className="px-2.5 py-1 text-[11px] bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-1 font-medium shadow-sm">
                            <Check size={12} /> Lưu
                          </button>
                        </div>
                      </div>
                    )}
                  </td>

                  <td className="px-1.5 py-2 text-center"><RoleBadge role={row.design} /></td>
                  <td className="px-1.5 py-2 text-center"><RoleBadge role={row.drafting2d} /></td>
                  <td className="px-1.5 py-2 text-center"><RoleBadge role={row.construction} /></td>
                  <td className="px-1.5 py-2 text-center"><RoleBadge role={row.factory} /></td>
                  <td className="px-1.5 py-2 text-center"><RoleBadge role={row.client} /></td>
                  <td className="px-1.5 py-2 text-center font-mono text-[11px] font-semibold text-slate-200">{row.days}</td>
                  <td className="px-2 py-2 text-[11px] text-blue-600 truncate">{row.input}</td>
                  <td className="px-2 py-2 text-[11px] text-red-600 truncate">{row.output}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-3 p-2.5 bg-[#1c1c1c] rounded-lg text-[11px] text-slate-400 flex items-start gap-2 border border-[#333]">
        <Info size={14} className="text-gray-400 mt-0.5 shrink-0" />
        <p>Hàng đỏ <span className="text-red-600 font-bold">★</span> = mốc chốt KH. Bước ⑦ chạy song song. Tổng ≈ 66–81 ngày. <strong className="text-purple-600">Rê chuột vào cột "Bước công việc"</strong> để xem checklist đầu ra.</p>
      </div>
    </div>
  );
}
