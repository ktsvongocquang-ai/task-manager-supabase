import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

// ============================================================
// FLASHCARDS SECTION 2.2 — Kích thước chuẩn (Ergonomics)
// Grouped by room/area for easy studying
// ============================================================
const FLASHCARDS_22 = [
  {
    heading: 'Flashcard: Phòng khách',
    content_type: 'flashcards',
    metadata: {
      flashcards: [
        { id: 1, question: "Chiều rộng chuẩn ghế sofa phòng khách?", answer: "W 200–250cm — đủ 2–3 người ngồi, phù hợp tỷ lệ phòng khách tiêu chuẩn.", short_answer: "W 200–250cm", tags: ["phòng khách", "sofa", "kích thước"] },
        { id: 2, question: "Kích thước chuẩn bàn cà phê phòng khách?", answer: "W 120cm × D 60cm — tỷ lệ phù hợp với sofa 200–250cm, không chắn lối đi.", short_answer: "W 120 × D 60cm", tags: ["phòng khách", "bàn cà phê", "kích thước"] },
        { id: 3, question: "Khoảng cách tối ưu từ sofa đến TV?", answer: "2–3m — đảm bảo góc nhìn thoải mái, không mỏi mắt cho TV 55–75 inch.", short_answer: "2–3m", tags: ["phòng khách", "TV", "khoảng cách"] },
        { id: 33, question: "Chiều cao lý tưởng của tủ TV trong phòng khách?", answer: "Mặt TV cách sàn 90–110cm — trục giữa màn hình ngang tầm mắt khi ngồi sofa.", short_answer: "90–110cm từ sàn", tags: ["phòng khách", "TV", "chiều cao"] },
        { id: 47, question: "Khoảng cách tối thiểu giữa ghế sofa và bàn trà?", answer: "35–45cm — đủ với tay lấy đồ uống mà không đứng dậy.", short_answer: "35–45cm", tags: ["phòng khách", "sofa", "bàn trà"] },
        { id: 50, question: "Khoảng cách chuẩn giữa 2 đèn downlight trong phòng khách?", answer: "1.0–1.5m — ánh sáng phủ đều, tránh điểm tối giữa các đèn.", short_answer: "1.0–1.5m", tags: ["đèn", "downlight", "chiếu sáng"] },
        { id: 51, question: "Chiều cao treo tranh trang trí chuẩn so với sàn?", answer: "Trục giữa tranh ở H 145–155cm — ngang tầm mắt người đứng, quy tắc gallery quốc tế.", short_answer: "Trục giữa H 145–155cm", tags: ["tranh", "trang trí", "chiều cao"] },
        { id: 58, question: "Khoảng cách tối thiểu từ TV đến trần nhà?", answer: "20–30cm — thoáng thị giác, thuận tiện gắn kệ hoặc đặt décor phía trên.", short_answer: "20–30cm", tags: ["TV", "trần", "khoảng cách"] },
      ]
    }
  },
  {
    heading: 'Flashcard: Phòng ngủ',
    content_type: 'flashcards',
    metadata: {
      flashcards: [
        { id: 4, question: "Khoảng cách tối thiểu từ mép giường đến tường?", answer: "50cm — khoảng tối thiểu để di chuyển, chỉnh ga, vệ sinh dễ dàng.", short_answer: "50cm", tags: ["phòng ngủ", "giường", "khoảng cách"] },
        { id: 5, question: "Kích thước giường đôi tiêu chuẩn?", answer: "1.8 × 2.0m — tiêu chuẩn Queen size, phù hợp cặp vợ chồng người Việt.", short_answer: "1.8 × 2.0m", tags: ["phòng ngủ", "giường", "kích thước"] },
        { id: 6, question: "Chiều cao đầu giường (headboard) chuẩn?", answer: "120cm tính từ sàn — đủ tựa lưng thoải mái khi đọc sách.", short_answer: "120cm từ sàn", tags: ["phòng ngủ", "headboard", "chiều cao"] },
        { id: 19, question: "Diện tích tối thiểu phòng ngủ master bedroom?", answer: "16–20m² — đủ bố trí giường 1.8m, tủ quần áo và lối đi.", short_answer: "16–20m²", tags: ["phòng ngủ", "diện tích", "master bedroom"] },
        { id: 41, question: "Chiều cao ổ điện đầu giường phòng ngủ?", answer: "30–35cm tính từ sàn — tầm với khi ngồi trên giường.", short_answer: "30–35cm từ sàn", tags: ["điện", "phòng ngủ", "chiều cao"] },
        { id: 44, question: "Chiều sâu phòng ngủ tối thiểu để bố trí giường 1.8m hợp lý?", answer: "3.5m — giường 1.8m + 50cm 2 bên + lối đi 60cm cuối giường.", short_answer: "3.5m tối thiểu", tags: ["phòng ngủ", "chiều sâu", "bố cục"] },
        { id: 59, question: "Chiều sâu tủ âm tường (built-in wardrobe) chuẩn?", answer: "55–60cm — vừa đủ móc treo, cửa mở không ăn vào không gian.", short_answer: "55–60cm", tags: ["tủ âm tường", "chiều sâu", "built-in"] },
      ]
    }
  },
  {
    heading: 'Flashcard: Tủ quần áo & Walk-in closet',
    content_type: 'flashcards',
    metadata: {
      flashcards: [
        { id: 26, question: "Chiều sâu tủ quần áo (wardrobe depth) chuẩn?", answer: "58–62cm — vừa đủ để treo quần áo ngang.", short_answer: "58–62cm", tags: ["phòng ngủ", "tủ quần áo", "chiều sâu"] },
        { id: 27, question: "Chiều cao thanh treo để áo dài nhất không chạm gầm tủ?", answer: "Thanh treo cách sàn 160–180cm — đủ cho áo dài nhất không chạm gầm.", short_answer: "160–180cm từ sàn", tags: ["tủ quần áo", "thanh treo", "chiều cao"] },
        { id: 39, question: "Chiều cao thanh treo trong walk-in closet (double hang)?", answer: "Thanh trên 180cm, thanh dưới 90cm — tiết kiệm không gian, tiêu chuẩn quốc tế.", short_answer: "Trên 180cm, dưới 90cm", tags: ["walk-in closet", "thanh treo", "chiều cao"] },
        { id: 40, question: "Khoảng không gian trước tủ quần áo để mở cửa?", answer: "60cm — đủ đứng quan sát và lấy đồ thoải mái.", short_answer: "60cm", tags: ["tủ quần áo", "lối đi", "khoảng cách"] },
        { id: 45, question: "Kích thước khu thay đồ trong walk-in closet?", answer: "90×120cm — đủ đứng xoay người, kiểm tra trang phục trong gương.", short_answer: "90×120cm", tags: ["walk-in closet", "thay đồ", "kích thước"] },
      ]
    }
  },
  {
    heading: 'Flashcard: Bếp',
    content_type: 'flashcards',
    metadata: {
      flashcards: [
        { id: 7, question: "Chiều cao mặt bàn bếp (counter height) chuẩn?", answer: "90cm — ergonomics chuẩn cho người cao 155–175cm đứng nấu không mỏi lưng.", short_answer: "90cm", tags: ["bếp", "counter", "chiều cao"] },
        { id: 8, question: "Khoảng cách giữa tủ bếp trên và tủ bếp dưới?", answer: "65cm — đủ thao tác thoải mái, đặt đồ gia dụng nhỏ.", short_answer: "65cm", tags: ["bếp", "tủ bếp", "khoảng cách"] },
        { id: 9, question: "Chiều rộng tối thiểu của đảo bếp (kitchen island)?", answer: "120cm — đảm bảo 2 người làm việc hai phía không va chạm.", short_answer: "120cm", tags: ["bếp", "đảo bếp", "kích thước"] },
        { id: 24, question: "Khoảng hở từ mặt bếp nấu lên tủ trên (upper cabinet clearance)?", answer: "45cm — đủ thao tác an toàn, tránh hơi nóng bám tủ.", short_answer: "45cm", tags: ["bếp", "tủ bếp", "an toàn"] },
        { id: 25, question: "Chiều sâu tủ bếp dưới tiêu chuẩn?", answer: "60cm — phù hợp hầu hết thiết bị bếp âm, thoải mái thao tác.", short_answer: "60cm", tags: ["bếp", "tủ bếp", "chiều sâu"] },
        { id: 28, question: "Khoảng cách giữa 2 mảng bếp đối diện nhau (work aisle)?", answer: "120cm — đủ để mở tủ lạnh, tủ bếp và 1 người đứng thao tác cùng lúc.", short_answer: "120cm", tags: ["bếp", "lối đi", "kích thước"] },
        { id: 42, question: "Chiều cao ổ điện trong bếp tính từ mặt bàn bếp?", answer: "15–20cm phía trên mặt bàn — an toàn khỏi nước bắn, tiện cắm thiết bị nhỏ.", short_answer: "15–20cm trên mặt bàn", tags: ["điện", "bếp", "chiều cao"] },
        { id: 52, question: "Khoảng cách an toàn từ bếp nấu đến tủ gỗ phía trên?", answer: "Tối thiểu 75cm — bảo vệ tủ khỏi nhiệt và dầu mỡ bắn lên.", short_answer: "75cm tối thiểu", tags: ["bếp", "an toàn", "khoảng cách"] },
        { id: 54, question: "Chiều rộng ngăn tủ lạnh âm (built-in fridge) tiêu chuẩn?", answer: "60–90cm — tủ lạnh âm châu Âu dùng 60cm; side-by-side cần 90cm.", short_answer: "60–90cm", tags: ["bếp", "tủ lạnh âm", "kích thước"] },
        { id: 60, question: "Diện tích tối thiểu phòng bếp + phòng ăn kết hợp?", answer: "16–20m² — đủ bố trí bếp chữ L hoặc đảo bếp + bàn ăn 4–6 người.", short_answer: "16–20m²", tags: ["bếp", "phòng ăn", "diện tích"] },
      ]
    }
  },
  {
    heading: 'Flashcard: WC & Phòng tắm',
    content_type: 'flashcards',
    metadata: {
      flashcards: [
        { id: 10, question: "Khoảng cách từ toilet đến tường bên trong WC?", answer: "70cm từ tường — clearance tối thiểu để ngồi thoải mái.", short_answer: "70cm", tags: ["WC", "toilet", "clearance"] },
        { id: 11, question: "Chiều cao lắp đặt lavabo chuẩn?", answer: "H 80–85cm — phù hợp chiều cao người Việt, không cúi quá nhiều.", short_answer: "H 80–85cm", tags: ["WC", "lavabo", "chiều cao"] },
        { id: 12, question: "Chiều cao vòi sen (shower head) chuẩn?", answer: "H 200–210cm — người cao 180cm không bị xối thẳng mặt.", short_answer: "H 200–210cm", tags: ["WC", "vòi sen", "chiều cao"] },
        { id: 30, question: "Tỷ lệ kích thước gương phòng tắm so với lavabo?", answer: "Rộng bằng hoặc lớn hơn tủ lavabo, cao 60–80cm — đủ nhìn toàn mặt khi đứng.", short_answer: "Rộng ≥ lavabo, cao 60–80cm", tags: ["WC", "gương", "kích thước"] },
        { id: 31, question: "Diện tích tối thiểu phòng tắm đứng (shower only)?", answer: "90×90cm tối thiểu; 100×100cm là lý tưởng.", short_answer: "90×90cm tối thiểu", tags: ["WC", "shower", "diện tích"] },
        { id: 32, question: "Khoảng cách từ mép bồn tắm đến tường tối thiểu?", answer: "60cm — đủ bước vào/ra, lau chùi và đặt phụ kiện bên cạnh.", short_answer: "60cm", tags: ["WC", "bồn tắm", "khoảng cách"] },
        { id: 53, question: "Diện tích phòng tắm đủ bố trí bồn tắm + vòi sen + toilet?", answer: "Tối thiểu 5–6m²; master bath DQH tiêu chuẩn thường 6–8m².", short_answer: "5–6m² tối thiểu", tags: ["WC", "diện tích", "master bath"] },
      ]
    }
  },
  {
    heading: 'Flashcard: Cửa · Hành lang · Cầu thang',
    content_type: 'flashcards',
    metadata: {
      flashcards: [
        { id: 13, question: "Chiều rộng cửa phòng ngủ tối thiểu?", answer: "80cm — đủ cho người trưởng thành và đồ nội thất nhỏ đi qua, tiêu chuẩn TCVN.", short_answer: "80cm", tags: ["cửa", "phòng ngủ", "TCVN"] },
        { id: 14, question: "Chiều rộng cửa phòng tắm tối thiểu?", answer: "70cm — tiêu chuẩn tối thiểu; 80cm nếu có người lớn tuổi hoặc trẻ nhỏ.", short_answer: "70cm", tags: ["cửa", "WC", "kích thước"] },
        { id: 15, question: "Chiều cao bậc thang (riser height) tiêu chuẩn?", answer: "15–18cm — thoải mái leo không mỏi chân; trên 20cm gây khó chịu.", short_answer: "15–18cm", tags: ["cầu thang", "bậc thang", "chiều cao"] },
        { id: 16, question: "Chiều rộng bản thang (tread depth) tối thiểu?", answer: "25–28cm — đặt vừa bàn chân khi leo, tránh trượt và mất thăng bằng.", short_answer: "25–28cm", tags: ["cầu thang", "bản thang", "kích thước"] },
        { id: 17, question: "Chiều rộng hành lang trong nhà tối thiểu?", answer: "90cm — đủ 1 người đi xách đồ; 120cm nếu 2 người qua nhau.", short_answer: "90cm", tags: ["hành lang", "lối đi", "kích thước"] },
        { id: 18, question: "Chiều cao tay vịn cầu thang chuẩn?", answer: "90–100cm tính từ mặt bậc — đảm bảo an toàn, đúng tầm tay người lớn.", short_answer: "90–100cm", tags: ["cầu thang", "tay vịn", "an toàn"] },
        { id: 48, question: "Chiều rộng cầu thang đơn trong nhà phố tối thiểu?", answer: "90cm — đủ 1 người xách đồ; 110cm nếu 2 người qua nhau thoải mái.", short_answer: "90cm tối thiểu", tags: ["cầu thang", "chiều rộng", "nhà phố"] },
        { id: 49, question: "Chiều cao lan can ban công tối thiểu theo TCXD Việt Nam?", answer: "1.1m — quy chuẩn an toàn nhà ở; 1.2m cho tầng cao trên 12m.", short_answer: "1.1m (trên 12m: 1.2m)", tags: ["ban công", "lan can", "TCVN", "an toàn"] },
        { id: 55, question: "Chiều cao khuôn cửa phòng ở chuẩn DQH?", answer: "2.1m tiêu chuẩn; 2.4m cho không gian cao cấp DQH — tạo cảm giác thoáng và sang.", short_answer: "2.1m (DQH cao cấp: 2.4m)", tags: ["cửa", "chiều cao", "DQH standard"] },
        { id: 56, question: "Khoảng hở dưới cánh cửa trong nhà?", answer: "1–1.5cm — thông thoáng khí, lưu thông không khí điều hòa giữa các phòng.", short_answer: "1–1.5cm", tags: ["cửa", "thông gió", "khe hở"] },
      ]
    }
  },
  {
    heading: 'Flashcard: Phòng ăn & Quầy bar',
    content_type: 'flashcards',
    metadata: {
      flashcards: [
        { id: 36, question: "Chiều cao bàn ăn chuẩn?", answer: "74–76cm — khuỷu tay thoải mái trên bàn khi ngồi ghế 43–45cm.", short_answer: "74–76cm", tags: ["phòng ăn", "bàn ăn", "chiều cao"] },
        { id: 37, question: "Diện tích mỗi người cần tại bàn ăn?", answer: "60cm chiều rộng/người — đủ đặt bát đĩa, không va chạm người bên cạnh.", short_answer: "60cm/người", tags: ["phòng ăn", "bàn ăn", "diện tích"] },
        { id: 38, question: "Khoảng cách từ bàn ăn đến tường hoặc tủ xung quanh?", answer: "90cm — đủ để kéo ghế ra và đứng dậy thoải mái không đụng vật phía sau.", short_answer: "90cm", tags: ["phòng ăn", "lối đi", "khoảng cách"] },
        { id: 46, question: "Chiều cao mặt quầy bar (bar counter) tiêu chuẩn?", answer: "100–110cm — phù hợp đứng hoặc ngồi ghế cao bar stool 65–75cm.", short_answer: "100–110cm", tags: ["quầy bar", "chiều cao", "ergonomics"] },
        { id: 57, question: "Chiều cao đèn thả (pendant light) phía trên bàn ăn?", answer: "Đáy đèn cách mặt bàn 70–80cm — chiếu sáng tốt, không chói mắt khi ngồi.", short_answer: "70–80cm từ mặt bàn", tags: ["đèn", "pendant", "phòng ăn"] },
      ]
    }
  },
  {
    heading: 'Flashcard: Bàn làm việc & Kệ sách',
    content_type: 'flashcards',
    metadata: {
      flashcards: [
        { id: 21, question: "Khoảng cách từ mặt bàn làm việc đến mắt người ngồi?", answer: "60–70cm — khoảng nhìn màn hình an toàn, hạn chế mỏi mắt và căng cổ.", short_answer: "60–70cm", tags: ["bàn làm việc", "ergonomics", "màn hình"] },
        { id: 22, question: "Chiều cao bàn làm việc (desk height) chuẩn?", answer: "72–75cm — khuỷu tay 90 độ khi gõ phím.", short_answer: "72–75cm", tags: ["bàn làm việc", "chiều cao", "ergonomics"] },
        { id: 23, question: "Chiều cao ghế ngồi làm việc so với sàn?", answer: "43–50cm — đùi song song với sàn, chân đặt phẳng xuống đất.", short_answer: "43–50cm", tags: ["ghế", "chiều cao", "ergonomics"] },
        { id: 34, question: "Chiều cao tối đa của kệ sách ngăn trên cùng?", answer: "Không quá 210cm — giới hạn với tay bình thường không cần ghế.", short_answer: "Tối đa 210cm", tags: ["kệ sách", "chiều cao", "an toàn"] },
        { id: 35, question: "Khoảng cách giữa các ngăn kệ phù hợp sách A4?", answer: "32–35cm — vừa sách A4, binder, có khoảng thở cho đồ trang trí nhỏ.", short_answer: "32–35cm", tags: ["kệ sách", "ngăn kệ", "kích thước"] },
      ]
    }
  },
  {
    heading: 'Flashcard: Trần · Điện · Cửa sổ',
    content_type: 'flashcards',
    metadata: {
      flashcards: [
        { id: 20, question: "Chiều cao trần tối thiểu để không gian cảm giác thoáng?", answer: "2.8m — dưới mức này cảm giác chật; DQH premium thường 3.0m+.", short_answer: "2.8m (DQH: 3.0m+)", tags: ["trần", "chiều cao", "không gian"] },
        { id: 29, question: "Chiều cao bệ cửa sổ (window sill) tối ưu trong phòng ngủ?", answer: "80–90cm — tầm mắt khi nằm, đủ kê đồ trang trí, tránh mất an toàn.", short_answer: "80–90cm", tags: ["cửa sổ", "phòng ngủ", "chiều cao"] },
        { id: 43, question: "Chiều cao công tắc đèn chuẩn từ sàn?", answer: "120–130cm — tầm tay với trung bình người Việt khi đứng, tiêu chuẩn TCVN 9207.", short_answer: "120–130cm", tags: ["điện", "công tắc", "TCVN"] },
      ]
    }
  },
];

