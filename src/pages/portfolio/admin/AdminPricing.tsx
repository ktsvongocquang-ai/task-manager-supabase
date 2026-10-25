import { useOutletContext } from 'react-router-dom';
import { CrudTable } from './CrudTable';

const CATEGORY_OPTS = [{ value: 'apartment', label: 'Chung cư' }, { value: 'house_villa', label: 'Nhà phố / Villa' }];
const STANDARD_OPTS = [{ value: 'dqh', label: 'DQH' }, { value: 'jux', label: 'JUX' }];

export function AdminPricing() {
  const { canWrite } = useOutletContext<{ canWrite: boolean }>();
  return (
    <div>
      <h1 className="font-serif text-2xl mb-1">Chi phí thiết kế & thi công</h1>
      <p className="text-xs text-[#8A8070] mb-6">Mỗi dòng là 1 chuẩn (DQH/JUX) theo 1 loại công trình. Nên có đủ 4 dòng: chung cư×DQH, chung cư×JUX, nhà phố×DQH, nhà phố×JUX.</p>
      <CrudTable
        table="landing_pricing_standards"
        orderBy="category"
        canWrite={canWrite}
        defaultValues={{ category: 'house_villa', standard: 'dqh' }}
        fields={[
          { key: 'category', label: 'Loại công trình', type: 'select', options: CATEGORY_OPTS },
          { key: 'standard', label: 'Chuẩn', type: 'select', options: STANDARD_OPTS },
          { key: 'standard_sub', label: 'Mô tả ngắn (hiện dưới tên loại công trình)' },
          { key: 'construction_time', label: 'Thời gian thi công' },
          { key: 'design_style', label: 'Style thiết kế' },
          { key: 'material_partners', label: 'Đối tác vật liệu', type: 'textarea' },
        ]}
      />
    </div>
  );
}
