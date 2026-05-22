import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

const MISTAKES = [
  {
    heading: "Tủ quần áo",
    mistakes: [
      { wrong: "Cánh tủ >1m² không có thanh chống cong.", right: "Cánh >1m² bắt buộc thanh tensioner chống mo cánh." },
      { wrong: "Cánh cao 2.4m chỉ gắn 3 bản lề.", right: "Cánh cao 2.4m → tối thiểu 5 bản lề, cách đều nhau." },
      { wrong: "Tủ kịch trần không chừa khe, thợ gồng ép cánh.", right: "Chừa 3–5mm khe trần, nẹp che sau." },
      { wrong: "Không ghi hướng vân gỗ từng cánh.", right: "Ghi mũi tên hướng vân lên TỪNG tấm ván trong bản vẽ." },
      { wrong: "Hộc kéo không trừ bề dày vách ngăn (18mm).", right: "W hộc = (W tủ − 2×18 hông − (N−1)×18 vách) / N." },
      { wrong: "Ván đợt dài >800mm MDF 18mm, không đỡ giữa.", right: "MDF 18mm: max 750mm. Dài hơn → vách đỡ hoặc tăng 25mm." },
      { wrong: "Tủ cánh lùa 2 cánh rộng = 1/2 tủ, không overlap.", right: "W cánh = (W tủ / 2) + 20mm để 2 cánh chồng nhau." },
      { wrong: "Tay nắm thanh dài (J-pull) trên cánh <300mm.", right: "Cánh hẹp <300mm → tay nắm chấm tròn hoặc tay dọc ngắn." },
      { wrong: "Quên tính dày cạnh dán (edge banding) +2mm.", right: "Ván 400mm + cạnh PVC 1mm × 2 bên = 402mm. Trừ trước khi cắt." },
      { wrong: "Không có cutting list kèm bản vẽ.", right: "Mỗi bộ tủ = 1 cutting list: tên, dài×rộng×dày, SL, hướng vân, dán cạnh." },
    ]
  },
  {
    heading: "Tủ bếp & Thiết bị bếp",
    mistakes: [
      { wrong: "Bếp nấu sát chậu rửa, không có bàn soạn.", right: "Chừa tối thiểu 600mm mặt bếp trống giữa bếp và chậu." },
      { wrong: "Máy hút mùi cách mặt bếp >750mm hoặc <650mm.", right: "Chuẩn: 650–750mm từ mặt bếp đến máy hút mùi." },
      { wrong: "Tủ lạnh âm không chừa khe tản nhiệt.", right: "Chừa lưới tản nhiệt ở len chân tủ hoặc khe phía trên." },
      { wrong: "Dùng đá Marble sáng cho mặt bếp.", right: "Bếp dùng Quartz (Vicostone) hoặc Granite. Marble dễ ố, ngấm màu." },
      { wrong: "Tủ trên sâu >350mm, đáy cách mặt bếp <600mm.", right: "Tủ trên: sâu ≤350mm, đáy cách mặt bếp ≥600mm tránh cấn đầu." },
      { wrong: "Không có ngăn kéo rác âm (pull-out bin).", right: "Tủ dưới bồn rửa → ngăn kéo rác âm 2 thùng (hữu cơ + vô cơ)." },
      { wrong: "Hộc lắp lò nướng âm sâu <580mm, lò nhô ra.", right: "Hộc lò nướng/vi sóng âm: sâu ≥580mm. Check spec thiết bị trước." },
      { wrong: "Ngăn kéo rộng >800mm dùng ray bi thường.", right: "Ngăn kéo >800mm → ray hộp Tandembox chịu tải 30–50kg." },
      { wrong: "Hộc 580mm muốn lắp Tandembox cần 600mm.", right: "Tra catalog phụ kiện TRƯỚC khi vẽ. Ghi mã phụ kiện vào bản vẽ." },
      { wrong: "Ống khói hút mùi lộ ống nhôm không che.", right: "Bọc hộp gỗ sơn hoặc inox cùng tông tủ bếp. Vẽ detail trong bản vẽ." },
    ]
  },
  {
    heading: "Cửa & Vách ngăn",
    mistakes: [
      { wrong: "Cửa mở 90° va vào công tắc điện.", right: "Công tắc cách mép cửa ≥200mm, ngoài vùng quét cửa." },
      { wrong: "WC nhỏ <3m² cửa mở vào cấn bồn cầu.", right: "WC nhỏ → cửa lùa hoặc mở ra ngoài. Vẽ cung quét check va chạm." },
      { wrong: "Cửa kính frameless không ghi spec trong bản vẽ.", right: "Ghi rõ: dày (8/10/12mm), loại (cường lực/dán an toàn), màu, phụ kiện." },
      { wrong: "Cửa lùa cao kịch trần (2.7m+) không có top guide.", right: "Cửa lùa cao → ray dẫn hướng trên bắt buộc, tránh bật khỏi ray dưới." },
      { wrong: "Vách ngăn phòng ngủ không có cách âm.", right: "Vách giữa phòng ngủ–khách, ngủ–WC phải có rockwool cách âm bên trong." },
      { wrong: "Cửa pocket (âm tường) không vẽ section tường.", right: "Section: tường giả dày ≥100mm × 2 + cửa 40mm = tổng 240mm. Ghi rõ." },
      { wrong: "Ngưỡng cửa ra ban công/sân thượng quá thấp.", right: "Ngưỡng cửa ngoài trời cao 50–100mm + rãnh thoát nước dọc ngưỡng." },
      { wrong: "Lan can cầu thang khe thanh đứng >100mm.", right: "Khoảng cách thanh đứng ≤100mm (TCVN) để trẻ em không chui đầu." },
      { wrong: "Bậc cầu thang không đều nhau.", right: "Tất cả bậc đều nhau: riser 160–175mm, tread ≥250mm. Lệch = lỗi nghiêm trọng." },
      { wrong: "Cầu thang rộng <900mm.", right: "Tối thiểu 900mm thông thủy. Cần di chuyển đồ lớn → 1000–1100mm." },
    ]
  },
  {
    heading: "Sàn gỗ & Sàn gạch",
    mistakes: [
      { wrong: "Sàn gỗ lát sát tường, không khe co giãn.", right: "Chừa khe 10–15mm sát tường, che bằng len chân tường." },
      { wrong: "Gạch 600×600 phòng 3150mm → viên lẻ cuối 150mm.", right: "Căn tim gạch từ giữa phòng ra 2 bên, viên lẻ ≥ 1/2 viên." },
      { wrong: "Ron tường và ron sàn không trùng (align) nhau.", right: "Chọn gạch tường bội/ước số gạch sàn. VD: sàn 600 → tường 300×600." },
      { wrong: "Không vẽ tile layout WC (4 tường + sàn).", right: "WC bắt buộc tile layout: điểm bắt đầu ốp, chiều ốp, vị trí viên cắt." },
      { wrong: "Sàn WC không dốc về phễu thu.", right: "Sàn WC dốc 1–2% về phễu. Gạch nhám chống trơn. Phễu nằm đúng giao điểm ron." },
      { wrong: "Không ghi FFL (cốt sàn hoàn thiện) từng phòng.", right: "Gỗ 14mm, gạch 14mm → cốt thô phải bằng nhau. WC thấp hơn hành lang 10–20mm." },
      { wrong: "Sàn gỗ chạy liên tục qua cửa không có nẹp T.", right: "Mỗi phòng sàn gỗ độc lập, nẹp T-profile tại ngưỡng cửa. Max 8–10m liên tục." },
      { wrong: "Gạch lớn 800×800 ron 1.5mm, sai số tích lũy.", right: "10 viên × 0.5mm sai/viên = lệch 5mm. Tính chính xác, ghi rõ loại ron." },
      { wrong: "Khe ron WC dùng keo trắng thường, bị mốc.", right: "Khu ướt bắt buộc ron epoxy chống nấm mốc. Khe ron ≥2mm." },
      { wrong: "Gạch herringbone không ghi starting point.", right: "Herringbone bắt đầu từ center line phòng. Ghi điểm gốc + hướng 45°." },
    ]
  },
  {
    heading: "Trần thạch cao · Khe rèm · Khe đèn",
    mistakes: [
      { wrong: "Hạ trần không check chiều cao còn lại.", right: "Thông thủy sau hạ trần: khách ≥2.6m, ngủ ≥2.4m. Check trước khi vẽ." },
      { wrong: "Trần che khuất lỗ thăm (access panel) điều hòa.", right: "Chừa access panel đủ rộng ở đúng vị trí dàn lạnh, box chia gió." },
      { wrong: "Khe rèm hẹp <120mm, rèm bị cấn trần.", right: "Khe rèm: rộng ≥150mm (1 lớp), ≥250mm (2 lớp). Sâu ≥100mm." },
      { wrong: "Khe đèn hắt không ghi kích thước lip che.", right: "Detail 1:2: lip che 40–60mm, LED cách lip 30–50mm, khe 100–150mm." },
      { wrong: "Đáy máng hắt thấp hơn tầm mắt → lộ bóng LED.", right: "Đáy máng phải cao hơn tầm mắt đứng (1600mm) + 50mm. Trần thấp → cần che lip." },
      { wrong: "Trần giật cấp không vẽ detail bo góc.", right: "Phải có chi tiết kỹ thuật: kích thước, vật liệu, góc tiếp giáp trần–tường." },
      { wrong: "Trần tiếp giáp vách cứng (gỗ/đá) không chừa khe.", right: "Chừa khe co giãn 5–8mm, silicon cùng màu hoặc shadow line. Không ép sát." },
      { wrong: "Profile LED dây không có mica tản sáng.", right: "Ghi rõ: profile nhôm có frosted diffuser, kích thước W×H, cách lắp." },
      { wrong: "Khe rèm không tính vị trí ổ cắm motor rèm.", right: "Rèm điện → ổ cắm 220V trong hộp kín ở 1 đầu thanh ray. Vẽ trong bản vẽ điện." },
      { wrong: "Không ghi spec đèn: CCT, CRI, beam angle.", right: "Lighting schedule: mã đèn, W, CCT (3000K/4000K), CRI ≥90, góc chiếu." },
    ]
  },
  {
    heading: "Giường · Phòng ngủ · Khoảng đi lại",
    mistakes: [
      { wrong: "Đèn downlight rọi thẳng mặt người nằm.", right: "Đèn phòng ngủ lệch về chân giường hoặc dùng hắt khe trần." },
      { wrong: "Thiếu công tắc 2 chiều (2-way) phòng ngủ.", right: "1 ở cửa + 1 ở táp đầu giường. Tắt đèn không cần ra khỏi chăn." },
      { wrong: "Lối đi 2 bên giường <600mm.", right: "Mỗi bên ≥600mm. Phòng hẹp 1 bên có thể giảm 450mm nhưng không bít." },
      { wrong: "Ổ cắm đầu giường bị headboard che khuất.", right: "Vẽ elevation đầu giường có giường + headboard. Ổ cắm lộ ra 2 bên hoặc cao hơn headboard." },
      { wrong: "Thiếu ổ cắm + USB mỗi đầu giường.", right: "Mỗi đầu giường: 1 ổ đôi + 1 USB. Cao 700–800mm từ FFL." },
      { wrong: "Giường hộc kéo cấn cánh tủ áo khi mở.", right: "Đo kỹ: mở cánh tủ có cấn hộc giường không? Cấn → tủ cửa lùa." },
      { wrong: "Bàn ăn sát tường, ghế trong không kéo ra được.", right: "Mép bàn ăn đến tường: ≥800mm (có người đi qua: 1100mm)." },
      { wrong: "Bàn đảo bếp lối đi xung quanh <900mm.", right: "Xung quanh đảo bếp: ≥900mm (lý tưởng 1050–1200mm) để mở tủ + đi lại." },
      { wrong: "Sofa seat depth >70cm trong phòng nhỏ.", right: "Phòng nhỏ: seat depth 55–65cm. >70cm chỉ cho phòng khách rộng." },
      { wrong: "Thảm quá nhỏ so với cụm sofa.", right: "Thảm phải bao phủ 2 chân trước tất cả ghế sofa. Quá nhỏ → không gian rời rạc." },
    ]
  },
  {
    heading: "Phòng tắm & Thiết bị vệ sinh",
    mistakes: [
      { wrong: "Tim bồn cầu đến tường bên <450mm.", right: "Tối thiểu 450mm mỗi bên (tổng 900mm) để ngồi thoải mái." },
      { wrong: "Van khóa nước âm tường không có access panel.", right: "Mọi van khóa âm tường → access panel mở được để bảo trì." },
      { wrong: "Shower không có vách/rèm → nước bắn khu khô.", right: "Phân vùng ướt/khô rõ ràng: vách kính hoặc bậc ngăn nước ≥50mm." },
      { wrong: "Gương WC không có đèn chiếu sáng riêng.", right: "Đèn gương LED 2 bên hoặc trên gương. Cần điểm điện 220V phía sau gương." },
      { wrong: "Không vẽ shower niche trên bản vẽ.", right: "Niche phải vẽ trước ốp gạch. KT niche = N × (gạch + ron) − ron để khỏi cắt." },
      { wrong: "Ổ cắm WC trong vùng ướt, cách nguồn nước <600mm.", right: "Ổ cắm WC cách nguồn nước ≥600mm, loại IP44 có nắp đậy chống ẩm." },
      { wrong: "Cửa kính tắm mở vào trong, cấn người bên trong.", right: "Cửa kính shower mở ra ngoài hoặc dạng lùa/xếp. Không cản lối thoát." },
      { wrong: "Lavabo đặt bàn + mặt đá 850mm → mặt chậu 1000mm, quá cao.", right: "Chậu đặt bàn cao 120–150mm → hạ mặt đá: 850 − 150 = 700mm." },
      { wrong: "WC kín không có quạt hút gió.", right: "WC không cửa sổ → quạt hút âm trần hoặc ống gió ra ngoài. Ghi trong bản vẽ MEP." },
      { wrong: "Bồn cầu treo: không tính chiều sâu khung Geberit.", right: "Khung cần tường giả sâu 120–200mm. Trừ vào diện tích WC trên mặt bằng." },
    ]
  },
  {
    heading: "Phụ kiện hay dùng (Ray · Bản lề · Tay nâng)",
    mistakes: [
      { wrong: "Bản lề cốc nhô vào hộc 12mm, cấn thiết bị âm.", right: "Tính clearance bản lề cốc. Hộc máy rửa bát: kiểm tra bản lề bên cạnh có cấn không." },
      { wrong: "Tay nâng Aventos HK-XS cho cánh >350mm.", right: "HK-XS: cánh ≤350mm. HF: 350–800mm. HL: 300–580mm. Tra bảng theo trọng lượng cánh." },
      { wrong: "Ray soft-close không chừa 40–50mm phía sau tủ.", right: "Ray Blum 550mm + soft-close = tủ sâu tối thiểu 580mm phủ bì." },
      { wrong: "Pull-out gia vị rổ 150mm, tủ cũng vẽ 150mm.", right: "W tủ = W rổ + 2×18mm ván + khe. Rổ 150mm → tủ ≥190mm phủ bì." },
      { wrong: "Inner drawer (ngăn kéo 2 tầng) cấn đáy mặt đá bếp.", right: "H tổng = H ngăn dưới + H inner + 2×ray + khe ≥10mm. Không vượt quá H hộc." },
      { wrong: "Cánh lift-up mở lên đập trần.", right: "Khoảng đỉnh tủ → trần ≥30mm (parallel) hoặc ≥H cánh × 0.3 (folding). Vẽ section check." },
      { wrong: "Ghi 'bản lề giảm chấn' chung chung, không ghi brand/mã.", right: "Ghi rõ: Blum Clip-top 110° / Hettich Sensys / Grass. Có mã code cụ thể." },
      { wrong: "Thùng rác âm cao hơn hộc tủ dưới bồn rửa.", right: "Thùng rác Hafele cao 350–400mm. H hộc = H thùng + ray (20mm) + khe (20mm). Check." },
      { wrong: "Khay chia ngăn kéo dài 450mm, hộc sâu chỉ 400mm.", right: "Hộc sâu ≥ chiều dài khay + 20mm. Check spec từng mã khay trước khi vẽ." },
      { wrong: "Không ghi spec phụ kiện trong bản vẽ → thợ dùng hàng chợ.", right: "Bản vẽ phải ghi brand + mã code phụ kiện. Có thể ghi 'tương đương' kèm tiêu chuẩn tối thiểu." },
    ]
  },
  {
    heading: "Bố trí đèn & Line đèn trên bản vẽ",
    mistakes: [
      { wrong: "Downlight bố trí đều kiểu 'ô bàn cờ' không theo nội thất.", right: "Đèn theo layout nội thất: task rọi mặt bếp/bàn, accent rọi feature wall, general ở lối đi." },
      { wrong: "Chỉ vẽ vị trí đèn, không ghi spec.", right: "Mỗi đèn: công suất W, CCT (3000K/4000K), CRI ≥90, beam angle (15°/24°/36°/60°)." },
      { wrong: "Đèn thả bàn ăn không ghi cao độ đáy đèn.", right: "Đáy đèn thả cách mặt bàn 750–850mm. Ghi cao độ đáy đèn từ FFL trên section." },
      { wrong: "LED dây gầm tủ bếp sát cạnh trước, chói mắt.", right: "LED lùi vào 2/3 sâu tủ trên (cách cạnh trước 100–120mm). Vẽ trên section." },
      { wrong: "Spotlight track/nam châm không ghi vị trí từng đầu đèn.", right: "Ghi vị trí từng đầu đèn trên ray: cách đầu ray bao nhiêu mm, hướng chiếu vào đâu." },
      { wrong: "Tổng W LED dây vượt 80% công suất driver.", right: "LED 14W/m × 5m = 70W → driver ≥88W. Ghi driver spec trên bản vẽ điện." },
      { wrong: "Phòng ngủ chỉ 1 công tắc, toàn bộ đèn bật/tắt cùng lúc.", right: "Phòng ngủ chia nhóm: đèn tổng, đèn hắt, đèn đọc sách. Mỗi nhóm 1 công tắc/dimmer." },
      { wrong: "Dùng 6500K trắng lạnh cho toàn bộ nhà.", right: "Bếp/WC: 4000K trung tính. Ngủ/Khách: 3000K ấm. Đồng bộ CCT trong 1 phòng." },
      { wrong: "15 loại đèn khác nhau trong 1 căn hộ.", right: "Tối đa 5–7 loại: 1 downlight, 1 spotlight, 1 LED dây, 1–2 trang trí. Ít loại = dễ quản lý." },
      { wrong: "Không có sơ đồ mạch đèn (circuit diagram).", right: "Bắt buộc: nhóm đèn theo công tắc (Group 1, 2, 3), đèn nào nối dimmer, đèn nào nối sensor." },
    ]
  },
  {
    heading: "Tiếp giáp vật liệu",
    mistakes: [
      { wrong: "Sàn gỗ giáp gạch WC không có nẹp chuyển tiếp.", right: "Nẹp nhôm chữ T hoặc silicon. Ghi: loại nẹp, màu, cốt 2 bên bằng hay giật cấp." },
      { wrong: "Sơn gặp vách ốp gỗ: hở khe, lộ cốt xấu.", right: "3 cách: nẹp nhôm, shadow gap 8–10mm, hoặc gỗ phủ đè sơn 5mm. Vẽ section detail 1:5." },
      { wrong: "Đá ốp tường ép sát trần thạch cao → nứt.", right: "Chừa khe 5–8mm giữa đá–trần, che silicon/nẹp inox. Nhà luôn có chuyển vị." },
      { wrong: "Len chân tường gặp khung cửa cắt thô 90°.", right: "Len cắt miter 45° khi gặp góc. Chạm khung cửa → vẽ plan detail cách xử lý." },
      { wrong: "Gỗ giáp kính WC không có joint sealant → phồng gỗ.", right: "Mối nối gỗ–kính: silicon trung tính. Gỗ giáp khu ướt phải seal end-grain chống thấm." },
      { wrong: "Đá book-match 2 tấm ghép không vẽ layout pattern.", right: "Layout đá: đánh số từng tấm, ký hiệu chiều vân, vị trí mạch ghép. Lật gương đúng chiều." },
      { wrong: "Inox hairline ốp tường gặp sơn: sơn dính inox.", right: "Thứ tự: sơn trước → băng keo bảo vệ → ốp inox đè lên mép sơn 3–5mm. Ghi sequence." },
      { wrong: "Mặt đá bếp backsplash không ghi chiều cao + mép trên.", right: "Ghi: H backsplash, mép trên xử lý (mài vát/nẹp inox/silicon), dày đá + keo." },
      { wrong: "Sàn gỗ chạy liên tục >10m không có expansion joint.", right: "Gỗ max 8–10m liên tục. Qua cửa → nẹp T tại ngưỡng cửa." },
      { wrong: "Shadow gap ghi '10mm' nhưng không vẽ detail.", right: "Detail 1:1: rãnh sâu bao nhiêu, nẹp nhôm L ẩn hay không, sơn đen trong rãnh hay thô." },
    ]
  },
  {
    heading: "Điện · Ổ cắm · Công tắc trên bản vẽ",
    mistakes: [
      { wrong: "Ổ cắm nằm sau sofa/tủ, không tiếp cận được.", right: "Vẽ layout nội thất TRƯỚC → overlay bản vẽ điện → check tất cả ổ cắm đều lộ." },
      { wrong: "Hành lang/cầu thang không có ổ cắm dự phòng.", right: "Mỗi tầng ≥1 ổ cắm hành lang cho máy hút bụi, đèn trang trí." },
      { wrong: "Tủ walk-in không có đèn bên trong.", right: "Tủ walk-in/tủ âm sâu cần đèn LED dây cảm biến. Phải có điểm đèn trong bản vẽ." },
      { wrong: "Dimmer không tương thích driver LED → nhấp nháy.", right: "Dimmer phải đồng bộ với driver LED. Ghi rõ loại dimmer tương thích trong spec." },
      { wrong: "Dây điện âm tường đi chéo góc 45°.", right: "Dây điện phải đi ngang–dọc. Đi chéo = không xác định được vị trí khi đục tường sau này." },
      { wrong: "Tất cả ổ cắm + đèn + AC dùng chung 1 CB.", right: "CB riêng: AC riêng 1 CB/thiết bị, bếp từ riêng, ổ cắm riêng, đèn riêng." },
      { wrong: "Không dự phòng dây mạng CAT6 cho smart home.", right: "Nếu có kế hoạch smart home → âm ống gen + dây tín hiệu từ đầu. Làm sau gấp 3 chi phí." },
      { wrong: "Ban công/sân thượng dùng ổ cắm thường.", right: "Khu ngoài trời: ổ cắm IP44 có nắp che chống nước." },
      { wrong: "Tủ điện bị nội thất che, không tiếp cận được.", right: "Tủ điện ở vị trí dễ tiếp cận, khoảng trống phía trước ≥700mm. Không bị tủ/sofa che." },
      { wrong: "Gương LED phòng tắm không có điểm điện phía sau.", right: "Gương LED cần 220V phía sau. Ghi vào bản vẽ điện: cao độ tâm gương, loại ổ cắm." },
    ]
  },
  {
    heading: "Điều hòa & Thông gió",
    mistakes: [
      { wrong: "Dàn lạnh thổi thẳng vào đầu giường/mặt người.", right: "Hướng thổi không rọi thẳng vào người. Xoay hướng hoặc dùng âm trần phân tán đều." },
      { wrong: "Không tính BTU theo diện tích + hướng nhà.", right: "BTU = diện tích × chiều cao × hệ số. Hướng Tây +20–30% công suất." },
      { wrong: "Ống xả nước ngưng AC thả tự do.", right: "Ống xả dẫn bằng ống nhựa riêng đến phễu WC/ban công. Dốc tối thiểu 1%." },
      { wrong: "Cục nóng đặt trong hộp kín.", right: "Cục nóng cần: 300mm phía sau, 500mm phía trước, thông thoáng. Không bít kín." },
      { wrong: "Không âm ống gen cho đường ống lạnh từ đầu.", right: "Âm ống gen Φ60–90mm từ dàn lạnh đến dàn nóng. Đi nổi sau = mất thẩm mỹ." },
      { wrong: "Dàn lạnh âm trần không có miệng thổi + miệng hút riêng.", right: "Bản vẽ trần phải vẽ: vị trí supply grille + return air grille cho dàn lạnh âm trần." },
      { wrong: "Phòng kín, kho, tủ walk-in không có thông gió.", right: "Phòng kín cần quạt hút hoặc ống thông gió. Tránh tích ẩm → mốc." },
      { wrong: "Dàn lạnh treo tường sát trần <150mm.", right: "Khoảng đỉnh máy đến trần ≥150–200mm cho miệng hút phía trên." },
      { wrong: "Ống gió đi qua trần thấp không check clearance.", right: "Tiết diện ống + bọc cách nhiệt 50mm. Check đủ khoảng trống trong trần." },
      { wrong: "AC dùng chung đường dây với ổ cắm thường.", right: "Mỗi dàn lạnh: CB riêng + dây riêng 2.5mm². Ghi rõ trong bản vẽ điện." },
    ]
  },
];

