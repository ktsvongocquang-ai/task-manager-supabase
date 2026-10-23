import { useOutletContext } from 'react-router-dom';
import { CrudTable } from './CrudTable';

const CATEGORY_OPTS = [{ value: 'apartment', label: 'Chung cư' }, { value: 'house_villa', label: 'Nhà phố / Villa' }];
const STANDARD_OPTS = [{ value: 'dqh', label: 'DQH' }, { value: 'jux', label: 'JUX' }];

export function AdminRates() {
  const { canWrite } = useOutletContext<{ canWrite: boolean }>();
  return (
    <div>
      <h1 className="font-serif text-2xl mb-1">Đơn giá cho công cụ ước tính (Calculator)</h1>
      <p className="text-xs text-[#8A8070] mb-6">
        Để trống min/max = landing page sẽ báo "chưa có đơn giá" thay vì hiện số — không bao giờ hiện giá bịa cho khách.
      </p>
      <CrudTable
        table="landing_price_rates"
        orderBy="category"
        canWrite={canWrite}
        defaultValues={{ category: 'house_villa', standard: 'dqh' }}
        fields={[
          { key: 'category', label: 'Loại công trình', type: 'select', options: CATEGORY_OPTS },
          { key: 'standard', label: 'Chuẩn', type: 'select', options: STANDARD_OPTS },
          { key: 'min_price_per_m2', label: 'Giá thấp nhất / m² (VNĐ)', type: 'number' },
          { key: 'max_price_per_m2', label: 'Giá cao nhất / m² (VNĐ)', type: 'number' },
        ]}
      />
    </div>
  );
}
