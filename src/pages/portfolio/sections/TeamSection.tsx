import { SectionHeader, NeedsInput } from './shared';

interface TeamMember {
  name: string;
  role: string;
}

interface TeamGroup {
  key: string;
  label: string;
  desc: string;
  members: TeamMember[];
}

// [cần điền] — tên + vai trò thật từng người. Giữ dạng danh sách gọn (không
// bắt buộc ảnh cá nhân) vì chưa có ảnh thật — tránh lặp lỗi dùng ảnh stock
// Unsplash giả làm nhân sự thật như bản cũ.
const TEAM_GROUPS: TeamGroup[] = [
  {
    key: 'design',
    label: 'Team Thiết Kế',
    desc: 'Kiến trúc sư, kỹ sư kết cấu, concept design & moodboard vật liệu.',
    members: [
      { name: '[cần điền: tên]', role: '[cần điền: vai trò — VD: KTS Trưởng]' },
      { name: '[cần điền: tên]', role: '[cần điền: vai trò]' },
    ],
  },
  {
    key: 'construction',
    label: 'Team Thi Công',
    desc: 'Quản lý dự án, giám sát kỹ thuật hiện trường, đội thợ thi công.',
    members: [
      { name: '[cần điền: tên]', role: '[cần điền: vai trò — VD: Quản lý dự án]' },
      { name: '[cần điền: tên]', role: '[cần điền: vai trò]' },
    ],
  },
  {
    key: 'workshop',
    label: 'Xưởng Sản Xuất',
    desc: 'Gia công nội thất gỗ theo bản vẽ CAD, kiểm soát chất lượng trước khi lắp đặt.',
    members: [
      { name: '[cần điền: tên]', role: '[cần điền: vai trò — VD: Quản lý xưởng]' },
    ],
  },
];

export function TeamSection() {
  return (
    <section id="section-3" className="px-6 md:px-16 py-32 bg-[#F5F2EC] border-b border-[#2C2920]/5">
      <div className="max-w-6xl mx-auto">
        <SectionHeader eyebrow="(BỘ MÁY TỔ CHỨC)" title="Đội ngũ nhân sự" accent="Design & Build trọn vẹn" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {TEAM_GROUPS.map(group => (
            <div key={group.key} className="bg-white border border-[#2C2920]/10 rounded-sm p-7 space-y-5">
              <div>
                <h3 className="font-serif text-xl font-light text-[#2C2920]">{group.label}</h3>
                <p className="text-xs text-[#8A8070] mt-2 leading-relaxed">{group.desc}</p>
              </div>
              <div className="h-px bg-[#2C2920]/10" />
              <ul className="space-y-3">
                {group.members.map((m, idx) => (
                  <li key={idx} className="flex flex-col gap-1">
                    <span className="text-sm font-semibold text-[#2C2920]">
                      {m.name.startsWith('[cần điền') ? <NeedsInput label="tên nhân sự" /> : m.name}
                    </span>
                    <span className="text-xs text-[#8A8070]">{m.role}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
