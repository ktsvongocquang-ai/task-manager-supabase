import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

const MISTAKES = [
  {
    heading: "Tủ quần áo",
    mistakes: [
      { wrong: "Cánh tủ cao >1200mm không có thanh chống cong.", right: "Cánh cao >1200mm → thanh tensioner bắt buộc, tránh mo cánh sau 6 tháng." },
      { wrong: "Cánh cao 2400mm chỉ gắn 3 bản lề.", right: "Cánh 2400mm → 4–5 bản lề cách đều. Cánh nặng (lõi xanh) → 5 bản lề." },
      { wrong: "Tủ kịch trần không chừa khe, ép sát trần.", right: "Chừa 5–10mm khe trần, lắp nẹp che sau. Không bao giờ ép sát." },
      { wrong: "Không ghi hướng vân gỗ từng cánh, từng tấm.", right: "Bản vẽ chi tiết ghi mũi tên hướng vân lên TỪNG tấm ván." },
      { wrong: "Chia hộc không trừ bề dày vách ngăn 18mm.", right: "W hộc = (W tủ − 2×18 hông − (N−1)×18 vách) ÷ N. Trừ hết vách trước." },
      { wrong: "Ván đợt kệ MDF 18mm dài >800mm, không đỡ giữa.", right: "MDF 18mm: max 800mm không đỡ. Dài hơn → vách đỡ giữa hoặc dùng ván 25mm." },
      { wrong: "Cánh lùa 2 cánh rộng đúng 1/2 tủ, kéo lùa bị hở.", right: "Mỗi cánh = (W tủ ÷ 2) + 25–30mm overlap. Ray đôi 2 rãnh cách nhau 20mm." },
      { wrong: "Tay nắm thanh J-pull dài trên cánh hẹp <300mm.", right: "Cánh hẹp <300mm → tay nắm núm tròn hoặc tay dọc ngắn." },
      { wrong: "Quên cộng bề dày cạnh dán (edge banding).", right: "Cạnh PVC 1mm × 2 bên = +2mm. Ván 400mm sau dán = 402mm. Trừ trước khi cắt." },
      { wrong: "Không có cutting list gửi xưởng.", right: "Mỗi bộ tủ kèm cutting list: tên chi tiết, L×W×dày, SL, hướng vân, mặt dán cạnh." },
    ]
  },
  {
    heading: "Tủ bếp & Thiết bị bếp",
    mistakes: [
      { wrong: "Bếp nấu sát bồn rửa, không có bàn soạn.", right: "Tối thiểu 400–600mm mặt bếp trống giữa bếp và chậu để thao tác." },
      { wrong: "Máy hút mùi cách mặt bếp quá cao hoặc quá thấp.", right: "Bếp gas: 650–750mm. Bếp từ: 550–650mm. Quá cao → hút yếu, quá thấp → cấn đầu." },
      { wrong: "Tủ lạnh âm sâu không chừa khe tản nhiệt.", right: "Lưới tản nhiệt len chân tủ hoặc khe phía trên tủ lạnh. Đọc spec từng model." },
      { wrong: "Dùng đá Marble tự nhiên cho mặt bếp.", right: "Bếp → Quartz (Vicostone, Caesarstone) hoặc Granite. Marble dễ ố, xước, ngấm dầu mỡ." },
      { wrong: "Tủ trên sâu >350mm hoặc đáy cách mặt bếp <550mm.", right: "Tủ trên sâu ≤350mm. Đáy tủ trên cách mặt bếp 550–650mm (chuẩn 600mm)." },
      { wrong: "Không bố trí thùng rác âm tủ.", right: "Ngăn kéo rác âm (pull-out bin) cạnh bồn rửa. Tối thiểu 2 thùng phân loại." },
      { wrong: "Hộc lò nướng âm sâu không đủ, lò nhô ra.", right: "Check spec thiết bị trước khi vẽ. Lò nướng thường cần hộc sâu ≥550–580mm." },
      { wrong: "Ngăn kéo rộng >800mm dùng ray bi thường.", right: "Rộng >800mm → ray hộp (Tandembox/Antaro) chịu tải 30–50kg, chống xệ đáy." },
      { wrong: "Vẽ hộc tủ xong mới chọn phụ kiện, không vừa.", right: "Tra catalog phụ kiện (Blum/Hafele/Hettich) TRƯỚC khi vẽ. Ghi mã code vào bản vẽ." },
      { wrong: "Ống khói hút mùi lộ ống nhôm chưa che.", right: "Bọc hộp gỗ/inox cùng tông tủ bếp. Vẽ chi tiết hộp bọc trong bản vẽ." },
    ]
  },
  {
    heading: "Cửa · Vách · Cầu thang",
    mistakes: [
      { wrong: "Cửa mở 90° va vào công tắc điện.", right: "Công tắc đặt phía tay nắm, cách mép cửa ≥150–200mm, ngoài vùng quét cánh." },
      { wrong: "WC nhỏ cửa mở vào cấn bồn cầu/lavabo.", right: "WC <3m² → cửa lùa hoặc mở ra ngoài. Vẽ cung quét 90° trên mặt bằng để check." },
      { wrong: "Vách kính cường lực không ghi spec.", right: "Ghi rõ: dày 8/10/12mm, loại kính (cường lực/dán an toàn), màu, phụ kiện kèm." },
      { wrong: "Cửa lùa cao kịch trần không có ray dẫn hướng trên.", right: "Cửa lùa cao ≥2400mm → bắt buộc top guide, tránh cửa đung đưa, bật khỏi ray." },
      { wrong: "Vách ngăn phòng ngủ–khách chỉ thạch cao 1 lớp, không cách âm.", right: "Vách ngăn phòng ngủ → thạch cao 2 lớp + rockwool bên trong để cách âm." },
      { wrong: "Cửa pocket (âm tường) không vẽ section.", right: "Section: tường giả 2 bên dày ≥75mm × 2 + cửa 44mm ≈ tổng 200–250mm." },
      { wrong: "Ngưỡng cửa ra ban công/sân thượng bằng hoặc thấp hơn sàn ngoài.", right: "Ngưỡng cửa ngoài trời cao hơn sàn ngoài 30–50mm + rãnh thoát nước." },
      { wrong: "Lan can cầu thang khoảng cách thanh đứng >100mm.", right: "Thanh đứng cách nhau ≤100mm (TCVN). Trẻ em không chui đầu qua được." },
      { wrong: "Bậc cầu thang không đều nhau.", right: "Mọi bậc đều nhau: riser 155–175mm, tread ≥250mm. Bậc lệch = lỗi nghiêm trọng." },
      { wrong: "Cầu thang thông thủy hẹp <900mm.", right: "Tối thiểu 900mm. Cần khuân vác đồ → 1000–1100mm." },
    ]
  },
  {
    heading: "Sàn gỗ · Sàn gạch · Ốp lát",
    mistakes: [
      { wrong: "Sàn gỗ lát sát chân tường, không khe co giãn.", right: "Chừa khe 8–12mm sát tường, che bằng len chân tường." },
      { wrong: "Gạch 600×600 phòng không chia module → viên lẻ góc tường quá nhỏ.", right: "Layout gạch từ tim phòng ra 2 bên. Viên lẻ 2 bên đều nhau và ≥ 1/2 viên." },
      { wrong: "Ron tường và ron sàn không thẳng hàng.", right: "Gạch tường phải là bội/ước số gạch sàn. VD: sàn 600×600 → tường 300×600." },
      { wrong: "WC không có bản vẽ tile layout.", right: "WC bắt buộc tile layout 4 mặt tường + sàn: điểm bắt đầu, chiều ốp, vị trí viên cắt." },
      { wrong: "Sàn WC không dốc về phễu thu.", right: "Sàn WC dốc 1–2% về phễu. Dùng gạch nhám chống trơn. Phễu nằm đúng giao ron." },
      { wrong: "Không ghi FFL (cốt sàn hoàn thiện) từng phòng.", right: "FFL = cốt thô + lớp hoàn thiện. WC thấp hơn hành lang 15–20mm. Ghi trên mặt bằng + mặt cắt." },
      { wrong: "Sàn gỗ chạy liên tục qua cửa không nẹp T.", right: "Mỗi phòng sàn gỗ cần nẹp T-profile tại ngưỡng cửa. Max 8–10m liên tục trước khi cần expansion joint." },
      { wrong: "Gạch lớn 800×800 không tính dung sai ron tích lũy.", right: "10 viên × sai số 0.5mm/viên = lệch 5mm. Layout phải tính chính xác đến mm." },
      { wrong: "Ron WC dùng keo trắng xi măng thường → mốc đen.", right: "Khu ướt bắt buộc ron epoxy chống nấm. Khe ron ≥1.5–2mm. Ghi loại + màu ron." },
      { wrong: "Gạch herringbone không ghi điểm bắt đầu.", right: "Herringbone bắt từ center line phòng/tường. Bản vẽ ghi: điểm gốc + hướng 45°." },
    ]
  },
  {
    heading: "Trần thạch cao · Khe rèm · Khe đèn",
    mistakes: [
      { wrong: "Hạ trần không check chiều cao thông thủy còn lại.", right: "Thông thủy sau hạ trần: phòng khách ≥2.7m, phòng ngủ ≥2.5m, hành lang ≥2.4m." },
      { wrong: "Trần che khuất lỗ thăm (access panel) điều hòa.", right: "Chừa access panel ≥400×400mm ở đúng vị trí dàn lạnh, van nước để bảo trì." },
      { wrong: "Khe rèm hẹp, rèm bị cấn trần hoặc xếp không gọn.", right: "Khe rèm: rộng ≥200mm (1 lớp), ≥300mm (2 lớp voan + rèm). Sâu ≥150mm." },
      { wrong: "Khe đèn hắt (cove light) không vẽ detail kích thước.", right: "Detail 1:2: lip che 40–60mm, LED cách lip 30–50mm, khe rộng 120–150mm. Ghi loại profile LED." },
      { wrong: "Đáy máng hắt thấp, nhìn thấy bóng LED.", right: "Lip che phải che khuất LED ở mọi góc nhìn trong phòng. Vẽ đường tia nhìn (sight line) trên section." },
      { wrong: "Trần giật cấp không vẽ chi tiết bo góc.", right: "Chi tiết kỹ thuật: kích thước giật cấp, vật liệu, xử lý góc tiếp giáp trần–tường." },
      { wrong: "Trần giáp vách cứng (gỗ/đá) ép sát → nứt sau 6 tháng.", right: "Chừa khe co giãn 8–10mm, silicon cùng màu hoặc shadow line. Nhà luôn có chuyển vị." },
      { wrong: "Profile nhôm LED dây không ghi loại, không có mica tản sáng.", right: "Ghi rõ: loại profile (âm/nổi/góc), mica frosted diffuser, kích thước W×H, cách lắp." },
      { wrong: "Rèm điện không có ổ cắm motor trong khe rèm.", right: "Motor rèm điện: ổ cắm 220V trong hộp kín ở đầu thanh ray. Ghi vào bản vẽ điện." },
      { wrong: "Đèn chỉ ghi 'downlight' không ghi spec.", right: "Lighting schedule bắt buộc: mã đèn, W, CCT (3000K/4000K), CRI ≥90, beam angle." },
    ]
  },
  {
    heading: "Giường · Phòng ngủ · Khoảng cách đi lại",
    mistakes: [
      { wrong: "Đèn downlight rọi thẳng mặt người nằm trên giường.", right: "Đèn phòng ngủ lệch về phía chân giường. Đầu giường dùng hắt khe trần hoặc đèn đọc sách." },
      { wrong: "Phòng ngủ thiếu công tắc 2 chiều.", right: "Bắt buộc: 1 công tắc ở cửa + 1 ở táp đầu giường. Tắt đèn không cần rời giường." },
      { wrong: "Lối đi 2 bên giường <600mm.", right: "Mỗi bên ≥600mm. Phòng hẹp: 1 bên giảm 400–450mm nhưng không bít hoàn toàn." },
      { wrong: "Ổ cắm đầu giường bị headboard che khuất.", right: "Vẽ elevation đầu giường gồm giường + headboard. Ổ cắm phải lộ ra 2 bên hoặc trên headboard." },
      { wrong: "Thiếu ổ cắm + USB mỗi đầu giường.", right: "Mỗi đầu giường: 1 ổ đôi + 1 cổng USB. Cao ổ cắm: ngang mặt táp hoặc trên táp 50–100mm." },
      { wrong: "Giường hộc kéo cấn cánh tủ quần áo khi mở.", right: "Vẽ mặt bằng: mở cánh tủ áo 90° có cấn hộc kéo giường? Cấn → chuyển tủ cửa lùa." },
      { wrong: "Bàn ăn sát tường, ghế phía trong không kéo ra được.", right: "Mép bàn ăn đến tường/tủ: ≥800mm (có lối đi sau lưng: ≥1100mm)." },
      { wrong: "Đảo bếp lối đi xung quanh <900mm.", right: "Xung quanh đảo bếp: ≥900mm (lý tưởng 1000–1200mm) để mở tủ + đi lại thoải mái." },
      { wrong: "Đèn thả (pendant) treo quá thấp ở lối đi.", right: "Đáy đèn thả ở lối đi: cách sàn ≥2100mm. Trên bàn ăn: cách mặt bàn 700–800mm." },
      { wrong: "Treo tranh quá cao, phải ngửa cổ nhìn.", right: "Tâm tranh cách sàn 1450–1550mm (tầm mắt). Trên sofa: cách đỉnh lưng sofa 150–200mm." },
    ]
  },
  {
    heading: "Phòng tắm · Thiết bị vệ sinh",
    mistakes: [
      { wrong: "Bồn cầu sát tường bên quá gần.", right: "Tim bồn cầu cách tường bên ≥400mm. Cách lavabo/vách tắm ≥350mm." },
      { wrong: "Van khóa nước âm tường không có access panel.", right: "Mọi van khóa âm tường phải có access panel mở được để sửa chữa." },
      { wrong: "Khu shower không phân vùng ướt/khô.", right: "Phân vùng: vách kính hoặc bậc ngăn nước ≥20–30mm (bậc đá hoặc nẹp chặn)." },
      { wrong: "Gương WC không có đèn riêng, chỉ nhờ đèn trần.", right: "Đèn gương LED 2 bên hoặc phía trên. Cần điểm điện 220V giấu phía sau gương." },
      { wrong: "Hốc tường shower (niche) không vẽ trước trên bản vẽ.", right: "Niche phải vẽ trên bản vẽ thi công. KT = N × (gạch + ron) − ron, tránh cắt gạch lẻ xấu." },
      { wrong: "Ổ cắm WC quá gần nguồn nước.", right: "Ổ cắm cách nguồn nước ≥600mm (tiêu chuẩn zone 2). Loại IP44 có nắp đậy chống ẩm." },
      { wrong: "Cửa kính shower mở vào trong, cấn người bên trong.", right: "Cửa kính shower nên mở ra ngoài hoặc dạng lùa để không cản lối thoát." },
      { wrong: "Chậu đặt bàn (vessel basin): mặt đá vẫn ở 850mm → mặt chậu 1000mm, quá cao.", right: "Mặt chậu vessel chuẩn ≈850mm → mặt đá = 850 − H chậu. Chậu cao 150mm → đá ở 700mm." },
      { wrong: "WC không cửa sổ, không quạt hút → ẩm mốc.", right: "WC kín → quạt hút âm trần bắt buộc, lưu lượng ≥80 m³/h. Ghi trong bản vẽ MEP." },
      { wrong: "Bồn cầu treo không trừ chiều sâu khung âm vào mặt bằng.", right: "Khung Geberit cần tường giả sâu 150–200mm. Phải trừ vào diện tích WC trên mặt bằng." },
    ]
  },
  {
    heading: "Phụ kiện thường dùng (Ray · Bản lề · Tay nâng)",
    mistakes: [
      { wrong: "Bản lề cốc nhô vào hộc 12mm, cấn thiết bị âm bên cạnh.", right: "Tính clearance bản lề cốc khi mở. Hộc máy rửa bát → check bản lề tủ bên cạnh có cấn không." },
      { wrong: "Tay nâng Aventos chọn sai model theo chiều cao cánh.", right: "HK-XS: cánh H ≤350mm. HK-S: H 200–500mm. HF: H 480–1040mm. HL: H 300–580mm. Tra bảng Blum theo H + trọng lượng." },
      { wrong: "Ray soft-close nhưng tủ sâu không đủ cho cơ cấu giảm chấn.", right: "Ray + soft-close cần thêm 30–40mm phía sau. Ray 550mm → tủ sâu ≥580–600mm phủ bì." },
      { wrong: "Rổ gia vị pull-out 150mm, vẽ hộc tủ cũng 150mm.", right: "W tủ phủ bì = W rổ + 2×18mm ván hông + khe. Rổ 150mm → tủ ≥190–200mm." },
      { wrong: "Ngăn kéo 2 tầng (inner drawer) cấn đáy mặt đá bếp.", right: "H tổng = H ngăn dưới + H inner + 2×ray + khe. Phải ≤ H hộc tủ − mặt đá. Vẽ section check." },
      { wrong: "Cánh lift-up mở lên đập trần.", right: "Khoảng đỉnh tủ đến trần: HF fold ≥ H cánh × 0.5, HL parallel ≥50mm. Vẽ section kiểm tra." },
      { wrong: "Ghi 'bản lề giảm chấn' không ghi brand, mã code.", right: "Ghi cụ thể: Blum Clip-top 110° soft-close / Hettich Sensys 110° / Grass Tiomos. Mã code rõ ràng." },
      { wrong: "Thùng rác âm cao hơn hộc tủ dưới bồn rửa.", right: "Check: H thùng + H ray (16mm) + khe (20mm) ≤ H hộc dưới bồn rửa. Bồn rửa thường hạ thấp → hộc thấp." },
      { wrong: "Khay chia ngăn kéo dài hơn hộc sâu.", right: "Hộc sâu ≥ dài khay + 15–20mm dự phòng. Check spec khay cụ thể trước khi chốt chiều sâu." },
      { wrong: "Không ghi spec phụ kiện trong bản vẽ.", right: "Bản vẽ phải ghi brand + mã + số lượng. Ghi 'hoặc tương đương' kèm tiêu chuẩn tối thiểu nếu cần." },
    ]
  },
  {
    heading: "Bố trí đèn · Line đèn trên bản vẽ",
    mistakes: [
      { wrong: "Downlight bố trí kiểu lưới đều, không theo layout nội thất.", right: "Đèn bố trí theo nội thất: task → mặt bếp/bàn, accent → feature wall, general → lối đi." },
      { wrong: "Chỉ vẽ vị trí đèn, không ghi thông số.", right: "Lighting schedule: mã đèn, W, CCT (3000K/4000K), CRI (≥90), góc chiếu (24°/36°/60°)." },
      { wrong: "Đèn thả bàn ăn không ghi cao độ đáy đèn.", right: "Đáy đèn thả cách mặt bàn 700–800mm. Ghi cao độ đáy đèn từ FFL trên mặt cắt." },
      { wrong: "LED dây gầm tủ bếp sát cạnh trước → chói mắt.", right: "LED lùi vào 2/3 sâu tủ trên, cách cạnh trước ≥100mm. Vẽ vị trí trên section bếp." },
      { wrong: "Đèn track/nam châm chỉ ghi vị trí ray, không ghi vị trí đầu đèn.", right: "Ghi: vị trí từng đầu đèn trên ray (cách đầu ray bao nhiêu mm), hướng chiếu, góc nghiêng." },
      { wrong: "Tổng W LED dây vượt 80% công suất driver.", right: "VD: LED 14W/m × 5m = 70W → driver ≥90W. Ghi spec driver + sơ đồ mạch trên bản vẽ điện." },
      { wrong: "Phòng ngủ tất cả đèn chung 1 công tắc.", right: "Chia group: đèn tổng (G1), đèn hắt (G2), đèn đọc sách (G3). Mỗi group 1 công tắc/dimmer." },
      { wrong: "Dùng 6500K trắng lạnh cho toàn bộ nhà.", right: "Bếp/WC: 4000K trung tính. Phòng ngủ/Khách: 3000K ấm. Đồng nhất CCT trong cùng 1 phòng." },
      { wrong: "Quá nhiều chủng loại đèn (>10 loại) trong 1 căn.", right: "Tối đa 5–7 loại đèn: 1 downlight, 1 spotlight, 1 LED dây, 1–2 đèn trang trí. Ít loại = dễ quản lý, đồng bộ." },
      { wrong: "Không có sơ đồ mạch đèn (lighting circuit).", right: "Bắt buộc: nhóm đèn theo công tắc (Group 1, 2, 3…), đèn nào dimmer, đèn nào sensor." },
    ]
  },
  {
    heading: "Tiếp giáp vật liệu",
    mistakes: [
      { wrong: "Sàn gỗ giáp gạch WC không có nẹp chuyển tiếp.", right: "Nẹp nhôm chữ T hoặc silicon. Ghi rõ: loại nẹp, màu, cốt 2 bên bằng hay giật cấp." },
      { wrong: "Sơn tường giáp vách ốp gỗ: hở khe, lộ cốt.", right: "3 cách: (1) nẹp nhôm, (2) shadow gap 8–10mm, (3) gỗ đè lên sơn 5mm. Vẽ section 1:5." },
      { wrong: "Đá ốp tường ép sát trần thạch cao → nứt.", right: "Chừa khe 8–10mm, che silicon hoặc nẹp inox cùng màu. Nhà luôn có chuyển vị nhỏ." },
      { wrong: "Len chân tường gặp khung cửa → cắt thô 90°.", right: "Len cắt miter 45° ở góc trong/ngoài. Chạm khung cửa → vẽ detail xử lý." },
      { wrong: "Gỗ giáp kính WC không seal → phồng gỗ.", right: "Mối nối gỗ–kính: silicon trung tính. Mặt cắt gỗ tiếp xúc ẩm phải seal chống thấm." },
      { wrong: "Đá book-match 2 tấm ghép không có layout.", right: "Layout đá: đánh số từng tấm, ký hiệu chiều vân, mạch ghép. Book-match lật gương đúng chiều." },
      { wrong: "Inox hairline ốp tường gặp sơn: sơn dính lên inox.", right: "Thứ tự: sơn xong → băng keo bảo vệ → ốp inox đè lên mép sơn 3–5mm." },
      { wrong: "Backsplash đá bếp không ghi chiều cao + xử lý mép trên.", right: "Ghi: H backsplash (thường full đến đáy tủ trên), mép trên (silicon/nẹp), dày đá + keo." },
      { wrong: "Sàn gỗ liên tục >10m không expansion joint.", right: "Max 8–10m liên tục. Qua cửa → nẹp T. Ghi vị trí expansion joint trên mặt bằng." },
      { wrong: "Shadow gap ghi '10mm' nhưng không vẽ section detail.", right: "Detail 1:1 hoặc 1:2: rãnh sâu bao nhiêu, nẹp nhôm L ẩn hay không, sơn đen trong rãnh." },
    ]
  },
  {
    heading: "Điện · Ổ cắm · Công tắc",
    mistakes: [
      { wrong: "Ổ cắm nằm sau sofa/tủ, không thể chạm tới.", right: "Vẽ layout nội thất TRƯỚC → overlay bản vẽ điện → kiểm tra mọi ổ cắm đều lộ và tiếp cận được." },
      { wrong: "Hành lang, cầu thang không có ổ cắm.", right: "Mỗi tầng ≥1 ổ cắm hành lang cho máy hút bụi, đèn trang trí." },
      { wrong: "Tủ walk-in, tủ âm tường sâu không có đèn bên trong.", right: "LED dây cảm biến bên trong. Phải có điểm đèn + công tắc trong bản vẽ điện." },
      { wrong: "Dimmer bị nhấp nháy vì không tương thích driver LED.", right: "Dimmer phải đồng bộ driver LED (Leading Edge / Trailing Edge). Ghi loại dimmer tương thích trong spec." },
      { wrong: "Dây điện âm tường đi chéo 45°.", right: "Dây điện luôn đi ngang–dọc. Chéo → không xác định vị trí khi đục tường sau này." },
      { wrong: "Toàn bộ ổ cắm + đèn + AC chung 1 CB.", right: "CB riêng: mỗi AC 1 CB, bếp từ riêng, ổ cắm riêng, đèn riêng." },
      { wrong: "Không dự phòng ống gen cho smart home.", right: "Có kế hoạch smart home → âm ống gen + dây CAT6 từ giai đoạn thô. Làm sau = đục tường, gấp 3 chi phí." },
      { wrong: "Ban công, sân thượng dùng ổ cắm thường.", right: "Ngoài trời: ổ cắm IP44 trở lên, có nắp che chống nước." },
      { wrong: "Tủ điện bị sofa/tủ che, không mở được.", right: "Tủ điện vị trí dễ tiếp cận: hành lang, khu kỹ thuật. Khoảng trống phía trước ≥700mm." },
      { wrong: "Gương LED phòng tắm không có điểm điện phía sau.", right: "Gương LED cần ổ 220V phía sau. Ghi vào bản vẽ điện: vị trí, cao độ tâm gương." },
    ]
  },
  {
    heading: "Điều hòa · Thông gió",
    mistakes: [
      { wrong: "Dàn lạnh thổi thẳng vào đầu giường / mặt người ngồi.", right: "Hướng thổi tránh rọi trực tiếp vào người. Xoay hướng hoặc dùng dàn lạnh âm trần phân tán." },
      { wrong: "Không tính BTU theo diện tích + đặc điểm phòng.", right: "BTU ≈ diện tích (m²) × 600–700. Phòng hướng Tây, nhiều kính → nhân thêm 1.2–1.3." },
      { wrong: "Ống xả nước ngưng AC thả tự do nhỏ giọt.", right: "Ống thoát nước ngưng dẫn ống nhựa riêng đến phễu WC/ban công. Dốc ≥1%." },
      { wrong: "Cục nóng đặt trong hộp kín.", right: "Cục nóng cần thông thoáng: 300mm sau, 500mm trước, không bít kín." },
      { wrong: "Không âm ống gen đường ống lạnh từ giai đoạn thô.", right: "Ống gen Φ60–80mm từ dàn lạnh đến dàn nóng. Âm sẵn trong tường/trần." },
      { wrong: "Dàn lạnh âm trần không vẽ miệng thổi + miệng hút.", right: "Bản vẽ trần phải vẽ: supply grille (thổi) + return air grille (hút) riêng biệt." },
      { wrong: "Phòng kín, kho, tủ walk-in không có thông gió.", right: "Phòng kín → quạt hút hoặc ống thông gió bắt buộc. Tránh tích ẩm → nấm mốc." },
      { wrong: "Dàn lạnh treo tường sát trần, khoảng hở <100mm.", right: "Đỉnh dàn lạnh đến trần: ≥150–200mm. Khoảng hở cho miệng hút gió phía trên." },
      { wrong: "Ống gió qua trần thấp không check clearance.", right: "Tiết diện ống + bọc cách nhiệt (thêm 50mm mỗi bên). Check khoảng trống trần đủ chứa." },
      { wrong: "AC dùng chung đường dây với ổ cắm thường.", right: "Mỗi AC: CB riêng + dây riêng tiết diện 2.5mm² trở lên. Ghi rõ trong bản vẽ điện." },
    ]
  },
];

async function seed() {
  console.log('=== RÀ SOÁT & CẬP NHẬT 120 LỖI THƯỜNG GẶP ===');

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
    content: 'Sổ tay tra cứu nhanh — Sai → Đúng. Những lỗi Designer phải tránh trên bản vẽ trước khi ra thi công.'
  }).eq('id', section.id);

  const total = MISTAKES.reduce((s, b) => s + b.mistakes.length, 0);
  console.log(`\n✅ Xong! ${total} lỗi / ${MISTAKES.length} chủ đề — ĐÃ RÀ SOÁT THÔNG SỐ.`);
}

seed();