async function seed() {
  console.log('=== SEEDING LỖI THƯỜNG GẶP — SỔ TAY THIẾT KẾ ===');

  const { data: mod } = await sb.from('training_modules').select('id').eq('slug', 'design-knowledge').single();
  if (!mod) { console.log('Module not found'); return; }

  const { data: section } = await sb.from('training_sections')
    .select('id').eq('module_id', mod.id).eq('number', '2.5').single();
  if (!section) { console.log('Section 2.5 not found'); return; }

  await sb.from('training_subsections').delete().eq('section_id', section.id);

  let order = 1;
  for (const block of MISTAKES) {
    await sb.from('training_subsections').insert({
      section_id: section.id,
      heading: block.heading,
      content_type: 'mistakes',
      metadata: { mistakes: block.mistakes },
      sort_order: order
    });
    console.log(`✓ ${order}. ${block.heading} (${block.mistakes.length} lỗi)`);
    order++;
  }

  await sb.from('training_sections').update({
    title: 'Lỗi thường gặp',
    content: 'Sổ tay tra cứu nhanh — Sai → Đúng. Mỗi lỗi là 1 bài học rút từ thực tế thi công DQH.'
  }).eq('id', section.id);

  const total = MISTAKES.reduce((s, b) => s + b.mistakes.length, 0);
  console.log(`\n✅ Xong! ${total} lỗi / ${MISTAKES.length} chủ đề.`);
}

seed();
