import { useEffect, useState } from 'react';
import { SectionHeader, NeedsInput } from './shared';
import { landingSupabase } from './landingSupabase';

interface TeamMember {
  name: string;
  role: string;
  experience: string;
}

interface TeamGroup {
  key: string;
  label: string;
  desc: string;
  members: TeamMember[];
}

const GROUP_META: Record<string, { label: string; desc: string }> = {
  design: { label: 'Team Thiết Kế', desc: 'Kiến trúc sư, kỹ sư kết cấu, concept design & moodboard vật liệu.' },
  construction: { label: 'Team Thi Công', desc: 'Quản lý dự án, giám sát kỹ thuật hiện trường, đội thợ thi công.' },
  workshop: { label: 'Xưởng Sản Xuất', desc: 'Gia công nội thất gỗ theo bản vẽ CAD, kiểm soát chất lượng trước khi lắp đặt.' },
};
const GROUP_ORDER = ['design', 'construction', 'workshop'];

export function TeamSection() {
  const [groups, setGroups] = useState<TeamGroup[] | null>(null);

  useEffect(() => {
    landingSupabase
      .from('landing_team_members')
      .select('group_key,name,role,experience')
      .order('sort_order')
      .then(({ data }) => {
        const byGroup: Record<string, TeamMember[]> = {};
        (data || []).forEach(row => {
          if (!byGroup[row.group_key]) byGroup[row.group_key] = [];
          byGroup[row.group_key].push({ name: row.name, role: row.role || '', experience: row.experience || '' });
        });
        setGroups(GROUP_ORDER.map(key => ({
          key,
          label: GROUP_META[key].label,
          desc: GROUP_META[key].desc,
          members: byGroup[key] || [],
        })));
      })
      .catch(() => setGroups(GROUP_ORDER.map(key => ({ key, label: GROUP_META[key].label, desc: GROUP_META[key].desc, members: [] }))));
  }, []);

  return (
    <section id="section-3" className="px-6 md:px-16 py-32 bg-[#F5F2EC] border-b border-[#2C2920]/5">
      <div className="max-w-6xl mx-auto">
        <SectionHeader eyebrow="(BỘ MÁY TỔ CHỨC)" title="Đội ngũ nhân sự" accent="Design & Build trọn vẹn" />

        {!groups ? (
          <p className="text-xs text-[#8A8070]">Đang tải...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {groups.map(group => (
              <div key={group.key} className="bg-white border border-[#2C2920]/10 rounded-sm p-7 space-y-5">
                <div>
                  <h3 className="font-serif text-xl font-light text-[#2C2920]">{group.label}</h3>
                  <p className="text-xs text-[#8A8070] mt-2 leading-relaxed">{group.desc}</p>
                </div>
                <div className="h-px bg-[#2C2920]/10" />
                {group.members.length > 0 ? (
                  <ul className="space-y-4">
                    {group.members.map((m, idx) => (
                      <li key={idx} className="flex flex-col gap-1 pb-4 border-b border-[#2C2920]/5 last:border-b-0 last:pb-0">
                        <span className="text-sm font-semibold text-[#2C2920]">{m.name}</span>
                        <span className="text-xs text-[#8A8070]">{m.role}</span>
                        {m.experience && <span className="text-xs text-[#2C2920]/70 leading-relaxed mt-1">{m.experience}</span>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <NeedsInput label={`nhân sự ${group.label.toLowerCase()}`} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
