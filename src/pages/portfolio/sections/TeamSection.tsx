import { useEffect, useState } from 'react';
import { SectionHeader, NeedsInput } from './shared';
import { landingSupabase } from './landingSupabase';
import { TeamMemberModal, type TeamMemberData } from './TeamMemberModal';

type TeamMember = TeamMemberData;

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
  const [openMember, setOpenMember] = useState<TeamMember | null>(null);

  useEffect(() => {
    landingSupabase
      .from('landing_team_members')
      .select('group_key,name,role,experience,avatar_url,bio,highlights')
      .order('sort_order')
      .then(({ data }) => {
        const byGroup: Record<string, TeamMember[]> = {};
        (data || []).forEach(row => {
          if (!byGroup[row.group_key]) byGroup[row.group_key] = [];
          byGroup[row.group_key].push({
            name: row.name,
            role: row.role || '',
            experience: row.experience || '',
            avatarUrl: row.avatar_url,
            bio: row.bio || '',
            highlights: row.highlights || [],
          });
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
                      <li key={idx}>
                        <button
                          onClick={() => setOpenMember(m)}
                          className="w-full flex items-center gap-3 text-left cursor-pointer group pb-4 border-b border-[#2C2920]/5 last:border-b-0 last:pb-0"
                        >
                          {m.avatarUrl ? (
                            <img src={m.avatarUrl} alt={m.name} className="w-11 h-11 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="w-11 h-11 rounded-full bg-[#F5F2EC] text-[#2C2920] flex items-center justify-center font-serif text-sm shrink-0">
                              {m.name.charAt(0)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="block text-sm font-semibold text-[#2C2920] group-hover:text-[#B8913A] transition-colors">{m.name}</span>
                            <span className="block text-xs text-[#8A8070]">{m.role}</span>
                          </div>
                        </button>
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

      {openMember && <TeamMemberModal member={openMember} onClose={() => setOpenMember(null)} />}
    </section>
  );
}
