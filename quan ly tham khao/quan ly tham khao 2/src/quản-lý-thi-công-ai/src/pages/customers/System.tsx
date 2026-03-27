import React, { useState } from 'react';
import { Save, Users, Shield, Database, Bell, Globe, Mail, Lock } from 'lucide-react';

export default function System() {
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', name: 'Cài đặt chung', icon: Globe },
    { id: 'users', name: 'Quản lý người dùng', icon: Users },
    { id: 'roles', name: 'Phân quyền', icon: Shield },
    { id: 'notifications', name: 'Thông báo', icon: Bell },
    { id: 'integrations', name: 'Tích hợp', icon: Database },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Cài đặt Hệ thống</h2>
        <button className="bg-indigo-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2">
          <Save className="w-4 h-4" />
          Lưu thay đổi
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Settings */}
        <div className="w-full md:w-64 shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <nav className="flex flex-col p-2 space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors text-left ${
                      activeTab === tab.id
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-4">Thông tin Công ty</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Tên công ty</label>
                  <input type="text" defaultValue="CRM Master Inc." className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Mã số thuế</label>
                  <input type="text" defaultValue="0123456789" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Địa chỉ</label>
                  <input type="text" defaultValue="123 Đường ABC, Quận XYZ, TP.HCM" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Email liên hệ</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="email" defaultValue="contact@crmmaster.com" className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Số điện thoại</label>
                  <input type="tel" defaultValue="1900 1234" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
                </div>
              </div>

              <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-4 mt-8">Cấu hình Hệ thống</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Chế độ bảo trì</h4>
                    <p className="text-sm text-gray-500">Tạm dừng truy cập hệ thống để nâng cấp</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Xác thực 2 bước (2FA)</h4>
                    <p className="text-sm text-gray-500">Bắt buộc tất cả nhân viên sử dụng 2FA</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab !== 'general' && (
            <div className="h-64 flex flex-col items-center justify-center text-gray-500">
              <Lock className="w-12 h-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Tính năng đang phát triển</h3>
              <p className="text-sm text-center max-w-md">Module {tabs.find(t => t.id === activeTab)?.name} đang được hoàn thiện và sẽ ra mắt trong phiên bản tiếp theo.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
