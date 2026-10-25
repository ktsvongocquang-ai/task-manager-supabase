import { useOutletContext } from 'react-router-dom';
import { CrudTable } from './CrudTable';

const PROCESS_TYPE_OPTS = [
  { value: 'noi_that', label: 'Nội thất & hoàn thiện' },
  { value: 'xay_dung', label: 'Xây dựng trọn gói' },
];
const PHASE_OPTS = [
  { value: 'thiet_ke', label: 'Thiết kế' },
  { value: 'thi_cong', label: 'Thi công' },
  { value: 'ban_giao', label: 'Bàn giao' },
];

export function AdminWorkflow() {
  const { canWrite } = useOutletContext<{ canWrite: boolean }>();
  return (
    <div className="space-y-12">
      <div>
        <h1 className="font-serif text-2xl mb-1">Quy trình làm việc</h1>
        <p className="text-xs text-[#8A8070] mb-6">
          2 quy trình riêng: <strong>Nội thất &amp; hoàn thiện</strong> và <strong>Xây dựng trọn gói</strong>. days_min/days_max dùng để tự tính thanh tổng quan tiến độ trên landing page —
          nhập đúng số ngày thực tế của từng bước. <strong>sort_order</strong> quyết định thứ tự — số "01, 02..." trên landing page tự đánh theo vị trí này, liên tục qua 2 cột (Thiết kế / Thi công &amp; bàn giao).
        </p>
        <CrudTable
          table="landing_process_steps"
          orderBy="sort_order"
          canWrite={canWrite}
          defaultValues={{ process_type: 'noi_that', phase: 'thiet_ke', step_no: 1, days_min: 0, days_max: 0, sort_order: 0 }}
          fields={[
            { key: 'process_type', label: 'Quy trình', type: 'select', options: PROCESS_TYPE_OPTS },
            { key: 'phase', label: 'Giai đoạn', type: 'select', options: PHASE_OPTS },
            { key: 'title', label: 'Tiêu đề' },
            { key: 'duration_label', label: 'Thời gian (hiển thị)' },
            { key: 'days_min', label: 'Số ngày — ít nhất', type: 'number' },
            { key: 'days_max', label: 'Số ngày — nhiều nhất', type: 'number' },
            { key: 'owner', label: 'Người phụ trách' },
            { key: 'description', label: 'Mô tả', type: 'textarea' },
            { key: 'sort_order', label: 'Thứ tự', type: 'number' },
          ]}
        />
      </div>

      <div>
        <h1 className="font-serif text-2xl mb-1">Bảo hành theo hạng mục</h1>
        <p className="text-xs text-[#8A8070] mb-6">Mỗi dòng là 1 hạng mục bảo hành, có thời hạn riêng cho từng quy trình. Để trống = ẩn hạng mục đó khỏi landing page.</p>
        <CrudTable
          table="landing_warranty_items"
          orderBy="sort_order"
          canWrite={canWrite}
          defaultValues={{ sort_order: 0 }}
          fields={[
            { key: 'item', label: 'Hạng mục' },
            { key: 'noi_that_term', label: 'Thời hạn — Nội thất & hoàn thiện' },
            { key: 'xay_dung_term', label: 'Thời hạn — Xây dựng trọn gói' },
            { key: 'sort_order', label: 'Thứ tự', type: 'number' },
          ]}
        />
      </div>
    </div>
  );
}
