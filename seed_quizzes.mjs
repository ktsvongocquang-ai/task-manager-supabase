import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

// ============================================================
// QUIZ 1: Kích thước chuẩn & Ergonomics (30 câu)
// ============================================================
const QUIZ_1 = {
  quiz: {
    title: "Bài test 1: Kích thước chuẩn & Ergonomics",
    description: "Kiểm tra kiến thức về kích thước chuẩn trong thiết kế nội thất: chiều cao mặt bếp, khoảng cách sofa-TV, kích thước giường, lối đi, bàn ăn, công tắc, ổ cắm, trần thông thủy.",
    timeLimit: 30,
    passingScore: 70,
    questions: [
      {
        id: 1,
        question: "Khoảng cách tối thiểu từ sofa đến TV 55\" là bao nhiêu?",
        options: ["A. 1500mm", "B. 2000mm", "C. 2500mm", "D. 3000mm"],
        correct: 2,
        explanation: "TV 55\" cần khoảng cách ≥2500mm. TV 65\" ≥3000mm, TV 75\" ≥3500mm."
      },
      {
        id: 2,
        question: "Chiều cao mặt bếp (countertop) chuẩn cho người cao 1m60 là bao nhiêu?",
        options: ["A. 800mm", "B. 850mm", "C. 900mm", "D. 950mm"],
        correct: 1,
        explanation: "Mặt bếp chuẩn 850–900mm. Người thấp 1m55: 850mm, người cao 1m75: 900mm."
      },
      {
        id: 3,
        question: "Chiều cao trần thông thủy phòng khách sau khi hạ trần tối thiểu là bao nhiêu?",
        options: ["A. 2400mm", "B. 2500mm", "C. 2700mm", "D. 3000mm"],
        correct: 2,
        explanation: "Phòng khách ≥2700mm, phòng ngủ ≥2500mm, hành lang ≥2400mm."
      },
      {
        id: 4,
        question: "Kích thước giường đôi Queen chuẩn là bao nhiêu?",
        options: ["A. W 1400 × L 2000mm", "B. W 1600 × L 2000mm", "C. W 1800 × L 2000mm", "D. W 2000 × L 2000mm"],
        correct: 1,
        explanation: "Queen: W 1600 × L 2000mm. King: W 1800. Super King: W 2000."
      },
      {
        id: 5,
        question: "Lối đi mỗi bên giường tối thiểu cần bao nhiêu mm?",
        options: ["A. 400mm", "B. 500mm", "C. 600mm", "D. 700mm"],
        correct: 2,
        explanation: "Mỗi bên ≥600mm. Phòng hẹp: 1 bên có thể giảm 400–450mm."
      },
      {
        id: 6,
        question: "Chiều cao công tắc đèn chuẩn từ sàn (FFL) là bao nhiêu?",
        options: ["A. 900–1000mm", "B. 1100–1300mm", "C. 1300–1500mm", "D. 1500–1700mm"],
        correct: 1,
        explanation: "Công tắc đèn: H 1100–1300mm từ FFL."
      },
      {
        id: 7,
        question: "Chiều cao ổ cắm tiêu chuẩn từ sàn là bao nhiêu?",
        options: ["A. 200–250mm", "B. 300–400mm", "C. 450–550mm", "D. 600–700mm"],
        correct: 1,
        explanation: "Ổ cắm thông thường: H 300–400mm từ FFL. Bếp: 1050–1150mm."
      },
      {
        id: 8,
        question: "Khoảng cách giữa sofa và bàn cà phê nên là bao nhiêu?",
        options: ["A. 200–300mm", "B. 400–500mm", "C. 600–700mm", "D. 800–900mm"],
        correct: 1,
        explanation: "Khoảng sofa → bàn cà phê: 400–500mm, đủ đi qua + đặt chân thoải mái."
      },
      {
        id: 9,
        question: "Chiều cao bàn ăn chuẩn quốc tế là bao nhiêu?",
        options: ["A. 680–700mm", "B. 730–760mm", "C. 780–800mm", "D. 820–850mm"],
        correct: 1,
        explanation: "Chiều cao bàn ăn chuẩn quốc tế: H 730–760mm."
      },
      {
        id: 10,
        question: "Đáy đèn thả (pendant) bàn ăn cách mặt bàn bao nhiêu mm?",
        options: ["A. 500–600mm", "B. 700–800mm", "C. 900–1000mm", "D. 1100–1200mm"],
        correct: 1,
        explanation: "Đáy đèn thả cách mặt bàn 700–800mm. Ở lối đi: cách sàn ≥2100mm."
      },
      {
        id: 11,
        question: "Khoảng cách tối thiểu từ mép bàn ăn đến tường phía sau ghế là bao nhiêu?",
        options: ["A. 600mm", "B. 800mm", "C. 1000mm", "D. 1200mm"],
        correct: 1,
        explanation: "Mép bàn ăn đến tường: ≥800mm. Có lối đi phía sau: ≥1100mm."
      },
      {
        id: 12,
        question: "Lối đi chính trong phòng khách tối thiểu cần bao nhiêu mm?",
        options: ["A. 600mm", "B. 700mm", "C. 800mm", "D. 900mm"],
        correct: 3,
        explanation: "Lối đi chính phòng khách ≥900mm. Lối đi phụ: ≥600mm."
      },
      {
        id: 13,
        question: "Chiều cao tâm tranh treo tường chuẩn cách sàn bao nhiêu?",
        options: ["A. 1200–1300mm", "B. 1450–1550mm", "C. 1600–1700mm", "D. 1800–1900mm"],
        correct: 1,
        explanation: "Tâm tranh cách sàn 1450–1550mm (tầm mắt). Trên sofa: cách đỉnh lưng sofa 150–200mm."
      },
      {
        id: 14,
        question: "Tim bồn cầu cách tường bên tối thiểu bao nhiêu mm?",
        options: ["A. 250mm", "B. 300mm", "C. 400mm", "D. 500mm"],
        correct: 2,
        explanation: "Tim bồn cầu cách tường bên ≥400mm. Cách lavabo/vách tắm ≥350mm."
      },
      {
        id: 15,
        question: "Chiều cao mặt chậu lavabo vessel (đặt bàn) chuẩn là bao nhiêu mm?",
        options: ["A. 750mm", "B. 800mm", "C. 850mm", "D. 900mm"],
        correct: 2,
        explanation: "Mặt chậu vessel chuẩn ≈850mm → mặt đá = 850 − H chậu (chậu H 150mm → đá ở 700mm)."
      },
      {
        id: 16,
        question: "Chiều cao trần thông thủy phòng ngủ sau hạ trần tối thiểu là bao nhiêu?",
        options: ["A. 2300mm", "B. 2400mm", "C. 2500mm", "D. 2600mm"],
        correct: 2,
        explanation: "Phòng ngủ ≥2500mm. Chấp nhận 2400mm nếu trần thô thấp."
      },
      {
        id: 17,
        question: "Bàn ăn 6 người hình chữ nhật cần kích thước tối thiểu bao nhiêu?",
        options: ["A. W 800 × L 1400mm", "B. W 900 × L 1600mm", "C. W 1000 × L 2000mm", "D. W 1100 × L 2200mm"],
        correct: 1,
        explanation: "Bàn ăn 6 người: W 900–1000 × L 1600–1800mm."
      },
      {
        id: 18,
        question: "Chiều rộng tối thiểu của hành lang nhà ở là bao nhiêu?",
        options: ["A. 700mm", "B. 800mm", "C. 900mm", "D. 1000mm"],
        correct: 2,
        explanation: "Hành lang W ≥900mm (tối thiểu 800mm). Hành lang dài ≥1000mm để khoan khoái."
      },
      {
        id: 19,
        question: "Ổ cắm phòng tắm phải cách nguồn nước tối thiểu bao nhiêu mm?",
        options: ["A. 300mm", "B. 400mm", "C. 600mm", "D. 800mm"],
        correct: 2,
        explanation: "Ổ cắm cách nguồn nước ≥600mm (tiêu chuẩn zone 2). Loại IP44 có nắp đậy."
      },
      {
        id: 20,
        question: "Chiều sâu tủ quần áo cánh mở (D) chuẩn cho móc áo ngang là bao nhiêu?",
        options: ["A. 450–500mm", "B. 500–550mm", "C. 580–600mm", "D. 650–700mm"],
        correct: 2,
        explanation: "Tủ quần áo cánh mở: D ≥580mm cho móc áo ngang. Cánh lùa D 600–650mm."
      },
      {
        id: 21,
        question: "Khoảng cách từ giường đến tủ quần áo cánh mở tối thiểu là bao nhiêu?",
        options: ["A. 600mm", "B. 700mm", "C. 800mm", "D. 900mm"],
        correct: 2,
        explanation: "Khoảng giường → tủ áo: ≥800mm, đủ mở cánh tủ + đứng chọn đồ."
      },
      {
        id: 22,
        question: "Chiều cao ghế ngồi ăn chuẩn (H seat) là bao nhiêu?",
        options: ["A. 380–400mm", "B. 430–460mm", "C. 480–500mm", "D. 520–550mm"],
        correct: 1,
        explanation: "Ghế ăn H seat 430–460mm. Chênh lệch H bàn − H ghế = 270–300mm."
      },
      {
        id: 23,
        question: "Chiều cao bar counter 1050mm cần ghế bar cao bao nhiêu?",
        options: ["A. 550–600mm", "B. 600–650mm", "C. 700–750mm", "D. 750–800mm"],
        correct: 3,
        explanation: "Bar 900mm → ghế 600–650mm. Bar 1050mm → ghế 750–800mm."
      },
      {
        id: 24,
        question: "Đáy quạt trần cách sàn tối thiểu bao nhiêu mm?",
        options: ["A. 2100mm", "B. 2200mm", "C. 2300mm", "D. 2400mm"],
        correct: 2,
        explanation: "Đáy quạt trần cách sàn ≥2300mm."
      },
      {
        id: 25,
        question: "Khoảng cách 2 đèn downlight âm trần chuẩn là bao nhiêu?",
        options: ["A. 0.8–1.0m", "B. 1.2–1.5m", "C. 1.8–2.0m", "D. 2.2–2.5m"],
        correct: 1,
        explanation: "Khoảng cách 2 đèn downlight: 1.2–1.5m. Cách tường 600–800mm."
      },
      {
        id: 26,
        question: "Chiều cao vòi sen trần (rain shower) chuẩn từ sàn là bao nhiêu?",
        options: ["A. 1800–1900mm", "B. 1900–2000mm", "C. 2100–2200mm", "D. 2300–2400mm"],
        correct: 2,
        explanation: "Vòi sen trần (rain shower): H 2100–2200mm từ FFL. Đầu sen Ø 200–300mm."
      },
      {
        id: 27,
        question: "Chiều rộng cầu thang thông thủy tối thiểu là bao nhiêu?",
        options: ["A. 700mm", "B. 800mm", "C. 900mm", "D. 1000mm"],
        correct: 2,
        explanation: "Cầu thang W ≥900mm thông thủy. Cần vác đồ: 1000–1100mm."
      },
      {
        id: 28,
        question: "Sàn WC phải thấp hơn sàn hành lang bao nhiêu mm?",
        options: ["A. 5–10mm", "B. 15–20mm", "C. 25–30mm", "D. 35–40mm"],
        correct: 1,
        explanation: "FFL sàn WC thấp hơn hành lang 15–20mm. Ngưỡng cửa có gờ chặn nước."
      },
      {
        id: 29,
        question: "Khoảng trống tối thiểu phía trước bồn cầu là bao nhiêu?",
        options: ["A. 400mm", "B. 500mm", "C. 600mm", "D. 700mm"],
        correct: 2,
        explanation: "Khoảng trống ≥600mm phía trước bồn cầu để ngồi thoải mái."
      },
      {
        id: 30,
        question: "Chiều cao lan can cầu thang đo từ mũi bậc chuẩn là bao nhiêu?",
        options: ["A. 700–750mm", "B. 800–850mm", "C. 850–900mm", "D. 950–1000mm"],
        correct: 2,
        explanation: "Lan can cầu thang: H 850–900mm từ mũi bậc. Thanh đứng cách ≤100mm."
      }
    ]
  }
};

