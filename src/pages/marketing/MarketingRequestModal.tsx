import { X } from 'lucide-react';

interface MarketingRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MarketingRequestModal({ isOpen, onClose }: MarketingRequestModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl my-8 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-white rounded-t-xl shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Form Cung Cấp Thông Tin Marketing</h2>
            <p className="text-sm text-gray-500 mt-1">Điền đầy đủ thông tin để team Marketing có chất liệu lên nội dung</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-6 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tên công trình */}
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên công trình <span className="text-red-500">*</span></label>
              <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="VD: Chung cư Palm Height" />
            </div>
            
            {/* Loại công trình */}
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Loại công trình <span className="text-red-500">*</span></label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                <option value="">Chọn loại công trình</option>
                <option value="Chung cư">Chung cư</option>
                <option value="Nhà phố">Nhà phố</option>
                <option value="Biệt thự - Villa">Biệt thự - Villa</option>
                <option value="F&B - Nhà hàng">F&B - Nhà hàng</option>
                <option value="F&B - Cafe">F&B - Cafe</option>
                <option value="Shop - Flagship store">Shop - Flagship store</option>
                <option value="Spa - Clinic - Salon">Spa - Clinic - Salon</option>
                <option value="Showroom">Showroom</option>
              </select>
            </div>

            {/* Tình trạng */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tình trạng <span className="text-red-500">*</span></label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                <option value="">Chọn tình trạng</option>
                <option value="Thiết kế bản vẽ">Thiết kế bản vẽ</option>
                <option value="Đang thi công">Đang thi công</option>
                <option value="Đã bàn giao">Đã bàn giao</option>
              </select>
            </div>

            {/* Trạng thái cập nhật */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái cập nhật hình ảnh</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                <option value="">Chọn trạng thái</option>
                <option value="Đầy đủ hình ảnh">Đầy đủ hình ảnh</option>
                <option value="Hình hoàn thiện">Hình hoàn thiện</option>
                <option value="Hình nhật ký">Hình nhật ký</option>
              </select>
            </div>

            {/* Ngày thi công */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày thi công</label>
              <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            </div>

            {/* Ngày hoàn thiện */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày hoàn thiện (dự kiến)</label>
              <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            </div>

            {/* Địa chỉ */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
              <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="Nhập địa chỉ công trình" />
            </div>

            {/* Có thể đến quay hay không? */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Có thể đến quay video không?</label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="canShoot" value="yes" className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300" />
                  <span className="text-sm text-gray-700">Có thể</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="canShoot" value="no" className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300" />
                  <span className="text-sm text-gray-700">Không thể</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="canShoot" value="pending" className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300" />
                  <span className="text-sm text-gray-700">Cần xin phép thêm</span>
                </label>
              </div>
            </div>

            {/* Kiểu hiệu ứng */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Kiểu hiệu ứng (Có thể chọn nhiều)</label>
              <div className="flex flex-wrap gap-3">
                {['Đất nện', 'Bê tông', 'Stucco', 'Đá khối'].map(effect => (
                  <label key={effect} className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
                    <input type="checkbox" className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300" />
                    <span className="text-sm text-gray-700">{effect}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Mô tả kiểu hiệu ứng */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả kiểu hiệu ứng</label>
              <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="VD: Bê tông đánh dao màu xanh Sage..." />
            </div>

            {/* Mô tả về công trình */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả về công trình</label>
              <p className="text-xs text-gray-500 mb-2">Công trình này có đặc điểm gì đặc biệt, tệp khách hàng là ai, phân khúc như thế nào...</p>
              <textarea rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="Nhập mô tả chi tiết..."></textarea>
            </div>

            {/* Vấn đề công trình / khách hàng */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Vấn đề công trình / khách hàng gặp phải</label>
              <p className="text-xs text-gray-500 mb-2">Những khó khăn, mong muốn được giải quyết của khách hàng</p>
              <textarea rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="Nhập vấn đề..."></textarea>
            </div>

            {/* Giải pháp DQH */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Giải pháp mà DQH mang lại</label>
              <p className="text-xs text-gray-500 mb-2">Càng chi tiết càng tốt</p>
              <textarea rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="Nhập giải pháp..."></textarea>
            </div>

            {/* Link tài liệu */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Hình ảnh / Videos của công trình</label>
              <p className="text-xs text-gray-500 mb-2">Link bản thiết kế, video từng giai đoạn, tài liệu muốn truyền tải (Google Drive, Notion...)</p>
              <input type="url" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="https://drive.google.com/..." />
            </div>

            {/* Thông tin khác */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Thông tin khác (nếu có)</label>
              <textarea rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="Nhập thêm thông tin..."></textarea>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            Hủy
          </button>
          <button onClick={() => { alert('Đã gửi thông tin thành công!'); onClose(); }} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">
            Gửi thông tin
          </button>
        </div>
      </div>
    </div>
  );
}
