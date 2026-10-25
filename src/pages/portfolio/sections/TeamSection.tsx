import { useEffect, useState } from 'react';
import { SectionHeader, NeedsInput } from './shared';
import { landingSupabase } from './landingSupabase';
import { TeamMemberModal, type TeamMemberData } from './TeamMemberModal';

type TeamMember = TeamMemberData;

function MemberCard({ member, onOpen }: { member: TeamMember; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="relative aspect-[3/4] w-full overflow-hidden rounded-sm cursor-pointer group text-left"
    >
      {member.avatarUrl ? (
        <img
          src={member.avatarUrl}
          alt={member.name}
          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="w-full h-full bg-white/5 flex items-center justify-center">
          <span className="font-serif text-4xl text-white/30">{member.name.charAt(0)}</span>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <p className="text-sm md:text-base font-semibold text-white leading-tight">{member.name}</p>
        <p className="text-xs text-white/65 mt-0.5">{member.role}</p>
      </div>
    </button>
  );
}

export function TeamSection() {
  const [members, setMembers] = useState<TeamMember[] | null>(null);
  const [openMember, setOpenMember] = useState<TeamMember | null>(null);

  useEffect(() => {
    landingSupabase
      .from('landing_team_members')
      .select('group_key,name,role,experience,avatar_url,bio,highlights')
      .order('group_key')
      .order('sort_order')
      .then(({ data }) => {
        setMembers(
          (data || []).map(row => ({
            name: row.name,
            role: row.role || '',
            experience: row.experience || '',
            avatarUrl: row.avatar_url,
            bio: row.bio || '',
            highlights: row.highlights || [],
          }))
        );
      })
      .catch(() => setMembers([]));
  }, []);

  return (
    <section id="section-3" className="px-6 md:px-16 py-16 md:py-32 bg-[#1A1814] text-white border-b border-white/5">
      <div className="max-w-6xl mx-auto">
        <SectionHeader eyebrow="(BỘ MÁY TỔ CHỨC)" title="Đội ngũ nhân sự" accent="Design & Build trọn vẹn" dark />
        <p className="max-w-2xl mx-auto text-center text-sm md:text-base text-white/60 leading-relaxed mb-16">
          Đội ngũ kiến trúc sư, kỹ sư và nghệ nhân nhiều năm kinh nghiệm, đồng hành cùng bạn từ bản vẽ đầu tiên đến ngày bàn giao.
        </p>

        {!members ? (
          <p className="text-xs text-white/50 text-center">Đang tải...</p>
        ) : members.length === 0 ? (
          <div className="flex justify-center">
            <NeedsInput label="đội ngũ nhân sự" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {members.map((m, idx) => (
              <MemberCard key={idx} member={m} onOpen={() => setOpenMember(m)} />
            ))}
          </div>
        )}
      </div>

      {openMember && <TeamMemberModal member={openMember} onClose={() => setOpenMember(null)} />}
    </section>
  );
}
