import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

interface Milestone {
  id: string;
  milestone_date: string;
  content: string;
  status: string;
}

interface ProjectData {
  id: string;
  name: string;
  actual_start_date: string;
  design_days: number;
  rough_construction_days: number;
  finishing_days: number;
  interior_days: number;
  handover_date: string;
  shooting_milestones: Milestone[];
}

interface ProjectProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectData | null;
  onSave: (updatedProject: ProjectData) => void;
}

export default function ProjectProgressModal({ isOpen, onClose, project, onSave }: ProjectProgressModalProps) {
  const [formData, setFormData] = useState<ProjectData | null>(null);

  useEffect(() => {
    if (project) {
      setFormData({ ...project, shooting_milestones: [...(project.shooting_milestones || [])] });
    }
  }, [project]);

  if (!isOpen || !formData) return null;

  const handleChange = (field: keyof ProjectData, value: any) => {
    setFormData(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleAddMilestone = () => {
    setFormData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        shooting_milestones: [
          ...prev.shooting_milestones,
          { id: `new-${Date.now()}`, milestone_date: '', content: '', status: 'Chờ quay' }
        ]
      };
    });
  };

  const handleUpdateMilestone = (id: string, field: keyof Milestone, value: string) => {
    setFormData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        shooting_milestones: prev.shooting_milestones.map(m => 
          m.id === id ? { ...m, [field]: value } : m
        )
      };
    });
  };

  const handleRemoveMilestone = (id: string) => {
    setFormData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        shooting_milestones: prev.shooting_milestones.filter(m => m.id !== id)
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) {
      onSave(formData);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Cập nhật tiến độ: {formData.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form id="progress-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu thực tế</label>
                <input 
                  type="date" 
                  value={formData.actual_start_date}
                  onChange={(e) => handleChange('actual_start_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bàn giao</label>
                <input 
                  type="date" 
                  value={formData.handover_date}
                  onChange={(e) => handleChange('handover_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thiết kế (Số ngày)</label>
                <input 
                  type="number" 
                  min="0"
                  value={formData.design_days}
                  onChange={(e) => handleChange('design_days', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thi công thô (Số ngày)</label>
                <input 
                  type="number" 
                  min="0"
                  value={formData.rough_construction_days}
                  onChange={(e) => handleChange('rough_construction_days', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thi công hoàn thiện (Số ngày)</label>
                <input 
                  type="number" 
                  min="0"
                  value={formData.finishing_days}
                  onChange={(e) => handleChange('finishing_days', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thi công nội thất (Số ngày)</label>
                <input 
                  type="number" 
                  min="0"
                  value={formData.interior_days}
                  onChange={(e) => handleChange('interior_days', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Mốc quay (Shooting Milestones)</h3>
                <button 
                  type="button"
                  onClick={handleAddMilestone}
                  className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Thêm mốc quay
                </button>
              </div>

              <div className="space-y-3">
                {formData.shooting_milestones.length === 0 ? (
                  <p className="text-sm text-gray-500 italic text-center py-4">Chưa có mốc quay nào.</p>
                ) : (
                  formData.shooting_milestones.map((milestone, index) => (
                    <div key={milestone.id} className="flex gap-3 items-start bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <div className="w-40 flex-shrink-0">
                        <input 
                          type="date" 
                          value={milestone.milestone_date}
                          onChange={(e) => handleUpdateMilestone(milestone.id, 'milestone_date', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                          required
                        />
                      </div>
                      <div className="flex-1">
                        <input 
                          type="text" 
                          placeholder="Nội dung quay..."
                          value={milestone.content}
                          onChange={(e) => handleUpdateMilestone(milestone.id, 'content', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                          required
                        />
                      </div>
                      <button 
                        type="button"
                        onClick={() => handleRemoveMilestone(milestone.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          <button 
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Hủy
          </button>
          <button 
            type="submit"
            form="progress-form"
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
          >
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
}
