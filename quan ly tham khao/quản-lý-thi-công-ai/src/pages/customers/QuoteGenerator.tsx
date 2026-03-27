import React, { useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Download, Printer, Plus, Trash2, Save } from 'lucide-react';
import { numberToVietnameseWords } from '../../utils/numberToWords';

interface CostItem {
  id: string;
  name: string;
  description: string;
  area: number;
  unitPrice: number;
}

interface PaymentStage {
  id: string;
  name: string;
  description: string;
  days: number;
  percentage: number;
}

export default function QuoteGenerator() {
  const location = useLocation();
  const navigate = useNavigate();
  const customer = location.state?.customer;
  const printRef = useRef<HTMLDivElement>(null);

  const [quoteInfo, setQuoteInfo] = useState({
    quoteNumber: `Số ..../2026/HĐTK/DQH-HCM`,
    quoteDate: new Date().toLocaleDateString('vi-VN'),
    projectName: customer?.projectInfo?.split('\n')[0] || 'Nhà phố Vĩnh Lộc - Bình Tân',
    clientName: customer?.name || 'Chị Thanh Hảo',
    projectLocation: 'Vĩnh Lộc - Bình Tân',
    constructionType: 'Thi công cải tạo',
    vatRate: 8,
    architectName: 'Võ Ngọc Quang',
    architectTitle: 'Giám đốc',
    publishDate: `TP. Hồ Chí Minh, ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}`
  });

  const [costItems, setCostItems] = useState<CostItem[]>([
    { id: '1', name: 'Thiết kế kiến trúc', description: 'Toàn bộ nhà', area: 342, unitPrice: 350000 },
    { id: '2', name: 'Thiết kế nội thất', description: 'Theo thực tế mong muốn', area: 0, unitPrice: 0 },
  ]);

  const [paymentStages, setPaymentStages] = useState<PaymentStage[]>([
    { id: '1', name: 'GĐ1', description: 'Sau khi ký hợp đồng', days: 1, percentage: 50 },
    { id: '2', name: 'GĐ2', description: 'Thiết kế mặt bằng & ý tưởng', days: 5, percentage: 0 },
    { id: '3', name: 'GĐ3', description: 'Phối cảnh 3D Mặt Tiền và sơ đồ tổ chức không gian', days: 10, percentage: 20 },
    { id: '4', name: 'GĐ4', description: 'Hồ sơ kỹ thuật', days: 25, percentage: 20 },
    { id: '5', name: 'GĐ5', description: 'Các giải pháp hoàn thiện', days: 10, percentage: 10 },
  ]);

  // Calculations
  const totalBeforeTax = costItems.reduce((sum, item) => sum + (item.area * item.unitPrice), 0);
  const vatAmount = totalBeforeTax * (quoteInfo.vatRate / 100);
  const totalAfterTax = totalBeforeTax + vatAmount;
  const roundedTotal = Math.round(totalAfterTax / 1000) * 1000; // Round to nearest 1000

  const handlePrint = () => {
    window.print();
  };

  const addCostItem = () => {
    setCostItems([...costItems, { id: Date.now().toString(), name: '', description: '', area: 0, unitPrice: 0 }]);
  };

  const removeCostItem = (id: string) => {
    setCostItems(costItems.filter(item => item.id !== id));
  };

  const updateCostItem = (id: string, field: keyof CostItem, value: string | number) => {
    setCostItems(costItems.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const addPaymentStage = () => {
    setPaymentStages([...paymentStages, { id: Date.now().toString(), name: `GĐ${paymentStages.length + 1}`, description: '', days: 0, percentage: 0 }]);
  };

  const removePaymentStage = (id: string) => {
    setPaymentStages(paymentStages.filter(stage => stage.id !== id));
  };

  const updatePaymentStage = (id: string, field: keyof PaymentStage, value: string | number) => {
    setPaymentStages(paymentStages.map(stage => stage.id === id ? { ...stage, [field]: value } : stage));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Xuất Thư Báo Giá Tự Động</h2>
            <p className="text-sm text-gray-500">Thiết lập thông tin và in báo giá theo chuẩn A4</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4" />
            In Báo Giá
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
            <Download className="w-4 h-4" />
            Lưu PDF
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm">
            <Save className="w-4 h-4" />
            Lưu Bản Nháp
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 print:block">
        {/* Editor Panel */}
        <div className="xl:col-span-5 space-y-6 print:hidden">
          {/* General Info */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-indigo-600 rounded-full"></span>
              Thông tin chung
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Tên công trình</label>
                <input 
                  type="text" 
                  value={quoteInfo.projectName}
                  onChange={(e) => setQuoteInfo({...quoteInfo, projectName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Khách hàng</label>
                <input 
                  type="text" 
                  value={quoteInfo.clientName}
                  onChange={(e) => setQuoteInfo({...quoteInfo, clientName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Loại hình</label>
                <input 
                  type="text" 
                  value={quoteInfo.constructionType}
                  onChange={(e) => setQuoteInfo({...quoteInfo, constructionType: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Địa điểm</label>
                <input 
                  type="text" 
                  value={quoteInfo.projectLocation}
                  onChange={(e) => setQuoteInfo({...quoteInfo, projectLocation: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Số báo giá</label>
                <input 
                  type="text" 
                  value={quoteInfo.quoteNumber}
                  onChange={(e) => setQuoteInfo({...quoteInfo, quoteNumber: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Ngày báo giá</label>
                <input 
                  type="text" 
                  value={quoteInfo.quoteDate}
                  onChange={(e) => setQuoteInfo({...quoteInfo, quoteDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Cost Items Editor */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
                Bảng chi phí
              </h3>
              <button 
                onClick={addCostItem}
                className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700"
              >
                <Plus className="w-4 h-4" /> Thêm hạng mục
              </button>
            </div>
            <div className="space-y-4">
              {costItems.map((item, index) => (
                <div key={item.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 relative group">
                  <button 
                    onClick={() => removeCostItem(item.id)}
                    className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="grid grid-cols-1 gap-3">
                    <input 
                      type="text" 
                      placeholder="Tên hạng mục"
                      value={item.name}
                      onChange={(e) => updateCostItem(item.id, 'name', e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-bold outline-none"
                    />
                    <input 
                      type="text" 
                      placeholder="Mô tả chi tiết"
                      value={item.description}
                      onChange={(e) => updateCostItem(item.id, 'description', e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs outline-none"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-0.5">Diện tích (m2)</label>
                        <input 
                          type="number" 
                          value={item.area}
                          onChange={(e) => updateCostItem(item.id, 'area', Number(e.target.value))}
                          className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-0.5">Đơn giá (VNĐ)</label>
                        <input 
                          type="number" 
                          value={item.unitPrice}
                          onChange={(e) => updateCostItem(item.id, 'unitPrice', Number(e.target.value))}
                          className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
              <div className="text-xs font-bold text-gray-500">Thuế suất VAT (%)</div>
              <input 
                type="number" 
                value={quoteInfo.vatRate}
                onChange={(e) => setQuoteInfo({...quoteInfo, vatRate: Number(e.target.value)})}
                className="w-20 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-right outline-none"
              />
            </div>
          </div>

          {/* Payment Stages Editor */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-orange-500 rounded-full"></span>
                Tiến độ thanh toán
              </h3>
              <button 
                onClick={addPaymentStage}
                className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700"
              >
                <Plus className="w-4 h-4" /> Thêm đợt
              </button>
            </div>
            <div className="space-y-3">
              {paymentStages.map((stage) => (
                <div key={stage.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 group">
                  <div className="w-12">
                    <input 
                      type="text" 
                      value={stage.name}
                      onChange={(e) => updatePaymentStage(stage.id, 'name', e.target.value)}
                      className="w-full bg-transparent font-bold text-xs outline-none"
                    />
                  </div>
                  <div className="flex-1">
                    <input 
                      type="text" 
                      placeholder="Nội dung đợt"
                      value={stage.description}
                      onChange={(e) => updatePaymentStage(stage.id, 'description', e.target.value)}
                      className="w-full bg-transparent text-xs outline-none border-b border-transparent focus:border-indigo-300"
                    />
                  </div>
                  <div className="w-16">
                    <input 
                      type="number" 
                      placeholder="Ngày"
                      value={stage.days}
                      onChange={(e) => updatePaymentStage(stage.id, 'days', Number(e.target.value))}
                      className="w-full bg-white px-2 py-1 border border-gray-200 rounded text-xs text-center outline-none"
                    />
                  </div>
                  <div className="w-16 flex items-center gap-1">
                    <input 
                      type="number" 
                      placeholder="%"
                      value={stage.percentage}
                      onChange={(e) => updatePaymentStage(stage.id, 'percentage', Number(e.target.value))}
                      className="w-full bg-white px-2 py-1 border border-gray-200 rounded text-xs text-center outline-none"
                    />
                    <span className="text-[10px] font-bold">%</span>
                  </div>
                  <button 
                    onClick={() => removePaymentStage(stage.id)}
                    className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="xl:col-span-7 flex justify-center bg-gray-100 xl:bg-transparent p-4 xl:p-0 rounded-2xl print:p-0">
          <div 
            ref={printRef}
            className="bg-white shadow-2xl xl:shadow-lg w-full max-w-[210mm] min-h-[297mm] p-8 sm:p-12 text-[12px] font-serif leading-relaxed text-black print:shadow-none print:p-0 print:max-w-none"
            style={{ color: '#000' }}
          >
            {/* Header Section */}
            <div className="flex justify-between items-start mb-8 border-b-2 border-red-800 pb-4">
              <div className="flex gap-4">
                <div className="w-16 h-16 bg-red-800 text-white flex items-center justify-center font-bold text-xl flex-shrink-0">
                  DQH
                </div>
                <div>
                  <h1 className="font-bold text-[13px] uppercase">CÔNG TY TNHH TM VÀ KIẾN TRÚC - XÂY DỰNG DQH</h1>
                  <p className="italic text-[10px] leading-tight">Mã số thuế: 3702959177</p>
                  <p className="italic text-[10px] leading-tight">Địa chỉ: 105-107 Trần Văn Dư, Phường Tân Bình, TP. Hồ Chí Minh</p>
                  <div className="flex gap-6 mt-1 text-[9px] font-bold text-red-800">
                    <span>Website: dqharchitects.vn</span>
                    <span>Facebook: DQH Architects</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-xl font-bold text-gray-900 mb-1 uppercase">THƯ BÁO PHÍ THIẾT KẾ</h2>
                <p className="font-bold text-[10px]">Ngày: {quoteInfo.quoteDate}</p>
                <div className="mt-4 text-left">
                  <p className="font-bold border-b border-gray-300 pb-0.5">Người phụ trách hồ sơ</p>
                  <p className="font-bold mt-1 text-[11px]">{quoteInfo.architectName}</p>
                  <p className="text-[10px]">Chức vụ: {quoteInfo.architectTitle}</p>
                </div>
              </div>
            </div>

            {/* Project Info Section */}
            <div className="mb-6 bg-gray-50 p-4 border border-gray-200 rounded">
              <h3 className="font-bold text-[11px] mb-3 uppercase border-b border-gray-300 pb-1">THÔNG TIN DỰ ÁN</h3>
              <div className="grid grid-cols-2 gap-y-2 gap-x-8">
                <div className="flex gap-2">
                  <span className="font-bold whitespace-nowrap">Tên công trình:</span> 
                  <span className="border-b border-dotted border-gray-400 flex-1">{quoteInfo.projectName}</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-bold whitespace-nowrap">Loại hình:</span> 
                  <span className="border-b border-dotted border-gray-400 flex-1">{quoteInfo.constructionType}</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-bold whitespace-nowrap">Chủ đầu tư:</span> 
                  <span className="border-b border-dotted border-gray-400 flex-1">{quoteInfo.clientName}</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-bold whitespace-nowrap">Số báo giá:</span> 
                  <span className="border-b border-dotted border-gray-400 flex-1">{quoteInfo.quoteNumber}</span>
                </div>
                <div className="flex gap-2 col-span-2">
                  <span className="font-bold whitespace-nowrap">Địa điểm dự án:</span> 
                  <span className="border-b border-dotted border-gray-400 flex-1">{quoteInfo.projectLocation}</span>
                </div>
              </div>
            </div>

            {/* Cost Table Section */}
            <div className="mb-6">
              <h3 className="font-bold text-[11px] mb-2 uppercase">BẢNG CHI PHÍ THIẾT KẾ</h3>
              <table className="w-full border-collapse border border-black text-center">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border border-black py-1.5 px-1 w-10">STT</th>
                    <th className="border border-black py-1.5 px-2 text-left">HẠNG MỤC THIẾT KẾ</th>
                    <th className="border border-black py-1.5 px-1 w-20">DIỆN TÍCH (m2)</th>
                    <th className="border border-black py-1.5 px-1 w-32">ĐƠN GIÁ (VNĐ)</th>
                    <th className="border border-black py-1.5 px-1 w-32">THÀNH TIỀN (VNĐ)</th>
                  </tr>
                </thead>
                <tbody>
                  {costItems.map((item, index) => (
                    <tr key={item.id}>
                      <td className="border border-black py-1.5">{index + 1}</td>
                      <td className="border border-black py-1.5 text-left px-2">
                        <div className="font-bold">{item.name}</div>
                        <div className="italic text-[10px] text-gray-600">{item.description}</div>
                      </td>
                      <td className="border border-black py-1.5">{item.area > 0 ? item.area.toLocaleString() : '-'}</td>
                      <td className="border border-black py-1.5">{item.unitPrice > 0 ? item.unitPrice.toLocaleString() : '-'}</td>
                      <td className="border border-black py-1.5 font-bold">
                        {item.area * item.unitPrice > 0 ? (item.area * item.unitPrice).toLocaleString() : '-'}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50">
                    <td colSpan={3} className="border border-black py-1.5 text-right px-4 font-bold uppercase">Tổng tiền trước thuế</td>
                    <td className="border border-black py-1.5"></td>
                    <td className="border border-black py-1.5 font-bold">{totalBeforeTax.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="border border-black py-1.5 text-right px-4 font-bold uppercase">Thuế suất VAT ({quoteInfo.vatRate}%)</td>
                    <td className="border border-black py-1.5"></td>
                    <td className="border border-black py-1.5 font-bold">{vatAmount.toLocaleString()}</td>
                  </tr>
                  <tr className="bg-red-50">
                    <td colSpan={3} className="border border-black py-2 text-right px-4 font-bold text-[13px] uppercase text-red-800">Tổng thanh toán làm tròn</td>
                    <td className="border border-black py-2"></td>
                    <td className="border border-black py-2 font-bold text-[13px] text-red-800">{roundedTotal.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
              <div className="mt-2 p-3 border border-black bg-gray-50 italic">
                <span className="font-bold">Số tiền bằng chữ:</span> {numberToVietnameseWords(roundedTotal)}
              </div>
            </div>

            {/* Payment Schedule Section */}
            <div className="mb-6">
              <h3 className="font-bold text-[11px] mb-2 uppercase">TIẾN ĐỘ THỰC HIỆN & THANH TOÁN</h3>
              <table className="w-full border-collapse border border-black text-center text-[10px]">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border border-black py-1 px-1 w-12">ĐỢT</th>
                    <th className="border border-black py-1 px-2 text-left">NỘI DUNG CÔNG VIỆC</th>
                    <th className="border border-black py-1 px-1 w-20">THỜI GIAN (NGÀY)</th>
                    <th className="border border-black py-1 px-1 w-24">TỶ LỆ (%)</th>
                    <th className="border border-black py-1 px-1 w-32">THANH TOÁN (VNĐ)</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentStages.map((stage) => (
                    <tr key={stage.id}>
                      <td className="border border-black py-1 font-bold">{stage.name}</td>
                      <td className="border border-black py-1 text-left px-2">{stage.description}</td>
                      <td className="border border-black py-1">{stage.days}</td>
                      <td className="border border-black py-1">{stage.percentage}%</td>
                      <td className="border border-black py-1 font-bold">
                        {stage.percentage > 0 ? Math.round(roundedTotal * stage.percentage / 100).toLocaleString() : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer Section */}
            <div className="flex justify-between mt-12 relative">
              <div className="text-center w-1/2">
                <p className="font-bold uppercase text-[10px]">XÁC NHẬN CỦA PHÍA KHÁCH HÀNG</p>
                <p className="italic text-[9px] mt-1">(Ký, ghi rõ họ tên)</p>
              </div>
              <div className="text-center w-1/2 relative">
                <p className="italic mb-1 text-[10px]">{quoteInfo.publishDate}</p>
                <p className="font-bold mb-20 uppercase text-[10px]">CÔNG TY TNHH TM VÀ KIẾN TRÚC<br/>XÂY DỰNG DQH</p>
                
                {/* Stamp Placeholder (Simulated) */}
                <div className="absolute top-10 left-1/2 -translate-x-1/2 opacity-60 pointer-events-none">
                  <div className="w-24 h-24 border-4 border-red-600 rounded-full flex items-center justify-center text-red-600 font-bold text-[10px] rotate-12 flex-col leading-tight">
                    <span className="text-[8px]">CÔNG TY TNHH TM & KT</span>
                    <span>XÂY DỰNG DQH</span>
                    <span className="text-[8px]">MST: 3702959177</span>
                  </div>
                </div>

                <p className="font-bold italic text-[11px]">{quoteInfo.architectName}</p>
              </div>
            </div>

            {/* Print Footer */}
            <div className="hidden print:block fixed bottom-4 left-0 right-0 text-center text-[8px] text-gray-400 italic">
              Trang 1/1 - Thư báo giá này có giá trị trong vòng 15 ngày kể từ ngày ban hành.
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #root, .print\\:block, .print\\:block * {
            visibility: visible;
          }
          .print\\:block {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print\\:hidden {
            display: none !important;
          }
          @page {
            size: A4;
            margin: 0;
          }
          body {
            background: white !important;
          }
        }
      `}} />
    </div>
  );
}