// ============================================================
// FLASHCARDS SECTION 2.3 — Vật liệu chuẩn DQH
// Grouped by material type
// ============================================================
const FLASHCARDS_23 = [
  {
    heading: 'Flashcard: Gỗ tự nhiên',
    content_type: 'flashcards',
    metadata: {
      flashcards: [
        { id: 61, question: "Tại sao DQH ưu tiên gỗ tự nhiên hơn MDF/HDF?", answer: "Gỗ tự nhiên aging đẹp theo thời gian, vân thớ độc đáo, không phồng trộp khi ẩm — phù hợp khí hậu HCMC và cam kết bền vững của DQH.", short_answer: "Aging đẹp, không phồng trộp khi ẩm", tags: ["gỗ", "vật liệu", "DQH standard"] },
        { id: 62, question: "5 loại gỗ tự nhiên trong danh mục chuẩn DQH?", answer: "Oak, Walnut, Cedar, Xoan và Lát — độ bền cao, vân đẹp, phù hợp nội thất premium.", short_answer: "Oak, Walnut, Cedar, Xoan, Lát", tags: ["gỗ", "danh mục", "DQH standard"] },
        { id: 63, question: "Nhà cung cấp gỗ chuẩn DQH?", answer: "An Cường (ancuong.com) và Mộc Phát (mocphat.com).", short_answer: "An Cường & Mộc Phát", tags: ["gỗ", "supplier", "vendor"] },
        { id: 76, question: "Sự khác biệt ứng dụng giữa Oak và Walnut?", answer: "Oak: vân thẳng sáng ấm, phù hợp Quiet Luxury. Walnut: vân xoắn nâu đậm, phù hợp Modern Luxury/Classic.", short_answer: "Oak=Quiet Luxury, Walnut=Modern Luxury", tags: ["gỗ", "oak", "walnut"] },
        { id: 77, question: "Khi nào dùng Cedar trong dự án DQH?", answer: "Tủ quần áo và walk-in closet — mùi thơm tự nhiên đuổi mối mọt, kháng ẩm tốt.", short_answer: "Walk-in closet, tủ quần áo", tags: ["gỗ", "cedar", "tủ quần áo"] },
        { id: 84, question: "Tại sao An Cường là nhà cung cấp gỗ DQH lựa chọn?", answer: "Cung cấp gỗ công nghiệp cao cấp (acrylic, laminate, veneer) chất lượng ổn định, bảo hành rõ ràng, phổ biến phân khúc premium VN.", short_answer: "Chất lượng ổn định, bảo hành rõ ràng", tags: ["gỗ", "An Cường", "supplier"] },
        { id: 85, question: "Sự khác biệt giữa veneer gỗ và solid wood?", answer: "Veneer: lớp gỗ thật mỏng phủ lên MDF — đẹp, nhẹ, ổn định hơn nhưng không sửa nhiều lần. Solid wood đắt hơn nhưng bền và repair được.", short_answer: "Veneer=ổn định hơn, Solid=bền hơn, repair được", tags: ["gỗ", "veneer", "solid wood"] },
        { id: 93, question: "Sự khác biệt giữa engineered wood floor và solid hardwood floor?", answer: "Engineered wood: nhiều lớp, ổn định hơn trong độ ẩm biến thiên, có thể lắp nổi. Solid hardwood: 100% gỗ thật, sàm lại được nhiều lần nhưng co giãn ở HCMC.", short_answer: "Engineered=ổn định hơn ở HCMC, Solid=sàm lại được", tags: ["sàn", "gỗ", "engineered wood"] },
        { id: 120, question: "Acacia wood (gỗ keo tràm) có trong danh mục DQH không?", answer: "Chưa trong danh mục chuẩn nhưng có thể xem xét cho dự án budget-mid — cần approval từ Design Director trước khi dùng.", short_answer: "Chưa chuẩn, cần approval Design Director", tags: ["gỗ", "acacia", "approval"] },
      ]
    }
  },
  {
    heading: 'Flashcard: Đá tự nhiên & Engineered stone',
    content_type: 'flashcards',
    metadata: {
      flashcards: [
        { id: 64, question: "4 loại đá tự nhiên trong danh mục vật liệu DQH?", answer: "Marble tự nhiên, Limestone, Slate và Granite.", short_answer: "Marble, Limestone, Slate, Granite", tags: ["đá", "danh mục", "DQH standard"] },
        { id: 65, question: "Nhà cung cấp đá chuẩn DQH?", answer: "Vicostone (vicostone.com) cho đá engineered; kho đá tự nhiên tại Quận 9 cho marble/limestone nguyên khối.", short_answer: "Vicostone & kho đá Q.9", tags: ["đá", "supplier", "vendor"] },
        { id: 74, question: "Sự khác biệt giữa Marble tự nhiên và Vicostone engineered stone?", answer: "Marble tự nhiên: vân độc bản, cần seal, thấm ố. Vicostone: đồng đều, không thấm, dễ bảo trì — phù hợp mặt bếp.", short_answer: "Marble=vân độc, cần seal. Vicostone=dễ bảo trì", tags: ["đá", "marble", "Vicostone"] },
        { id: 75, question: "Tại sao Limestone phù hợp cho Quiet Luxury?", answer: "Tone warm neutral tự nhiên, bề mặt matte, vân chìm — đúng DNA Quiet Luxury là sang trọng không phô trương.", short_answer: "Warm neutral, matte, vân chìm", tags: ["đá", "limestone", "Quiet Luxury"] },
        { id: 82, question: "Slate có đặc điểm gì phù hợp cho dự án DQH?", answer: "Bề mặt tự nhiên lớp lớp, màu xám xanh/đen, chống trơn trượt — phù hợp sàn WC, ban công, outdoor.", short_answer: "Chống trơn, phù hợp WC/ban công/outdoor", tags: ["đá", "slate", "ứng dụng"] },
        { id: 83, question: "Granite khác Marble ở điểm gì trong ứng dụng thực tế?", answer: "Granite: cứng hơn, chịu nhiệt và acid — phù hợp mặt bếp. Marble: mềm hơn — ốp tường, sàn, đầu giường.", short_answer: "Granite=mặt bếp, Marble=ốp tường/sàn", tags: ["đá", "granite", "marble"] },
        { id: 96, question: "Cách kiểm tra chất lượng marble trước khi dùng?", answer: "Kiểm tra water absorption, check crack ngầm bằng đèn UV, đo độ dày tối thiểu 18mm cho sàn và 20mm cho mặt bếp.", short_answer: "Water absorption test, UV check crack, đo độ dày", tags: ["marble", "QC", "kiểm tra"] },
        { id: 99, question: "Cách phân biệt Limestone thật và ceramic giả Limestone?", answer: "Limestone thật: vân không đều, lạnh khi chạm, nặng hơn, có lỗ khí nhỏ (cần seal). Ceramic giả: đều tăm tắp, nhẹ hơn, bề mặt phẳng hoàn toàn.", short_answer: "Limestone thật: vân không đều, lạnh, nặng, có lỗ khí", tags: ["limestone", "ceramic", "phân biệt"] },
        { id: 104, question: "Cách lựa chọn thickness đá cho từng ứng dụng?", answer: "Mặt bàn bếp: 20mm. Sàn: 12–15mm. Ốp tường: 10–12mm. Đầu giường: 15–20mm. Dưới 10mm dễ nứt.", short_answer: "Bếp 20mm, sàn 12–15mm, tường 10–12mm", tags: ["đá", "thickness", "specification"] },
        { id: 109, question: "Onyx stone phù hợp ứng dụng nào trong dự án DQH?", answer: "Backlit wall panel (ốp tường chiếu sáng từ sau) — hiệu ứng đèn đẹp. Không dùng làm sàn hoặc mặt bếp.", short_answer: "Backlit wall panel, không dùng sàn/mặt bếp", tags: ["onyx", "đá", "backlit"] },
        { id: 117, question: "Cách xử lý joint (mạch) giữa các tấm đá để trông sang hơn?", answer: "Dùng invisible joint (mạch tàng) hoặc book-match (tấm đá gương nhau qua đường cắt) — tạo cảm giác liền mạch, đặc trưng công trình fine finish.", short_answer: "Invisible joint hoặc book-match", tags: ["đá", "joint", "fine finish"] },
        { id: 119, question: "Tại sao cần spec rõ honed finish hay polished finish khi order đá?", answer: "Honed (mờ): matte, ít lộ vết tay, DQH ưu tiên. Polished (bóng): phản chiếu như gương, khó bảo trì. Cùng loại đá nhưng hai finish trông rất khác nhau.", short_answer: "Honed=DQH ưu tiên, Polished=khó bảo trì", tags: ["đá", "finish", "specification"] },
      ]
    }
  },
  {
    heading: 'Flashcard: Vải & Upholstery',
    content_type: 'flashcards',
    metadata: {
      flashcards: [
        { id: 66, question: "Tại sao DQH chọn linen, cotton, wool thay vì polyester?", answer: "Linen/cotton/wool breathable tự nhiên, cảm giác cao cấp khi chạm, aging tốt — polyester giá rẻ không phù hợp Quiet Luxury.", short_answer: "Breathable tự nhiên, aging tốt, không polyester", tags: ["vải", "vật liệu", "Quiet Luxury"] },
        { id: 67, question: "Nhà cung cấp vải chuẩn DQH?", answer: "Acacia Fabrics (acaciafabrics.com) và Cỏ May.", short_answer: "Acacia Fabrics & Cỏ May", tags: ["vải", "supplier", "vendor"] },
        { id: 79, question: "Linen fabric có ưu điểm gì phù hợp khí hậu HCMC?", answer: "Thoáng khí nhất trong các vải tự nhiên, hút ẩm và thoát hơi nhanh, mát mùa hè.", short_answer: "Thoáng khí nhất, mát mùa hè", tags: ["vải", "linen", "khí hậu HCMC"] },
        { id: 80, question: "Cashmere và wool được dùng ở vị trí nào trong dự án DQH?", answer: "Thảm (rug), vỏ gối trang trí, throw blanket — tạo cảm giác ấm sang, phù hợp phòng ngủ và phòng khách.", short_answer: "Thảm, vỏ gối, throw blanket", tags: ["vải", "wool", "cashmere"] },
        { id: 105, question: "Upholstery fabric chuẩn DQH cho sofa cao cấp?", answer: "Linen weave, performance velvet, bouclé — natural fiber hoặc high-grade blended. Test pilling và fade resistance.", short_answer: "Linen weave, velvet, bouclé — test pilling", tags: ["vải", "upholstery", "sofa"] },
        { id: 114, question: "Bouclé fabric là gì?", answer: "Vải sợi vòng xoắn, texture thô nhẹ, màu neutral — rất phù hợp Quiet Luxury. Dùng cho armchair, sofa accent, đầu giường upholstered.", short_answer: "Sợi vòng xoắn, texture thô nhẹ, phù hợp Quiet Luxury", tags: ["vải", "bouclé", "Quiet Luxury"] },
      ]
    }
  },
  {
    heading: 'Flashcard: Sơn & Hoàn thiện bề mặt',
    content_type: 'flashcards',
    metadata: {
      flashcards: [
        { id: 68, question: "Tại sao DQH dùng sơn nước không độc?", answer: "Bảo vệ sức khỏe gia đình client — đặc biệt quan trọng với trẻ em và người lớn tuổi.", short_answer: "Bảo vệ sức khỏe, không độc hại", tags: ["sơn", "sức khỏe", "DQH standard"] },
        { id: 69, question: "Hai nhà cung cấp sơn chuẩn DQH?", answer: "Jotun (jotun.com) và Dulux (dulux.vn).", short_answer: "Jotun & Dulux", tags: ["sơn", "supplier", "vendor"] },
        { id: 78, question: "Sự khác biệt giữa finish matte và gloss cho gỗ và đá?", answer: "Matte: không phản chiếu, che vết tay, DQH ưa dùng. Gloss: phản chiếu cao, dễ thấy bụi — chỉ dùng khi client yêu cầu.", short_answer: "Matte = DQH ưu tiên", tags: ["finish", "matte", "gloss"] },
        { id: 86, question: "Jotun khác Dulux ở điểm gì khi tư vấn client?", answer: "Jotun mạnh về dải màu trung tính và white — phù hợp Quiet Luxury. Dulux có công cụ color matching tốt, mix màu theo yêu cầu tại điểm bán.", short_answer: "Jotun=neutral/white tốt, Dulux=color matching linh hoạt", tags: ["sơn", "Jotun", "Dulux"] },
        { id: 95, question: "Limewash paint là gì và khi nào DQH khuyến nghị dùng?", answer: "Sơn vôi truyền thống, tạo bề mặt matte có chiều sâu, breathing wall — phù hợp Quiet Luxury, tạo texture tự nhiên hơn sơn thông thường.", short_answer: "Sơn vôi matte, breathing wall, Quiet Luxury", tags: ["sơn", "limewash", "tường"] },
      ]
    }
  },
  {
    heading: 'Flashcard: Phụ kiện · Kính · Kim loại',
    content_type: 'flashcards',
    metadata: {
      flashcards: [
        { id: 70, question: "Tại sao DQH dùng Blum và Hafele cho phụ kiện?", answer: "Tiêu chuẩn châu Âu — bền 50.000+ lần đóng mở, bảo hành chính hãng, phù hợp cam kết chất lượng DQH.", short_answer: "Chuẩn châu Âu, bền 50.000+ lần", tags: ["phụ kiện", "Blum", "Hafele"] },
        { id: 87, question: "Khi nào dùng Blum, khi nào dùng Hafele?", answer: "Blum: chuyên bản lề Blumotion, ray trượt tủ bếp cao cấp. Hafele: đa dạng hơn, bao gồm khóa, tay nắm, phụ kiện WC.", short_answer: "Blum=tủ bếp, Hafele=đa dạng hơn", tags: ["phụ kiện", "Blum", "Hafele"] },
        { id: 90, question: "PVD coating là gì và khi nào DQH khuyến nghị dùng?", answer: "Physical Vapor Deposition — mạ ion kim loại, cứng hơn mạ thường 4–5 lần, không bong tróc. Dùng cho gold/rose gold finish phụ kiện WC, tay nắm.", short_answer: "Mạ ion kim loại, bền 4–5 lần, không bong tróc", tags: ["PVD", "phụ kiện", "WC"] },
        { id: 100, question: "Brass (đồng thau) finishing — khi nào dùng và khi nào không?", answer: "Dùng: brushed brass cho phụ kiện WC, tay nắm, đèn trong không gian warm neutral. Không dùng: polished brass sáng bóng — quá flashy.", short_answer: "Brushed brass OK, polished brass tránh", tags: ["brass", "phụ kiện", "finish"] },
        { id: 101, question: "Tại sao glass partition phù hợp với triết lý DQH?", answer: "Kính trong cho phép ánh sáng tự nhiên xuyên suốt không gian, không làm nặng thị giác — đúng với indirect lighting của Quiet Luxury.", short_answer: "Cho ánh sáng tự nhiên xuyên, không nặng thị giác", tags: ["kính", "vách kính", "ánh sáng"] },
        { id: 102, question: "Frosted glass và fluted glass khác nhau thế nào?", answer: "Frosted: mờ đục, tạo riêng tư — dùng vách phòng ngủ/WC. Fluted: texture sóng dọc, tán sáng — dùng cửa tủ, vách trang trí.", short_answer: "Frosted=riêng tư, Fluted=tán sáng trang trí", tags: ["kính", "frosted", "fluted"] },
      ]
    }
  },
  {
    heading: 'Flashcard: Vật liệu cần tránh',
    content_type: 'flashcards',
    metadata: {
      flashcards: [
        { id: 71, question: "Tại sao DQH không dùng microcement tại HCMC?", answer: "HCMC độ ẩm 75–85%, nhiệt độ cao — microcement nứt và bong tróc sau 1–2 năm. DQH cam kết bền 10–20 năm.", short_answer: "Nứt/bong do ẩm cao và nhiệt độ HCMC", tags: ["microcement", "vật liệu tránh", "HCMC"] },
        { id: 72, question: "Tại sao mạ vàng nằm trong danh mục vật liệu cần tránh?", answer: "Tróc vảy sau 2–3 năm. Thay bằng brushed brass hoặc PVD coating bền hơn.", short_answer: "Tróc vảy sau 2–3 năm", tags: ["mạ vàng", "vật liệu tránh", "PVD"] },
        { id: 73, question: "Plastic decor là gì và tại sao DQH tránh dùng?", answer: "Đồ trang trí nhựa giả vật liệu (giả gỗ, đá, mây) — không có câu chuyện vật liệu, không phù hợp triết lý DQH.", short_answer: "Nhựa giả vật liệu, không có câu chuyện", tags: ["plastic", "vật liệu tránh", "Quiet Luxury"] },
        { id: 89, question: "Tại sao DQH không dùng gạch ceramic bóng trong phòng khách?", answer: "Phản chiếu mạnh, cảm giác lạnh và công trình — ưu tiên sàn gỗ, đá matte hoặc large format tile matte.", short_answer: "Phản chiếu mạnh, cảm giác lạnh", tags: ["sàn", "ceramic", "vật liệu tránh"] },
        { id: 97, question: "Tại sao DQH không dùng mirror finish cho đồ nội thất lớn?", answer: "Mặt gương phản chiếu và lộ toàn bộ môi trường — dễ thấy bụi, vết tay, không phù hợp triết lý tiết chế của Quiet Luxury.", short_answer: "Lộ bụi/vết tay, không phù hợp Quiet Luxury", tags: ["finish", "mirror", "vật liệu tránh"] },
        { id: 103, question: "Tại sao DQH hạn chế thạch cao 3D đắp nổi?", answer: "Bám bụi, khó vệ sinh, tạo cảm giác rườm rà — đi ngược tiêu chí clean lines của Quiet Luxury.", short_answer: "Rườm rà, bám bụi, ngược clean lines", tags: ["thạch cao", "vật liệu tránh", "Quiet Luxury"] },
        { id: 108, question: "Tại sao DQH không dùng alu composite cladding cho nội thất?", answer: "Phản chiếu như kim loại công nghiệp, cảm giác lạnh và vô hồn — không có câu chuyện vật liệu, không phù hợp không gian premium.", short_answer: "Cảm giác công nghiệp, không có câu chuyện vật liệu", tags: ["alu composite", "vật liệu tránh", "premium"] },
        { id: 115, question: "Tại sao DQH không dùng high gloss laminate cho tủ bếp?", answer: "Phản chiếu như gương, lộ vân tay và vết trầy — không phù hợp triết lý matte tinh tế của DQH. Thay bằng matte laminate hoặc veneer gỗ.", short_answer: "Lộ vân tay/vết trầy, không phù hợp matte DQH", tags: ["laminate", "tủ bếp", "vật liệu tránh"] },
      ]
    }
  },
  {
    heading: 'Flashcard: Ứng dụng · Bảo trì · Tư vấn',
    content_type: 'flashcards',
    metadata: {
      flashcards: [
        { id: 81, question: "Khi client yêu cầu vật liệu ngoài danh mục DQH, designer cần làm gì?", answer: "Báo cáo Lead/Design Director trước khi cam kết — không tự quyết ngoài danh mục chuẩn.", short_answer: "Báo cáo Design Director trước", tags: ["quy trình", "vật liệu", "approval"] },
        { id: 88, question: "Wool rug (thảm len) cần bảo trì như thế nào?", answer: "Hút bụi 2 lần/tuần, lật chiều 6 tháng/lần, dry clean 1 lần/năm. Tránh ẩm dưới thảm, không giặt máy.", short_answer: "Hút bụi 2x/tuần, dry clean 1x/năm", tags: ["thảm", "wool", "bảo trì"] },
        { id: 91, question: "Terrazzo có phù hợp với tiêu chí vật liệu DQH không?", answer: "Có — terrazzo tự nhiên (cement + marble chips) bền, unique, aging đẹp. Phù hợp Quiet Luxury khi dùng tone neutral.", short_answer: "Có — terrazzo tự nhiên tone neutral", tags: ["terrazzo", "sàn", "Quiet Luxury"] },
        { id: 92, question: "Khi client hỏi về wallpaper, DQH tư vấn thế nào?", answer: "Ưu tiên wallpaper textile (linen, grasscloth) hoặc natural fiber. Tránh vinyl rẻ. Hoặc thay bằng paint texture/lime wash phù hợp khí hậu ẩm HCMC.", short_answer: "Textile wallpaper hoặc limewash, tránh vinyl", tags: ["wallpaper", "tường", "tư vấn"] },
        { id: 94, question: "Rattan và bamboo có nằm trong danh mục vật liệu DQH không?", answer: "Không trong danh mục chuẩn nhưng được chấp nhận có chọn lọc — rattan tự nhiên (không sơn bóng) phù hợp làm accent.", short_answer: "Không chuẩn, chấp nhận có chọn lọc làm accent", tags: ["rattan", "bamboo", "accent"] },
        { id: 98, question: "Concrete trang trí có phù hợp với nội thất DQH không?", answer: "Concrete polished hoặc concrete look tile chấp nhận được cho Contemporary Minimalism — phải sealed kỹ và thi công đúng chuẩn.", short_answer: "Chấp nhận được nếu polished và sealed kỹ", tags: ["concrete", "sàn", "Contemporary Minimalism"] },
        { id: 106, question: "Sàn gỗ hay sàn đá — khi nào chọn loại nào?", answer: "Gỗ: phòng ngủ, phòng khách — ấm, thoải mái chân trần. Đá: WC, bếp, lối vào — chịu ẩm, dễ vệ sinh.", short_answer: "Gỗ=phòng ngủ/khách, Đá=WC/bếp/lối vào", tags: ["sàn", "gỗ", "đá"] },
        { id: 107, question: "Acoustic panel vật liệu nào phù hợp với DQH?", answer: "Felt tự nhiên (wool felt), perforated wood panel, fabric panel linen — vừa chức năng vừa thẩm mỹ, tránh foam tổng hợp.", short_answer: "Wool felt, perforated wood, linen fabric panel", tags: ["acoustic", "vật liệu", "tiêu âm"] },
        { id: 110, question: "Cách bảo trì sàn gỗ tự nhiên trong khí hậu HCMC?", answer: "Lau khô ngay khi dính nước, wax/oil hàng năm, duy trì độ ẩm trong nhà 50–65% RH để tránh co ngót hoặc phồng.", short_answer: "Lau khô ngay, wax hàng năm, 50–65% RH", tags: ["sàn gỗ", "bảo trì", "HCMC"] },
        { id: 111, question: "Microcement khác gì với polished concrete?", answer: "Microcement: lớp mỏng 2–3mm phủ lên nền có sẵn, nhạy với co giãn nhiệt → nứt ở HCMC. Polished concrete: mài trực tiếp lên sàn bê tông — bền hơn.", short_answer: "Microcement=lớp mỏng, dễ nứt. Polished concrete=bền hơn", tags: ["microcement", "concrete", "phân biệt"] },
        { id: 112, question: "Khi thiết kế phòng tắm wet area, vật liệu nào cần ưu tiên?", answer: "Đá tự nhiên sealed (slate, granite, honed marble), tile lớn R9+ anti-slip, joint keo epoxy chống ẩm — tránh grout thông thường dễ đen mốc.", short_answer: "Đá sealed + tile R9+ + epoxy joint", tags: ["WC", "wet area", "vật liệu"] },
        { id: 113, question: "Cách tư vấn client về upkeep của marble tự nhiên?", answer: "Cần seal 1–2 lần/năm, lau ngay khi dính acid (chanh, cafe). Nếu client không chấp nhận bảo trì cao → đề xuất Vicostone hoặc porcelain marble look.", short_answer: "Seal 1–2x/năm, tránh acid. Không chấp nhận → Vicostone", tags: ["marble", "bảo trì", "tư vấn"] },
        { id: 116, question: "Scent concept (hương thơm không gian) có phải DQH cần spec không?", answer: "Không phải vật liệu thi công nhưng DQH recommend spec hương thơm như một phần sensory experience — điểm khác biệt của dự án premium.", short_answer: "Recommend spec hương thơm cho dự án premium", tags: ["scent", "sensory", "premium experience"] },
        { id: 118, question: "Handmade tile có phù hợp với DQH không?", answer: "Có — zellige tile (Maroc), terracotta artisanal phù hợp Quiet Luxury khi làm accent (backsplash bếp, ốp tường toilet). Không trải sàn toàn bộ.", short_answer: "Phù hợp làm accent, không trải sàn toàn bộ", tags: ["tile", "handmade", "accent"] },
      ]
    }
  },
];

