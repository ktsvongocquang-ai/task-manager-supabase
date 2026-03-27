import React, { useState, useEffect } from "react";
import {
  X,
  FileText,
  DollarSign,
  MessageSquare,
  ListPlus,
  Send,
  CheckCircle2,
  Calendar,
  Clock,
  Video,
  Plus,
  Trash2,
} from "lucide-react";

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: any) => void;
  initialData?: any;
}

const CONTRACT_STATUSES = [
  "Đang soạn HĐ",
  "Đã ký HĐ Thiết kế",
  "Đang thiết kế",
  "Chờ duyệt Concept",
  "Đã chốt 3D",
  "Bàn giao Hồ sơ",
  "Đã ký HĐ Thi công",
];
const PAYMENT_STAGES = [
  { id: 1, name: "Đợt 1: Cọc thiết kế (30%)" },
  { id: 2, name: "Đợt 2: Chốt 3D (50%)" },
  { id: 3, name: "Đợt 3: Bàn giao hồ sơ (20%)" },
  { id: 4, name: "Đợt 4: Cọc thi công (30%)" },
];

const DESIGN_WORKFLOW = [
  { id: "survey", label: "Khảo sát hiện trạng & Đo đạc" },
  { id: "contract", label: "Ký Hợp đồng Thiết kế" },
  { id: "concept", label: "Duyệt Concept mặt bằng 2D" },
  { id: "3d_v1", label: "Duyệt 3D lần 1" },
  { id: "3d_final", label: "Chốt 3D hoàn thiện" },
  { id: "technical", label: "Triển khai bản vẽ kỹ thuật" },
  { id: "handover", label: "Bàn giao Hồ sơ kỹ thuật" },
  { id: "quote", label: "Gửi Báo giá Thi công" },
  { id: "signed_construction", label: "Ký Hợp đồng Thi công" },
];

