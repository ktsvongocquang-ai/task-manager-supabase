import { useOutletContext } from 'react-router-dom';
import { CrudTable } from './CrudTable';

export function AdminWorkflow() {
  const { canWrite } = useOutletContext<{ canWrite: boolean }>();
  return (
    <div>
      <h1 className="font-serif text-2xl mb-1">Quy trình làm việc</h1>
      <p className="text-xs text-[#8A8070] mb-6">8 bước từ khảo sát tới bảo hành — step_no quyết định thứ tự hiển thị trên landing page (dùng sort_order để sắp xếp).</p>
      <CrudTable
        table="landing_workflow_steps"
        orderBy="sort_order"
        canWrite={canWrite}
        defaultValues={{ step_no: '', sort_order: 0 }}
        fields={[
          { key: 'step_no', label: 'Số bước' },
          { key: 'title', label: 'Tiêu đề' },
          { key: 'duration', label: 'Thời gian' },
          { key: 'executor', label: 'Người thực hiện' },
          { key: 'details', label: 'Chi tiết', type: 'textarea' },
          { key: 'sort_order', label: 'Thứ tự', type: 'number' },
        ]}
      />
    </div>
  );
}