// ============================================================
// QUIZ 6: Ngân hàng kiến thức DQH (120 câu, frontend random 30)
// ============================================================
const QUIZ_6 = {
  quiz: {
    title: "Bài test 6: Ngân hàng kiến thức DQH",
    description: "Ngân hàng 120 câu hỏi tổng hợp từ Kích thước chuẩn (2.2) và Vật liệu DQH (2.3). Hệ thống chọn ngẫu nhiên 30 câu mỗi lần thi. Đạt ≥80% (24/30) mới pass.",
    type: "knowledge_bank",
    timeLimit: 30,
    passingScore: 80,
    totalQuestions: 30,
    totalBank: 120,
    instruction: "Random 30 câu từ ngân hàng 120 kiến thức. Mỗi câu có 4 lựa chọn (1 đúng, 3 sai). Hiện giải thích sau mỗi câu trả lời. Hiện danh sách câu sai sau khi hoàn thành.",
    questions: [
      // ===== SECTION 2.2: KÍCH THƯỚC CHUẨN (60 câu) =====
      { id: 1, section: "2.2", question: "Chiều rộng chuẩn ghế sofa phòng khách?", options: ["A. W 150–180cm", "B. W 200–250cm", "C. W 280–320cm", "D. W 120–140cm"], correct: 1, explanation: "W 200–250cm — đủ 2–3 người ngồi, phù hợp tỷ lệ phòng khách tiêu chuẩn." },
      { id: 2, section: "2.2", question: "Kích thước chuẩn bàn cà phê phòng khách?", options: ["A. W 120 × D 60cm", "B. W 80 × D 40cm", "C. W 160 × D 80cm", "D. W 100 × D 100cm"], correct: 0, explanation: "W 120cm × D 60cm — tỷ lệ phù hợp với sofa 200–250cm, không chắn lối đi." },
      { id: 3, section: "2.2", question: "Khoảng cách tối ưu từ sofa đến TV?", options: ["A. 1–1.5m", "B. 1.5–2m", "C. 2–3m", "D. 3.5–4.5m"], correct: 2, explanation: "2–3m — đảm bảo góc nhìn thoải mái, không mỏi mắt cho TV 55–75 inch." },
      { id: 4, section: "2.2", question: "Khoảng cách tối thiểu từ mép giường đến tường?", options: ["A. 30cm", "B. 50cm", "C. 70cm", "D. 100cm"], correct: 1, explanation: "50cm — khoảng tối thiểu để di chuyển, chỉnh ga, vệ sinh dễ dàng." },
      { id: 5, section: "2.2", question: "Kích thước giường đôi tiêu chuẩn DQH?", options: ["A. 1.4 × 2.0m", "B. 1.6 × 2.0m", "C. 1.8 × 2.0m", "D. 2.0 × 2.2m"], correct: 2, explanation: "1.8 × 2.0m — tiêu chuẩn Queen size, phù hợp cặp vợ chồng người Việt." },
      { id: 6, section: "2.2", question: "Chiều cao đầu giường (headboard) chuẩn?", options: ["A. 90cm từ sàn", "B. 100cm từ sàn", "C. 120cm từ sàn", "D. 150cm từ sàn"], correct: 2, explanation: "120cm tính từ sàn — đủ tựa lưng thoải mái khi đọc sách." },
      { id: 7, section: "2.2", question: "Chiều cao mặt bàn bếp (counter height) chuẩn?", options: ["A. 80cm", "B. 85cm", "C. 90cm", "D. 95cm"], correct: 2, explanation: "90cm — ergonomics chuẩn cho người cao 155–175cm đứng nấu không mỏi lưng." },
      { id: 8, section: "2.2", question: "Khoảng cách giữa tủ bếp trên và tủ bếp dưới?", options: ["A. 45cm", "B. 55cm", "C. 65cm", "D. 75cm"], correct: 2, explanation: "65cm — đủ thao tác thoải mái, đặt đồ gia dụng nhỏ." },
      { id: 9, section: "2.2", question: "Chiều rộng tối thiểu của đảo bếp (kitchen island)?", options: ["A. 80cm", "B. 100cm", "C. 120cm", "D. 150cm"], correct: 2, explanation: "120cm — đảm bảo 2 người làm việc hai phía không va chạm." },
      { id: 10, section: "2.2", question: "Khoảng cách từ toilet đến tường bên trong WC?", options: ["A. 40cm", "B. 55cm", "C. 70cm", "D. 90cm"], correct: 2, explanation: "70cm từ tường — clearance tối thiểu để ngồi thoải mái." },
      { id: 11, section: "2.2", question: "Chiều cao lắp đặt lavabo chuẩn?", options: ["A. H 70–75cm", "B. H 80–85cm", "C. H 90–95cm", "D. H 65–70cm"], correct: 1, explanation: "H 80–85cm — phù hợp chiều cao người Việt, không cúi quá nhiều." },
      { id: 12, section: "2.2", question: "Chiều cao vòi sen (shower head) chuẩn?", options: ["A. H 180–190cm", "B. H 200–210cm", "C. H 220–230cm", "D. H 170–180cm"], correct: 1, explanation: "H 200–210cm — người cao 180cm không bị xối thẳng mặt." },
      { id: 13, section: "2.2", question: "Chiều rộng cửa phòng ngủ tối thiểu?", options: ["A. 60cm", "B. 70cm", "C. 80cm", "D. 90cm"], correct: 2, explanation: "80cm — đủ cho người trưởng thành và đồ nội thất nhỏ đi qua, tiêu chuẩn TCVN." },
      { id: 14, section: "2.2", question: "Chiều rộng cửa phòng tắm tối thiểu?", options: ["A. 50cm", "B. 60cm", "C. 70cm", "D. 80cm"], correct: 2, explanation: "70cm — tiêu chuẩn tối thiểu; 80cm nếu có người lớn tuổi hoặc trẻ nhỏ." },
      { id: 15, section: "2.2", question: "Chiều cao bậc thang (riser height) tiêu chuẩn?", options: ["A. 10–12cm", "B. 15–18cm", "C. 20–22cm", "D. 25–28cm"], correct: 1, explanation: "15–18cm — thoải mái leo không mỏi chân; trên 20cm gây khó chịu." },
      { id: 16, section: "2.2", question: "Chiều rộng bản thang (tread depth) tối thiểu?", options: ["A. 18–20cm", "B. 22–24cm", "C. 25–28cm", "D. 30–35cm"], correct: 2, explanation: "25–28cm — đặt vừa bàn chân khi leo, tránh trượt và mất thăng bằng." },
      { id: 17, section: "2.2", question: "Chiều rộng hành lang trong nhà tối thiểu?", options: ["A. 60cm", "B. 75cm", "C. 90cm", "D. 120cm"], correct: 2, explanation: "90cm — đủ 1 người đi xách đồ; 120cm nếu 2 người qua nhau." },
      { id: 18, section: "2.2", question: "Chiều cao tay vịn cầu thang chuẩn?", options: ["A. 70–80cm", "B. 80–85cm", "C. 90–100cm", "D. 110–120cm"], correct: 2, explanation: "90–100cm tính từ mặt bậc — đảm bảo an toàn, đúng tầm tay người lớn." },
      { id: 19, section: "2.2", question: "Diện tích tối thiểu phòng ngủ master bedroom?", options: ["A. 10–12m²", "B. 12–15m²", "C. 16–20m²", "D. 22–25m²"], correct: 2, explanation: "16–20m² — đủ bố trí giường 1.8m, tủ quần áo và lối đi." },
      { id: 20, section: "2.2", question: "Chiều cao trần tối thiểu để không gian thoáng?", options: ["A. 2.4m", "B. 2.6m", "C. 2.8m", "D. 3.2m"], correct: 2, explanation: "2.8m — dưới mức này cảm giác chật; DQH premium thường 3.0m+." },
      { id: 21, section: "2.2", question: "Khoảng cách từ mặt bàn đến mắt người ngồi (nhìn màn hình)?", options: ["A. 40–50cm", "B. 60–70cm", "C. 80–90cm", "D. 100–110cm"], correct: 1, explanation: "60–70cm — khoảng nhìn màn hình an toàn, hạn chế mỏi mắt và căng cổ." },
      { id: 22, section: "2.2", question: "Chiều cao bàn làm việc (desk height) chuẩn?", options: ["A. 65–68cm", "B. 72–75cm", "C. 78–80cm", "D. 82–85cm"], correct: 1, explanation: "72–75cm — khuỷu tay 90 độ khi gõ phím." },
      { id: 23, section: "2.2", question: "Chiều cao ghế ngồi làm việc so với sàn?", options: ["A. 35–40cm", "B. 43–50cm", "C. 52–55cm", "D. 58–62cm"], correct: 1, explanation: "43–50cm — đùi song song với sàn, chân đặt phẳng xuống đất." },
      { id: 24, section: "2.2", question: "Khoảng hở từ mặt bếp nấu lên tủ trên?", options: ["A. 30cm", "B. 45cm", "C. 60cm", "D. 75cm"], correct: 1, explanation: "45cm — đủ thao tác an toàn, tránh hơi nóng bám tủ." },
      { id: 25, section: "2.2", question: "Chiều sâu tủ bếp dưới tiêu chuẩn?", options: ["A. 45cm", "B. 50cm", "C. 60cm", "D. 70cm"], correct: 2, explanation: "60cm — phù hợp hầu hết thiết bị bếp âm, thoải mái thao tác." },
      { id: 26, section: "2.2", question: "Chiều sâu tủ quần áo (wardrobe depth) chuẩn?", options: ["A. 45–50cm", "B. 50–55cm", "C. 58–62cm", "D. 65–70cm"], correct: 2, explanation: "58–62cm — vừa đủ để treo quần áo ngang." },
      { id: 27, section: "2.2", question: "Chiều cao thanh treo áo chuẩn?", options: ["A. 140–150cm từ sàn", "B. 160–180cm từ sàn", "C. 190–200cm từ sàn", "D. 210–220cm từ sàn"], correct: 1, explanation: "160–180cm từ sàn — đủ cho áo dài nhất không chạm gầm." },
      { id: 28, section: "2.2", question: "Khoảng cách giữa 2 mảng bếp đối diện (work aisle)?", options: ["A. 80cm", "B. 100cm", "C. 120cm", "D. 150cm"], correct: 2, explanation: "120cm — đủ mở tủ lạnh, tủ bếp và 1 người thao tác cùng lúc." },
      { id: 29, section: "2.2", question: "Chiều cao bệ cửa sổ (window sill) phòng ngủ?", options: ["A. 60–70cm", "B. 80–90cm", "C. 100–110cm", "D. 120–130cm"], correct: 1, explanation: "80–90cm — tầm mắt khi nằm, đủ kê đồ trang trí, tránh mất an toàn." },
      { id: 30, section: "2.2", question: "Gương phòng tắm nên rộng bao nhiêu so với lavabo?", options: ["A. Nhỏ hơn lavabo 10cm", "B. Rộng bằng hoặc lớn hơn lavabo", "C. Gấp đôi lavabo", "D. Chỉ cần 40cm"], correct: 1, explanation: "Rộng bằng hoặc lớn hơn tủ lavabo, cao 60–80cm — đủ nhìn toàn mặt khi đứng." },
      { id: 31, section: "2.2", question: "Diện tích tối thiểu phòng tắm đứng (shower only)?", options: ["A. 70×70cm", "B. 80×80cm", "C. 90×90cm", "D. 100×100cm"], correct: 2, explanation: "90×90cm tối thiểu; 100×100cm là lý tưởng." },
      { id: 32, section: "2.2", question: "Khoảng cách từ mép bồn tắm đến tường tối thiểu?", options: ["A. 40cm", "B. 50cm", "C. 60cm", "D. 80cm"], correct: 2, explanation: "60cm — đủ bước vào/ra, lau chùi và đặt phụ kiện bên cạnh." },
      { id: 33, section: "2.2", question: "Chiều cao tủ TV phòng khách lý tưởng?", options: ["A. 60–80cm từ sàn", "B. 90–110cm từ sàn", "C. 120–140cm từ sàn", "D. 150–170cm từ sàn"], correct: 1, explanation: "Mặt TV cách sàn 90–110cm — trục giữa màn hình ngang tầm mắt khi ngồi sofa." },
      { id: 34, section: "2.2", question: "Chiều cao tối đa kệ sách ngăn trên cùng?", options: ["A. 180cm", "B. 190cm", "C. 210cm", "D. 240cm"], correct: 2, explanation: "Không quá 210cm — giới hạn với tay bình thường không cần ghế." },
      { id: 35, section: "2.2", question: "Khoảng cách giữa các ngăn kệ phù hợp sách A4?", options: ["A. 25–28cm", "B. 32–35cm", "C. 38–42cm", "D. 45–50cm"], correct: 1, explanation: "32–35cm — vừa sách A4, binder, có khoảng thở cho đồ trang trí nhỏ." },
      { id: 36, section: "2.2", question: "Chiều cao bàn ăn chuẩn?", options: ["A. 68–70cm", "B. 74–76cm", "C. 78–80cm", "D. 82–85cm"], correct: 1, explanation: "74–76cm — khuỷu tay thoải mái trên bàn khi ngồi ghế 43–45cm." },
      { id: 37, section: "2.2", question: "Diện tích mỗi người cần tại bàn ăn?", options: ["A. 40cm/người", "B. 50cm/người", "C. 60cm/người", "D. 70cm/người"], correct: 2, explanation: "60cm chiều rộng/người — đủ đặt bát đĩa, không va chạm người bên cạnh." },
      { id: 38, section: "2.2", question: "Khoảng cách từ bàn ăn đến tường xung quanh?", options: ["A. 60cm", "B. 75cm", "C. 90cm", "D. 120cm"], correct: 2, explanation: "90cm — đủ để kéo ghế ra và đứng dậy thoải mái." },
      { id: 39, section: "2.2", question: "Walk-in closet — chiều cao thanh treo đôi (double hang)?", options: ["A. Trên 160cm, dưới 80cm", "B. Trên 180cm, dưới 90cm", "C. Trên 200cm, dưới 100cm", "D. Trên 220cm, dưới 110cm"], correct: 1, explanation: "Thanh trên 180cm, thanh dưới 90cm — tiết kiệm không gian, tiêu chuẩn quốc tế." },
      { id: 40, section: "2.2", question: "Khoảng không gian trước tủ quần áo để mở cửa?", options: ["A. 40cm", "B. 50cm", "C. 60cm", "D. 80cm"], correct: 2, explanation: "60cm — đủ đứng quan sát và lấy đồ thoải mái." },
      { id: 41, section: "2.2", question: "Chiều cao ổ điện đầu giường?", options: ["A. 20–25cm từ sàn", "B. 30–35cm từ sàn", "C. 40–45cm từ sàn", "D. 50–55cm từ sàn"], correct: 1, explanation: "30–35cm tính từ sàn — tầm với khi ngồi trên giường." },
      { id: 42, section: "2.2", question: "Chiều cao ổ điện bếp tính từ mặt bàn bếp?", options: ["A. 5–10cm trên mặt bàn", "B. 15–20cm trên mặt bàn", "C. 25–30cm trên mặt bàn", "D. 35–40cm trên mặt bàn"], correct: 1, explanation: "15–20cm phía trên mặt bàn — an toàn khỏi nước bắn, tiện cắm thiết bị nhỏ." },
      { id: 43, section: "2.2", question: "Chiều cao công tắc đèn chuẩn từ sàn (TCVN)?", options: ["A. 100–110cm", "B. 120–130cm", "C. 140–150cm", "D. 80–90cm"], correct: 1, explanation: "120–130cm — tầm tay với trung bình người Việt, tiêu chuẩn TCVN 9207." },
      { id: 44, section: "2.2", question: "Chiều sâu phòng ngủ tối thiểu cho giường 1.8m?", options: ["A. 2.8m", "B. 3.0m", "C. 3.5m", "D. 4.0m"], correct: 2, explanation: "3.5m — giường 1.8m + 50cm 2 bên + lối đi 60cm cuối giường." },
      { id: 45, section: "2.2", question: "Kích thước khu thay đồ trong walk-in closet?", options: ["A. 60×80cm", "B. 75×100cm", "C. 90×120cm", "D. 120×150cm"], correct: 2, explanation: "90×120cm — đủ đứng xoay người, kiểm tra trang phục trong gương." },
      { id: 46, section: "2.2", question: "Chiều cao mặt quầy bar tiêu chuẩn?", options: ["A. 80–90cm", "B. 90–100cm", "C. 100–110cm", "D. 110–120cm"], correct: 2, explanation: "100–110cm — phù hợp đứng hoặc ngồi ghế bar stool 65–75cm." },
      { id: 47, section: "2.2", question: "Khoảng cách tối thiểu giữa sofa và bàn trà?", options: ["A. 20–30cm", "B. 35–45cm", "C. 50–60cm", "D. 65–75cm"], correct: 1, explanation: "35–45cm — đủ với tay lấy đồ uống mà không đứng dậy." },
      { id: 48, section: "2.2", question: "Chiều rộng cầu thang đơn nhà phố tối thiểu?", options: ["A. 70cm", "B. 80cm", "C. 90cm", "D. 100cm"], correct: 2, explanation: "90cm — đủ 1 người xách đồ; 110cm nếu 2 người qua nhau." },
      { id: 49, section: "2.2", question: "Chiều cao lan can ban công tối thiểu (TCXD VN)?", options: ["A. 0.9m", "B. 1.0m", "C. 1.1m", "D. 1.2m"], correct: 2, explanation: "1.1m — quy chuẩn an toàn; 1.2m cho tầng cao trên 12m." },
      { id: 50, section: "2.2", question: "Khoảng cách chuẩn giữa 2 đèn downlight?", options: ["A. 0.5–0.8m", "B. 1.0–1.5m", "C. 1.8–2.2m", "D. 2.5–3.0m"], correct: 1, explanation: "1.0–1.5m — ánh sáng phủ đều, tránh điểm tối giữa các đèn." },
      { id: 51, section: "2.2", question: "Chiều cao treo tranh chuẩn (trục giữa)?", options: ["A. 130–140cm", "B. 145–155cm", "C. 160–170cm", "D. 175–185cm"], correct: 1, explanation: "Trục giữa H 145–155cm — ngang tầm mắt người đứng, quy tắc gallery quốc tế." },
      { id: 52, section: "2.2", question: "Khoảng cách an toàn từ bếp nấu đến tủ gỗ phía trên?", options: ["A. 45cm", "B. 60cm", "C. 75cm", "D. 90cm"], correct: 2, explanation: "Tối thiểu 75cm — bảo vệ tủ khỏi nhiệt và dầu mỡ bắn lên." },
      { id: 53, section: "2.2", question: "Diện tích phòng tắm đủ bồn tắm + vòi sen + toilet?", options: ["A. 3–4m²", "B. 5–6m²", "C. 7–8m²", "D. 9–10m²"], correct: 1, explanation: "Tối thiểu 5–6m²; master bath DQH thường 6–8m²." },
      { id: 54, section: "2.2", question: "Chiều rộng ngăn tủ lạnh âm (built-in fridge)?", options: ["A. 45–55cm", "B. 60–90cm", "C. 95–110cm", "D. 120–150cm"], correct: 1, explanation: "60–90cm — châu Âu dùng 60cm; side-by-side cần 90cm." },
      { id: 55, section: "2.2", question: "Chiều cao khuôn cửa chuẩn DQH?", options: ["A. 2.0m", "B. 2.1m", "C. 2.3m", "D. 2.5m"], correct: 1, explanation: "2.1m tiêu chuẩn; 2.4m cho không gian cao cấp DQH." },
      { id: 56, section: "2.2", question: "Khoảng hở dưới cánh cửa trong nhà?", options: ["A. 0.5cm", "B. 1–1.5cm", "C. 2–2.5cm", "D. 3–4cm"], correct: 1, explanation: "1–1.5cm — thông khí, lưu thông không khí điều hòa giữa các phòng." },
      { id: 57, section: "2.2", question: "Đèn thả (pendant) phía trên bàn ăn cách mặt bàn bao nhiêu?", options: ["A. 50–60cm", "B. 70–80cm", "C. 90–100cm", "D. 110–120cm"], correct: 1, explanation: "Đáy đèn cách mặt bàn 70–80cm — chiếu sáng tốt, không chói mắt." },
      { id: 58, section: "2.2", question: "Khoảng cách tối thiểu từ TV đến trần nhà?", options: ["A. 10–15cm", "B. 20–30cm", "C. 35–45cm", "D. 50–60cm"], correct: 1, explanation: "20–30cm — thoáng thị giác, thuận tiện gắn kệ phía trên." },
      { id: 59, section: "2.2", question: "Chiều sâu tủ âm tường (built-in wardrobe)?", options: ["A. 40–45cm", "B. 48–52cm", "C. 55–60cm", "D. 65–70cm"], correct: 2, explanation: "55–60cm — vừa đủ móc treo, cửa mở không ăn vào không gian." },
      { id: 60, section: "2.2", question: "Diện tích tối thiểu phòng bếp + phòng ăn kết hợp?", options: ["A. 10–12m²", "B. 13–15m²", "C. 16–20m²", "D. 22–25m²"], correct: 2, explanation: "16–20m² — đủ bếp chữ L hoặc đảo bếp + bàn ăn 4–6 người." },

      // ===== SECTION 2.3: VẬT LIỆU DQH (60 câu) =====
      { id: 61, section: "2.3", question: "Tại sao DQH ưu tiên gỗ tự nhiên hơn MDF/HDF?", options: ["A. Rẻ hơn MDF/HDF", "B. Aging đẹp, không phồng trộp khi ẩm", "C. Nhẹ hơn, dễ vận chuyển", "D. Dễ sơn màu tùy ý"], correct: 1, explanation: "Gỗ tự nhiên aging đẹp theo thời gian, vân độc đáo, không phồng trộp khi ẩm — phù hợp khí hậu HCMC." },
      { id: 62, section: "2.3", question: "5 loại gỗ tự nhiên trong danh mục chuẩn DQH?", options: ["A. Oak, Walnut, Cedar, Xoan, Lát", "B. Teak, Mahogany, Pine, Ash, Birch", "C. Oak, Pine, Birch, Teak, Cedar", "D. Walnut, Cherry, Maple, Ash, Elm"], correct: 0, explanation: "Oak, Walnut, Cedar, Xoan và Lát — độ bền cao, vân đẹp, nội thất premium." },
      { id: 63, section: "2.3", question: "Nhà cung cấp gỗ chuẩn DQH?", options: ["A. Hoàng Anh & Phú Tài", "B. An Cường & Mộc Phát", "C. Đồng Nai Wood & Sao Nam", "D. Minh Long & Trường Thành"], correct: 1, explanation: "An Cường (ancuong.com) và Mộc Phát (mocphat.com)." },
      { id: 64, section: "2.3", question: "4 loại đá tự nhiên trong danh mục DQH?", options: ["A. Marble, Limestone, Slate, Granite", "B. Quartzite, Onyx, Sandstone, Basalt", "C. Marble, Travertine, Quartz, Soapstone", "D. Granite, Basalt, Sandstone, Limestone"], correct: 0, explanation: "Marble tự nhiên, Limestone, Slate và Granite." },
      { id: 65, section: "2.3", question: "Nhà cung cấp đá chuẩn DQH?", options: ["A. Đá Việt & Stone Center", "B. Vicostone & kho đá Q.9", "C. Hoàng Gia Stone & Rex", "D. Đá Nam Á & Granite World"], correct: 1, explanation: "Vicostone cho đá engineered; kho đá tự nhiên tại Quận 9 cho marble/limestone." },
      { id: 66, section: "2.3", question: "Tại sao DQH chọn linen, cotton, wool thay vì polyester?", options: ["A. Rẻ hơn polyester", "B. Breathable tự nhiên, aging tốt", "C. Nhiều màu sắc hơn", "D. Dễ giặt máy hơn"], correct: 1, explanation: "Breathable tự nhiên, cảm giác cao cấp, aging tốt — polyester không phù hợp Quiet Luxury." },
      { id: 67, section: "2.3", question: "Nhà cung cấp vải chuẩn DQH?", options: ["A. Vải Sài Gòn & Hà Nội Textile", "B. Acacia Fabrics & Cỏ May", "C. An Phước & Việt Tiến", "D. Phong Phú & TCM"], correct: 1, explanation: "Acacia Fabrics (acaciafabrics.com) và Cỏ May." },
      { id: 68, section: "2.3", question: "Tại sao DQH dùng sơn nước không độc?", options: ["A. Rẻ hơn sơn dầu", "B. Bảo vệ sức khỏe gia đình, đặc biệt trẻ em", "C. Khô nhanh hơn", "D. Bền hơn sơn thường"], correct: 1, explanation: "Bảo vệ sức khỏe gia đình client — đặc biệt trẻ em và người lớn tuổi." },
      { id: 69, section: "2.3", question: "Hai nhà cung cấp sơn chuẩn DQH?", options: ["A. Nippon & TOA", "B. Jotun & Dulux", "C. Kansai & Spec", "D. Mykolor & Maxilite"], correct: 1, explanation: "Jotun (jotun.com) và Dulux (dulux.vn)." },
      { id: 70, section: "2.3", question: "Tại sao DQH dùng Blum và Hafele?", options: ["A. Giá rẻ nhất thị trường", "B. Chuẩn châu Âu, bền 50.000+ lần đóng mở", "C. Sản xuất tại Việt Nam", "D. Dễ thay thế nhất"], correct: 1, explanation: "Tiêu chuẩn châu Âu — bền 50.000+ lần đóng mở, bảo hành chính hãng." },
      { id: 71, section: "2.3", question: "Tại sao DQH không dùng microcement tại HCMC?", options: ["A. Quá đắt", "B. Nứt/bong do ẩm cao 75–85% và nhiệt HCMC", "C. Không có nhà cung cấp", "D. Màu sắc hạn chế"], correct: 1, explanation: "HCMC ẩm 75–85% — microcement nứt bong sau 1–2 năm. DQH cam kết bền 10–20 năm." },
      { id: 72, section: "2.3", question: "Tại sao mạ vàng nằm trong danh mục tránh?", options: ["A. Quá sang trọng", "B. Tróc vảy sau 2–3 năm", "C. Quá nặng", "D. Khó vệ sinh"], correct: 1, explanation: "Tróc vảy sau 2–3 năm. Thay bằng brushed brass hoặc PVD coating bền hơn." },
      { id: 73, section: "2.3", question: "Plastic decor — tại sao DQH tránh?", options: ["A. Giá cao", "B. Nhựa giả vật liệu, không có câu chuyện", "C. Khó thi công", "D. Không bền với UV"], correct: 1, explanation: "Đồ trang trí nhựa giả vật liệu — không có câu chuyện vật liệu, không phù hợp DQH." },
      { id: 74, section: "2.3", question: "Marble tự nhiên khác Vicostone engineered stone?", options: ["A. Marble rẻ hơn Vicostone", "B. Marble vân độc, cần seal; Vicostone đồng đều, dễ bảo trì", "C. Vicostone cứng hơn Marble", "D. Không có sự khác biệt đáng kể"], correct: 1, explanation: "Marble: vân độc bản, cần seal, thấm ố. Vicostone: đồng đều, không thấm, dễ bảo trì." },
      { id: 75, section: "2.3", question: "Tại sao Limestone phù hợp Quiet Luxury?", options: ["A. Bóng loáng sang trọng", "B. Warm neutral, matte, vân chìm", "C. Rẻ nhất trong các đá", "D. Cứng nhất, chịu lực tốt"], correct: 1, explanation: "Tone warm neutral, matte, vân chìm — đúng DNA Quiet Luxury." },
      { id: 76, section: "2.3", question: "Oak khác Walnut ở ứng dụng nào?", options: ["A. Oak=Modern, Walnut=Classic", "B. Oak=Quiet Luxury, Walnut=Modern Luxury", "C. Không khác biệt", "D. Oak=WC, Walnut=Bếp"], correct: 1, explanation: "Oak: vân sáng ấm → Quiet Luxury. Walnut: vân nâu đậm → Modern Luxury/Classic." },
      { id: 77, section: "2.3", question: "Khi nào dùng Cedar trong dự án DQH?", options: ["A. Sàn phòng khách", "B. Walk-in closet, tủ quần áo", "C. Mặt bếp", "D. Ốp trần"], correct: 1, explanation: "Tủ quần áo và walk-in closet — mùi thơm đuổi mối mọt, kháng ẩm." },
      { id: 78, section: "2.3", question: "DQH ưu tiên finish nào cho gỗ và đá?", options: ["A. High gloss", "B. Matte", "C. Semi-gloss", "D. Satin"], correct: 1, explanation: "Matte: không phản chiếu, che vết tay, DQH ưa dùng." },
      { id: 79, section: "2.3", question: "Linen phù hợp khí hậu HCMC vì?", options: ["A. Giữ ấm tốt", "B. Thoáng khí nhất, mát mùa hè", "C. Không nhăn", "D. Chống thấm nước"], correct: 1, explanation: "Thoáng khí nhất trong các vải tự nhiên, hút ẩm thoát hơi nhanh." },
      { id: 80, section: "2.3", question: "Cashmere/wool dùng ở vị trí nào trong dự án DQH?", options: ["A. Rèm cửa", "B. Thảm, vỏ gối, throw blanket", "C. Ghế ăn", "D. Ga giường"], correct: 1, explanation: "Thảm (rug), vỏ gối trang trí, throw blanket — phù hợp phòng ngủ/khách." },
      { id: 81, section: "2.3", question: "Client yêu cầu vật liệu ngoài danh mục DQH — designer làm gì?", options: ["A. Tự quyết định dùng", "B. Báo cáo Design Director trước khi cam kết", "C. Từ chối ngay", "D. Thay bằng vật liệu tương tự"], correct: 1, explanation: "Báo cáo Lead/Design Director trước — không tự quyết ngoài danh mục." },
      { id: 82, section: "2.3", question: "Slate phù hợp ứng dụng nào?", options: ["A. Mặt bếp", "B. Sàn WC, ban công, outdoor", "C. Ốp trần", "D. Đầu giường"], correct: 1, explanation: "Chống trơn trượt — phù hợp sàn WC, ban công, outdoor." },
      { id: 83, section: "2.3", question: "Granite khác Marble ở ứng dụng thực tế?", options: ["A. Granite=ốp tường, Marble=mặt bếp", "B. Granite=mặt bếp, Marble=ốp tường/sàn", "C. Giống nhau hoàn toàn", "D. Granite=outdoor, Marble=indoor"], correct: 1, explanation: "Granite: cứng, chịu nhiệt/acid → mặt bếp. Marble: mềm hơn → ốp tường, sàn." },
      { id: 84, section: "2.3", question: "An Cường là supplier DQH vì?", options: ["A. Giá rẻ nhất", "B. Chất lượng ổn định, bảo hành rõ ràng", "C. Chỉ bán gỗ tự nhiên", "D. Giao hàng nhanh nhất"], correct: 1, explanation: "Gỗ công nghiệp cao cấp chất lượng ổn định, bảo hành rõ ràng, phổ biến premium VN." },
      { id: 85, section: "2.3", question: "Veneer gỗ khác solid wood?", options: ["A. Veneer bền hơn solid wood", "B. Veneer ổn định hơn, Solid bền hơn và repair được", "C. Solid wood rẻ hơn veneer", "D. Không có sự khác biệt"], correct: 1, explanation: "Veneer: ổn định, nhẹ. Solid wood: đắt hơn nhưng bền và repair được." },
      { id: 86, section: "2.3", question: "Jotun khác Dulux khi tư vấn client?", options: ["A. Jotun rẻ hơn Dulux", "B. Jotun=neutral/white tốt, Dulux=color matching linh hoạt", "C. Dulux bền hơn Jotun", "D. Jotun chỉ có sơn ngoại thất"], correct: 1, explanation: "Jotun mạnh neutral/white → Quiet Luxury. Dulux có color matching tốt." },
      { id: 87, section: "2.3", question: "Khi nào dùng Blum, khi nào Hafele?", options: ["A. Blum=ngoại thất, Hafele=nội thất", "B. Blum=tủ bếp cao cấp, Hafele=đa dạng hơn", "C. Giống nhau", "D. Blum=WC, Hafele=phòng ngủ"], correct: 1, explanation: "Blum: bản lề Blumotion, ray trượt tủ bếp. Hafele: đa dạng hơn, khóa/tay nắm/WC." },
      { id: 88, section: "2.3", question: "Wool rug cần bảo trì thế nào?", options: ["A. Giặt máy hàng tháng", "B. Hút bụi 2x/tuần, dry clean 1x/năm", "C. Phơi nắng hàng tuần", "D. Không cần bảo trì"], correct: 1, explanation: "Hút bụi 2 lần/tuần, lật chiều 6 tháng/lần, dry clean 1 lần/năm." },
      { id: 89, section: "2.3", question: "Tại sao DQH không dùng gạch ceramic bóng phòng khách?", options: ["A. Giá cao", "B. Phản chiếu mạnh, cảm giác lạnh", "C. Khó lau chùi", "D. Dễ vỡ"], correct: 1, explanation: "Phản chiếu mạnh, cảm giác lạnh — ưu tiên sàn gỗ, đá matte." },
      { id: 90, section: "2.3", question: "PVD coating là gì?", options: ["A. Sơn phun tĩnh điện", "B. Mạ ion kim loại, bền 4–5 lần, không bong tróc", "C. Mạ kẽm chống rỉ", "D. Sơn bột epoxy"], correct: 1, explanation: "Physical Vapor Deposition — mạ ion kim loại, cứng 4–5 lần, không bong tróc." },
      { id: 91, section: "2.3", question: "Terrazzo phù hợp DQH không?", options: ["A. Không phù hợp", "B. Có — terrazzo tự nhiên tone neutral", "C. Chỉ cho outdoor", "D. Chỉ cho bếp"], correct: 1, explanation: "Có — terrazzo tự nhiên (cement + marble chips), bền, aging đẹp, Quiet Luxury tone neutral." },
      { id: 92, section: "2.3", question: "Client hỏi wallpaper, DQH tư vấn?", options: ["A. Dùng vinyl giá rẻ", "B. Textile wallpaper hoặc limewash, tránh vinyl", "C. Không bao giờ dùng wallpaper", "D. Chỉ dùng 3D wallpaper"], correct: 1, explanation: "Ưu tiên textile (linen, grasscloth) hoặc limewash. Tránh vinyl rẻ." },
      { id: 93, section: "2.3", question: "Engineered wood floor khác solid hardwood?", options: ["A. Engineered wood bền hơn solid", "B. Engineered ổn định hơn ở HCMC, Solid sàm lại được", "C. Solid wood rẻ hơn", "D. Không khác biệt"], correct: 1, explanation: "Engineered: nhiều lớp, ổn định hơn ở HCMC. Solid: 100% gỗ, sàm lại được nhiều lần." },
      { id: 94, section: "2.3", question: "Rattan/bamboo trong danh mục DQH?", options: ["A. Danh mục chuẩn", "B. Không chuẩn, chấp nhận có chọn lọc làm accent", "C. Tuyệt đối không dùng", "D. Chỉ dùng outdoor"], correct: 1, explanation: "Không chuẩn nhưng chấp nhận có chọn lọc — rattan tự nhiên phù hợp làm accent." },
      { id: 95, section: "2.3", question: "Limewash paint là gì?", options: ["A. Sơn nhũ kim loại", "B. Sơn vôi matte, breathing wall, Quiet Luxury", "C. Sơn chống thấm", "D. Sơn lót nền"], correct: 1, explanation: "Sơn vôi truyền thống, matte có chiều sâu, breathing wall — Quiet Luxury." },
      { id: 96, section: "2.3", question: "Kiểm tra chất lượng marble trước khi dùng?", options: ["A. Chỉ cần nhìn bằng mắt", "B. Water absorption, UV check crack, đo độ dày", "C. Gõ nghe tiếng", "D. Chỉ kiểm tra màu sắc"], correct: 1, explanation: "Water absorption test, check crack bằng đèn UV, đo độ dày ≥18mm (sàn), ≥20mm (bếp)." },
      { id: 97, section: "2.3", question: "Tại sao DQH không dùng mirror finish nội thất lớn?", options: ["A. Quá đắt", "B. Lộ bụi/vết tay, không phù hợp Quiet Luxury", "C. Khó thi công", "D. Dễ vỡ"], correct: 1, explanation: "Mặt gương lộ bụi, vết tay — không phù hợp triết lý tiết chế Quiet Luxury." },
      { id: 98, section: "2.3", question: "Concrete trang trí phù hợp DQH?", options: ["A. Không bao giờ", "B. Chấp nhận nếu polished và sealed kỹ", "C. Chỉ cho ngoại thất", "D. Luôn phù hợp"], correct: 1, explanation: "Polished hoặc concrete look tile chấp nhận cho Contemporary Minimalism — sealed kỹ." },
      { id: 99, section: "2.3", question: "Phân biệt Limestone thật vs ceramic giả?", options: ["A. Cùng trọng lượng", "B. Limestone: vân không đều, lạnh, nặng, có lỗ khí", "C. Ceramic giả lạnh hơn", "D. Limestone nhẹ hơn ceramic"], correct: 1, explanation: "Limestone thật: vân không đều, lạnh khi chạm, nặng, có lỗ khí (cần seal)." },
      { id: 100, section: "2.3", question: "Brass finishing — khi nào dùng, khi nào không?", options: ["A. Polished brass cho mọi nơi", "B. Brushed brass OK, polished brass tránh", "C. Không bao giờ dùng brass", "D. Chỉ dùng brass cho đèn"], correct: 1, explanation: "Brushed brass cho phụ kiện WC, tay nắm, đèn. Polished brass quá flashy → tránh." },
      { id: 101, section: "2.3", question: "Glass partition phù hợp DQH vì?", options: ["A. Rẻ hơn tường xây", "B. Cho ánh sáng xuyên, không nặng thị giác", "C. Cách âm tốt hơn", "D. Dễ thi công hơn"], correct: 1, explanation: "Kính cho ánh sáng tự nhiên xuyên suốt, không nặng thị giác — đúng Quiet Luxury." },
      { id: 102, section: "2.3", question: "Frosted glass khác fluted glass?", options: ["A. Frosted=trang trí, Fluted=riêng tư", "B. Frosted=riêng tư, Fluted=tán sáng trang trí", "C. Giống nhau", "D. Fluted=cách âm tốt hơn"], correct: 1, explanation: "Frosted: mờ đục, riêng tư → vách phòng ngủ/WC. Fluted: sóng dọc, tán sáng → cửa tủ, vách." },
      { id: 103, section: "2.3", question: "Tại sao DQH hạn chế thạch cao 3D đắp nổi?", options: ["A. Quá đắt", "B. Rườm rà, bám bụi, ngược clean lines", "C. Khó sơn", "D. Không bền"], correct: 1, explanation: "Bám bụi, khó vệ sinh, rườm rà — ngược tiêu chí clean lines Quiet Luxury." },
      { id: 104, section: "2.3", question: "Thickness đá cho mặt bàn bếp?", options: ["A. 10mm", "B. 15mm", "C. 20mm", "D. 25mm"], correct: 2, explanation: "Bếp: 20mm. Sàn: 12–15mm. Tường: 10–12mm. Dưới 10mm dễ nứt." },
      { id: 105, section: "2.3", question: "Upholstery fabric chuẩn DQH cho sofa?", options: ["A. Polyester blend", "B. Linen weave, velvet, bouclé", "C. Nylon", "D. PU leather"], correct: 1, explanation: "Linen weave, performance velvet, bouclé — natural/high-grade blended. Test pilling." },
      { id: 106, section: "2.3", question: "Sàn gỗ hay sàn đá — khi nào chọn?", options: ["A. Gỗ=WC, Đá=phòng ngủ", "B. Gỗ=phòng ngủ/khách, Đá=WC/bếp/lối vào", "C. Chỉ dùng đá cho toàn bộ", "D. Chỉ dùng gỗ cho toàn bộ"], correct: 1, explanation: "Gỗ: phòng ngủ, khách → ấm. Đá: WC, bếp, lối vào → chịu ẩm, dễ vệ sinh." },
      { id: 107, section: "2.3", question: "Acoustic panel phù hợp DQH?", options: ["A. Foam tổng hợp", "B. Wool felt, perforated wood, linen panel", "C. Xốp EPS", "D. Gạch bê tông nhẹ"], correct: 1, explanation: "Felt tự nhiên, perforated wood panel, fabric panel linen — tránh foam tổng hợp." },
      { id: 108, section: "2.3", question: "Tại sao DQH không dùng alu composite nội thất?", options: ["A. Quá nặng", "B. Cảm giác công nghiệp, không có câu chuyện vật liệu", "C. Dễ rỉ sét", "D. Khó cắt"], correct: 1, explanation: "Phản chiếu công nghiệp, lạnh, vô hồn — không phù hợp premium." },
      { id: 109, section: "2.3", question: "Onyx stone dùng ở đâu trong dự án DQH?", options: ["A. Sàn phòng khách", "B. Backlit wall panel", "C. Mặt bếp", "D. Bậc cầu thang"], correct: 1, explanation: "Backlit wall panel — hiệu ứng đèn đẹp. Không dùng sàn hoặc mặt bếp." },
      { id: 110, section: "2.3", question: "Bảo trì sàn gỗ tự nhiên ở HCMC?", options: ["A. Giặt nước hàng tuần", "B. Lau khô ngay, wax hàng năm, 50–65% RH", "C. Phơi nắng thường xuyên", "D. Không cần bảo trì"], correct: 1, explanation: "Lau khô ngay nước, wax/oil hàng năm, duy trì 50–65% RH." },
      { id: 111, section: "2.3", question: "Microcement khác polished concrete?", options: ["A. Giống nhau", "B. Microcement lớp mỏng dễ nứt, Polished concrete bền hơn", "C. Polished concrete rẻ hơn", "D. Microcement cứng hơn"], correct: 1, explanation: "Microcement: 2–3mm, nhạy co giãn → nứt ở HCMC. Polished concrete: mài trực tiếp → bền." },
      { id: 112, section: "2.3", question: "Vật liệu ưu tiên cho WC wet area?", options: ["A. Sàn gỗ + grout thường", "B. Đá sealed + tile R9+ + epoxy joint", "C. Thảm chống thấm", "D. Vinyl sheet"], correct: 1, explanation: "Đá sealed (slate, granite), tile R9+ anti-slip, joint epoxy chống ẩm." },
      { id: 113, section: "2.3", question: "Tư vấn client về marble tự nhiên?", options: ["A. Marble không cần bảo trì", "B. Seal 1–2x/năm, tránh acid. Không chấp nhận → Vicostone", "C. Marble bền hơn granite", "D. Dùng marble cho mọi bề mặt"], correct: 1, explanation: "Seal 1–2 lần/năm, tránh acid. Client không chấp nhận bảo trì → Vicostone/porcelain marble look." },
      { id: 114, section: "2.3", question: "Bouclé fabric là gì?", options: ["A. Vải dệt phẳng", "B. Sợi vòng xoắn, texture thô nhẹ, Quiet Luxury", "C. Vải da thuộc", "D. Vải tổng hợp chống cháy"], correct: 1, explanation: "Sợi vòng xoắn, texture thô nhẹ, neutral — phù hợp Quiet Luxury cho armchair, sofa." },
      { id: 115, section: "2.3", question: "Tại sao DQH không dùng high gloss laminate tủ bếp?", options: ["A. Không đủ cứng", "B. Lộ vân tay/vết trầy, không phù hợp matte DQH", "C. Giá quá cao", "D. Không đủ màu sắc"], correct: 1, explanation: "Phản chiếu, lộ vân tay/vết trầy. Thay bằng matte laminate hoặc veneer gỗ." },
      { id: 116, section: "2.3", question: "DQH có cần spec hương thơm không gian không?", options: ["A. Không cần", "B. Recommend cho dự án premium", "C. Bắt buộc mọi dự án", "D. Chỉ cho showroom"], correct: 1, explanation: "Không bắt buộc nhưng recommend như sensory experience — điểm khác biệt premium." },
      { id: 117, section: "2.3", question: "Xử lý joint đá để trông sang hơn?", options: ["A. Ron xi măng rộng", "B. Invisible joint hoặc book-match", "C. Silicon màu", "D. Để khe hở tự nhiên"], correct: 1, explanation: "Invisible joint (mạch tàng) hoặc book-match — cảm giác liền mạch, fine finish." },
      { id: 118, section: "2.3", question: "Handmade tile phù hợp DQH?", options: ["A. Không phù hợp", "B. Phù hợp làm accent, không trải sàn toàn bộ", "C. Chỉ cho outdoor", "D. Trải sàn toàn bộ"], correct: 1, explanation: "Zellige, terracotta artisanal phù hợp Quiet Luxury — accent (backsplash, ốp tường WC)." },
      { id: 119, section: "2.3", question: "Tại sao phải spec rõ honed hay polished khi order đá?", options: ["A. Không quan trọng", "B. Honed=DQH ưu tiên (matte), Polished=khó bảo trì", "C. Polished rẻ hơn", "D. Honed cứng hơn polished"], correct: 1, explanation: "Honed: matte, ít lộ vết tay → DQH ưu tiên. Polished: phản chiếu, khó bảo trì." },
      { id: 120, section: "2.3", question: "Acacia wood (keo tràm) trong danh mục DQH?", options: ["A. Danh mục chuẩn", "B. Chưa chuẩn, cần approval Design Director", "C. Tuyệt đối không dùng", "D. Chỉ dùng outdoor"], correct: 1, explanation: "Chưa chuẩn, có thể xem xét budget-mid — cần approval Design Director." },
    ]
  }
};

