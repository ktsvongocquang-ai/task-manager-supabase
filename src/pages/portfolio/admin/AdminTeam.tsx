import { useOutletContext } from 'react-router-dom';
import { CrudTable } from './CrudTable';

const GROUP_OPTS = [
  { value: 'design', label: 'Team Thiết Kế' },
  { value: 'construction', label: 'Team Thi Công' },
  { value: 'workshop', label: 'Xưởng Sản Xuất' },
];

export function AdminTeam() {
  const { canWrite } = useOutletContext<{ canWrite: boolean }>();
  return (
    <div>
      <h1 className="font-serif text-2xl mb-1">Đội ngũ nhân sự</h1>
      <p className="text-xs text-[#8A8070] mb-6">Mỗi dòng là 1 người, gắn vào đúng nhóm (Thiết kế / Thi công / Xưởng sản xuất).</p>
      <CrudTable
        table="landing_team_members"
        orderBy="group_key"
        canWrite={canWrite}
        defaultValues={{ group_key: 'design', sort_order: 0 }}
        fields={[
          { key: 'group_key', label: 'Nhóm', type: 'select', options: GROUP_OPTS },
          { key: 'name', label: 'Tên' },
          { key: 'role', label: 'Vai trò' },
          { key: 'experience', label: 'Lịch sử kinh nghiệm', type: 'textarea' },
          { key: 'sort_order', label: 'Thứ tự', type: 'number' },
        ]}
      />
    </div>
  );
}
