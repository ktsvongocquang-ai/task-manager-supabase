import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

const DESIGN_MISTAKES = [
  {
    heading: "1. Chia khổ ván & Module gỗ công nghiệp",
    content_type: "mistakes",
    metadata: {
      mistakes: [
        { wrong: "Thiết kế cánh tủ rộng 620mm → cắt từ tấm 1220mm ra 2 cánh bị dư 1 đường cắt, phí ván.", right: "Tính ngược từ khổ ván tiêu chuẩn (1220×2440mm). Cánh nên chia 600mm hoặc 400mm để tối ưu cắt, ít phế liệu nhất." },
        { wrong: "Vẽ tủ cao 2400mm dùng ván 18mm nhưng quên trừ bề dày ván nóc + ván đáy + len chân → thực tế cao hơn dự kiến.", right: "Công thức: H tủ = H thông thủy − len chân (80–100mm) − khe trần (3–5mm). Bên trong: H nội = H tủ − 2×18mm (nóc+đáy)." },
        { wrong: "Chia hộc tủ bếp dưới không tính đến chiều rộng ván vách ngăn (18mm), tổng rộng tủ bị lệch 36–54mm.", right: "Khi chia N hộc trong tủ: W_nội_hộc = (W_tổng − 2×18mm hông − (N−1)×18mm vách) / N. Phải trừ hết vách ngăn trước." },
        { wrong: "Thiết kế cánh tủ overlay (phủ mặt) nhưng ghi kích thước cánh bằng kích thước hộc → cánh bị hụt.", right: "Cánh overlay = W_hộc + 2×khe chừa (thường 2mm mỗi bên). Cánh half-overlay chỉ phủ nửa vách. Bản vẽ phải ghi rõ loại overlay." },
        { wrong: "Không ghi rõ chiều hướng cắt ván (ngang hay dọc khổ 1220×2440), dẫn đến vân gỗ bị ngược chiều.", right: "Bản vẽ chi tiết phải có ký hiệu mũi tên chỉ hướng vân trên TỪNG tấm ván. Vân dọc cho cánh tủ, vân ngang cho kệ ngang." },
        { wrong: "Thiết kế ván đợt (kệ) dài 900mm bằng MDF 18mm không tính tải, kệ võng sau 3 tháng.", right: "Quy tắc: MDF 18mm kệ tối đa 750mm không đỡ, 25mm tối đa 900mm. Dài hơn → phải có vách đỡ giữa hoặc thanh sắt gia cường phía dưới." },
        { wrong: "Bản vẽ ghi kích thước tổng thể tủ nhưng không có bảng cắt ván chi tiết (cutting list).", right: "Mỗi bộ tủ phải kèm cutting list: tên chi tiết, dài×rộng×dày, số lượng, hướng vân, dán cạnh mặt nào. Đây là tài liệu bắt buộc cho xưởng." },
        { wrong: "Quên tính độ dày cạnh dán (edge banding 0.5–2mm) vào kích thước tấm ván → cánh tủ bị rộng hơn hộc.", right: "Cạnh dán PVC 1mm × 2 cạnh = +2mm. Tấm ván 400mm sau dán cạnh 2 bên = 402mm. Phải trừ trước khi cắt hoặc ghi rõ 'kích thước sau dán cạnh'." },
        { wrong: "Tủ quần áo cánh lùa: vẽ cánh rộng bằng 1/2 tổng rộng tủ → 2 cánh không chồng lấn, khi lùa bị hở khe giữa.", right: "Cánh lùa phải overlap tối thiểu 30–40mm. Công thức: W_cánh = (W_tủ / 2) + 20mm. Ray lùa đôi cần 2 rãnh cách nhau 18–20mm." },
        { wrong: "Thiết kế tủ góc chữ L nhưng không vẽ chi tiết mối nối góc (joint detail), thợ tự xử lý bị lệch mặt.", right: "Tủ góc L phải có bản vẽ chi tiết: tủ nào đâm vào tủ nào, filler panel góc bao nhiêu mm, tay nắm cánh góc có cấn nhau không khi mở." }
      ]
    }
  },
  {
    heading: "2. Tính ron & Module gạch ốp lát",
    content_type: "mistakes",
    metadata: {
      mistakes: [
        { wrong: "Vẽ layout gạch 600×600 cho phòng 3150mm nhưng không tính ron → 5.25 viên, viên lẻ cuối chỉ còn 150mm rất xấu.", right: "Công thức: (W_phòng + ron) / (W_gạch + ron). Ví dụ: (3150+2) / (600+2) = 5.24 → cần căn chỉnh tim gạch từ giữa phòng ra 2 bên, viên lẻ ≥ 1/2 viên." },
        { wrong: "Không vẽ bản vẽ layout gạch (tile layout drawing) cho phòng tắm, thợ ốp tự căn → ron chạy lệch giữa các mảng tường.", right: "Phòng tắm bắt buộc có tile layout 4 mặt tường + sàn, ghi rõ: điểm bắt đầu ốp, chiều ốp, vị trí viên cắt, ron bao nhiêu mm." },
        { wrong: "Ốp gạch tường 300×600 dọc nhưng gạch sàn 600×600 → ron tường và sàn không trùng nhau, nhìn lộn xộn.", right: "Quy tắc: ron tường phải trùng (align) với ron sàn tại đường tiếp giáp. Chọn module gạch tường là bội số hoặc ước số của gạch sàn." },
        { wrong: "Thiết kế hốc tường (niche) trong shower nhưng kích thước hốc không chia hết cho module gạch → phải cắt gạch nhỏ xấu.", right: "Kích thước niche phải = N × (W_gạch + ron) − ron. Ví dụ: gạch 300mm, ron 2mm → niche 604mm (2 viên), 906mm (3 viên). Vẽ trước trên elevation." },
        { wrong: "Gạch lớn 800×800 lát phòng khách nhưng quên rằng gạch đại chỉ cho phép ron tối thiểu 1.5mm → tổng lệch tích lũy lớn.", right: "Gạch càng lớn, sai số tích lũy theo ron càng rõ. 10 viên × sai số 0.5mm/viên = lệch 5mm. Bản vẽ phải tính chính xác đến mm và ghi loại ron (1.5mm/2mm/3mm)." },
        { wrong: "Ốp gạch herringbone (xương cá) nhưng không vẽ starting point → thợ bắt đầu từ góc, pattern bị lệch tâm phòng.", right: "Pattern herringbone phải bắt đầu từ đường tim (center line) của phòng/tường. Bản vẽ phải ghi rõ điểm gốc và hướng xoay 45°." },
        { wrong: "Thiết kế viền chỉ (border) gạch quanh phòng nhưng khoảng cách viền đến tường không đủ rộng cho 1 viên gạch nền nguyên.", right: "Viền border phải tính sao cho phần gạch nền giữa viền và tường ≥ 1/2 viên. Nếu không → bỏ viền hoặc điều chỉnh vị trí viền vào trong." },
        { wrong: "Không ghi rõ loại ron (ron xi măng / ron epoxy) và màu ron trong bản vẽ, thợ tự chọn.", right: "Bản vẽ phải specify: loại ron (cement grout / epoxy grout), mã màu ron, bề rộng ron. Khu ướt bắt buộc ron epoxy chống nấm mốc." },
        { wrong: "Layout gạch sàn không tính đến vị trí phễu thu sàn WC → gạch phải cắt chéo xung quanh phễu rất xấu.", right: "Phễu thu sàn phải nằm đúng giao điểm ron gạch hoặc tâm viên gạch. Vẽ vị trí phễu trên tile layout trước khi thi công cấp thoát." },
        { wrong: "Chọn gạch ốp tường format khác hoàn toàn gạch sàn (ví dụ tường 100×300 sàn 600×600) → không thể căn ron.", right: "Chọn gạch tường là bội số hoặc phân số chẵn của gạch sàn. Ví dụ: sàn 600×600 → tường 300×600, 200×600. Tránh tường 250×400 sẽ không bao giờ khớp ron." }
      ]
    }
  },
  {
    heading: "3. Kích thước hộc tủ & Phụ kiện",
    content_type: "mistakes",
    metadata: {
      mistakes: [
        { wrong: "Vẽ hộc tủ bếp rộng 580mm để lắp ngăn kéo Blum Tandembox nhưng Tandembox cần hộc tối thiểu 600mm (nominal).", right: "Tra catalog phụ kiện TRƯỚC khi vẽ: Blum Tandembox: hộc = ray + 42mm (mỗi bên 21mm). Ray 500mm cần hộc sâu ≥ 520mm. Ghi mã phụ kiện vào bản vẽ." },
        { wrong: "Thiết kế hộc chứa khay chia ngăn kéo (cutlery tray) nhưng hộc quá nông (sâu 400mm), khay dài 450mm không vừa.", right: "Khay chia ngăn kéo tiêu chuẩn: 400–500mm. Hộc phải sâu ≥ chiều dài khay + 20mm dự phòng. Check spec từng mã khay trước." },
        { wrong: "Bản lề góc mở 165° (bi-fold hinge) cần bề rộng vách tủ tối thiểu 40mm, nhưng vẽ vách chỉ 18mm → không lắp được.", right: "Mỗi loại bản lề có yêu cầu vách tủ khác nhau. Bản lề thường: vách 18mm OK. Bản lề góc mở rộng: cần tấm filler ≥ 37mm. Luôn check installation guide." },
        { wrong: "Tay nâng (lift-up) Blum Aventos HK-XS lắp cho cánh cao 400mm nhưng spec ghi chỉ cho cánh 200–350mm → tay nâng quá yếu.", right: "Mỗi model tay nâng có giới hạn chiều cao và trọng lượng cánh. HK-XS: cánh ≤ 350mm. HF: cánh 350–800mm. HL: cánh 300–580mm. Tra bảng spec theo trọng lượng cánh." },
        { wrong: "Ngăn kéo bên trong (inner drawer) lắp trên ngăn kéo chính nhưng không tính chiều cao tổng 2 tầng → cấn đáy mặt đá bếp.", right: "H tổng = H ngăn dưới + H inner + 2×ray (mỗi ray cao 16–20mm) + khe ≥ 10mm. Tổng không được vượt quá H hộc tủ trừ mặt đá." },
        { wrong: "Thiết kế giá để gia vị (spice pull-out) trong tủ hẹp 150mm nhưng rổ giá vị tiêu chuẩn cần hộc 150mm thông thủy (sau trừ ván = 186mm phủ bì).", right: "Tủ pull-out gia vị: W_phủ_bì = W_rổ + 2×18mm ván + 2×khe 2mm. Rổ 150mm → tủ tối thiểu 190mm. Tra catalog Hafele/Wellmax chính xác từng mã." },
        { wrong: "Vẽ hộc máy rửa bát 600mm nhưng quên trừ bản lề ở vách tủ bên cạnh → máy rửa bát không lắp vừa.", right: "Máy rửa bát 600mm cần hộc thông thủy tối thiểu 598–600mm. Nếu vách bên có bản lề cốc (cup hinge) nhô vào 12mm → phải cộng thêm hoặc chuyển bản lề sang vách đối diện." },
        { wrong: "Thiết kế ray giảm chấn soft-close cho ngăn kéo nhưng không chừa khoảng trống phía sau tủ cho cơ cấu giảm chấn.", right: "Cơ cấu soft-close built-in cần 40–50mm phía sau. Ray Blum 550mm + soft-close = tủ sâu tối thiểu 580mm phủ bì (bao gồm ván lưng). Ghi rõ chiều sâu tối thiểu tủ." },
        { wrong: "Bản vẽ tủ bếp trên không tính clearance cánh mở lên (lift-up) với trần nhà → cánh đập trần.", right: "Cánh lift-up Aventos HF mở lên cần khoảng cách từ đỉnh tủ đến trần ≥ 30mm (parallel lift) hoặc ≥ H_cánh × 0.3 (folding lift). Vẽ mặt cắt kiểm tra." },
        { wrong: "Thiết kế khoang chứa thùng rác âm (pull-out waste bin) nhưng quên kiểm tra chiều cao thùng rác so với H hộc tủ.", right: "Thùng rác Hafele/Blum cao 350–400mm. Hộc tủ phải cao ≥ H_thùng + H_ray (20mm) + khe trên (20mm). Tủ dưới bồn rửa thường thấp hơn → check kỹ." }
      ]
    }
  },
  {
    heading: "4. Tiếp giáp vật liệu (Material Junctions)",
    content_type: "mistakes",
    metadata: {
      mistakes: [
        { wrong: "Sàn gỗ tiếp giáp sàn gạch WC không có nẹp chuyển tiếp (transition strip), nước từ WC ngấm vào mép gỗ.", right: "Mối nối gỗ–gạch phải có nẹp nhôm chữ T hoặc nẹp silicon chuyển tiếp. Bản vẽ phải ghi: loại nẹp, màu, cốt sàn 2 bên bằng nhau hay giật cấp." },
        { wrong: "Tường sơn gặp vách ốp gỗ: không vẽ chi tiết xử lý mép → thi công ra bị hở khe, lộ cốt gỗ xấu.", right: "3 cách xử lý: (1) Nẹp nhôm che mối nối, (2) Phay rãnh âm (shadow gap) 8–10mm, (3) Gỗ phủ đè lên sơn 5mm. Bản vẽ phải vẽ section detail 1:5." },
        { wrong: "Đá ốp tường tiếp giáp trần thạch cao: không có chi tiết xử lý → khe hở lộ, hoặc đá bị ép sát trần dễ nứt khi nhà lún.", right: "Tiếp giáp đá–trần phải chừa khe 5–8mm, che bằng nẹp inox hoặc silicon cùng màu. Không bao giờ ép sát vì nhà luôn có chuyển vị." },
        { wrong: "Len chân tường gỗ gặp khung cửa: không vẽ chi tiết cắt xéo (miter) hoặc bo cua → thợ cắt thô 90° rất xấu.", right: "Bản vẽ phải ghi rõ: len cắt miter 45° khi gặp góc trong/ngoài, len chạm khung cửa thì xử lý thế nào (cắt sát / quấn quanh). Vẽ plan detail." },
        { wrong: "Mặt đá bếp cuốn lên backsplash tường: không ghi chiều cao backsplash và cách xử lý mép trên → đá lơ lửng giữa tường.", right: "Backsplash đá phải ghi: H (thường 50mm ngắn hoặc full từ mặt bếp đến đáy tủ trên), mép trên xử lý ra sao (mài vát, nẹp inox, silicon), và cốt dày đá+keo." },
        { wrong: "Gỗ ốp tường gặp kính cường lực phòng tắm: không có joint sealant → nước thấm vào mép gỗ gây phồng rộp.", right: "Mọi mối nối gỗ–kính phải có ron silicon trung tính (neutral cure). Gỗ tiếp giáp khu ướt bắt buộc xử lý chống thấm mặt cắt (seal end-grain)." },
        { wrong: "Ốp đá tự nhiên 2 tấm ghép mạch (book-match / vein-match): không vẽ layout pattern → thợ ghép tùy hứng, vân không đối xứng.", right: "Bản vẽ layout đá phải đánh số thứ tự từng tấm, ký hiệu chiều vân, vị trí mạch ghép. Đá book-match phải lật gương đúng chiều." },
        { wrong: "Trần thạch cao tiếp giáp vách gỗ/đá: không xử lý khe co giãn → sau 6 tháng bị nứt chân chim tại mối nối.", right: "Mối nối trần–vách cứng (gỗ, đá, kính) phải có khe co giãn 5–8mm, xử lý silicon cùng màu trần hoặc nẹp shadow line. Bản vẽ phải vẽ detail." },
        { wrong: "Sàn gỗ chạy liên tục qua khoảng cửa (door threshold) giữa 2 phòng không có nẹp chặn → gỗ co giãn đội lên.", right: "Sàn gỗ mỗi phòng phải độc lập, ngăn cách bằng nẹp T-profile tại ngưỡng cửa. Chiều dài sàn gỗ liên tục tối đa 8–10m (tùy loại) trước khi cần expansion joint." },
        { wrong: "Inox hairline ốp tường gặp sơn: không ghi thứ tự thi công → sơn dính lên inox hoặc inox che mép sơn không đều.", right: "Thứ tự thi công: sơn tường trước → dán băng keo bảo vệ → ốp inox đè lên mép sơn 3–5mm. Bản vẽ phải ghi sequence và chi tiết overlap." }
      ]
    }
  },
  {
    heading: "5. Cao độ & Cốt hoàn thiện (FFL)",
    content_type: "mistakes",
    metadata: {
      mistakes: [
        { wrong: "Không ghi Finished Floor Level (FFL) trong bản vẽ mặt bằng → sàn gỗ phòng khách cao hơn sàn gạch bếp 5mm, vấp.", right: "Bản vẽ phải ghi FFL từng phòng. Gỗ 12mm + xốp 2mm = 14mm. Gạch 10mm + keo 4mm = 14mm. Tính ngược để cốt nền thô bằng nhau." },
        { wrong: "Bản vẽ WC không ghi WC phải thấp hơn hành lang bao nhiêu → nước tràn ra ngoài khi tắm.", right: "FFL sàn WC phải thấp hơn hành lang 10–20mm. Ghi rõ trên mặt cắt và mặt bằng. Ngưỡng cửa WC phải có gờ chặn nước." },
        { wrong: "Thiết kế bục podium giường cao 200mm nhưng quên cộng chiều cao nệm (200mm) → tổng cao 400mm, bước lên khó.", right: "Cao độ bục = H_mong_muốn_mặt_nệm − H_nệm − H_khung_giường. Thường bục 100–150mm + nệm 200mm + khung 50mm = mặt nệm cách sàn 350–400mm (chuẩn ngồi)." },
        { wrong: "Không tính cao độ ổ cắm đầu giường so với chiều cao mặt nệm + chiều cao táp → ổ cắm bị chìm sau táp.", right: "Ổ cắm đầu giường = FFL + H_bục(nếu có) + H_nệm + 100mm. Thường 750–800mm từ FFL. Táp đầu giường ≤ H_ổ_cắm − 50mm." },
        { wrong: "Vẽ bàn ăn built-in nhưng FFL khu bếp khác FFL khu ăn (do giật cấp sàn) → chân bàn bị lệch.", right: "Nếu có giật cấp sàn, cao độ mặt bàn phải tính từ FFL thấp hơn. Bản vẽ mặt cắt phải thể hiện rõ chênh cốt và phương án xử lý chân bàn." },
        { wrong: "Công tắc đèn vẽ cao 1200mm từ FFL nhưng quên phòng đó có bục giật cấp 150mm → công tắc chỉ còn 1050mm, thấp quá.", right: "Cao độ công tắc/ổ cắm luôn tính từ FFL CỦA PHÒNG ĐÓ (sau giật cấp). Ghi rõ trên bản vẽ: 'cao 1200mm từ FFL phòng ngủ (+150mm bục)'." },
        { wrong: "Bồn cầu treo tường: không tính cao độ khung âm (concealed cistern frame) → mặt bồn cầu quá cao hoặc quá thấp.", right: "Bồn cầu treo: mặt ngồi chuẩn cách FFL 400–420mm. Khung Geberit cần tường giả sâu 120–200mm và cao 1120mm. Vẽ section detail chính xác." },
        { wrong: "Lavabo đặt bàn (countertop basin): chỉ vẽ mặt bằng, không check cao độ mặt đá + chiều cao chậu → mặt chậu quá cao.", right: "Cao độ mặt đá lavabo chuẩn: 800–850mm từ FFL. Chậu đặt bàn cao 120–150mm → mặt đá hạ xuống: 850 − 150 = 700mm. Phải tính ngược." },
        { wrong: "Máng đèn hắt trần (cove lighting): vẽ chi tiết nhưng không tính cao độ đáy máng so với mắt người đứng → nhìn thấy bóng LED lộ.", right: "Đáy máng hắt phải cao hơn tầm mắt người đứng (1550–1600mm) tối thiểu 50mm. Nếu trần thấp 2600mm → máng ở 2500mm, người 1700mm → vẫn thấy. Cần che lip." },
        { wrong: "Kệ trang trí treo tường: chỉ ghi 'cao 1500mm' nhưng không nói từ FFL hay từ mặt tủ bên dưới → thợ lắp sai vị trí.", right: "Mọi cao độ trong bản vẽ phải ghi rõ mốc: 'cách FFL', 'cách mặt bàn', 'cách đỉnh tủ'. Không bao giờ ghi cao độ mà không kèm mốc tham chiếu." }
      ]
    }
  },
  {
    heading: "6. Clearance & Khoảng cách thao tác",
    content_type: "mistakes",
    metadata: {
      mistakes: [
        { wrong: "Cánh tủ bếp trên mở ra đập vào đèn downlight trần vì không kiểm tra vùng quét cánh trên mặt cắt.", right: "Bản vẽ mặt cắt bếp phải vẽ cung quét cánh mở (arc swing). Đèn downlight phải nằm ngoài cung quét tối thiểu 50mm." },
        { wrong: "2 cánh tủ mở đối diện nhau (tủ bếp trên ↔ tủ bếp đảo) → cánh đập nhau khi mở cùng lúc.", right: "Khoảng cách giữa 2 tủ đối diện mở cánh = W_cánh_1 + W_cánh_2 + 100mm buffer. Hoặc 1 bên dùng cánh lùa/lift-up." },
        { wrong: "Ngăn kéo bếp kéo ra cấn vào cánh tủ lạnh đang mở (khi tủ lạnh đặt cạnh tủ bếp).", right: "Vẽ mặt bằng kiểm tra: khi cánh tủ lạnh mở 90°, ngăn kéo bếp cạnh có kéo ra được không? Tủ lạnh cần filler panel 30–50mm cách tủ bếp." },
        { wrong: "Cửa phòng WC mở vào trong đập vào bồn cầu / lavabo vì WC quá nhỏ mà không dùng cửa lùa.", right: "WC diện tích < 3m² nên dùng cửa lùa hoặc cửa mở ra ngoài. Bản vẽ phải vẽ cung quét cửa và check va chạm với mọi thiết bị." },
        { wrong: "Ghế bàn ăn kéo ra chạm tường/tủ phía sau, không đủ khoảng đứng lên ngồi xuống.", right: "Khoảng từ mép bàn ăn đến tường/tủ phía sau: tối thiểu 800mm (có người đi qua: 1100mm). Vẽ trên mặt bằng kèm ghế kéo ra." },
        { wrong: "Máy giặt/sấy đặt trong tủ kín nhưng không chừa khe thoát nhiệt và mở cửa load đồ.", right: "Máy giặt cửa trước: cần khoảng trước mặt ≥ 600mm để mở cửa. Hai bên chừa 10–15mm thông gió. Phía trên chừa 50mm nếu đặt chồng." },
        { wrong: "Tủ quần áo cánh mở full-height (2.4m): cánh mở ra cấn quạt trần hoặc đèn chùm phía trước.", right: "Kiểm tra trên mặt cắt: cung quét cánh tủ 2.4m khi mở 90° có cấn đèn/quạt trần không? Nếu cấn → chuyển sang cánh lùa." },
        { wrong: "Bồn rửa bát 2 hộc lắp dưới cửa sổ, nhưng vòi nước cao cấn bệ cửa sổ khi bật lên.", right: "Khoảng cách từ mặt đá bếp đến bệ cửa sổ phải ≥ chiều cao vòi nước (thường 300–400mm). Nếu không đủ → dùng vòi gập (fold-down faucet)." },
        { wrong: "Giường ngủ có headboard ốp vải, nhưng khi kê giường vào thì che khuất ổ cắm và công tắc đầu giường.", right: "Vẽ elevation tường đầu giường có giường + headboard. Ổ cắm phải ở vị trí lộ ra 2 bên hoặc cao hơn đỉnh headboard. Check cả chiều dày headboard nhô ra." },
        { wrong: "Tủ TV built-in có ngăn chứa ampli/đầu thu nhưng không có khe thoát nhiệt phía sau → thiết bị quá nóng.", right: "Hộc chứa thiết bị điện tử: chừa khe thông gió phía sau (lỗ Ø60mm hoặc khe rộng 50mm), ván lưng không bít kín. Ghi rõ trong bản vẽ chi tiết." }
      ]
    }
  },
  {
    heading: "7. Hệ thống MEP trên bản vẽ thiết kế",
    content_type: "mistakes",
    metadata: {
      mistakes: [
        { wrong: "Bản vẽ nội thất không đối chiếu bản vẽ điện → ổ cắm bị tủ che khuất, công tắc nằm sau cánh cửa.", right: "SAU KHI chốt layout nội thất → overlay bản vẽ điện lên trên để check: ổ cắm không bị che, công tắc ở phía tay nắm cửa, đèn downlight không nằm trên đỉnh tủ." },
        { wrong: "Thiết kế tủ âm tường nhưng không check MEP trong tường → thi công phát hiện ống nước chạy ngang, phải sửa.", right: "Trước khi vẽ tủ âm/hốc tường/niche, phải check bản vẽ MEP: ống nước, ống gas, dây điện chạy trong tường đó. Request bản vẽ MEP as-built từ nhà thầu." },
        { wrong: "Thiết kế gương LED phòng tắm nhưng không chừa điểm điện (power point) phía sau gương.", right: "Gương LED cần điểm điện 220V phía sau (giấu sau gương). Bản vẽ điện phải có ký hiệu riêng cho điểm điện gương, ghi cao độ tâm gương." },
        { wrong: "Đèn LED dây dưới gầm tủ bếp trên (under-cabinet light): chỉ vẽ trên elevation nhưng không có điểm điện tương ứng.", right: "Mỗi đường LED dây phải có 1 điểm cấp nguồn (driver LED) + 1 công tắc điều khiển. Ghi rõ trong bản vẽ điện: vị trí driver (giấu trong tủ), vị trí công tắc." },
        { wrong: "Vẽ máy rửa bát âm tủ nhưng bản vẽ cấp thoát nước không có điểm cấp nước nóng/lạnh + thoát nước cho máy rửa bát.", right: "Máy rửa bát cần: 1 cấp nước nóng, 1 cấp nước lạnh, 1 thoát nước Ø40mm, 1 ổ cắm 220V. Tất cả phải xuất hiện trên bản vẽ MEP tại đúng vị trí tủ." },
        { wrong: "Quên vẽ đường ống xả cho AC (điều hòa) giấu trần → khi đóng trần mới phát hiện không có đường thoát.", right: "Bản vẽ trần phải phối hợp với bản vẽ HVAC: vị trí dàn lạnh, miệng thổi, miệng hút, đường ống gió, đường ống xả nước ngưng + độ dốc tối thiểu 1%." },
        { wrong: "Thiết kế bếp đảo (kitchen island) có bồn rửa nhưng không tính đường cấp thoát nước đi dưới sàn.", right: "Bồn rửa trên đảo bếp: đường thoát phải âm sàn (đục sàn bê tông nếu chung cư). Check với kết cấu sàn có cho phép không? Nếu không → bỏ bồn rửa khỏi đảo." },
        { wrong: "Thiết kế bồn cầu treo (wall-hung toilet) nhưng tường lắp khung chỉ dày 70mm (tường gạch 10cm) → khung Geberit không vừa.", right: "Khung bồn cầu treo Geberit cần tường giả sâu 120–200mm phía trước tường gạch. Tổng chiều sâu mất thêm 200mm. Phải trừ vào diện tích WC trên mặt bằng." },
        { wrong: "Quạt hút mùi bếp: chỉ vẽ vị trí trên trần nhưng không vẽ đường ống gió ra ngoài → ống gió đi ngoằn ngoèo, hút yếu.", right: "Bản vẽ phải vẽ toàn bộ đường ống gió từ máy hút mùi ra đến louver ngoài trời: kích thước ống, góc cua (tối đa 2 góc 90°), chiều dài tối đa, vị trí louver xả." },
        { wrong: "Smart home: bản vẽ không thể hiện đường dây bus (KNX/Zigbee), vị trí hub trung tâm, điểm đặt AP wifi.", right: "Bản vẽ điện yếu (ELV) phải có layer riêng: đường dây KNX/bus, vị trí gateway, sensor, camera, Access Point wifi (1 AP / 50–70m²). Đi dây âm từ đầu." }
      ]
    }
  },
  {
    heading: "8. Mặt cắt & Chi tiết kỹ thuật (Section Details)",
    content_type: "mistakes",
    metadata: {
      mistakes: [
        { wrong: "Bản vẽ chỉ có mặt bằng + elevation mà thiếu mặt cắt (section) → thợ không biết bên trong cấu tạo thế nào.", right: "Mỗi hạng mục phức tạp (tủ bếp, tủ áo, bục, vách ốp) phải có ít nhất 1 mặt cắt ngang + 1 mặt cắt dọc. Tỷ lệ 1:10 hoặc 1:5 cho detail." },
        { wrong: "Vẽ vách ốp gỗ trên elevation nhưng không vẽ section → không ai biết xương bên trong bằng gì, cách bắt vào tường ra sao.", right: "Section vách ốp phải thể hiện: khung xương (gỗ/thép), cách liên kết với tường (nở sắt/keo), khe thông gió phía sau, chiều dày tổng (ảnh hưởng mặt bằng)." },
        { wrong: "Chi tiết hố trần (cove lighting) chỉ vẽ phác, không ghi kích thước lip che, vị trí LED, khoảng hở → ánh sáng hắt xấu.", right: "Detail hố trần tỷ lệ 1:2 phải ghi: H lip che (40–60mm), khoảng LED đến lip (30–50mm), W khe hở (100–150mm), vị trí profile nhôm LED, loại LED (CRI, CCT, W/m)." },
        { wrong: "Tủ bếp: chỉ vẽ mặt đứng front view → xưởng không biết ngăn kéo hay cánh mở, bên trong chia thế nào.", right: "Tủ bếp cần tối thiểu: front elevation + plan view (nhìn từ trên) + section (cắt ngang). Ghi rõ: ngăn kéo (KK), cánh mở (CM), kệ cố định/di chuyển." },
        { wrong: "Detail lan can cầu thang: chỉ vẽ elevation, không có section → thợ không biết cách gắn trụ vào bậc thang.", right: "Section lan can phải thể hiện: trụ chôn vào bậc bao sâu (min 80mm), loại nở/bu lông, tấm đế (base plate), khoảng cách thanh đứng (≤100mm), tay vịn profile." },
        { wrong: "Thiết kế giật cấp sàn (step-down / step-up) nhưng không có section detail → thợ xây không biết cấu tạo bậc.", right: "Section bậc giật cấp: vật liệu khung (bê tông/thép/gỗ), cao độ bậc, chiều rộng mặt bậc, vật liệu ốp mặt bậc, nẹp mũi bậc (nosing), đèn LED chân bậc (nếu có)." },
        { wrong: "Không có bản vẽ chi tiết cách lắp đặt kính cường lực shower partition → kính lắp sai gioăng, bị rò nước.", right: "Detail kính shower: loại kính (10mm/12mm cường lực), gioăng silicon (U-channel hoặc wall clamp), bản lề (pivot/bản lề sàn), nẹp chặn nước dưới cùng, khe thoát hơi." },
        { wrong: "Vách TV feature wall: chỉ vẽ front view trang trí nhưng không có section → không ai biết TV treo thế nào, dây cáp đi đâu.", right: "Section vách TV: khung xương (cho tường thạch cao), tấm gia cường chịu lực TV (gỗ/thép sau thạch cao), ống luồn HDMI+điện (Ø50mm), hộp chia ổ cắm phía sau TV." },
        { wrong: "Bản vẽ có ghi 'shadow gap 10mm' nhưng không vẽ detail → thợ không hiểu shadow gap là gì, làm thành khe hở thô.", right: "Detail shadow gap tỷ lệ 1:1 hoặc 1:2: rãnh phay sâu bao nhiêu, rộng bao nhiêu, nẹp nhôm chữ L ẩn bên trong hay không, sơn đen bên trong rãnh hay để thô." },
        { wrong: "Cửa lùa âm tường (pocket door): chỉ ghi ký hiệu trên mặt bằng nhưng không có section tường chứa cửa.", right: "Section tường pocket door: chiều dày tường giả (tối thiểu 100mm × 2 + cửa 40mm = 240mm), ray trượt trên, guide dưới, cách xử lý ổ cắm/công tắc trên tường đó." }
      ]
    }
  },
  {
    heading: "9. Kích thước Ergonomic trên bản vẽ",
    content_type: "mistakes",
    metadata: {
      mistakes: [
        { wrong: "Mặt bếp (countertop) vẽ cao 900mm cho tất cả → người thấp 1m55 phải nhón chân khi nấu.", right: "Chiều cao mặt bếp chuẩn theo chiều cao người nấu: (H_người / 2) + 50mm. Người 160cm → 850mm. Bản vẽ phải confirm với gia chủ trước khi chốt." },
        { wrong: "Gương phòng tắm vẽ tâm gương cách sàn 1600mm → người thấp không thấy đỉnh đầu, người cao bị cắt cằm.", right: "Gương lavabo: cạnh dưới cách FFL 1000–1050mm, cạnh trên 1850–1900mm. Gương cao 800–900mm phục vụ đa số chiều cao 1m55–1m80." },
        { wrong: "Kệ treo tường bếp (floating shelf) vẽ cao 1400mm → phụ nữ 1m55 phải với tay mới lấy đồ.", right: "Kệ dùng hàng ngày: cao tối đa tầm với tay (H_người − 300mm). Người 1m55 → kệ ≤ 1250mm. Kệ trưng bày có thể cao hơn." },
        { wrong: "Bàn bar counter built-in cao 1050mm nhưng mua ghế bar cao 650mm → ngồi thò đầu gối, không vừa.", right: "Quy tắc: chênh lệch H_bàn − H_mặt_ghế = 250–300mm. Bar 1050mm → ghế 750–800mm. Bar 900mm → ghế 600–650mm. Check trước khi chốt." },
        { wrong: "Tay vịn cầu thang vẽ cao 800mm cho tất cả → nhà có trẻ em không có tay vịn phụ thấp hơn.", right: "Tay vịn chính: 850–900mm (người lớn). Nhà có trẻ: thêm tay vịn phụ cao 550–650mm. Bản vẽ phải thể hiện cả 2 tay vịn trên section." },
        { wrong: "Bàn làm việc vẽ sâu 500mm nhưng không tính khoảng cách mắt–màn hình → ngồi quá gần màn hình 27'.", right: "Chiều sâu bàn làm việc: màn 24\": bàn sâu ≥ 600mm. Màn 27\": bàn sâu ≥ 700mm. Khoảng mắt–màn hình: 500–700mm tùy kích thước." },
        { wrong: "Quầy reception/lễ tân: mặt quầy cao 1100mm nhưng không có mặt bàn thấp phía trong cho nhân viên ngồi.", right: "Quầy lễ tân 2 level: mặt cao (1050–1100mm, phía khách) + mặt thấp (730–750mm, phía nhân viên ngồi). Section phải thể hiện rõ 2 level." },
        { wrong: "Công tắc đèn vẽ ở cao 1300mm nhưng nhà có người khuyết tật dùng xe lăn → không với tới.", right: "Tiêu chuẩn accessible design: công tắc 900–1100mm, ổ cắm 400–500mm (thay vì 300mm thông thường). Cần confirm với gia chủ về nhu cầu đặc biệt." },
        { wrong: "Không ghi chiều cao đặt TV trên bản vẽ → thợ treo theo cảm tính, xem TV bị ngửa cổ.", right: "TV phòng khách (ngồi sofa): tâm TV cách FFL 1000–1100mm. TV phòng ngủ (nằm): tâm TV cách FFL 900–1000mm. Ghi rõ cao độ tâm TV trên elevation." },
        { wrong: "Bệ cửa sổ (window sill) vẽ thấp 600mm nhưng phòng ở tầng cao chung cư → không an toàn theo quy chuẩn.", right: "Quy chuẩn TCVN: bệ cửa sổ tầng cao phải ≥ 900mm từ FFL, hoặc có lan can bảo vệ cao ≥ 900mm. Bản vẽ phải check với kiến trúc." }
      ]
    }
  },
  {
    heading: "10. Ghi chú & Quy cách bản vẽ (Drawing Notes)",
    content_type: "mistakes",
    metadata: {
      mistakes: [
        { wrong: "Bản vẽ không có bảng vật tư (material schedule) → thợ và chủ đầu tư không biết dùng vật liệu gì ở đâu.", right: "Mỗi bộ bản vẽ phải kèm Material Schedule: mã vật tư, tên, brand, mã màu/mã hàng, vị trí sử dụng, số lượng ước tính. Đây là tài liệu bắt buộc." },
        { wrong: "Ghi kích thước mập mờ: '~2400mm', 'khoảng 600mm' → thợ hiểu sai, cắt sai.", right: "Mọi kích thước trên bản vẽ phải là con số chính xác đến mm. Nếu là kích thước tham khảo (không bắt buộc) → đặt trong ngoặc vuông [2400]." },
        { wrong: "Không có ký hiệu mặt cắt (section mark) trên mặt bằng → người đọc không biết section cắt ở đâu, hướng nhìn nào.", right: "Mỗi section phải có ký hiệu cắt trên mặt bằng (mũi tên + mã section: A-A, B-B...) và ghi rõ trên bản vẽ section tương ứng." },
        { wrong: "Bản vẽ dùng nhiều tỷ lệ khác nhau nhưng không ghi tỷ lệ từng view → đo trên bản vẽ ra sai.", right: "TỪNG view phải ghi tỷ lệ (1:50, 1:20, 1:10, 1:5). Nếu print bản vẽ không đúng tỷ lệ → ghi note: 'DO NOT SCALE - chỉ dùng kích thước ghi trên bản vẽ'." },
        { wrong: "Layer bản vẽ lộn xộn: nội thất, điện, nước, kết cấu trộn lẫn trên 1 layer → không thể tắt/bật để kiểm tra.", right: "Hệ thống layer chuẩn: ID-FURNITURE, ID-FINISHES, EL-POWER, EL-LIGHTING, PL-SUPPLY, PL-DRAIN, AC-HVAC. Mỗi bộ phận filter được layer riêng." },
        { wrong: "Bản vẽ chi tiết không có revision history → không ai biết bản mới nhất là bản nào, thợ dùng bản cũ thi công.", right: "Mỗi bản vẽ phải có khung revision (Rev A, B, C...) ghi: ngày sửa, nội dung sửa, người sửa. Issue bản mới phải thu hồi bản cũ bằng watermark 'SUPERSEDED'." },
        { wrong: "Ghi chú vật liệu chỉ ghi chung chung: 'gỗ công nghiệp', 'gạch ốp', 'đá nhân tạo' → thợ mua sai chủng loại.", right: "Ghi chú vật liệu phải cụ thể: 'MDF lõi xanh chống ẩm 18mm An Cường mã AC-xxxx, phủ Melamine 2 mặt, dán cạnh PVC 1mm'. Càng chi tiết càng ít tranh chấp." },
        { wrong: "Bản vẽ thi công vẫn dùng block furniture từ thư viện (bàn ghế generic) → kích thước thực tế khác.", right: "Bản vẽ thi công phải dùng kích thước THẬT của sản phẩm đã chọn (lấy từ catalog/datasheet nhà sản xuất). Block thư viện chỉ dùng cho giai đoạn concept." },
        { wrong: "Không có bản vẽ tổng hợp clash detection (kiểm tra xung đột) giữa nội thất, MEP, và kiến trúc.", right: "Trước khi xuất bản vẽ thi công: overlay tất cả layer (nội thất + điện + nước + HVAC + kiến trúc) lên cùng 1 mặt bằng để phát hiện xung đột (clash)." },
        { wrong: "Bản vẽ shop drawing từ xưởng gỗ gửi về nhưng designer không review lại → xưởng hiểu sai ý, sản xuất lỗi.", right: "Shop drawing từ xưởng/nhà thầu phải được designer REVIEW và ký duyệt (stamp 'Approved' / 'Approved with comments' / 'Revise & Resubmit') trước khi sản xuất." }
      ]
    }
  },
  {
    heading: "11. Bản vẽ ánh sáng (Lighting Design)",
    content_type: "mistakes",
    metadata: {
      mistakes: [
        { wrong: "Downlight bố trí đều kiểu 'lưới ô bàn cờ' không theo layout nội thất → đèn rọi vào đỉnh tủ, khoảng trống giữa phòng lại tối.", right: "Đèn phải bố trí theo layout nội thất: đèn task rọi vào mặt bếp/bàn làm việc, đèn accent rọi vào vách feature, đèn general ở lối đi. Vẽ lighting plan SAU khi chốt furniture plan." },
        { wrong: "Chỉ vẽ vị trí đèn trên ceiling plan mà không ghi spec đèn: công suất, CCT, CRI, beam angle.", right: "Bản vẽ đèn phải kèm Lighting Schedule: mã đèn, brand, công suất (W), nhiệt độ màu (3000K/4000K), CRI (≥90 cho nội thất), góc chiếu (15°/24°/36°/60°)." },
        { wrong: "LED dây (strip) ghi chung '3000K warm white' → mua đèn brand khác nhau, cùng 3000K nhưng màu khác nhau do dung sai.", right: "LED dây phải cùng 1 brand, cùng 1 lot/batch để đảm bảo đồng đều màu. Ghi rõ brand, mã SKU, bin code (nếu có). Mua dư 10% cùng lot để thay thế sau này." },
        { wrong: "Đèn spotlight track/nam châm: bản vẽ chỉ ghi vị trí ray nhưng không ghi vị trí từng đèn trên ray → thợ gắn tùy hứng.", right: "Bản vẽ lighting phải ghi: vị trí ray, vị trí từng đầu đèn trên ray (cách đầu ray bao nhiêu mm), hướng chiếu (rọi vào vật thể nào), góc nghiêng." },
        { wrong: "Đèn thả bàn ăn: chỉ ghi vị trí trên ceiling plan, không ghi chiều dài dây treo → đèn treo quá cao hoặc quá thấp.", right: "Bản vẽ phải ghi: cao độ đáy đèn thả cách FFL (thường 750–850mm trên mặt bàn ăn). Chiều dài dây treo = H_trần − H_đáy_đèn. Ghi rõ trên section." },
        { wrong: "Profile nhôm cho LED dây (aluminum channel): chỉ ghi 'profile nhôm' không ghi loại → thợ dùng profile không có mica tản sáng, lộ chấm LED.", right: "Ghi rõ: profile nhôm loại nào (âm trần/nổi/góc), có mica tản sáng (frosted diffuser) hay không, kích thước (W×H), cách lắp (vít/keo/kẹp)." },
        { wrong: "Đèn hắt gầm tủ bếp (under-cabinet): không vẽ vị trí chính xác trên section → đèn đặt quá sát cạnh trước, chói mắt người đứng.", right: "Đèn gầm tủ nên đặt lùi vào 2/3 chiều sâu tủ trên (cách cạnh trước 100–120mm) để ánh sáng rọi xuống mặt bếp mà không chói mắt. Vẽ trên section." },
        { wrong: "Không tính tổng công suất LED trên 1 mạch driver → driver quá tải, đèn nhấp nháy hoặc cháy driver.", right: "Tổng W LED trên 1 driver ≤ 80% công suất driver. LED 14W/m × 5m = 70W → driver phải ≥ 88W. Ghi driver spec và sơ đồ mạch trên bản vẽ điện." },
        { wrong: "Bản vẽ có 15 loại đèn khác nhau (quá nhiều model) → khó mua, khó bảo trì, chênh lệch màu sắc ánh sáng.", right: "Giới hạn tối đa 5–7 loại đèn cho 1 căn hộ. Tối ưu: 1 loại downlight, 1 loại spotlight, 1 loại LED dây, 1–2 loại đèn trang trí. Ít loại = dễ quản lý, đồng bộ." },
        { wrong: "Không có bản vẽ sơ đồ mạch đèn (lighting circuit diagram): đèn nào thuộc công tắc nào, dimmer nào.", right: "Lighting circuit diagram bắt buộc: nhóm đèn theo công tắc (Switch Group 1, 2, 3...), đèn nào nối dimmer, đèn nào nối sensor. Đây là tài liệu cho thợ điện đấu nối." }
      ]
    }
  },
  {
    heading: "12. Checklist trước khi xuất bản vẽ thi công",
    content_type: "mistakes",
    metadata: {
      mistakes: [
        { wrong: "Xuất bản vẽ thi công mà chưa check kích thước phủ bì tất cả các tủ có vừa thang máy/cửa nhà không.", right: "Check list: kích thước tủ lớn nhất (WxHxD phủ bì) so với kích thước thang máy, cửa chính, cầu thang. Nếu không vừa → chia tủ thành module lắp ghép tại công trình." },
        { wrong: "Bản vẽ ghi kích thước phòng từ bản vẽ kiến trúc (thiết kế) nhưng không đo thực tế (as-built) → sai 20–50mm.", right: "TRƯỚC KHI vẽ chi tiết thi công, phải đo thực tế công trình (site measurement). So sánh với bản vẽ kiến trúc. Ghi chú sai lệch trên bản vẽ." },
        { wrong: "Không check cửa sổ, dầm, cột, hộp kỹ thuật nhô ra trên bản vẽ → tủ đóng xong bị cấn dầm, không lắp được.", right: "Site survey phải đo: dầm nhô (vị trí, kích thước), cột nhô, hộp kỹ thuật, ống nước nổi, bậu cửa sổ. Tất cả phải vẽ lên mặt bằng và elevation." },
        { wrong: "Bản vẽ chỉ ghi 1 kích thước tổng (ví dụ: tủ dài 3000mm) nhưng không ghi kích thước phân chia bên trong.", right: "Bản vẽ thi công phải có dimension chain (chuỗi kích thước): kích thước tổng = tổng các kích thước thành phần. Chuỗi kích thước phải 'đóng' (tổng khớp)." },
        { wrong: "Elevation tủ bếp không vẽ vị trí ổ cắm, công tắc đèn, điểm cấp nước → thi công xong mới phát hiện ổ cắm bị tủ che.", right: "Elevation tủ bếp phải overlay lên bản vẽ MEP: vẽ ổ cắm (ký hiệu tam giác), van nước (ký hiệu), điểm ga, điểm thoát. Kiểm tra không bị che bởi tủ." },
        { wrong: "Quên check chiều mở cánh cửa phòng có cấn nội thất bên trong không (tủ giày, bàn console...).", right: "Trên mặt bằng: vẽ cung quét cửa (door swing arc) 90°. Nội thất không được nằm trong vùng quét. Nếu cấn → đổi hướng mở hoặc dùng cửa lùa." },
        { wrong: "Bản vẽ sử dụng font chữ, line weight, hatch pattern không nhất quán → bản vẽ lộn xộn, khó đọc.", right: "Áp dụng CAD Standard: font chữ 1 loại (Arial/Helvetica), line weight theo lớp (tường dày, nội thất mỏng, dim mảnh), hatch theo vật liệu (gỗ, gạch, đá, bê tông)." },
        { wrong: "Không có bản vẽ 3D perspective kèm theo cho khách hàng → khách đọc bản vẽ 2D không hiểu, duyệt xong kêu sai.", right: "Kèm bản vẽ 2D là 3D render hoặc axonometric view cho mỗi phòng chính. Khách ký duyệt trên cả 2D và 3D để tránh tranh chấp 'tôi không nghĩ nó trông thế này'." },
        { wrong: "Xuất bản vẽ thi công dạng PDF nhưng xưởng cần file CAD (DWG) để chuyển sang CNC → phải vẽ lại.", right: "Hỏi xưởng/nhà thầu cần file format gì TRƯỚC khi vẽ: DWG cho xưởng CNC, PDF cho giám sát, SKP/3DM cho 3D detailing. Xuất đúng format, đúng tỷ lệ." },
        { wrong: "Bản vẽ thi công không có trang bìa (cover page) ghi: tên dự án, địa chỉ, tên khách hàng, revision, danh sách bản vẽ.", right: "Cover page + Drawing Index là trang đầu tiên bắt buộc: liệt kê tất cả bản vẽ trong bộ (A-01 Mặt bằng, A-02 Trần, E-01 Điện...), revision hiện tại, ngày phát hành, người duyệt." }
      ]
    }
  }
];