export default function ProjectModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: ProjectModalProps) {
  const [activeTab, setActiveTab] = useState<"general" | "timeline">("general");

  const [formData, setFormData] = useState({
    name: "",
    client: "",
    contractStatus: "Đang soạn HĐ",
    payments: [] as number[],
    designChecklist: [] as string[],
    feedbackRounds: 0,
    activityLog: [] as { date: string; content: string; link?: string }[],
    actual_start_date: "",
    design_days: 0,
    rough_construction_days: 0,
    finishing_days: 0,
    interior_days: 0,
    handover_date: "",
    shooting_milestones: [] as {
      id: string;
      milestone_date: string;
      content: string;
      status: string;
    }[],
  });

  const [newLog, setNewLog] = useState("");
  const [newLogLink, setNewLogLink] = useState("");

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...formData,
        ...initialData,
        payments: initialData.payments || [],
        designChecklist: initialData.designChecklist || [],
        activityLog: initialData.activityLog || [],
        actual_start_date: initialData.actual_start_date || "",
        design_days: initialData.design_days || 0,
        rough_construction_days: initialData.rough_construction_days || 0,
        finishing_days: initialData.finishing_days || 0,
        interior_days: initialData.interior_days || 0,
        handover_date: initialData.handover_date || "",
        shooting_milestones: initialData.shooting_milestones || [],
      });
    } else {
      setFormData({
        name: "",
        client: "",
        contractStatus: "Đang soạn HĐ",
        payments: [],
        designChecklist: [],
        feedbackRounds: 0,
        activityLog: [],
        actual_start_date: "",
        design_days: 0,
        rough_construction_days: 0,
        finishing_days: 0,
        interior_days: 0,
        handover_date: "",
        shooting_milestones: [],
      });
    }
    setActiveTab("general");
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const designProgress = Math.round(
    (formData.designChecklist.length / DESIGN_WORKFLOW.length) * 100,
  );

  const handleAddLog = () => {
    if (!newLog.trim()) return;
    const logEntry = {
      date: new Date().toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
      content: newLog.trim(),
      link: newLogLink.trim() || undefined,
    };
    setFormData({
      ...formData,
      activityLog: [logEntry, ...formData.activityLog],
    });
    setNewLog("");
    setNewLogLink("");
  };

  const togglePayment = (id: number) => {
    let newPayments = [...formData.payments];
    if (newPayments.includes(id)) {
      newPayments = newPayments.filter((item) => item !== id);
    } else {
      newPayments.push(id);
    }
    setFormData({ ...formData, payments: newPayments });
  };

  const toggleDesignTask = (id: string) => {
    let newChecklist = [...formData.designChecklist];
    if (newChecklist.includes(id)) {
      newChecklist = newChecklist.filter((item) => item !== id);
    } else {
      newChecklist.push(id);
    }

    // Auto update contract status based on checklist
    let newStatus = formData.contractStatus;
    if (newChecklist.includes("signed_construction")) {
      newStatus = "Đã ký HĐ Thi công";
    } else if (newChecklist.includes("handover")) {
      newStatus = "Bàn giao Hồ sơ";
    } else if (newChecklist.includes("3d_final")) {
      newStatus = "Đã chốt 3D";
    } else if (newChecklist.includes("contract")) {
      newStatus = "Đã ký HĐ Thiết kế";
    }

    setFormData({
      ...formData,
      designChecklist: newChecklist,
      contractStatus: newStatus,
    });
  };

  const handleAddMilestone = () => {
    setFormData({
      ...formData,
      shooting_milestones: [
        ...formData.shooting_milestones,
        {
          id: Math.random().toString(36).substr(2, 9),
          milestone_date: "",
          content: "",
          status: "pending",
        },
      ],
    });
  };

  const handleUpdateMilestone = (id: string, field: string, value: string) => {
    setFormData({
      ...formData,
      shooting_milestones: formData.shooting_milestones.map((m) =>
        m.id === id ? { ...m, [field]: value } : m,
      ),
    });
  };

  const handleRemoveMilestone = (id: string) => {
    setFormData({
      ...formData,
      shooting_milestones: formData.shooting_milestones.filter(
        (m) => m.id !== id,
      ),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...formData, progress: designProgress });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {initialData ? "Chi tiết Dự án" : "Thêm Dự án mới"}
            </h2>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-xs text-gray-500">
                Quản lý xuyên suốt: Thiết kế - Kế toán - Thi công
              </p>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full uppercase">
                Tiến độ thiết kế: {designProgress}%
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6 bg-white">
          <button
            onClick={() => setActiveTab("general")}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "general"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Thông tin chung
          </button>
          <button
            onClick={() => setActiveTab("timeline")}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "timeline"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Tiến độ thực tế
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form id="project-form" onSubmit={handleSubmit} className="space-y-8">
            {activeTab === "general" ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Info & Status */}
                <div className="lg:col-span-1 space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-500" /> Thông tin
                      chung
                    </h3>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                        Tên dự án
                      </label>
                      <input
                        required
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                        Khách hàng
                      </label>
                      <input
                        required
                        type="text"
                        value={formData.client}
                        onChange={(e) =>
                          setFormData({ ...formData, client: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                        Trạng thái Hợp đồng / Thiết kế
                      </label>
                      <select
                        value={formData.contractStatus}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            contractStatus: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      >
                        {CONTRACT_STATUSES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                    <h3 className="text-sm font-bold text-gray-900 border-b border-emerald-200 pb-2 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-500" /> Tiến
                      độ thanh toán (Kế toán)
                    </h3>
                    <div className="space-y-2">
                      {PAYMENT_STAGES.map((stage) => (
                        <label
                          key={stage.id}
                          className="flex items-center gap-3 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors border border-transparent hover:border-gray-200"
                        >
                          <input
                            type="checkbox"
                            checked={formData.payments.includes(stage.id)}
                            onChange={() => togglePayment(stage.id)}
                            className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                          />
                          <span
                            className={`text-sm font-medium ${formData.payments.includes(stage.id) ? "text-gray-900 line-through opacity-60" : "text-gray-700"}`}
                          >
                            {stage.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4 bg-orange-50/50 p-4 rounded-xl border border-orange-100">
                    <h3 className="text-sm font-bold text-gray-900 border-b border-orange-200 pb-2 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-orange-500" /> Phản
                      hồi thiết kế
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        Số lần sửa đổi:
                      </span>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              feedbackRounds: Math.max(
                                0,
                                formData.feedbackRounds - 1,
                              ),
                            })
                          }
                          className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                        >
                          -
                        </button>
                        <span className="font-bold text-lg w-4 text-center">
                          {formData.feedbackRounds}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              feedbackRounds: formData.feedbackRounds + 1,
                            })
                          }
                          className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Middle Column: Design Workflow (Kick-off tasks) */}
                <div className="lg:col-span-1 space-y-6">
                  <div className="space-y-4 bg-indigo-50/30 p-5 rounded-xl border border-indigo-100">
                    <h3 className="text-sm font-bold text-gray-900 border-b border-indigo-200 pb-2 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-indigo-500" /> Quy
                      trình Thiết kế (Kick-off)
                    </h3>
                    <div className="space-y-1">
                      {DESIGN_WORKFLOW.map((task) => (
                        <label
                          key={task.id}
                          className="flex items-center gap-3 p-2.5 hover:bg-white rounded-lg cursor-pointer transition-colors border border-transparent hover:border-indigo-100 group"
                        >
                          <input
                            type="checkbox"
                            checked={formData.designChecklist.includes(task.id)}
                            onChange={() => toggleDesignTask(task.id)}
                            className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                          />
                          <span
                            className={`text-xs font-medium transition-colors ${formData.designChecklist.includes(task.id) ? "text-gray-400 line-through" : "text-gray-700 group-hover:text-indigo-600"}`}
                          >
                            {task.label}
                          </span>
                        </label>
                      ))}
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4 pt-4 border-t border-indigo-100">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                          Hoàn thành thiết kế
                        </span>
                        <span className="text-xs font-bold text-indigo-700">
                          {designProgress}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-indigo-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                          style={{ width: `${designProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Logs */}
                <div className="lg:col-span-1 space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 border-b border-gray-200 pb-2 flex items-center gap-2">
                      <ListPlus className="w-4 h-4 text-purple-500" /> Nhật ký
                      dự án
                    </h3>

                    <div className="flex flex-col gap-2">
                      <input
                        type="text"
                        value={newLog}
                        onChange={(e) => setNewLog(e.target.value)}
                        onKeyPress={(e) =>
                          e.key === "Enter" &&
                          (e.preventDefault(), handleAddLog())
                        }
                        placeholder="VD: Đã gửi phương án mặt bằng..."
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      />
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={newLogLink}
                          onChange={(e) => setNewLogLink(e.target.value)}
                          onKeyPress={(e) =>
                            e.key === "Enter" &&
                            (e.preventDefault(), handleAddLog())
                          }
                          placeholder="Link đính kèm (tùy chọn)..."
                          className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        />
                        <button
                          type="button"
                          onClick={handleAddLog}
                          className="p-2 bg-indigo-100 text-indigo-600 hover:bg-indigo-200 rounded-lg transition-colors shrink-0"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                      {formData.activityLog.length === 0 ? (
                        <div className="text-center text-xs text-gray-400 py-4 italic">
                          Chưa có nhật ký nào
                        </div>
                      ) : (
                        formData.activityLog.map((log, idx) => (
                          <div
                            key={idx}
                            className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm relative pl-4"
                          >
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-200 rounded-l-lg"></div>
                            <div className="text-[10px] text-gray-400 font-medium mb-1">
                              {log.date}
                            </div>
                            <div className="text-sm text-gray-700">
                              {log.content}
                            </div>
                            {log.link && (
                              <a
                                href={log.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-indigo-600 hover:underline mt-1 inline-block"
                              >
                                Xem đính kèm
                              </a>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-indigo-500" /> Thời gian
                      dự án
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                          Ngày bắt đầu thực tế
                        </label>
                        <input
                          type="date"
                          value={formData.actual_start_date}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              actual_start_date: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                          Ngày bàn giao dự kiến
                        </label>
                        <input
                          type="date"
                          value={formData.handover_date}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              handover_date: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2 mt-6">
                      <Clock className="w-4 h-4 text-emerald-500" /> Thời gian
                      các giai đoạn (Ngày)
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                          Thiết kế
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.design_days}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              design_days: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                          Thi công thô
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.rough_construction_days}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              rough_construction_days:
                                parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                          Thi công hoàn thiện
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.finishing_days}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              finishing_days: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                          Thi công nội thất
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.interior_days}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              interior_days: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                      <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <Video className="w-4 h-4 text-red-500" /> Mốc quay
                        Marketing
                      </h3>
                      <button
                        type="button"
                        onClick={handleAddMilestone}
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded-md"
                      >
                        <Plus className="w-3 h-3" /> Thêm mốc
                      </button>
                    </div>

                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                      {formData.shooting_milestones.length === 0 ? (
                        <div className="text-center text-xs text-gray-400 py-8 italic bg-gray-50 rounded-lg border border-dashed border-gray-200">
                          Chưa có mốc quay nào được lên kế hoạch
                        </div>
                      ) : (
                        formData.shooting_milestones.map((milestone) => (
                          <div
                            key={milestone.id}
                            className="bg-gray-50 p-4 rounded-xl border border-gray-200 relative group"
                          >
                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveMilestone(milestone.id)
                              }
                              className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <div className="space-y-3 pr-6">
                              <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">
                                  Ngày quay
                                </label>
                                <input
                                  type="date"
                                  value={milestone.milestone_date}
                                  onChange={(e) =>
                                    handleUpdateMilestone(
                                      milestone.id,
                                      "milestone_date",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">
                                  Nội dung quay
                                </label>
                                <input
                                  type="text"
                                  placeholder="VD: Quay thô tầng 1..."
                                  value={milestone.content}
                                  onChange={(e) =>
                                    handleUpdateMilestone(
                                      milestone.id,
                                      "content",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">
                                  Trạng thái
                                </label>
                                <select
                                  value={milestone.status}
                                  onChange={(e) =>
                                    handleUpdateMilestone(
                                      milestone.id,
                                      "status",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                  <option value="pending">Chờ quay</option>
                                  <option value="completed">Đã quay</option>
                                  <option value="cancelled">Đã huỷ</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action: Send Construction Quote */}
            {(formData.contractStatus === "Bàn giao Hồ sơ" ||
              designProgress >= 80) && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-center justify-between animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-indigo-900">
                      Sẵn sàng cho giai đoạn Thi công
                    </h4>
                    <p className="text-xs text-indigo-700 mt-0.5">
                      Hồ sơ thiết kế đã cơ bản hoàn thiện. Bạn có thể bắt đầu
                      bóc tách khối lượng và báo giá thi công.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-all active:scale-95"
                >
                  Tạo Báo giá Thi công
                </button>
              </div>
            )}
          </form>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 bg-gray-100 rounded-xl transition-colors"
          >
            Đóng
          </button>
          <button
            type="submit"
            form="project-form"
            className="px-6 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm shadow-indigo-200 transition-colors"
          >
            Lưu Dự án
          </button>
        </div>
      </div>
    </div>
  );
}
