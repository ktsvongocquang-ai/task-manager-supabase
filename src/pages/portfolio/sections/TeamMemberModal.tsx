export interface TeamMemberData {
  name: string;
  role: string;
  experience: string;
  avatarUrl: string | null;
  bio: string;
  highlights: string[];
}

export function TeamMemberModal({ member, onClose }: { member: TeamMemberData; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-[#161412]/90 z-[1000] flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg max-h-[85vh] overflow-y-auto bg-[#FAF8F4] rounded-sm shadow-2xl border border-[#2C2920]/15 p-8 relative"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[#1A1814] hover:bg-[#B8913A] text-white flex items-center justify-center text-lg font-light cursor-pointer transition-colors"
        >
          &times;
        </button>

        <div className="flex items-center gap-4 mb-6">
          {member.avatarUrl ? (
            <img src={member.avatarUrl} alt={member.name} className="w-20 h-20 rounded-full object-cover border border-[#2C2920]/10" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-[#1A1814] text-white flex items-center justify-center font-serif text-2xl shrink-0">
              {member.name.charAt(0)}
            </div>
          )}
          <div>
            <h3 className="font-serif text-xl text-[#2C2920]">{member.name}</h3>
            <p className="text-xs text-[#8A8070] mt-0.5">{member.role}</p>
          </div>
        </div>

        {member.bio ? (
          <p className="text-sm text-[#2C2920] leading-relaxed whitespace-pre-line mb-6">{member.bio}</p>
        ) : member.experience ? (
          <p className="text-sm text-[#2C2920] leading-relaxed mb-6">{member.experience}</p>
        ) : null}

        {member.highlights.length > 0 && (
          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-[#8A8070] font-semibold mb-3">Điểm nổi bật</p>
            <ul className="space-y-2">
              {member.highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[#2C2920]">
                  <span className="text-[#B8913A] mt-0.5">—</span>
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