// ============================================================
// QUIZ 2: Tủ bếp & Phụ kiện (30 câu)
// ============================================================
const QUIZ_2 = {
  quiz: {
    title: "Bài test 2: Tủ bếp & Phụ kiện",
    description: "Kiểm tra kiến thức về tủ bếp, phụ kiện Blum/Hafele/Hettich: Tandembox, Aventos, ray soft-close, hộc lò nướng, pull-out, bản lề cốc, cutting list.",
    timeLimit: 30,
    passingScore: 70,
    questions: [
      {
        id: 1,
        question: "Aventos HK-S phù hợp cho cánh tủ có chiều cao (H) bao nhiêu?",
        options: ["A. ≤350mm", "B. 200–500mm", "C. 480–1040mm", "D. 300–580mm"],
        correct: 1,
        explanation: "HK-XS: H ≤350mm. HK-S: H 200–500mm. HF: H 480–1040mm. HL: H 300–580mm."
      },
      {
        id: 2,
        question: "Aventos HF (fold lift) phù hợp cho cánh tủ cao bao nhiêu?",
        options: ["A. ≤350mm", "B. 200–500mm", "C. 480–1040mm", "D. 300–580mm"],
        correct: 2,
        explanation: "HF (fold lift): cánh H 480–1040mm. Khoảng đỉnh tủ → trần ≥ H cánh × 0.5."
      },
      {
        id: 3,
        question: "Aventos HL (parallel lift) phù hợp cho cánh tủ cao bao nhiêu?",
        options: ["A. ≤350mm", "B. 200–500mm", "C. 480–1040mm", "D. 300–580mm"],
        correct: 3,
        explanation: "HL (parallel lift): cánh H 300–580mm. Khoảng đỉnh tủ → trần ≥50mm."
      },
      {
        id: 4,
        question: "Bản lề cốc (cup hinge) nhô vào trong hộc tủ bao nhiêu mm?",
        options: ["A. 5–8mm", "B. 10–12mm", "C. 15–18mm", "D. 20–25mm"],
        correct: 1,
        explanation: "Bản lề cốc nhô vào hộc 10–12mm. Phải tính clearance khi có thiết bị âm bên cạnh."
      },
      {
        id: 5,
        question: "Ray soft-close cần thêm bao nhiêu mm phía sau tủ cho cơ cấu giảm chấn?",
        options: ["A. 10–20mm", "B. 30–40mm", "C. 50–60mm", "D. 70–80mm"],
        correct: 1,
        explanation: "Ray + soft-close cần thêm 30–40mm phía sau. Ray 550mm → tủ sâu ≥580–600mm phủ bì."
      },
      {
        id: 6,
        question: "Chiều sâu tủ bếp dưới (phủ bì) chuẩn là bao nhiêu?",
        options: ["A. 450–500mm", "B. 550–600mm", "C. 650–700mm", "D. 750–800mm"],
        correct: 1,
        explanation: "Tủ bếp dưới: D 550–600mm phủ bì. Mặt đá nhô ra 20–30mm so với cánh tủ."
      },
      {
        id: 7,
        question: "Đáy tủ bếp trên cách mặt bếp (countertop) chuẩn là bao nhiêu?",
        options: ["A. 400–450mm", "B. 550–650mm", "C. 700–750mm", "D. 800–850mm"],
        correct: 1,
        explanation: "Đáy tủ trên cách mặt bếp 550–650mm, chuẩn 600mm."
      },
      {
        id: 8,
        question: "Chiều sâu tủ bếp trên (D) tối đa nên là bao nhiêu?",
        options: ["A. 250mm", "B. 350mm", "C. 450mm", "D. 550mm"],
        correct: 1,
        explanation: "Tủ trên sâu ≤350mm. Sâu hơn sẽ cấn đầu khi thao tác ở mặt bếp."
      },
      {
        id: 9,
        question: "Hộc lò nướng âm cần chiều sâu (D) tối thiểu bao nhiêu?",
        options: ["A. 400–450mm", "B. 500–520mm", "C. 550–580mm", "D. 600–650mm"],
        correct: 2,
        explanation: "Lò nướng thường cần hộc sâu ≥550–580mm. Check spec thiết bị trước khi vẽ."
      },
      {
        id: 10,
        question: "Hộc tủ Tandembox cần thêm bao nhiêu mm mỗi bên so với chiều rộng ray?",
        options: ["A. 10mm (5mm mỗi bên)", "B. 21mm mỗi bên (tổng 42mm)", "C. 30mm mỗi bên (tổng 60mm)", "D. 15mm mỗi bên (tổng 30mm)"],
        correct: 1,
        explanation: "W hộc Tandembox = W ray + 42mm (21mm mỗi bên). Ray 500mm → hộc sâu ≥520mm."
      },
      {
        id: 11,
        question: "Rổ gia vị pull-out tiêu chuẩn 150mm cần hộc tủ phủ bì rộng tối thiểu bao nhiêu?",
        options: ["A. 150–160mm", "B. 170–180mm", "C. 190–200mm", "D. 220–250mm"],
        correct: 2,
        explanation: "W tủ phủ bì = W rổ + 2×18mm ván hông + khe. Rổ 150mm → tủ ≥190–200mm."
      },
      {
        id: 12,
        question: "Ngăn kéo rộng hơn 800mm nên dùng loại ray nào?",
        options: ["A. Ray bi thường", "B. Ray hộp (Tandembox/Antaro)", "C. Ray trượt gỗ", "D. Ray giấu âm đáy"],
        correct: 1,
        explanation: "Rộng >800mm → ray hộp (Tandembox/Antaro) chịu tải 30–50kg, chống xệ đáy."
      },
      {
        id: 13,
        question: "Khi vẽ cánh tủ bếp, nếu tay nắm Aventos HF cách trần bao nhiêu trước khi mở?",
        options: ["A. ≥ H cánh × 0.3", "B. ≥ H cánh × 0.5", "C. ≥ H cánh × 0.7", "D. ≥ H cánh × 1.0"],
        correct: 1,
        explanation: "Cánh lift-up HF fold: khoảng đỉnh tủ đến trần ≥ H cánh × 0.5."
      },
      {
        id: 14,
        question: "Máy hút mùi cách mặt bếp gas chuẩn bao nhiêu mm?",
        options: ["A. 450–550mm", "B. 550–650mm", "C. 650–750mm", "D. 750–850mm"],
        correct: 2,
        explanation: "Bếp gas: 650–750mm. Bếp từ: 550–650mm."
      },
      {
        id: 15,
        question: "Chiều cao len chân tủ bếp chuẩn là bao nhiêu?",
        options: ["A. 50–70mm", "B. 80–120mm", "C. 130–160mm", "D. 170–200mm"],
        correct: 1,
        explanation: "Len chân tủ bếp: H 80–120mm × lùi vào 50–60mm."
      },
      {
        id: 16,
        question: "Cạnh dán PVC (edge banding) 1mm × 2 bên thêm vào kích thước ván bao nhiêu mm?",
        options: ["A. +1mm", "B. +2mm", "C. +4mm", "D. +6mm"],
        correct: 1,
        explanation: "Cạnh PVC 1mm × 2 bên = +2mm. Ván 400mm sau dán = 402mm."
      },
      {
        id: 17,
        question: "Ván đợt kệ MDF 18mm không có đỡ giữa thì chiều dài tối đa là bao nhiêu?",
        options: ["A. 600mm", "B. 800mm", "C. 1000mm", "D. 1200mm"],
        correct: 1,
        explanation: "MDF 18mm: max 800mm không đỡ. Dài hơn → vách đỡ giữa hoặc ván 25mm."
      },
      {
        id: 18,
        question: "Cutting list gửi xưởng cần ghi những thông tin gì?",
        options: [
          "A. Chỉ cần L × W × dày",
          "B. Tên chi tiết, L×W×dày, SL, hướng vân, mặt dán cạnh",
          "C. Chỉ cần mã code phụ kiện",
          "D. Chỉ cần bản vẽ 3D"
        ],
        correct: 1,
        explanation: "Cutting list đầy đủ: tên chi tiết, L×W×dày, số lượng, hướng vân, mặt dán cạnh."
      },
      {
        id: 19,
        question: "Cánh tủ cao 2400mm cần gắn tối thiểu bao nhiêu bản lề?",
        options: ["A. 2 bản lề", "B. 3 bản lề", "C. 4–5 bản lề", "D. 6 bản lề"],
        correct: 2,
        explanation: "Cánh 2400mm → 4–5 bản lề cách đều. Cánh nặng (lõi xanh) → 5 bản lề."
      },
      {
        id: 20,
        question: "Filler panel giữa tủ lạnh và tủ bếp cần rộng bao nhiêu?",
        options: ["A. 10–20mm", "B. 30–50mm", "C. 60–80mm", "D. 100–120mm"],
        correct: 1,
        explanation: "Filler panel 30–50mm giữa tủ lạnh và tủ bếp. Tránh cánh tủ lạnh cấn ngăn kéo."
      },
      {
        id: 21,
        question: "Khoảng cách tối thiểu giữa bếp nấu và chậu rửa (bàn soạn) là bao nhiêu?",
        options: ["A. 200–300mm", "B. 400–600mm", "C. 700–800mm", "D. 900–1000mm"],
        correct: 1,
        explanation: "Tối thiểu 400–600mm mặt bếp trống giữa bếp và chậu để thao tác."
      },
      {
        id: 22,
        question: "Cánh tủ lùa 2 cánh, mỗi cánh cần overlap bao nhiêu mm?",
        options: ["A. 10–15mm", "B. 25–30mm", "C. 40–50mm", "D. 60–70mm"],
        correct: 1,
        explanation: "Mỗi cánh = (W tủ ÷ 2) + 25–30mm overlap. Ray đôi 2 rãnh cách nhau 20mm."
      },
      {
        id: 23,
        question: "Cánh tủ cao >1200mm cần phụ kiện gì để tránh mo cánh?",
        options: ["A. Thêm bản lề", "B. Thanh tensioner (chống cong)", "C. Dùng ván dày hơn", "D. Thêm nẹp nhôm"],
        correct: 1,
        explanation: "Cánh cao >1200mm → thanh tensioner bắt buộc, tránh mo cánh sau 6 tháng."
      },
      {
        id: 24,
        question: "Thùng rác âm tủ cần kiểm tra gì trước khi chốt kích thước hộc?",
        options: [
          "A. Chỉ cần check chiều rộng",
          "B. H thùng + H ray (16mm) + khe (20mm) ≤ H hộc dưới bồn rửa",
          "C. Chỉ cần check loại ray",
          "D. Chỉ cần check brand"
        ],
        correct: 1,
        explanation: "Check: H thùng + H ray (16mm) + khe (20mm) ≤ H hộc dưới bồn rửa."
      },
      {
        id: 25,
        question: "Tủ kịch trần cần chừa khe bao nhiêu mm giữa tủ và trần?",
        options: ["A. 0mm (ép sát)", "B. 5–10mm", "C. 15–20mm", "D. 25–30mm"],
        correct: 1,
        explanation: "Chừa 5–10mm khe trần, lắp nẹp che sau. Không bao giờ ép sát."
      },
      {
        id: 26,
        question: "Khi tính kích thước hộc tủ chia ngăn, công thức nào đúng?",
        options: [
          "A. W hộc = W tủ ÷ N",
          "B. W hộc = (W tủ − 2×18 hông − (N−1)×18 vách) ÷ N",
          "C. W hộc = W tủ − 18mm",
          "D. W hộc = (W tủ − 36mm) ÷ N"
        ],
        correct: 1,
        explanation: "W hộc = (W tủ − 2×18 hông − (N−1)×18 vách) ÷ N. Trừ hết vách trước."
      },
      {
        id: 27,
        question: "Ổ cắm mặt bếp (cho máy xay, ấm đun) chuẩn ở cao độ bao nhiêu?",
        options: ["A. 800–900mm", "B. 1050–1150mm", "C. 1200–1300mm", "D. 1400–1500mm"],
        correct: 1,
        explanation: "Ổ cắm mặt bếp: cao 1050–1150mm từ FFL, 2–3 ổ."
      },
      {
        id: 28,
        question: "Loại đá nào KHÔNG nên dùng cho mặt bếp vì dễ ố, xước?",
        options: ["A. Quartz (Vicostone)", "B. Granite", "C. Marble tự nhiên", "D. Caesarstone"],
        correct: 2,
        explanation: "Bếp → Quartz hoặc Granite. Marble dễ ố, xước, ngấm dầu mỡ."
      },
      {
        id: 29,
        question: "Hộc máy rửa bát cần chiều rộng thông thủy bao nhiêu mm?",
        options: ["A. 550–560mm", "B. 598–600mm", "C. 620–650mm", "D. 680–700mm"],
        correct: 1,
        explanation: "Hộc máy rửa bát: W thông thủy 598–600mm. Check bản lề tủ bên cạnh có cấn không."
      },
      {
        id: 30,
        question: "Khi vẽ hộc tủ, nên tra catalog phụ kiện vào thời điểm nào?",
        options: [
          "A. Sau khi xong bản vẽ",
          "B. TRƯỚC khi vẽ, ghi mã code vào bản vẽ",
          "C. Sau khi đặt hàng thi công",
          "D. Khi nào cũng được"
        ],
        correct: 1,
        explanation: "Tra catalog phụ kiện (Blum/Hafele/Hettich) TRƯỚC khi vẽ. Ghi mã code vào bản vẽ."
      }
    ]
  }
};

