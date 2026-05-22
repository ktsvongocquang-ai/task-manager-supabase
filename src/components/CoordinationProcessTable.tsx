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
  { step: "① Khảo sát hiện trạng", design: "Chủ trì", drafting2d: "Phối hợp", construction: "Tư vấn", factory: "—", client: "Nhận tin", days: "2", input: "Hợp đồng + KH", output: "Concept" },
  { step: "② Concept – công năng", design: "Chủ trì", drafting2d: "Phối hợp", construction: "—", factory: "—", client: "Phối hợp", days: "4", input: "File hiện trạng + nhu cầu KH", output: "2D layout" },
  { step: "③ Triển khai 2D layout", design: "Tư vấn", drafting2d: "Chủ trì", construction: "—", factory: "—", client: "Tư vấn", days: "3", input: "Concept đã duyệt", output: "Chốt 2D" },
  { step: "★ Chốt 2D layout", design: "Phối hợp", drafting2d: "Phối hợp", construction: "Nhận tin", factory: "Nhận tin", client: "Chủ trì", days: "1-2", input: "Bản vẽ 2D layout", output: "3D Render", isMilestone: true },
  { step: "④ 3D Render – dựng & sửa", design: "Chủ trì", drafting2d: "Tư vấn", construction: "—", factory: "—", client: "Tư vấn", days: "6-8", input: "Layout đã chốt", output: "Chốt 3D" },
  { step: "★ Chốt 3D", design: "Phối hợp", drafting2d: "Nhận tin", construction: "—", factory: "Nhận tin", client: "Chủ trì", days: "1-2", input: "3D Render hoàn chỉnh", output: "Báo giá", isMilestone: true },
  { step: "⑤ Lập báo giá thi công", design: "Tư vấn", drafting2d: "Chủ trì", construction: "Phối hợp", factory: "Phối hợp", client: "Nhận tin", days: "3-4", input: "3D + layout đã chốt", output: "Chốt báo giá" },
  { step: "★ Chốt báo giá", design: "Nhận tin", drafting2d: "Phối hợp", construction: "Nhận tin", factory: "Nhận tin", client: "Chủ trì", days: "2-3", input: "Bảng báo giá", output: "Hồ sơ 2D", isMilestone: true },
  { step: "⑥ Hồ sơ 2D + vật liệu + TB", design: "Tư vấn", drafting2d: "Chủ trì", construction: "Tư vấn", factory: "Tư vấn", client: "Phối hợp", days: "7", input: "Báo giá đã chốt", output: "Chốt hồ sơ" },
  { step: "★ Chốt hồ sơ 2D", design: "Phối hợp", drafting2d: "Phối hợp", construction: "Nhận tin", factory: "Nhận tin", client: "Chủ trì", days: "1-2", input: "Hồ sơ 2D + vật liệu", output: "Thi công + Xưởng", isMilestone: true },
  { step: "⑦ Thi công tại căn hộ", design: "Tư vấn", drafting2d: "Tư vấn", construction: "Chủ trì", factory: "—", client: "Nhận tin", days: "21-28", input: "Hồ sơ đã chốt", output: "Lắp đặt" },
  { step: "⑦ Lên hàng nội thất (xưởng)", design: "Tư vấn", drafting2d: "Tư vấn", construction: "—", factory: "Chủ trì", client: "Nhận tin", days: "21-28", input: "Hồ sơ + spec đã chốt", output: "Lắp đặt" },
  { step: "⑧ Lắp đặt & hoàn thiện", design: "Tư vấn", drafting2d: "—", construction: "Phối hợp", factory: "Chủ trì", client: "Nhận tin", days: "14", input: "Mặt bằng TC + hàng từ xưởng", output: "Nghiệm thu" },
  { step: "★ Nghiệm thu & bàn giao", design: "Phối hợp", drafting2d: "Nhận tin", construction: "Phối hợp", factory: "Phối hợp", client: "Chủ trì", days: "1-2", input: "Công trình hoàn thiện", output: "Hết · bảo hành", isMilestone: true }
];

const RoleBadge = ({ role }: { role: RoleType }) => {
  if (role === "—") return <span className="text-gray-300">—</span>;
  
  let colorClass = "text-gray-500";
  if (role === "Chủ trì") colorClass = "text-amber-600 font-semibold";
  if (role === "Phối hợp") colorClass = "text-blue-600 font-medium";
  if (role === "Tư vấn") colorClass = "text-emerald-600";
  if (role === "Nhận tin") colorClass = "text-gray-400";
  
  return <span className={`text-[13px] ${colorClass}`}>{role}</span>;
};

interface CoordinationProcessTableProps {
  steps?: any[];
  isEditing?: boolean;
  onUpdateChecklist?: (phase: string, actions: string[]) => void;
}