// ============================================================
// SEED FUNCTION
// ============================================================
async function seed() {
  console.log('=== SEED NGÂN HÀNG KIẾN THỨC + FLASHCARDS ===\n');

  // 1. Get module
  const { data: mod, error: modErr } = await sb
    .from('training_modules').select('id').eq('slug', 'design-knowledge').single();
  if (!mod) { console.log('❌ Module not found', modErr); return; }
  console.log(`✓ Module: ${mod.id}`);

  // 2. Get section 2.2
  const { data: sec22 } = await sb
    .from('training_sections').select('id').eq('module_id', mod.id).eq('number', '2.2').single();
  if (!sec22) { console.log('❌ Section 2.2 not found'); return; }
  console.log(`✓ Section 2.2: ${sec22.id}`);

  // 3. Get section 2.3
  const { data: sec23 } = await sb
    .from('training_sections').select('id').eq('module_id', mod.id).eq('number', '2.3').single();
  if (!sec23) { console.log('❌ Section 2.3 not found'); return; }
  console.log(`✓ Section 2.3: ${sec23.id}`);

  // 4. Get or create section 2.6
  let { data: sec26 } = await sb
    .from('training_sections').select('id').eq('module_id', mod.id).eq('number', '2.6').single();
  if (!sec26) {
    console.log('→ Section 2.6 chưa tồn tại, tạo mới...');
    const { data: newSec } = await sb.from('training_sections').insert({
      module_id: mod.id, number: '2.6',
      title: 'Kiểm tra kiến thức',
      content: '5 bài test trắc nghiệm — mỗi bài 30 câu. Đạt ≥70% mới pass. Kiến thức thực tế, áp dụng ngay vào bản vẽ.',
      sort_order: 6
    }).select('id').single();
    sec26 = newSec;
    console.log(`✓ Tạo section 2.6: ${sec26.id}`);
  } else {
    console.log(`✓ Section 2.6: ${sec26.id}`);
  }

  // 5. Delete old flashcard subsections in 2.2 (only flashcards, keep tables)
  const { data: old22 } = await sb.from('training_subsections')
    .delete().eq('section_id', sec22.id).eq('content_type', 'flashcards').select('id');
  console.log(`✓ Xóa ${old22?.length || 0} flashcard cũ trong 2.2`);

  // 6. Delete old flashcard subsections in 2.3
  const { data: old23 } = await sb.from('training_subsections')
    .delete().eq('section_id', sec23.id).eq('content_type', 'flashcards').select('id');
  console.log(`✓ Xóa ${old23?.length || 0} flashcard cũ trong 2.3`);

  // 7. Get max sort_order in 2.2 to append after existing tables
  const { data: maxOrder22 } = await sb.from('training_subsections')
    .select('sort_order').eq('section_id', sec22.id).order('sort_order', { ascending: false }).limit(1);
  let startOrder22 = (maxOrder22?.[0]?.sort_order || 0) + 1;

  // 8. Insert flashcards for 2.2
  console.log('\n--- Flashcards Section 2.2 ---');
  for (const fc of FLASHCARDS_22) {
    const { error } = await sb.from('training_subsections').insert({
      section_id: sec22.id,
      heading: fc.heading,
      content_type: fc.content_type,
      metadata: fc.metadata,
      sort_order: startOrder22++
    });
    if (error) console.log(`❌ ${fc.heading}:`, error.message);
    else console.log(`✓ ${fc.heading} (${fc.metadata.flashcards.length} câu)`);
  }

  // 9. Get max sort_order in 2.3
  const { data: maxOrder23 } = await sb.from('training_subsections')
    .select('sort_order').eq('section_id', sec23.id).order('sort_order', { ascending: false }).limit(1);
  let startOrder23 = (maxOrder23?.[0]?.sort_order || 0) + 1;

  // 10. Insert flashcards for 2.3
  console.log('\n--- Flashcards Section 2.3 ---');
  for (const fc of FLASHCARDS_23) {
    const { error } = await sb.from('training_subsections').insert({
      section_id: sec23.id,
      heading: fc.heading,
      content_type: fc.content_type,
      metadata: fc.metadata,
      sort_order: startOrder23++
    });
    if (error) console.log(`❌ ${fc.heading}:`, error.message);
    else console.log(`✓ ${fc.heading} (${fc.metadata.flashcards.length} câu)`);
  }

  // 11. Check if Quiz 6 already exists in 2.6, delete if so
  const { data: oldQuiz6 } = await sb.from('training_subsections')
    .delete().eq('section_id', sec26.id).like('heading', '%Ngân hàng kiến thức%').select('id');
  if (oldQuiz6?.length) console.log(`\n✓ Xóa ${oldQuiz6.length} quiz ngân hàng cũ`);

  // 12. Get max sort_order in 2.6
  const { data: maxOrder26 } = await sb.from('training_subsections')
    .select('sort_order').eq('section_id', sec26.id).order('sort_order', { ascending: false }).limit(1);
  const quiz6Order = (maxOrder26?.[0]?.sort_order || 0) + 1;

  // 13. Insert Quiz 6 (knowledge bank)
  console.log('\n--- Quiz 6: Ngân hàng kiến thức ---');
  const { error: q6Err } = await sb.from('training_subsections').insert({
    section_id: sec26.id,
    heading: 'Quiz 6: Ngân hàng kiến thức DQH',
    content_type: 'quiz',
    metadata: QUIZ_6,
    sort_order: quiz6Order
  });
  if (q6Err) console.log('❌ Quiz 6:', q6Err.message);
  else console.log(`✓ Quiz 6: Ngân hàng kiến thức DQH (${QUIZ_6.quiz.questions.length} câu, random ${QUIZ_6.quiz.totalQuestions})`);

  // Summary
  const totalFC22 = FLASHCARDS_22.reduce((s, f) => s + f.metadata.flashcards.length, 0);
  const totalFC23 = FLASHCARDS_23.reduce((s, f) => s + f.metadata.flashcards.length, 0);
  console.log(`\n✅ Hoàn tất!`);
  console.log(`   → ${totalFC22} flashcards trong section 2.2 (${FLASHCARDS_22.length} nhóm)`);
  console.log(`   → ${totalFC23} flashcards trong section 2.3 (${FLASHCARDS_23.length} nhóm)`);
  console.log(`   → ${QUIZ_6.quiz.questions.length} câu quiz ngân hàng (random ${QUIZ_6.quiz.totalQuestions}, pass ≥${QUIZ_6.quiz.passingScore}%)`);
}

seed();