// ============================================================
// QUIZ 3: Sàn · Gạch · Ốp lát (30 câu)
// ============================================================
const QUIZ_3 = {
  quiz: {
    title: "Bài test 3: Sàn · Gạch · Ốp lát",
    description: "Kiểm tra kiến thức về sàn gỗ, gạch ốp lát, khe co giãn, ron gạch, tile layout, FFL, herringbone, nẹp T và kỹ thuật ốp lát.",
    timeLimit: 30,
    passingScore: 70,
    questions: [
      {
        id: 1,
        question: "Khe co giãn sàn gỗ sát chân tường cần chừa bao nhiêu mm?",
        options: ["A. 3–5mm", "B. 8–12mm", "C. 15–20mm", "D. 25–30mm"],
        correct: 1,
        explanation: "Chừa khe 8–12mm sát tường, che bằng len chân tường."
      },
      {
        id: 2,
        question: "Sàn gỗ chạy liên tục tối đa bao nhiêu mét trước khi cần expansion joint?",
        options: ["A. 4–5m", "B. 8–10m", "C. 12–15m", "D. 18–20m"],
        correct: 1,
        explanation: "Max 8–10m liên tục trước khi cần expansion joint. Qua cửa → nẹp T."
      },
      {
        id: 3,
        question: "Khi layout gạch 600×600 cho phòng, cách nào đúng để tránh viên lẻ quá nhỏ?",
        options: [
          "A. Bắt đầu từ góc phòng",
          "B. Layout từ tim phòng ra 2 bên, viên lẻ đều ≥ 1/2 viên",
          "C. Bắt đầu từ cửa ra vào",
          "D. Gạch nào cũng ốp đều được"
        ],
        correct: 1,
        explanation: "Layout gạch từ tim phòng ra 2 bên. Viên lẻ 2 bên đều nhau và ≥ 1/2 viên."
      },
      {
        id: 4,
        question: "Ron gạch khu ướt (WC) bắt buộc dùng loại gì?",
        options: ["A. Ron xi măng trắng thường", "B. Ron xi măng màu", "C. Ron epoxy chống nấm", "D. Silicon thường"],
        correct: 2,
        explanation: "Khu ướt bắt buộc ron epoxy chống nấm. Khe ron ≥1.5–2mm."
      },
      {
        id: 5,
        question: "Sàn WC cần dốc bao nhiêu % về phía phễu thu?",
        options: ["A. 0.5%", "B. 1–2%", "C. 3–4%", "D. 5–6%"],
        correct: 1,
        explanation: "Sàn WC dốc 1–2% về phễu. Dùng gạch nhám chống trơn."
      },
      {
        id: 6,
        question: "FFL (cốt sàn hoàn thiện) WC phải thấp hơn hành lang bao nhiêu mm?",
        options: ["A. 5–10mm", "B. 15–20mm", "C. 25–30mm", "D. 35–40mm"],
        correct: 1,
        explanation: "FFL WC thấp hơn hành lang 15–20mm. Ngưỡng cửa có gờ chặn nước."
      },
      {
        id: 7,
        question: "Phễu thu sàn WC nên đặt ở vị trí nào?",
        options: [
          "A. Bất kỳ chỗ nào",
          "B. Đúng giao điểm ron gạch",
          "C. Sát góc tường",
          "D. Giữa phòng"
        ],
        correct: 1,
        explanation: "Phễu thu sàn nằm đúng giao điểm ron gạch, tránh cắt gạch xấu."
      },
      {
        id: 8,
        question: "Gạch herringbone cần bắt đầu từ đâu?",
        options: [
          "A. Góc phòng",
          "B. Center line phòng/tường",
          "C. Cửa ra vào",
          "D. Vị trí bất kỳ"
        ],
        correct: 1,
        explanation: "Herringbone bắt từ center line phòng/tường. Bản vẽ ghi: điểm gốc + hướng 45°."
      },
      {
        id: 9,
        question: "Sàn gỗ qua ngưỡng cửa giữa 2 phòng cần phụ kiện gì?",
        options: ["A. Silicon", "B. Nẹp T-profile", "C. Băng keo", "D. Không cần gì"],
        correct: 1,
        explanation: "Mỗi phòng sàn gỗ cần nẹp T-profile tại ngưỡng cửa."
      },
      {
        id: 10,
        question: "Ron gạch tường và ron sàn phải thỏa điều kiện gì?",
        options: [
          "A. Không cần liên quan",
          "B. Thẳng hàng — gạch tường là bội/ước số gạch sàn",
          "C. Ron tường phải rộng hơn ron sàn",
          "D. Ron tường và sàn phải cùng màu"
        ],
        correct: 1,
        explanation: "Gạch tường phải là bội/ước số gạch sàn. VD: sàn 600×600 → tường 300×600."
      },
      {
        id: 11,
        question: "WC bắt buộc phải có bản vẽ gì?",
        options: [
          "A. Chỉ cần mặt bằng",
          "B. Tile layout 4 mặt tường + sàn",
          "C. Chỉ cần mặt cắt",
          "D. Chỉ cần bản vẽ 3D"
        ],
        correct: 1,
        explanation: "WC bắt buộc tile layout 4 mặt tường + sàn: điểm bắt đầu, chiều ốp, vị trí viên cắt."
      },
      {
        id: 12,
        question: "Khi ốp gạch lớn 800×800, cần chú ý gì về dung sai?",
        options: [
          "A. Không cần quan tâm dung sai",
          "B. 10 viên × 0.5mm/viên = lệch 5mm, layout phải tính chính xác đến mm",
          "C. Dung sai chỉ ảnh hưởng đến thẩm mỹ, không quan trọng",
          "D. Chỉ cần tính dung sai cho viên cuối"
        ],
        correct: 1,
        explanation: "10 viên × sai số 0.5mm/viên = lệch 5mm. Layout phải tính chính xác đến mm."
      },
      {
        id: 13,
        question: "Nẹp chuyển tiếp giữa sàn gỗ và gạch WC nên dùng loại nào?",
        options: ["A. Nẹp nhựa", "B. Nẹp nhôm chữ T hoặc silicon", "C. Băng keo 2 mặt", "D. Ron xi măng"],
        correct: 1,
        explanation: "Nẹp nhôm chữ T hoặc silicon. Ghi rõ: loại nẹp, màu, cốt 2 bên bằng hay giật cấp."
      },
      {
        id: 14,
        question: "Sơn tường giáp vách ốp gỗ có mấy cách xử lý?",
        options: [
          "A. 1 cách: silicon",
          "B. 2 cách: nẹp hoặc silicon",
          "C. 3 cách: nẹp nhôm, shadow gap 8–10mm, hoặc gỗ đè lên sơn 5mm",
          "D. 4 cách trở lên"
        ],
        correct: 2,
        explanation: "3 cách: (1) nẹp nhôm, (2) shadow gap 8–10mm, (3) gỗ đè lên sơn 5mm. Vẽ section 1:5."
      },
      {
        id: 15,
        question: "Đá ốp tường giáp trần thạch cao cần chừa khe bao nhiêu mm?",
        options: ["A. 3–5mm", "B. 8–10mm", "C. 15–20mm", "D. 25–30mm"],
        correct: 1,
        explanation: "Chừa khe 8–10mm, che silicon hoặc nẹp inox cùng màu."
      },
      {
        id: 16,
        question: "Len chân tường khi gặp góc trong/ngoài cần cắt góc bao nhiêu độ?",
        options: ["A. 30°", "B. 45°", "C. 60°", "D. 90°"],
        correct: 1,
        explanation: "Len cắt miter 45° ở góc trong/ngoài. Chạm khung cửa → vẽ detail xử lý."
      },
      {
        id: 17,
        question: "Gỗ giáp kính WC cần xử lý mối nối bằng gì?",
        options: ["A. Keo dán gỗ", "B. Silicon trung tính + seal chống thấm", "C. Ron xi măng", "D. Băng keo chịu nước"],
        correct: 1,
        explanation: "Mối nối gỗ–kính: silicon trung tính. Mặt cắt gỗ tiếp xúc ẩm phải seal chống thấm."
      },
      {
        id: 18,
        question: "Shadow gap (khe âm) giữa trần và tường có kích thước chuẩn bao nhiêu?",
        options: ["A. W 3–5mm × sâu 5–10mm", "B. W 8–12mm × sâu 15–20mm", "C. W 15–20mm × sâu 25–30mm", "D. W 20–25mm × sâu 30–40mm"],
        correct: 1,
        explanation: "Shadow gap: W 8–12mm × sâu 15–20mm. Sơn đen bên trong. Nẹp nhôm L ẩn nếu cần."
      },
      {
        id: 19,
        question: "Đá book-match 2 tấm ghép cần chuẩn bị gì trước khi thi công?",
        options: [
          "A. Chỉ cần chọn màu",
          "B. Layout: đánh số từng tấm, ký hiệu chiều vân, mạch ghép, lật gương đúng chiều",
          "C. Chỉ cần đo kích thước",
          "D. Chỉ cần chọn loại đá"
        ],
        correct: 1,
        explanation: "Layout đá: đánh số từng tấm, ký hiệu chiều vân, mạch ghép. Book-match lật gương đúng chiều."
      },
      {
        id: 20,
        question: "Khi ốp inox hairline lên tường đã sơn, thứ tự thi công đúng là gì?",
        options: [
          "A. Ốp inox trước → sơn sau",
          "B. Sơn xong → băng keo bảo vệ → ốp inox đè lên mép sơn 3–5mm",
          "C. Ốp inox + sơn cùng lúc",
          "D. Không cần thứ tự"
        ],
        correct: 1,
        explanation: "Thứ tự: sơn xong → băng keo bảo vệ → ốp inox đè lên mép sơn 3–5mm."
      },
      {
        id: 21,
        question: "Backsplash đá bếp chuẩn cao từ mặt bếp đến đâu?",
        options: [
          "A. Chỉ cần 50mm",
          "B. Full từ mặt bếp đến đáy tủ trên",
          "C. Tùy ý",
          "D. Chỉ cần 200mm"
        ],
        correct: 1,
        explanation: "Full backsplash từ mặt bếp đến đáy tủ trên dễ lau chùi hơn."
      },
      {
        id: 22,
        question: "Hốc tường shower (niche) tính kích thước theo công thức nào?",
        options: [
          "A. KT bất kỳ",
          "B. KT = N × (gạch + ron) − ron",
          "C. KT = N × gạch",
          "D. KT = chiều rộng tường ÷ 2"
        ],
        correct: 1,
        explanation: "Niche: KT = N × (gạch + ron) − ron, tránh cắt gạch lẻ xấu."
      },
      {
        id: 23,
        question: "Bậc ngăn nước sàn khu shower cần cao bao nhiêu mm?",
        options: ["A. 10–15mm", "B. 20–30mm", "C. 40–50mm", "D. 60–80mm"],
        correct: 1,
        explanation: "Bậc ngăn nước ≥20–30mm (bậc đá hoặc nẹp chặn)."
      },
      {
        id: 24,
        question: "Sàn gỗ liên tục >10m mà không có expansion joint sẽ gây ra vấn đề gì?",
        options: [
          "A. Không có vấn đề gì",
          "B. Sàn phồng rộp, bung mối nối do co giãn nhiệt",
          "C. Chỉ ảnh hưởng thẩm mỹ nhẹ",
          "D. Chỉ ảnh hưởng khi độ ẩm cao"
        ],
        correct: 1,
        explanation: "Max 8–10m liên tục. Ghi vị trí expansion joint trên mặt bằng. Không có → sàn phồng."
      },
      {
        id: 25,
        question: "Ngưỡng cửa ra ban công/sân thượng cần cao hơn sàn ngoài bao nhiêu mm?",
        options: ["A. 10–20mm", "B. 30–50mm", "C. 60–80mm", "D. 100–120mm"],
        correct: 1,
        explanation: "Ngưỡng cửa ngoài trời cao hơn sàn ngoài 30–50mm + rãnh thoát nước."
      },
      {
        id: 26,
        question: "Hốc tường shower (niche) cần sâu bao nhiêu mm?",
        options: ["A. 50–60mm", "B. 80–100mm", "C. 120–150mm", "D. 180–200mm"],
        correct: 1,
        explanation: "Niche sâu 80–100mm. H ≥300mm. Vẽ trước khi ốp gạch."
      },
      {
        id: 27,
        question: "Khe ron gạch khu ướt chuẩn rộng tối thiểu bao nhiêu mm?",
        options: ["A. 0.5–1mm", "B. 1.5–2mm", "C. 3–4mm", "D. 5–6mm"],
        correct: 1,
        explanation: "Khe ron ≥1.5–2mm. Ghi loại + màu ron trong bản vẽ."
      },
      {
        id: 28,
        question: "Shadow gap ghi '10mm' trong bản vẽ nhưng không vẽ section detail. Đây có phải lỗi?",
        options: [
          "A. Không, ghi kích thước là đủ",
          "B. Có, phải vẽ detail 1:1 hoặc 1:2 gồm rãnh sâu, nẹp ẩn, sơn đen",
          "C. Không, thợ sẽ tự hiểu",
          "D. Chỉ cần note bằng chữ"
        ],
        correct: 1,
        explanation: "Detail 1:1 hoặc 1:2: rãnh sâu bao nhiêu, nẹp nhôm L ẩn hay không, sơn đen trong rãnh."
      },
      {
        id: 29,
        question: "Trần thạch cao giáp vách cứng (gỗ/đá) ép sát sẽ gây ra gì?",
        options: [
          "A. Không sao",
          "B. Nứt sau 6 tháng do nhà có chuyển vị",
          "C. Chỉ ảnh hưởng thẩm mỹ",
          "D. Chỉ xảy ra với nhà cũ"
        ],
        correct: 1,
        explanation: "Chừa khe co giãn 8–10mm, silicon cùng màu hoặc shadow line. Nhà luôn có chuyển vị."
      },
      {
        id: 30,
        question: "Vách kính tắm cần dùng kính dày bao nhiêu mm?",
        options: ["A. 4–5mm", "B. 6–7mm", "C. 8–10mm", "D. 12–15mm"],
        correct: 2,
        explanation: "Vách kính tắm: kính 8–10mm cường lực. H 1800–2000mm."
      }
    ]
  }
};