export default function CoordinationProcessTable({ steps = [], isEditing, onUpdateChecklist }: CoordinationProcessTableProps) {
  const [editingPhase, setEditingPhase] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const getChecklist = (phase: string): string[] => {
    const step = steps.find(s => s.phase === phase);
    return step?.actions || [];
  };

  const startEdit = (phase: string) => {
    setEditingPhase(phase);
    setEditValue(getChecklist(phase).join("\\n"));
  };

  const saveEdit = () => {
    if (editingPhase && onUpdateChecklist) {
      const newActions = editValue.split("\\n").map(s => s.trim()).filter(s => s.length > 0);
      onUpdateChecklist(editingPhase, newActions);
    }
    setEditingPhase(null);
  };

  return (
    <div className="w-full pb-32"> {/* Extra padding bottom for tooltips */}
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mb-4 text-sm px-2">
        <span className="flex items-center gap-1.5"><span className="text-amber-600 font-semibold">Chủ trì</span> = làm chính</span>
        <span className="flex items-center gap-1.5"><span className="text-blue-600 font-medium">Phối hợp</span> = tham gia trực tiếp</span>
        <span className="flex items-center gap-1.5"><span className="text-emerald-600">Tư vấn</span> = được hỏi ý kiến</span>
        <span className="flex items-center gap-1.5"><span className="text-gray-400">Nhận tin</span> = được thông báo</span>
      </div>

      <div className="rounded-xl border border-gray-200 shadow-sm overflow-visible">
        <table className="w-full text-left border-collapse bg-white whitespace-nowrap overflow-visible">
          <thead>
            <tr className="bg-gray-800 text-gray-100 text-[13px]">
              <th className="p-3 font-semibold border-b border-gray-700 w-1/4">Bước công việc</th>
              <th className="p-3 font-semibold border-b border-gray-700">Thiết kế</th>
              <th className="p-3 font-semibold border-b border-gray-700">2D</th>
              <th className="p-3 font-semibold border-b border-gray-700">Thi công</th>
              <th className="p-3 font-semibold border-b border-gray-700">Xưởng</th>
              <th className="p-3 font-semibold border-b border-gray-700">Khách hàng</th>
              <th className="p-3 font-semibold border-b border-gray-700 text-center">Số ngày</th>
              <th className="p-3 font-semibold border-b border-gray-700">Nhận đầu vào từ</th>
              <th className="p-3 font-semibold border-b border-gray-700">Bàn giao cho</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {TABLE_DATA.map((row, idx) => {
              const checklist = getChecklist(row.step);
              const isEditingThis = editingPhase === row.step;

              return (
                <tr 
                  key={idx} 
                  className={`transition-colors hover:bg-gray-50 group relative ${row.isMilestone ? 'bg-red-50/40' : ''}`}
                >
                  <td className={`p-3 text-[13px] ${row.isMilestone ? 'font-bold text-red-700' : 'font-medium text-gray-900'}`}>
                    <div className="flex items-center gap-2">
                      <span className="cursor-help relative">
                        {row.step}
                        
                        {/* Hover Tooltip */}
                        {checklist.length > 0 && !isEditing && (
                          <div className="absolute left-0 top-full mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none">
                            <div className="flex items-center gap-2 mb-2 text-purple-700 font-semibold text-sm border-b border-gray-100 pb-2">
                              <ClipboardList size={16} />
                              Checklist Thông Tin
                            </div>
                            <ul className="space-y-1.5">
                              {checklist.map((item, i) => (
                                <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600 whitespace-normal">
                                  <span className="text-purple-400 mt-1 flex-shrink-0">•</span>
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                            <div className="absolute -top-2 left-4 w-4 h-4 bg-white border-t border-l border-gray-200 rotate-45"></div>
                          </div>
                        )}
                      </span>

                      {/* Editing Button & Mode */}
                      {isEditing && (
                        <button 
                          onClick={() => startEdit(row.step)}
                          className="p-1 rounded text-gray-400 hover:text-purple-600 hover:bg-purple-50"
                        >
                          <Edit2 size={12} />
                        </button>
                      )}
                      {checklist.length > 0 && isEditing && (
                        <span className="bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0.5 rounded-full font-semibold">
                          {checklist.length} mục
                        </span>
                      )}
                    </div>

                    {/* Inline Edit Form */}
                    {isEditingThis && (
                      <div className="absolute left-0 top-full mt-1 w-[400px] bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50 whitespace-normal">
                        <label className="block text-xs font-semibold text-gray-700 mb-2">Checklist (mỗi mục 1 dòng)</label>
                        <textarea
                          autoFocus
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-full border border-gray-200 rounded-lg p-2 text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="Mỗi dòng là một checklist item..."
                        />
                        <div className="flex justify-end gap-2 mt-3">
                          <button onClick={() => setEditingPhase(null)} className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded flex items-center gap-1">
                            <X size={14} /> Hủy
                          </button>
                          <button onClick={saveEdit} className="px-3 py-1.5 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded flex items-center gap-1 font-medium">
                            <Check size={14} /> Lưu checklist
                          </button>
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="p-3"><RoleBadge role={row.design} /></td>
                  <td className="p-3"><RoleBadge role={row.drafting2d} /></td>
                  <td className="p-3"><RoleBadge role={row.construction} /></td>
                  <td className="p-3"><RoleBadge role={row.factory} /></td>
                  <td className="p-3"><RoleBadge role={row.client} /></td>
                  <td className="p-3 text-center font-mono text-[13px] font-semibold text-gray-700">{row.days}</td>
                  <td className="p-3 text-[13px] text-blue-600">{row.input}</td>
                  <td className="p-3 text-[13px] text-red-600">→ {row.output}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600 flex items-start gap-2 border border-gray-100">
        <Info size={16} className="text-gray-400 mt-0.5 shrink-0" />
        <p>Hàng nền đỏ <span className="text-red-600">★</span> = mốc chốt với khách hàng. Bước ⑦ Thi công và Lên hàng chạy song song — không cộng dồn ngày. Tổng dự án ≈ 66-81 ngày.</p>
      </div>
    </div>
  );
}