async function seedDesignMistakes() {
  console.log('=== SEEDING 120 DESIGN-FOCUSED MISTAKES (2.5) ===');

  const { data: mod } = await sb.from('training_modules').select('id').eq('slug', 'design-knowledge').single();
  if (!mod) { console.log('Module 2 not found'); return; }

  const { data: section } = await sb.from('training_sections')
    .select('id').eq('module_id', mod.id).eq('number', '2.5').single();
  if (!section) { console.log('Section 2.5 not found'); return; }

  await sb.from('training_subsections').delete().eq('section_id', section.id);

  let order = 1;
  for (const block of DESIGN_MISTAKES) {
    await sb.from('training_subsections').insert({
      section_id: section.id,
      heading: block.heading,
      content_type: block.content_type,
      metadata: block.metadata,
      sort_order: order
    });
    console.log(`Inserted block ${order}: ${block.heading} (${block.metadata.mistakes.length} mistakes)`);
    order++;
  }

  // Update section title + lead
  await sb.from('training_sections').update({
    title: 'Lỗi thường gặp trên bản vẽ',
    content: 'Lỗi sai không phải để xấu hổ — để cả team không lặp lại. Focus vào những gì Designer PHẢI tính trên bản vẽ trước khi ra thi công.'
  }).eq('id', section.id);

  console.log('✅ Done! 120 design-focused mistakes seeded.');
}

seedDesignMistakes();