// ============================================================
// QUIZ 4: Trần · Đèn · Điện · Điều hòa (30 câu)
// ============================================================
const QUIZ_4 = {
  quiz: {
    title: "Bài test 4: Trần · Đèn · Điện · Điều hòa",
    description: "Kiểm tra kiến thức về trần thạch cao, khe rèm, cove light, CCT, CRI, downlight spacing, BTU, AC clearance, CB riêng và hệ thống điện.",
    timeLimit: 30,
    passingScore: 70,
    questions: [
      {
        id: 1,
        question: "Khe rèm 1 lớp cần rộng tối thiểu bao nhiêu mm?",
        options: ["A. 100mm", "B. 150mm", "C. 200mm", "D. 300mm"],
        correct: 2,
        explanation: "Khe rèm 1 lớp ≥200mm. Khe rèm 2 lớp (voan + rèm) ≥300mm."
      },
      {
        id: 2,
        question: "Khe rèm 2 lớp (voan + rèm chính) cần rộng tối thiểu bao nhiêu mm?",
        options: ["A. 200mm", "B. 250mm", "C. 300mm", "D. 350mm"],
        correct: 2,
        explanation: "Khe rèm 2 lớp ≥300mm × sâu ≥150mm. 2 ray: voan + rèm chính."
      },
      {
        id: 3,
        question: "Khe đèn hắt (cove light) có lip che cao bao nhiêu mm?",
        options: ["A. 20–30mm", "B. 40–60mm", "C. 70–90mm", "D. 100–120mm"],
        correct: 1,
        explanation: "Lip che 40–60mm, LED cách lip 30–50mm, khe rộng 120–150mm."
      },
      {
        id: 4,
        question: "CCT (nhiệt độ màu) phù hợp cho phòng ngủ là bao nhiêu K?",
        options: ["A. 2700K", "B. 3000K", "C. 4000K", "D. 6500K"],
        correct: 1,
        explanation: "Phòng ngủ/Khách: 3000K ấm. Bếp/WC: 4000K trung tính. Tránh 6500K trắng lạnh."
      },
      {
        id: 5,
        question: "Chỉ số CRI (Color Rendering Index) tối thiểu cho đèn nội thất là bao nhiêu?",
        options: ["A. ≥70", "B. ≥80", "C. ≥90", "D. ≥95"],
        correct: 2,
        explanation: "CRI ≥90 cho nội thất. Đèn CRI thấp làm sai lệch màu vật liệu."
      },
      {
        id: 6,
        question: "BTU điều hòa ước tính cho phòng 20m² thông thường là bao nhiêu?",
        options: ["A. 6000–8000 BTU", "B. 9000–10000 BTU", "C. 12000–14000 BTU", "D. 18000–20000 BTU"],
        correct: 2,
        explanation: "BTU ≈ diện tích (m²) × 600–700. 20m² × 600–700 = 12000–14000 BTU."
      },
      {
        id: 7,
        question: "Phòng hướng Tây, nhiều kính cần nhân thêm hệ số BTU bao nhiêu?",
        options: ["A. ×1.0–1.1", "B. ×1.2–1.3", "C. ×1.4–1.5", "D. ×1.6–1.8"],
        correct: 1,
        explanation: "Phòng hướng Tây/nhiều kính → nhân thêm ×1.2–1.3."
      },
      {
        id: 8,
        question: "Cục nóng điều hòa cần khoảng thoáng phía trước tối thiểu bao nhiêu mm?",
        options: ["A. 200mm", "B. 300mm", "C. 500mm", "D. 700mm"],
        correct: 2,
        explanation: "Cục nóng: trước ≥500mm, sau ≥300mm. Không đặt trong hộp kín."
      },
      {
        id: 9,
        question: "Dàn lạnh treo tường cách trần tối thiểu bao nhiêu mm?",
        options: ["A. 50–80mm", "B. 100–120mm", "C. 150–200mm", "D. 250–300mm"],
        correct: 2,
        explanation: "Đỉnh dàn lạnh đến trần: ≥150–200mm. Khoảng hở cho miệng hút gió phía trên."
      },
      {
        id: 10,
        question: "Mỗi máy AC cần CB (circuit breaker) riêng và dây tiết diện tối thiểu bao nhiêu mm²?",
        options: ["A. 1.5mm²", "B. 2.5mm²", "C. 4.0mm²", "D. 6.0mm²"],
        correct: 1,
        explanation: "Mỗi AC: CB riêng + dây riêng tiết diện 2.5mm² trở lên."
      },
      {
        id: 11,
        question: "Ống gen đường ống lạnh AC cần đường kính bao nhiêu?",
        options: ["A. Φ 30–40mm", "B. Φ 60–80mm", "C. Φ 100–120mm", "D. Φ 150mm"],
        correct: 1,
        explanation: "Ống gen Φ 60–80mm từ dàn lạnh đến dàn nóng. Âm sẵn trong tường/trần."
      },
      {
        id: 12,
        question: "Ống thoát nước ngưng AC phải có độ dốc tối thiểu bao nhiêu?",
        options: ["A. 0.5%", "B. 1%", "C. 2%", "D. 3%"],
        correct: 1,
        explanation: "Ống thoát nước ngưng dốc ≥1%. Dẫn đến phễu WC/ban công."
      },
      {
        id: 13,
        question: "Access panel trần cho dàn lạnh AC kích thước tối thiểu bao nhiêu?",
        options: ["A. 200×200mm", "B. 300×300mm", "C. 400×400mm", "D. 500×500mm"],
        correct: 2,
        explanation: "Access panel ≥400×400mm ở đúng vị trí dàn lạnh, van nước để bảo trì."
      },
      {
        id: 14,
        question: "LED dây gầm tủ bếp nên đặt cách cạnh trước tủ trên tối thiểu bao nhiêu mm?",
        options: ["A. 30mm", "B. 50mm", "C. 100mm", "D. 150mm"],
        correct: 2,
        explanation: "LED lùi vào 2/3 sâu tủ trên, cách cạnh trước ≥100mm. Tránh chói mắt."
      },
      {
        id: 15,
        question: "Tổng W LED dây không nên vượt quá bao nhiêu % công suất driver?",
        options: ["A. 50%", "B. 60%", "C. 70%", "D. 80%"],
        correct: 3,
        explanation: "Tổng W LED ≤80% công suất driver. VD: LED 14W/m × 5m = 70W → driver ≥90W."
      },
      {
        id: 16,
        question: "Phòng ngủ cần chia đèn thành ít nhất bao nhiêu group công tắc?",
        options: ["A. 1 group", "B. 2 group", "C. 3 group", "D. 4 group"],
        correct: 2,
        explanation: "Chia group: đèn tổng (G1), đèn hắt (G2), đèn đọc sách (G3). Mỗi group 1 công tắc/dimmer."
      },
      {
        id: 17,
        question: "Tối đa bao nhiêu chủng loại đèn trong 1 căn nhà?",
        options: ["A. 3–4 loại", "B. 5–7 loại", "C. 8–10 loại", "D. Không giới hạn"],
        correct: 1,
        explanation: "Tối đa 5–7 loại: 1 downlight, 1 spotlight, 1 LED dây, 1–2 đèn trang trí."
      },
      {
        id: 18,
        question: "Dây điện âm tường phải đi theo hướng nào?",
        options: ["A. Chéo 45°", "B. Ngang–dọc", "C. Đường ngắn nhất", "D. Tùy ý"],
        correct: 1,
        explanation: "Dây điện luôn đi ngang–dọc. Chéo → không xác định vị trí khi đục tường sau."
      },
      {
        id: 19,
        question: "Rèm điện cần gì ở đầu thanh ray?",
        options: [
          "A. Chỉ cần ray",
          "B. Ổ cắm 220V trong hộp kín ở đầu ray",
          "C. Công tắc gắn tường",
          "D. Không cần điện"
        ],
        correct: 1,
        explanation: "Motor rèm điện: ổ cắm 220V trong hộp kín ở đầu thanh ray."
      },
      {
        id: 20,
        question: "Dimmer nhấp nháy thường do nguyên nhân gì?",
        options: [
          "A. Điện áp không ổn",
          "B. Dimmer không tương thích driver LED (Leading/Trailing Edge)",
          "C. LED bị hỏng",
          "D. Dây điện quá nhỏ"
        ],
        correct: 1,
        explanation: "Dimmer phải đồng bộ driver LED (Leading Edge / Trailing Edge)."
      },
      {
        id: 21,
        question: "Ổ cắm ngoài trời (ban công, sân thượng) cần tiêu chuẩn IP tối thiểu bao nhiêu?",
        options: ["A. IP20", "B. IP33", "C. IP44", "D. IP67"],
        correct: 2,
        explanation: "Ngoài trời: ổ cắm IP44 trở lên, có nắp che chống nước."
      },
      {
        id: 22,
        question: "Khoảng trống phía trước tủ điện tối thiểu bao nhiêu mm?",
        options: ["A. 400mm", "B. 500mm", "C. 600mm", "D. 700mm"],
        correct: 3,
        explanation: "Tủ điện cần khoảng trống phía trước ≥700mm để tiếp cận."
      },
      {
        id: 23,
        question: "Quạt hút WC kín (không cửa sổ) cần lưu lượng tối thiểu bao nhiêu?",
        options: ["A. 40 m³/h", "B. 60 m³/h", "C. 80 m³/h", "D. 100 m³/h"],
        correct: 2,
        explanation: "WC kín → quạt hút âm trần bắt buộc, lưu lượng ≥80 m³/h."
      },
      {
        id: 24,
        question: "Lighting schedule bắt buộc ghi những thông tin gì?",
        options: [
          "A. Chỉ ghi 'downlight' là đủ",
          "B. Mã đèn, W, CCT, CRI, góc chiếu (beam angle)",
          "C. Chỉ cần ghi vị trí",
          "D. Chỉ ghi loại đèn"
        ],
        correct: 1,
        explanation: "Lighting schedule: mã đèn, W, CCT (3000K/4000K), CRI (≥90), góc chiếu (24°/36°/60°)."
      },
      {
        id: 25,
        question: "Đèn phòng ngủ nên bố trí lệch về phía nào trên trần?",
        options: ["A. Phía đầu giường", "B. Phía chân giường", "C. Giữa phòng", "D. Sát tường"],
        correct: 1,
        explanation: "Đèn phòng ngủ lệch về phía chân giường. Đầu giường dùng hắt khe trần hoặc đèn đọc sách."
      },
      {
        id: 26,
        question: "Phòng ngủ bắt buộc có công tắc 2 chiều ở đâu?",
        options: [
          "A. Chỉ ở cửa",
          "B. 1 ở cửa + 1 ở táp đầu giường",
          "C. Chỉ ở đầu giường",
          "D. 1 ở cửa + 1 ở cuối giường"
        ],
        correct: 1,
        explanation: "Bắt buộc: 1 công tắc ở cửa + 1 ở táp đầu giường. Tắt đèn không cần rời giường."
      },
      {
        id: 27,
        question: "Gương LED phòng tắm cần gì phía sau?",
        options: [
          "A. Chỉ cần móc treo",
          "B. Ổ 220V phía sau + ghi vào bản vẽ điện",
          "C. Pin sạc",
          "D. Không cần điện"
        ],
        correct: 1,
        explanation: "Gương LED cần ổ 220V phía sau. Ghi vào bản vẽ điện: vị trí, cao độ tâm gương."
      },
      {
        id: 28,
        question: "CCT phù hợp cho khu bếp và WC là bao nhiêu K?",
        options: ["A. 2700K", "B. 3000K", "C. 4000K", "D. 6500K"],
        correct: 2,
        explanation: "Bếp/WC: 4000K trung tính. Phòng ngủ/Khách: 3000K ấm."
      },
      {
        id: 29,
        question: "Hạ trần giật cấp bậc quá hẹp (<200mm) sẽ gây ra vấn đề gì?",
        options: [
          "A. Không sao",
          "B. Khó thi công và xấu",
          "C. Chỉ ảnh hưởng chi phí",
          "D. Chỉ ảnh hưởng kết cấu"
        ],
        correct: 1,
        explanation: "Hạ trần giật cấp: bậc H 100–200mm × W 200–400mm. Quá hẹp (<200mm) khó thi công, xấu."
      },
      {
        id: 30,
        question: "Profile nhôm LED dây bắt buộc phải có phụ kiện gì để tản sáng đều?",
        options: ["A. Kính trong suốt", "B. Mica frosted diffuser", "C. Lưới thép", "D. Không cần"],
        correct: 1,
        explanation: "Profile nhôm có mica frosted diffuser. Ghi loại profile (âm/nổi/góc), W×H, cách lắp."
      }
    ]
  }
};

