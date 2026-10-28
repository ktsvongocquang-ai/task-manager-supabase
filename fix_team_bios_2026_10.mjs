// Ghi đè bio/experience/highlights cho 18 nhân sự landing_team_members —
// nội dung "bài bản" theo ĐÚNG chức danh thật, KHÔNG bịa số năm kinh nghiệm/
// chứng chỉ/số lượng công trình cụ thể (dữ liệu mẫu cũ trước đây có bịa, sai
// hoàn toàn chức danh thật — ví dụ Giám đốc xưởng bị ghi "từng thực tập tại
// Singapore"). experience set null để bio luôn được ưu tiên hiển thị
// (TeamMemberModal.tsx: bio ưu tiên trước, experience chỉ là fallback).
import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  'https://yiuokvszyaqqjksshybn.supabase.co',
  'sb_publishable_-MePkqVIFqX6lyS9Yw3uxQ_6FWzXem1'
);

const DATA = [
  ['becb3bdb-2194-448b-be9a-16883d2059d9', 'Người sáng lập và dẫn dắt DQH Architects theo mô hình Design & Build khép kín — từ ý tưởng thiết kế đến thi công hoàn thiện. Trực tiếp định hướng phong cách Modern Tropical Biophilic & Japandi cho từng dự án, đảm bảo mọi công trình DQH thực hiện đều là bản thiết kế độc bản, không sao chép.', ['Sáng lập & định hướng chiến lược DQH Architects', 'Trực tiếp duyệt phương án thiết kế cho mọi dự án', 'Giám sát xuyên suốt từ ý tưởng đến bàn giao']],
  ['1b680404-e75f-4ce4-a427-1de39b2fcd37', 'Phụ trách điều phối tiến độ, ngân sách và chất lượng xuyên suốt vòng đời dự án — là đầu mối kết nối giữa đội thiết kế, đội thi công và khách hàng để đảm bảo công trình triển khai đúng kế hoạch đã cam kết.', ['Điều phối tiến độ & ngân sách dự án', 'Đầu mối liên lạc chính với khách hàng trong suốt thi công', 'Kiểm soát chất lượng theo từng mốc nghiệm thu']],
  ['26d1876c-ec8e-4338-bd94-2842b7586cc0', 'Trực tiếp giám sát hiện trường, điều phối đội thợ và kiểm soát chất lượng từng hạng mục thi công — đảm bảo công trình được triển khai đúng bản vẽ kỹ thuật và tiêu chuẩn hoàn thiện của DQH.', ['Giám sát thi công tại hiện trường', 'Kiểm soát chất lượng theo từng hạng mục', 'Điều phối nhân lực & tiến độ công trường']],
  ['bfbab6a5-8b96-4472-8a02-cfdec6678690', 'Phụ trách toàn bộ khâu sản xuất nội thất tại xưởng DQH — từ kiểm soát vật tư đầu vào, giám sát gia công đến nghiệm thu trước khi lắp đặt tại công trình. Đảm bảo mọi sản phẩm đạt chuẩn showroom trước khi ra khỏi xưởng.', ['Quản lý dây chuyền sản xuất nội thất', 'Kiểm soát chất lượng đầu ra tại xưởng', 'Điều phối tiến độ sản xuất theo kế hoạch lắp đặt']],
  ['8fedd09d-3d00-41d5-ab78-ed678b6166b3', 'Dẫn dắt đội thiết kế nội thất, trực tiếp phát triển phương án bố trí không gian và lựa chọn vật liệu cho từng dự án — đảm bảo mỗi công trình giữ đúng tinh thần Modern Tropical Biophilic mà vẫn cá nhân hoá theo nhu cầu riêng của khách hàng.', ['Dẫn dắt đội thiết kế nội thất', 'Phát triển phương án bố trí & phối vật liệu', 'Đảm bảo tính nhất quán phong cách DQH qua các dự án']],
  ['2039d8ca-adc9-47c2-9a32-e3a52f711f6f', 'Đảm nhận song song vai trò kiến trúc sư và thiết kế nội thất — phát triển phương án không gian từ mặt bằng kiến trúc đến chi tiết nội thất hoàn thiện cho các dự án nhà phố, biệt thự và căn hộ.', ['Thiết kế kiến trúc & nội thất đồng bộ', 'Phát triển phương án từ mặt bằng đến chi tiết hoàn thiện']],
  ['64bc5218-6cbc-403b-a270-de76b4fcad7f', 'Phát triển phương án kiến trúc và hồ sơ kỹ thuật cho các dự án nhà phố, biệt thự, căn hộ — phối hợp chặt chẽ với đội thi công để đảm bảo bản vẽ thiết kế được hiện thực hoá chính xác ngoài công trình.', ['Phát triển phương án kiến trúc & hồ sơ kỹ thuật', 'Phối hợp đội thi công đảm bảo đúng bản vẽ']],
  ['54ee7203-56d4-41fa-a286-b3d2d89c7c61', 'Tham gia phát triển phương án kiến trúc và dựng phối cảnh 3D cho các dự án DQH — hỗ trợ truyền tải ý tưởng thiết kế rõ ràng, trực quan tới khách hàng trước khi bước vào giai đoạn thi công.', ['Phát triển phương án kiến trúc', 'Dựng phối cảnh 3D truyền tải ý tưởng thiết kế']],
  ['90a7c1ab-889f-4f72-b092-0480b65ae984', 'Tham gia triển khai hồ sơ thiết kế kỹ thuật và phối hợp giám sát thi công — đảm bảo các chi tiết kiến trúc được thực hiện đúng với phương án đã duyệt.', ['Triển khai hồ sơ thiết kế kỹ thuật', 'Phối hợp giám sát thi công hiện trường']],
  ['6ac4aa64-6676-4329-abf0-3ff8b0819f27', 'Tham gia phát triển phương án kiến trúc và bản vẽ chi tiết cho các dự án nhà phố, biệt thự — đảm bảo tính thống nhất giữa công năng sử dụng và thẩm mỹ tổng thể công trình.', ['Phát triển phương án kiến trúc', 'Triển khai bản vẽ chi tiết thi công']],
  ['e68555a6-9fbc-4cb3-b966-6e310a6ce732', 'Tham gia phát triển phương án kiến trúc và phối hợp thiết kế nội — ngoại thất, đảm bảo sự liền mạch giữa không gian sống và cảnh quan xung quanh theo tinh thần biophilic của DQH.', ['Phát triển phương án kiến trúc', 'Phối hợp thiết kế liên kết nội – ngoại thất']],
  ['b111e37f-ceb1-4cdc-8b79-47f3d263405c', 'Phụ trách thiết kế cảnh quan sân vườn, mảng xanh cho các công trình DQH — hiện thực hoá yếu tố thiên nhiên trong triết lý Modern Tropical Biophilic, tạo sự kết nối giữa không gian sống và cây xanh.', ['Thiết kế cảnh quan & mảng xanh công trình', 'Hiện thực hoá yếu tố biophilic trong không gian sống']],
  ['9783b2f1-40cc-4623-a0a9-2fed651239cf', 'Phát triển phương án nội thất chi tiết, lựa chọn vật liệu và phối màu cho từng không gian — đảm bảo mỗi căn hộ, nhà phố mang dấu ấn thiết kế độc bản, không sao chép.', ['Phát triển phương án nội thất chi tiết', 'Lựa chọn vật liệu & phối màu không gian']],
  ['6c86058d-ee7d-4026-af31-d162e420d41b', 'Tham gia phát triển phương án nội thất và dựng phối cảnh 3D, hỗ trợ khách hàng hình dung rõ ràng không gian trước khi bước vào thi công thực tế.', ['Phát triển phương án nội thất', 'Dựng phối cảnh 3D hỗ trợ khách hàng hình dung không gian']],
  ['85064534-f507-4be8-b3ce-bdfd9fbe4111', 'Giám sát kỹ thuật thi công tại công trường, kiểm tra chất lượng thi công theo đúng bản vẽ và tiêu chuẩn kỹ thuật đã duyệt — đảm bảo an toàn và tiến độ triển khai.', ['Giám sát kỹ thuật thi công tại công trường', 'Kiểm tra chất lượng theo bản vẽ & tiêu chuẩn kỹ thuật']],
  ['d016cbf9-27d0-4462-844e-613e2170271a', 'Giám sát thi công hiện trường, phối hợp kiểm tra khối lượng và nghiệm thu từng hạng mục — đảm bảo công trình triển khai đúng tiến độ và chất lượng cam kết.', ['Giám sát thi công hiện trường', 'Phối hợp nghiệm thu từng hạng mục thi công']],
  ['206754df-9567-46e8-a5ac-1fd24d58073e', 'Giám sát kỹ thuật các hạng mục thi công phần thô và hoàn thiện — kiểm soát chất lượng vật tư, nhân công tại công trường theo đúng quy trình DQH.', ['Giám sát thi công phần thô & hoàn thiện', 'Kiểm soát chất lượng vật tư tại công trường']],
  ['a6a2444a-2fd4-4072-ad1e-f4d6a80fe160', 'Hỗ trợ điều phối công việc hành chính và hậu cần cho đội ngũ dự án — đảm bảo quy trình làm việc giữa các bộ phận thiết kế, thi công và khách hàng diễn ra thông suốt.', ['Điều phối hành chính & hậu cần dự án', 'Hỗ trợ kết nối thông tin giữa các bộ phận']],
];

async function main() {
  for (const [id, bio, highlights] of DATA) {
    const { error } = await sb.from('landing_team_members').update({ bio, experience: null, highlights }).eq('id', id);
    if (error) console.error('  ✗', id, error.message);
    else console.log('  ✓', id);
  }
}
main();