// ============================================================
// QUIZ 5: Lỗi thường gặp tổng hợp (30 câu)
// ============================================================
const QUIZ_5 = {
  quiz: {
    title: "Bài test 5: Lỗi thường gặp tổng hợp",
    description: "Bài test tổng hợp từ 12 chủ đề lỗi thường gặp: tủ áo, bếp, cửa, sàn, trần, phòng tắm, phụ kiện, đèn, tiếp giáp vật liệu, điện, điều hòa.",
    timeLimit: 30,
    passingScore: 70,
    questions: [
      {
        id: 1,
        question: "Cánh tủ quần áo cao >1200mm không có thanh chống cong. Hậu quả sau 6 tháng?",
        options: ["A. Không sao", "B. Mo cánh (cong vênh)", "C. Bản lề hỏng", "D. Sơn bong tróc"],
        correct: 1,
        explanation: "Cánh cao >1200mm → thanh tensioner bắt buộc, tránh mo cánh sau 6 tháng."
      },
      {
        id: 2,
        question: "Bếp nấu sát bồn rửa, không có bàn soạn. Khoảng cách tối thiểu cần bao nhiêu?",
        options: ["A. 200–300mm", "B. 400–600mm", "C. 700–800mm", "D. 900–1000mm"],
        correct: 1,
        explanation: "Tối thiểu 400–600mm mặt bếp trống giữa bếp và chậu để thao tác."
      },
      {
        id: 3,
        question: "Cửa WC mở vào trong, phòng <3m². Giải pháp đúng?",
        options: [
          "A. Cửa mở nhỏ hơn",
          "B. Cửa lùa hoặc mở ra ngoài",
          "C. Bỏ cửa",
          "D. Dùng rèm"
        ],
        correct: 1,
        explanation: "WC <3m² → cửa lùa hoặc mở ra ngoài. Vẽ cung quét 90° trên mặt bằng để check."
      },
      {
        id: 4,
        question: "Sàn gỗ lát sát chân tường, không khe co giãn. Cần chừa bao nhiêu?",
        options: ["A. 3–5mm", "B. 8–12mm", "C. 15–20mm", "D. 25–30mm"],
        correct: 1,
        explanation: "Chừa khe 8–12mm sát tường, che bằng len chân tường."
      },
      {
        id: 5,
        question: "Hạ trần phòng khách còn thông thủy 2500mm. Đúng hay sai?",
        options: [
          "A. Đúng, đủ chuẩn",
          "B. Sai, phòng khách cần ≥2700mm",
          "C. Tùy diện tích phòng",
          "D. Chỉ sai với nhà phố"
        ],
        correct: 1,
        explanation: "Phòng khách ≥2700mm, phòng ngủ ≥2500mm, hành lang ≥2400mm."
      },
      {
        id: 6,
        question: "Bồn cầu treo cần tường giả sâu bao nhiêu mm cho khung Geberit?",
        options: ["A. 80–100mm", "B. 150–200mm", "C. 250–300mm", "D. 350–400mm"],
        correct: 1,
        explanation: "Khung Geberit cần tường giả sâu 150–200mm. Phải trừ vào diện tích WC trên mặt bằng."
      },
      {
        id: 7,
        question: "Bản lề cốc nhô vào hộc tủ 10–12mm. Khi nào cần đặc biệt chú ý?",
        options: [
          "A. Luôn luôn",
          "B. Khi có thiết bị âm (máy rửa bát) ở hộc bên cạnh",
          "C. Chỉ khi tủ sâu <500mm",
          "D. Chỉ khi cánh >1200mm"
        ],
        correct: 1,
        explanation: "Tính clearance bản lề cốc khi mở. Hộc máy rửa bát → check bản lề tủ bên cạnh có cấn không."
      },
      {
        id: 8,
        question: "Downlight bố trí kiểu lưới đều, không theo layout nội thất. Đúng hay sai?",
        options: [
          "A. Đúng, lưới đều là chuẩn",
          "B. Sai, đèn phải bố trí theo nội thất: task, accent, general",
          "C. Tùy phòng",
          "D. Chỉ sai với phòng khách"
        ],
        correct: 1,
        explanation: "Đèn bố trí theo nội thất: task → mặt bếp/bàn, accent → feature wall, general → lối đi."
      },
      {
        id: 9,
        question: "Sàn gỗ giáp gạch WC không có nẹp chuyển tiếp. Cần xử lý thế nào?",
        options: [
          "A. Silicon là đủ",
          "B. Nẹp nhôm chữ T hoặc silicon, ghi loại nẹp + màu",
          "C. Không cần xử lý",
          "D. Dùng ron xi măng"
        ],
        correct: 1,
        explanation: "Nẹp nhôm chữ T hoặc silicon. Ghi rõ: loại nẹp, màu, cốt 2 bên bằng hay giật cấp."
      },
      {
        id: 10,
        question: "Ổ cắm nằm sau sofa/tủ, không thể chạm tới. Cách phòng tránh?",
        options: [
          "A. Đặt nhiều ổ cắm hơn",
          "B. Vẽ layout nội thất TRƯỚC → overlay bản vẽ điện → kiểm tra",
          "C. Dùng ổ cắm nổi",
          "D. Dùng dây nối dài"
        ],
        correct: 1,
        explanation: "Vẽ layout nội thất TRƯỚC → overlay bản vẽ điện → kiểm tra mọi ổ cắm đều lộ và tiếp cận được."
      },
      {
        id: 11,
        question: "Dàn lạnh AC thổi thẳng vào đầu giường. Giải pháp đúng?",
        options: [
          "A. Giảm công suất AC",
          "B. Xoay hướng hoặc dùng dàn lạnh âm trần phân tán",
          "C. Đắp chăn dày hơn",
          "D. Chuyển giường ra xa"
        ],
        correct: 1,
        explanation: "Hướng thổi tránh rọi trực tiếp vào người. Xoay hướng hoặc dùng dàn lạnh âm trần phân tán."
      },
      {
        id: 12,
        question: "Bậc cầu thang không đều nhau: riser lệch 10mm giữa các bậc. Mức độ lỗi?",
        options: ["A. Lỗi nhẹ", "B. Lỗi nghiêm trọng", "C. Chấp nhận được", "D. Chỉ ảnh hưởng thẩm mỹ"],
        correct: 1,
        explanation: "Mọi bậc đều nhau: riser 155–175mm, tread ≥250mm. Bậc lệch = lỗi nghiêm trọng."
      },
      {
        id: 13,
        question: "Lan can cầu thang khoảng cách thanh đứng 120mm. Đúng hay sai?",
        options: [
          "A. Đúng, trong chuẩn",
          "B. Sai, phải ≤100mm (TCVN) — trẻ em không chui đầu qua được",
          "C. Tùy thiết kế",
          "D. Chỉ cần ≤150mm"
        ],
        correct: 1,
        explanation: "Thanh đứng cách nhau ≤100mm (TCVN). Trẻ em không chui đầu qua được."
      },
      {
        id: 14,
        question: "Chậu đặt bàn (vessel basin) trên mặt đá 850mm → mặt chậu 1000mm. Sai ở đâu?",
        options: [
          "A. Mặt đá quá thấp",
          "B. Mặt đá phải hạ xuống: 850 − H chậu (VD chậu 150mm → đá ở 700mm)",
          "C. Nên dùng chậu thấp hơn",
          "D. Quá cao 50mm, không sao"
        ],
        correct: 1,
        explanation: "Mặt chậu vessel chuẩn ≈850mm → mặt đá = 850 − H chậu."
      },
      {
        id: 15,
        question: "Công tắc điện đặt phía bản lề cửa, mở cánh cửa là va vào. Cách đặt đúng?",
        options: [
          "A. Đặt phía trên cửa",
          "B. Đặt phía tay nắm, cách mép cửa ≥150–200mm, ngoài vùng quét cánh",
          "C. Đặt phía đối diện cửa",
          "D. Đặt bất kỳ bên nào"
        ],
        correct: 1,
        explanation: "Công tắc đặt phía tay nắm, cách mép cửa ≥150–200mm, ngoài vùng quét cánh."
      },
      {
        id: 16,
        question: "Khe rèm hẹp, rèm bị cấn trần. Khe rèm 2 lớp cần rộng tối thiểu bao nhiêu?",
        options: ["A. 150mm", "B. 200mm", "C. 300mm", "D. 400mm"],
        correct: 2,
        explanation: "Khe rèm 2 lớp: rộng ≥300mm (voan + rèm). Sâu ≥150mm."
      },
      {
        id: 17,
        question: "Toàn bộ ổ cắm + đèn + AC chung 1 CB. Đúng hay sai?",
        options: [
          "A. Đúng, tiết kiệm",
          "B. Sai, CB riêng: mỗi AC 1 CB, bếp từ riêng, ổ cắm riêng, đèn riêng",
          "C. Tùy quy mô nhà",
          "D. Chỉ cần 2 CB là đủ"
        ],
        correct: 1,
        explanation: "CB riêng: mỗi AC 1 CB, bếp từ riêng, ổ cắm riêng, đèn riêng."
      },
      {
        id: 18,
        question: "Đèn track/nam châm chỉ ghi vị trí ray, không ghi vị trí đầu đèn. Đúng hay sai?",
        options: [
          "A. Đúng, ghi ray là đủ",
          "B. Sai, phải ghi vị trí từng đầu đèn + hướng chiếu + góc nghiêng",
          "C. Tùy thiết kế",
          "D. Chỉ cần ghi số đầu đèn"
        ],
        correct: 1,
        explanation: "Ghi: vị trí từng đầu đèn trên ray (cách đầu ray bao nhiêu mm), hướng chiếu, góc nghiêng."
      },
      {
        id: 19,
        question: "WC không cửa sổ, không quạt hút. Hậu quả?",
        options: [
          "A. Chỉ hơi bí",
          "B. Ẩm mốc, nấm phát triển",
          "C. Chỉ ảnh hưởng mùi",
          "D. Không sao nếu có AC"
        ],
        correct: 1,
        explanation: "WC kín → quạt hút âm trần bắt buộc, lưu lượng ≥80 m³/h."
      },
      {
        id: 20,
        question: "Cửa kính shower mở vào trong WC nhỏ. Vấn đề gì?",
        options: [
          "A. Không sao",
          "B. Cấn người bên trong, cản lối thoát",
          "C. Chỉ ảnh hưởng thẩm mỹ",
          "D. Chỉ bất tiện nhẹ"
        ],
        correct: 1,
        explanation: "Cửa kính shower nên mở ra ngoài hoặc dạng lùa để không cản lối thoát."
      },
      {
        id: 21,
        question: "Ống khói hút mùi lộ ống nhôm chưa che. Cách xử lý?",
        options: [
          "A. Để lộ là bình thường",
          "B. Bọc hộp gỗ/inox cùng tông tủ bếp, vẽ chi tiết hộp bọc",
          "C. Sơn cùng màu tường",
          "D. Dùng ống PVC thay thế"
        ],
        correct: 1,
        explanation: "Bọc hộp gỗ/inox cùng tông tủ bếp. Vẽ chi tiết hộp bọc trong bản vẽ."
      },
      {
        id: 22,
        question: "Giường hộc kéo cấn cánh tủ quần áo khi mở. Giải pháp?",
        options: [
          "A. Bỏ hộc kéo giường",
          "B. Chuyển tủ sang cửa lùa",
          "C. Kê giường xa tủ hơn",
          "D. Dùng hộc kéo nhỏ hơn"
        ],
        correct: 1,
        explanation: "Vẽ mặt bằng: mở cánh tủ áo 90° có cấn hộc kéo giường? Cấn → chuyển tủ cửa lùa."
      },
      {
        id: 23,
        question: "Ổ cắm đầu giường bị headboard che khuất. Cách phòng tránh?",
        options: [
          "A. Đặt ổ cắm thấp hơn",
          "B. Vẽ elevation đầu giường gồm giường + headboard, ổ cắm lộ ra 2 bên",
          "C. Không dùng headboard",
          "D. Dùng dây nối dài"
        ],
        correct: 1,
        explanation: "Vẽ elevation đầu giường gồm giường + headboard. Ổ cắm phải lộ ra 2 bên hoặc trên headboard."
      },
      {
        id: 24,
        question: "Đá Marble dùng cho mặt bếp. Vấn đề gì?",
        options: [
          "A. Quá đắt",
          "B. Dễ ố, xước, ngấm dầu mỡ",
          "C. Quá nặng",
          "D. Khó cắt"
        ],
        correct: 1,
        explanation: "Bếp → Quartz hoặc Granite. Marble dễ ố, xước, ngấm dầu mỡ."
      },
      {
        id: 25,
        question: "Tủ walk-in không có đèn bên trong. Cần gì?",
        options: [
          "A. Dùng đèn pin",
          "B. LED dây cảm biến, ghi điểm đèn + công tắc trong bản vẽ điện",
          "C. Mở cửa cho sáng",
          "D. Không cần đèn"
        ],
        correct: 1,
        explanation: "LED dây cảm biến bên trong. Phải có điểm đèn + công tắc trong bản vẽ điện."
      },
      {
        id: 26,
        question: "Vách ngăn phòng ngủ–khách chỉ thạch cao 1 lớp. Cần gì để cách âm?",
        options: [
          "A. Sơn thêm 1 lớp",
          "B. Thạch cao 2 lớp + rockwool bên trong",
          "C. Dùng vách gỗ thay",
          "D. Dùng thạch cao dày hơn"
        ],
        correct: 1,
        explanation: "Vách ngăn phòng ngủ → thạch cao 2 lớp + rockwool bên trong để cách âm."
      },
      {
        id: 27,
        question: "Lối đi xung quanh đảo bếp tối thiểu bao nhiêu mm?",
        options: ["A. 600mm", "B. 700mm", "C. 800mm", "D. 900mm"],
        correct: 3,
        explanation: "Xung quanh đảo bếp: ≥900mm (lý tưởng 1000–1200mm) để mở tủ + đi lại thoải mái."
      },
      {
        id: 28,
        question: "Không ghi hướng vân gỗ trên bản vẽ tủ. Hậu quả?",
        options: [
          "A. Không sao, thợ sẽ tự xử lý",
          "B. Vân gỗ lộn xộn, không đồng bộ giữa các cánh/tấm",
          "C. Chỉ ảnh hưởng chi phí",
          "D. Chỉ ảnh hưởng thời gian"
        ],
        correct: 1,
        explanation: "Bản vẽ chi tiết ghi mũi tên hướng vân lên TỪNG tấm ván."
      },
      {
        id: 29,
        question: "Bàn ăn sát tường, ghế phía trong không kéo ra được. Cần khoảng cách bao nhiêu?",
        options: ["A. 600mm", "B. 800mm", "C. 1000mm", "D. 1200mm"],
        correct: 1,
        explanation: "Mép bàn ăn đến tường/tủ: ≥800mm. Có lối đi sau lưng: ≥1100mm."
      },
      {
        id: 30,
        question: "Dùng 6500K (trắng lạnh) cho toàn bộ nhà. Đúng hay sai?",
        options: [
          "A. Đúng, sáng đều",
          "B. Sai, bếp/WC dùng 4000K, phòng ngủ/khách dùng 3000K",
          "C. Tùy sở thích",
          "D. 6500K tiết kiệm hơn"
        ],
        correct: 1,
        explanation: "Bếp/WC: 4000K trung tính. Phòng ngủ/Khách: 3000K ấm. Đồng nhất CCT trong cùng 1 phòng."
      }
    ]
  }
};

// ============================================================
// SEED FUNCTION
// ============================================================
async function seed() {
  console.log('=== SEED 5 BÀI KIỂM TRA KIẾN THỨC (2.6) ===\n');

  // 1. Get module 'design-knowledge'
  const { data: mod, error: modErr } = await sb
    .from('training_modules')
    .select('id')
    .eq('slug', 'design-knowledge')
    .single();

  if (!mod) {
    console.log('❌ Module "design-knowledge" not found', modErr);
    return;
  }
  console.log(`✓ Module design-knowledge: ${mod.id}`);

  // 2. Check if section 2.6 exists
  let { data: section } = await sb
    .from('training_sections')
    .select('id')
    .eq('module_id', mod.id)
    .eq('number', '2.6')
    .single();

  if (!section) {
    console.log('→ Section 2.6 chưa tồn tại, tạo mới...');
    const { data: newSection, error: secErr } = await sb
      .from('training_sections')
      .insert({
        module_id: mod.id,
        number: '2.6',
        title: 'Kiểm tra kiến thức',
        content: '5 bài test trắc nghiệm — mỗi bài 30 câu. Đạt ≥70% mới pass. Kiến thức thực tế, áp dụng ngay vào bản vẽ.',
        sort_order: 6
      })
      .select('id')
      .single();

    if (secErr || !newSection) {
      console.log('❌ Không tạo được section 2.6', secErr);
      return;
    }
    section = newSection;
    console.log(`✓ Tạo section 2.6: ${section.id}`);
  } else {
    console.log(`✓ Section 2.6 đã tồn tại: ${section.id}`);
    // Update title + content
    await sb.from('training_sections').update({
      title: 'Kiểm tra kiến thức',
      content: '5 bài test trắc nghiệm — mỗi bài 30 câu. Đạt ≥70% mới pass. Kiến thức thực tế, áp dụng ngay vào bản vẽ.'
    }).eq('id', section.id);
  }

  // 3. Delete existing subsections
  const { data: deleted } = await sb
    .from('training_subsections')
    .delete()
    .eq('section_id', section.id)
    .select('id');

  console.log(`✓ Đã xóa ${deleted?.length || 0} subsections cũ`);

  // 4. Insert 5 quiz subsections
  const quizzes = [
    { heading: 'Quiz 1: Kích thước chuẩn & Ergonomics', metadata: QUIZ_1 },
    { heading: 'Quiz 2: Tủ bếp & Phụ kiện', metadata: QUIZ_2 },
    { heading: 'Quiz 3: Sàn · Gạch · Ốp lát', metadata: QUIZ_3 },
    { heading: 'Quiz 4: Trần · Đèn · Điện · Điều hòa', metadata: QUIZ_4 },
    { heading: 'Quiz 5: Lỗi thường gặp tổng hợp', metadata: QUIZ_5 },
  ];

  for (let i = 0; i < quizzes.length; i++) {
    const q = quizzes[i];
    const { error } = await sb.from('training_subsections').insert({
      section_id: section.id,
      heading: q.heading,
      content_type: 'quiz',
      metadata: q.metadata,
      sort_order: i + 1
    });

    if (error) {
      console.log(`❌ Lỗi insert ${q.heading}:`, error.message);
    } else {
      console.log(`✓ ${i + 1}. ${q.heading} (${q.metadata.quiz.questions.length} câu)`);
    }
  }

  const totalQ = quizzes.reduce((s, q) => s + q.metadata.quiz.questions.length, 0);
  console.log(`\n✅ Xong! ${totalQ} câu hỏi / ${quizzes.length} bài test — Section 2.6: Kiểm tra kiến thức.`);
}

seed();
