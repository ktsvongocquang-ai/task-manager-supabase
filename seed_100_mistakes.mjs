import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

const MISTAKES_100 = [
  {
    heading: "1. PHÒNG KHÁCH (Living Room)",
    content_type: "mistakes",
    metadata: {
      mistakes: [
        { wrong: "Chọn sofa quá khổ làm lối đi hẹp, hoặc quá nhỏ lọt thỏm giữa không gian.", right: "Đo đạc kỹ tỷ lệ. Khoảng cách từ sofa đến TV tối thiểu 2.5m - 3m tùy kích thước màn hình. Chừa lối đi tối thiểu 800mm." },
        { wrong: "Treo TV quá cao so với tầm mắt người ngồi sofa.", right: "Tâm màn hình TV nên ở độ cao khoảng 1m - 1.1m so với mặt sàn." },
        { wrong: "Bố trí đèn downlight rọi thẳng xuống vị trí ngồi sofa gây chói mắt.", right: "Downlight nên rọi vào tranh tường, bàn trà, hoặc dùng đèn hắt trần, đèn sàn (floor lamp) tạo ánh sáng gián tiếp." },
        { wrong: "Rèm cửa treo quá thấp (chỉ vừa che khung cửa) làm trần có cảm giác thấp.", right: "Treo thanh rèm sát trần (cao nhất có thể) và để rèm rủ xuống sát sàn để tạo cảm giác không gian cao và sang trọng." },
        { wrong: "Mua thảm quá nhỏ chỉ lọt thỏm dưới bàn trà.", right: "Thảm phải đủ lớn để ít nhất 2 chân trước của sofa và ghế bành đè lên được." },
        { wrong: "Bỏ qua vị trí ổ cắm sàn cho bàn trà hoặc sofa điện.", right: "Quy hoạch ổ cắm âm sàn từ đầu nếu có dự định xài sofa điện hoặc đèn bàn cạnh sofa giữa nhà." },
        { wrong: "Nhồi nhét quá nhiều vật liệu đắt tiền (đá, gỗ vân to, inox vàng) vào một vách TV.", right: "Áp dụng nguyên tắc 'Quiet Luxury': 1 điểm nhấn (Accent), còn lại là nền (Base). Không để các vật liệu 'đánh nhau'." },
        { wrong: "Không tính toán góc mở của cửa chính, khi mở cửa đập vào tủ giày/sofa.", right: "Luôn chừa khoảng không quét cửa (door sweep) tối thiểu 90 độ, dùng chặn cửa (door stopper)." },
        { wrong: "Bố trí quạt trần ngay dưới đèn downlight/đèn chùm.", right: "Quạt quay sẽ cắt ánh sáng gây hiện tượng chớp nháy (strobe effect) rất nhức mắt. Tách biệt tâm đèn và tâm quạt." },
        { wrong: "Quên đi hố rèm / máng rèm che thanh ray.", right: "Đóng trần thạch cao phòng khách phải chừa hố rèm sâu 150-200mm, rộng 200-250mm (nếu rèm 2 lớp) để giấu thanh ray và motor." }
      ]
    }
  },
  {
    heading: "2. KHÔNG GIAN BẾP (Kitchen)",
    content_type: "mistakes",
    metadata: {
      mistakes: [
        { wrong: "Bếp nấu và chậu rửa nằm sát cạnh nhau.", right: "Tuân thủ 'Tam giác bếp' (Bếp - Chậu - Tủ lạnh). Phải có khoảng bàn soạn (prep zone) tối thiểu 600mm giữa Bếp và Chậu." },
        { wrong: "Chiều cao mặt bếp không phù hợp với chiều cao người nấu chính.", right: "Chiều cao chuẩn thường là 810mm - 860mm. Tính bằng công thức: (Chiều cao người nấu / 2) + 50mm." },
        { wrong: "Lắp máy hút mùi quá cao (>800mm) hoặc quá thấp (<600mm).", right: "Khoảng cách tiêu chuẩn từ mặt bếp lên máy hút mùi là 650mm - 750mm. Hút mùi nghiêng có thể thấp hơn." },
        { wrong: "Quên chừa khe tản nhiệt cho tủ lạnh âm hoặc lò nướng âm tủ.", right: "Thiết bị âm tủ tỏa nhiệt nhiều, cần có lưới tản nhiệt ở len chân và hở phía sau/trên tủ để đối lưu không khí." },
        { wrong: "Dùng đá Marble sáng màu (trắng Ý, Volakas) làm mặt bếp.", right: "Đá Marble dễ bị ố (nghệ, rượu, chanh) và trầy. Khuyên dùng đá thạch anh nhân tạo (Vicostone) hoặc Granite tự nhiên." },
        { wrong: "Không có ổ cắm dự phòng ở khu vực bàn bếp / đảo bếp.", right: "Cần nhiều ổ cắm (có nắp che chống nước) cho máy xay, nồi chiên, máy pha cafe... Thiết kế ổ cắm pop-up ở đảo bếp." },
        { wrong: "Ngăn kéo đựng xoong nồi quá rộng (>900mm) nhưng dùng ray trượt thường.", right: "Ngăn kéo lớn chứa đồ nặng bắt buộc dùng ray hộp (Tandembox) chịu tải 30-50kg để chống xệ và rớt bi." },
        { wrong: "Tủ bếp trên sát trần mở cánh bị cấn đèn downlight mâm nổi.", right: "Dùng downlight âm trần siêu mỏng hoặc tính toán khoảng cách mở cánh tủ không cấn mặt viền đèn." },
        { wrong: "Sàn bếp dùng vật liệu trơn trượt hoặc sàn gỗ công nghiệp chịu nước kém.", right: "Bếp dễ văng nước/dầu mỡ. Nên dùng gạch porcelain nhám nhẹ hoặc sàn hèm khóa SPC/nhựa giả gỗ." },
        { wrong: "Quên đường nước cấp/thoát cho máy rửa chén, tủ lạnh lấy nước đá ngoài.", right: "Phải khảo sát và thi công MEP chuẩn xác: cấp nước, thoát nước riêng và ổ cắm công suất lớn." }
      ]
    }
  },
  {
    heading: "3. PHÒNG NGỦ MASTER (Master Bedroom)",
    content_type: "mistakes",
    metadata: {
      mistakes: [
        { wrong: "Bố trí đèn downlight rọi thẳng vào mặt người nằm ngủ.", right: "Đèn phòng ngủ không rọi vào giường. Dùng ánh sáng hắt, đèn tường, hoặc bố trí downlight lệch về phía cuối chân giường." },
        { wrong: "Quên công tắc đảo chiều (2-way) ở táp đầu giường.", right: "Bắt buộc có công tắc đảo chiều để tắt đèn tổng từ trên giường mà không cần bước ra cửa." },
        { wrong: "Giường ngủ có hộc kéo nhưng đặt sát tủ quần áo cánh mở.", right: "Đo đạc khoảng cách mở cánh tủ, nếu hẹp quá thì không xài hộc kéo bên đó hoặc đổi tủ sang cánh lùa." },
        { wrong: "Lắp máy lạnh thổi thẳng vào đầu hoặc người nằm trên giường.", right: "Gió lạnh phả trực tiếp gây khô họng, viêm xoang. Vị trí máy lạnh tốt nhất là thổi ngang qua thân người (từ 2 bên hông giường)." },
        { wrong: "Giường ngủ che khuất một phần ổ cắm táp / công tắc đèn.", right: "Kích thước nệm + khung giường thay đổi so với bản vẽ CAD ban đầu. Phải lấy kích thước nệm chuẩn (1m8x2m) + phủ bì khung để chốt vị trí ổ cắm." },
        { wrong: "Thiếu rèm cản sáng 100% (blackout) cho người khó ngủ.", right: "Phòng ngủ Master nên xài rèm 2 lớp: rèm voan (lọc sáng ban ngày) và rèm vải blackout (cản sáng tuyệt đối ban đêm)." },
        { wrong: "Tivi treo quá cao khi xem từ tư thế nằm.", right: "Cao độ TV phòng ngủ phải thấp hơn phòng khách. Cạnh dưới TV thường cách sàn 700mm - 800mm." },
        { wrong: "Chọn nệm lò xo quá dày (30-40cm) nhưng làm đầu giường (headboard) thấp.", right: "Chiều cao nệm ảnh hưởng đến tỷ lệ vách đầu giường. Nệm dày thì tap đầu giường và ốp vách phải chỉnh cao lên tương ứng." },
        { wrong: "Thiếu đèn đọc sách cá nhân (reading lamp) có góc chiếu hẹp.", right: "Người đọc sách sẽ làm phiền người bên cạnh nếu bật đèn tổng. Cần đèn đọc sách xoay hướng, góc chiếu 15-30 độ." },
        { wrong: "Bố trí gương bàn trang điểm chiếu thẳng vào giường ngủ.", right: "Theo phong thủy và tâm lý, gương chiếu thẳng giường gây giật mình/khó ngủ. Nên đặt lệch hoặc dùng gương gấp gọn." }
      ]
    }
  },
  {
    heading: "4. PHÒNG TẮM & VỆ SINH (Bathroom & WC)",
    content_type: "mistakes",
    metadata: {
      mistakes: [
        { wrong: "Tủ Lavabo dùng gỗ MDF chống ẩm (cốt xanh).", right: "MDF chỉ chống ẩm không chống nước. Môi trường WC phải dùng vật liệu kháng nước 100% (nhựa Picomat, WPC) hoặc bọc khung Inox." },
        { wrong: "Lát gạch nền không đủ độ dốc (hoặc dốc ngược) về phễu thu sàn.", right: "Sàn WC phải dốc 1%-2% về phễu thu. Thợ ốp lát phải đánh thăng bằng và test đọng nước trước khi bàn giao." },
        { wrong: "Dùng gạch ốp tường bóng kính mang xuống lát nền.", right: "Gạch lát nền WC bắt buộc phải là loại có bề mặt nhám (matt) chống trơn trượt R9-R10 để đảm bảo an toàn." },
        { wrong: "Không phân cấp (giật cấp hoặc làm gờ cản nước) giữa khu khô và khu ướt.", right: "Sàn khu vực tắm vòi sen (khu ướt) phải thấp hơn khu vực bồn cầu/lavabo (khu khô) từ 1.5 - 2cm để nước không tràn ra ngoài." },
        { wrong: "Gương Lavabo không có sấy kính, dễ bị mờ khi tắm nước nóng.", right: "Nên tích hợp chức năng sấy kính (defogger) trên gương LED ở các phòng tắm cao cấp." },
        { wrong: "Ống thoát nước lavabo đi đâm thẳng xuống sàn gây vướng víu dọn dẹp.", right: "Sử dụng ống xả chữ P đi vào tường (âm tường) để giải phóng không gian dưới tủ lavabo, dễ lau chùi và thẩm mỹ hơn." },
        { wrong: "Quên ổ cắm có nắp che chống nước cho bồn cầu thông minh, máy sấy tóc.", right: "Cần bố trí ít nhất 2 ổ cắm chuẩn IP44/IP55 (1 cạnh bồn cầu, 1 cạnh gương lavabo)." },
        { wrong: "Quạt hút thông gió quá yếu, hút không ra ngoài mà đẩy ngược lên trần thạch cao.", right: "Quạt hút phải nối ống mềm đưa ra hộp kỹ thuật hoặc louver ngoài trời, không xả luẩn quẩn trong trần giả gây mốc." },
        { wrong: "Lắp thanh vắt khăn tắm (towel rack) ở vị trí với không tới từ buồng tắm kính.", right: "Vị trí đặt khăn phải thuận tay mở cửa buồng tắm kính là lấy được ngay, không để nước nhỏ giọt ra sàn khu khô." },
        { wrong: "Ron gạch lát nền bằng xi măng trắng dễ ố vàng dính bẩn.", right: "Nên dùng keo chà ron epoxy (chống thấm, chống bám bẩn) cho khu vực ướt thay vì xi măng trắng." }
      ]
    }
  },
  {
    heading: "5. PHÒNG TRẺ EM (Kids Room)",
    content_type: "mistakes",
    metadata: {
      mistakes: [
        { wrong: "Sử dụng cạnh bàn, cạnh tủ nhọn, sắc bén ở cao độ từ 500-1000mm.", right: "Bo tròn (chamfer / fillet) mọi góc cạnh đồ nội thất. Hạn chế tay nắm tủ lồi ra ngoài, nên dùng tay nắm vát/âm (finger pull)." },
        { wrong: "Lắp đặt tủ sách, tủ quần áo cao, hẹp nhưng không bắt vít cố định vào tường.", right: "Nguy cơ lật tủ khi trẻ đu bám rất nguy hiểm. Bắt buộc neo đỉnh đồ gỗ (anti-tip brackets) vào tường gạch/bê tông." },
        { wrong: "Sơn tường phòng trẻ bằng các loại sơn rẻ tiền chứa VOC cao.", right: "Hô hấp của trẻ rất nhạy cảm. Phải dùng sơn sinh thái, sơn không mùi, chuẩn Zero-VOC (như Dulux EasyClean, Jotun Majestic)." },
        { wrong: "Bàn học gắn liền / dính cứng vào giường theo kiểu combo không thể tháo rời.", right: "Trẻ lớn rất nhanh (thể chất & tâm sinh lý). Nội thất trẻ em (đặc biệt bàn ghế) nên mua loại loose-furniture có thể nâng hạ chiều cao hoặc dễ thay thế." },
        { wrong: "Sử dụng quá nhiều màu sắc sặc sỡ (xanh, đỏ, vàng rực) trên các mảng lớn.", right: "Nhiều màu rực rỡ gây phấn khích quá mức, khó ngủ. Nên dùng màu Pastel làm nền (tường, tủ áo), màu nhấn rực rỡ chỉ để ở đồ chơi, gối nệm." },
        { wrong: "Cửa sổ phòng trẻ không có song chắn an toàn hoặc lưới an toàn ban công.", right: "Safety First. Chung cư/nhà phố bắt buộc có cáp an toàn (invisible grille) hoặc song bảo vệ cửa sổ để tránh té ngã." },
        { wrong: "Ổ cắm điện đặt quá thấp, vừa tầm tay trẻ bò/đi chập chững.", right: "Sử dụng ổ cắm có màn che an toàn (child-safe sockets), hoặc dùng nắp bịt nhựa. Đặt cao hơn tầm với nếu được." },
        { wrong: "Thiết kế giường tầng nhưng rào chắn tầng 2 quá thấp (<200mm sau khi để nệm).", right: "Rào chắn (guardrail) phải cao ít nhất 300-400mm tính từ mặt ĐỈNH NỆM. Phải tính trước độ dày của nệm khi làm rào." },
        { wrong: "Bố trí bàn học ở góc khuất sáng tự nhiên hoặc quay lưng lại cửa phòng.", right: "Bàn học cần ánh sáng tự nhiên (vuông góc hoặc từ bên trái sang với người thuận tay phải). Vị trí quay lưng cửa tạo cảm giác bất an." },
        { wrong: "Dùng sàn gạch bóng kính lạnh lẽo và trơn trượt.", right: "Phòng trẻ em (nơi bé hay ngồi bò chơi) nên dùng sàn gỗ (ấm áp) trải thảm mềm hoặc thảm xốp ghép (dễ vệ sinh)." }
      ]
    }
  },
  {
    heading: "6. TỦ ÁO & PHÒNG THAY ĐỒ (Walk-in Closet)",
    content_type: "mistakes",
    metadata: {
      mistakes: [
        { wrong: "Chia ngăn treo quần áo quá thấp, treo đầm váy bị quệt sát mặt ván.", right: "Khoang treo áo sơ mi/quần gập cần cao 900-1000mm. Khoang treo váy dài/coat cần 1400-1500mm." },
        { wrong: "Làm khoang treo đồ quá sâu (sâu >650mm) hoặc quá nông (sâu <550mm).", right: "Chiều sâu phủ bì tủ áo chuẩn là 600mm. Nếu sâu hơn sẽ khó lấy đồ, nếu nông hơn (500mm) khi đóng cửa sẽ kẹt vai áo." },
        { wrong: "Tủ cánh kính dùng led dây dán lộ bóng chói mắt lởm chởm.", right: "Sử dụng thanh nhôm profile có nắp mica tản sáng, rãnh phay âm vào thành ván. Ánh sáng mịn, không lộ chấm mắt led." },
        { wrong: "Thiết kế ngăn kéo tủ áo sát nền nhà (cao độ 0).", right: "Ngăn kéo nên bắt đầu từ cao độ 300-400mm trở lên để không phải cúi gập lưng sát đất lấy đồ. Phía dưới cùng để giày/giỏ xách." },
        { wrong: "Làm cửa lùa nhưng không xài ray giảm chấn, kéo trượt sầm sập.", right: "Tủ áo cửa lùa bắt buộc dùng ray trượt có tính năng giảm chấn (soft-close) ở cả chiều đóng và mở để chống kẹt tay và tiếng ồn." },
        { wrong: "Dùng ván đợt tủ (kệ để đồ gấp) rộng >900mm mà không có vách đỡ giữa.", right: "Ván MDF dày 18mm để nặng thời gian dài (900-1000mm) sẽ bị võng. Nếu rộng hơn 800mm, tăng độ dày ván lên 25mm hoặc thêm vách ngăn." },
        { wrong: "Phòng thay đồ (Walk-in Closet) không có cửa sổ thông gió nhưng không làm quạt hút.", right: "Quần áo ẩm, giày da, túi xách trong phòng kín sẽ sinh mùi ẩm mốc. Bắt buộc có hệ thống thông gió hoặc máy hút ẩm." },
        { wrong: "Bố trí đèn chiếu sáng phòng thay đồ trên trần nằm NGAY TRÊN đỉnh tủ.", right: "Đèn downlight phải nằm ở lối đi (cách mặt tủ 400-500mm) để chiếu vào mặt cửa tủ/quần áo. Nếu chiếu trên đỉnh tủ, lưng người sẽ che khuất sáng khi tìm đồ." },
        { wrong: "Không phân bổ chỗ để vali (hành lý) hoặc chăn mền mùa đông.", right: "Tủ áo kịch trần (cao 2.8m - 3m) cần khoang sát trần (cao 400-500mm) không vướng thanh treo để nhét vừa vali size lớn." },
        { wrong: "Sử dụng kính trong suốt (clear glass) cho tủ quần áo bừa bộn.", right: "Kính trong chỉ đẹp khi đồ đạc treo thưa, chia theo tone màu như store. Thực tế nên dùng kính xám khói, kính sọc (fluted glass) để che bớt khuyết điểm." }
      ]
    }
  },
  {
    heading: "7. SÀN, TRẦN & TƯỜNG (Hoàn thiện kiến trúc)",
    content_type: "mistakes",
    metadata: {
      mistakes: [
        { wrong: "Cắt ron (mạch gạch) không chuẩn xác, ron to nhỏ không đều, cắt gạch lem nhem ở góc.", right: "Yêu cầu thợ ốp lát dùng ke chữ thập/ke cân bằng. Ốp gạch phải căn roong chẵn ở cửa/vị trí đập vào mắt, dồn viên gạch cắt vào góc khuất." },
        { wrong: "Giao cắt vật liệu sàn (gỗ và gạch) bị chênh cốt (cao thấp không đều).", right: "Phải chốt cao độ hoàn thiện của gạch và gỗ ngay từ lúc cán nền. Gỗ 12mm + xốp 2mm = gạch 10mm + hồ dầu 4mm để mặt sàn phẳng lỳ." },
        { wrong: "Đóng trần thạch cao che mất hệ thống PCCC, đầu báo khói, sprinkler.", right: "Quy định an toàn PCCC chung cư: đầu phun nước, báo khói phải được dời xuống mặt trần thạch cao mới, không được giấu." },
        { wrong: "Thiết kế hố trần giật cấp quá nông nhưng dùng led dây kích thước lớn.", right: "Khe hắt sáng (cove lighting) hố trần cần hở tối thiểu 100-150mm để ánh sáng tản đều, giấu được dải led, tránh hắt vệt cục bộ." },
        { wrong: "Tường tô trát bị gợn sóng, lồi lõm nhưng sơn bóng (gloss).", right: "Sơn bóng/bán bóng sẽ phơi bày mọi khuyết điểm lồi lõm của tường. Nếu tường không phẳng lỳ, an toàn nhất là dùng sơn mờ (matt)." },
        { wrong: "Làm vách CNC / lam gỗ chạm trần nhưng không gia cố xương thép bên trong.", right: "Hệ lam dài >2.5m bằng MDF/Gỗ tự nhiên không có cốt thép gia cường theo thời gian sẽ bị cong võng chữ C." },
        { wrong: "Bỏ qua len chân tường (skirting) mà không chạy roong âm (shadow line).", right: "Bỏ len nổi phải thay bằng khe âm chân tường (shadow gap) hoặc len nhôm âm. Cây lau nhà sẽ làm bẩn, bong tróc mép tường sơn nếu không có len chặn." },
        { wrong: "Dán giấy dán tường khu vực dễ ẩm mốc (tường giáp WC, tường ngoại thất).", right: "Giấy dán tường sẽ bong tróc, mốc đen. Các mảng tường có rủi ro thấm ẩm phải xử lý chống thấm ngược trước, ưu tiên ốp vách gỗ nhựa, ốp đá." },
        { wrong: "Dùng vách ngăn thạch cao thường (không chống ẩm) cho tường WC / phòng bếp.", right: "Khu vực ẩm ướt, bắt buộc dùng tấm thạch cao lõi xanh (chống ẩm) hoặc tấm xi măng Duraflex, Aquapanel." },
        { wrong: "Ron sàn gỗ công nghiệp đi đâm vuông góc thẳng vào giữa cửa sổ lấy sáng.", right: "Cách lát sàn gỗ chuẩn thẩm mỹ: Chiều dài thanh gỗ đi theo chiều ánh sáng từ cửa sổ chính dội vào để tạo cảm giác không gian dài và ít thấy vết nối." }
      ]
    }
  },
  {
    heading: "8. HỆ THỐNG ÁNH SÁNG (Lighting)",
    content_type: "mistakes",
    metadata: {
      mistakes: [
        { wrong: "Quá lạm dụng downlight rải đều khắp nhà dạng 'sao sa'.", right: "Thiết kế chiếu sáng lớp (Layered lighting). Kết hợp General lighting (sáng chung), Task lighting (sáng công năng - bếp, đọc sách), Accent lighting (nhấn tranh, kệ)." },
        { wrong: "Chọn đèn LED có CRI (Chỉ số hoàn màu) thấp < 80.", right: "CRI thấp làm đồ nội thất, màu da bị nhợt nhạt. Đèn nội thất cao cấp nên có CRI > 90 (như đèn ray nam châm, đèn spotlight chuẩn)." },
        { wrong: "Sử dụng ánh sáng nhiệt độ màu (CCT) lộn xộn trong cùng một phòng.", right: "Mix đèn 6000K (trắng xanh) và 3000K (vàng ệch) xen kẽ tạo cảm giác rẻ tiền. Giữ nhất quán 1 dải màu hoặc dùng hệ smarthome chỉnh CCT đồng bộ." },
        { wrong: "Đèn Spotlight chiếu sai vật thể (chiếu xuống sàn nhà thay vì tường/tranh).", right: "Spotlight là để tạo điểm nhấn (Accent). Góc chiếu (beam angle) hẹp 15-24 độ phải nhắm vào vách đá, tranh, bình hoa để tạo hiệu ứng thị giác." },
        { wrong: "Đèn thả bàn ăn (pendant) lắp quá cao chạm trần hoặc quá thấp che mặt người ngồi.", right: "Khoảng cách chuẩn từ đáy đèn thả đến mặt bàn ăn là 750mm - 850mm. Đủ sáng món ăn, không chói mắt." },
        { wrong: "Công tắc đèn giấu lấp sau cánh cửa phòng mở ra.", right: "Xác định rõ hướng mở cửa (bản lề trái/phải). Công tắc phải nằm cùng phía với tay nắm cửa để bước vào là bật được ngay." },
        { wrong: "Không tính đèn hắt gầm tủ bếp (task lighting) cho mặt đá bếp.", right: "Người đứng nấu sẽ che mất đèn trần. Bắt buộc phải có led dây hắt gầm tủ trên để thớt thái đồ được sáng tỏ." },
        { wrong: "Dùng đèn trang trí dạng chùm pha lê khổng lồ trong căn hộ trần thấp (2m6).", right: "Trần chung cư thấp sẽ làm không gian bị đè nén, vướng đầu. Đèn chùm pha lê dài chỉ hợp nhà phố, thông tầng, biệt thự trần >3m5." },
        { wrong: "Lắp đèn gương WC rọi từ trên đỉnh đầu xuống.", right: "Đèn rọi từ trên xuống tạo bóng đen (đổ bóng hốc mắt, cằm) làm mặt bị xấu đi. Đèn gương tốt nhất là dải LED hắt từ phía sau gương hoặc hắt hông 2 bên." },
        { wrong: "Không dùng Dimmer (chiết áp) cho phòng ngủ hoặc phòng khách.", right: "Làm mất khả năng tùy biến mood. Phòng khách cần sáng để tiếp khách nhưng cần tối mờ để xem phim. Phòng ngủ cần dim để thư giãn trước khi ngủ." }
      ]
    }
  },
  {
    heading: "9. HỆ THỐNG ĐIỆN NƯỚC (MEP - Electrical & Plumbing)",
    content_type: "mistakes",
    metadata: {
      mistakes: [
        { wrong: "Kéo đường ống cấp nước đi trên trần nhưng không bọc xốp bảo ôn.", right: "Ngưng tụ sương (đổ mồ hôi) do chênh lệch nhiệt độ sẽ nhỏ giọt làm ố hỏng trần thạch cao. Phải bọc bảo ôn ống nước lạnh ngầm." },
        { wrong: "Không có Aptomat (CB) chống giật (RCBO/ELCB) cho bình nóng lạnh, WC.", right: "Bắt buộc phải có CB chống dòng rò cho các thiết bị gần nước (Bình nóng lạnh, máy giặt, ổ cắm WC) để chống giật chết người." },
        { wrong: "Thiết kế ổ cắm đằng sau tủ kệ mà quên khoét lỗ ván để cắm điện.", right: "Tính toán kỹ cao độ ổ cắm. Nếu ổ cắm lọt vào bụng tủ, thợ mộc phải khoét lỗ lách dây hoặc đi nổi phích cắm sang bên hông tủ." },
        { wrong: "Dùng tiết diện dây điện quá nhỏ cho Bếp từ, Lò nướng, Điều hòa.", right: "Tải nặng (Bếp từ đôi 4000W+) phải dùng dây điện cáp ruột đồng tiết diện tối thiểu 4.0mm2 - 6.0mm2, và đi line riêng từ tủ điện tổng." },
        { wrong: "Ống xả AC (máy lạnh) đi ngang không có độ dốc.", right: "Ống thoát nước ngưng điều hòa phải dốc tối thiểu 2-3%, nếu đi đường dài phải tính độ tụt cốt trần, nếu không nước sẽ chảy ngược thấm trần." },
        { wrong: "Sắp xếp tủ điện tổng lộn xộn, không dán nhãn (label) các Aptomat.", right: "Tủ điện phải đấu nối gọn gàng (lược đồng, code dây), dán nhãn chú thích rõ (Đèn PK, Ổ cắm Bếp, BNL WC1...) để sửa chữa, bảo trì dễ dàng." },
        { wrong: "Bộ xiphong chậu rửa chén (bếp) không có nắp ngăn mùi cong (bẫy nước chữ U/P).", right: "Mùi hôi từ cống sẽ bốc ngược lên. Bộ xiphong thoát nước phải có thiết kế tạo bẫy nước (water trap) ngăn mùi bốc lên." },
        { wrong: "Điểm lắp đặt wifi (Router) bị giấu kín trong hộp tủ kim loại hoặc kẹt trong hốc tường.", right: "Sóng wifi bị cản nghiêm trọng. Tủ điện trung tâm chứa router nên dùng nắp nhựa, hoặc đi dây LAN kéo Access Point ra trần các phòng." },
        { wrong: "Lắp quạt hút mùi bếp (ống mềm nhôm) ngoằn ngoèo, quá dài (>4m) chui qua nhiều góc vuông.", right: "Ống gió bếp càng cong, hút mùi càng yếu và kêu to. Cố gắng đi đường ống gió thoát ra ngoài ngắn nhất, dùng ống cứng (PVC) thay vì ống nhôm ruột gà nếu đi xa." },
        { wrong: "Không tính toán chia tải (Phase) cho nhà cao tầng hoặc biệt thự 3 pha.", right: "Gây lệch pha, sập nguồn nhảy CB liên tục. Kỹ sư MEP phải cân bằng tải thiết bị (ví dụ pha 1: Bếp, thang máy; pha 2: ĐH tầng 1,2...)." }
      ]
    }
  },
  {
    heading: "10. VẬT LIỆU & PHỤ KIỆN (Materials & Hardware)",
    content_type: "mistakes",
    metadata: {
      mistakes: [
        { wrong: "Sử dụng bản lề giảm chấn loại rẻ tiền (hàng nhái) cho tủ bếp.", right: "Tủ bếp mở mỗi ngày chục lần. Bản lề dỏm sẽ xệ cánh, rỉ sét sau 6 tháng. Bắt buộc đầu tư bản lề chuẩn (Blum, Hafele, Hettich) bằng Inox 304." },
        { wrong: "Dùng ván bọc Melamine cho bục chậu rửa bát (tủ bếp dưới chậu rửa).", right: "Khu vực bồn rửa rất hay rỉ nước, rỉ xi phông. Ván công nghiệp sẽ trương nở bục rữa. Phải thay khoang bồn rửa bằng nhựa WPC/Picomat hoặc Inox." },
        { wrong: "Lát đá hoa cương (Granite) nhuộm màu rẻ tiền làm mặt bếp.", right: "Đá nhuộm dùng vài tháng sẽ phai màu loang lổ, hóa chất độc hại thấm vào thức ăn. Đầu tư đá tự nhiên nguyên khối hoặc đá nhân tạo gốc thạch anh." },
        { wrong: "Mua sofa bọc da simili/PU rẻ tiền thay vì da bò thật hoặc vải nỉ tốt.", right: "Da PU/simili sẽ bong tróc vẩy cá, nổ rộp ở vùng ngồi sau 1-2 năm xứ nóng ẩm. Nếu budget thấp, thà xài vải nỉ/Linen chất lượng cao còn hơn giả da." },
        { wrong: "Chọn nẹp viền inox mạ PVD nhưng thợ dùng keo Silicon axit để dán.", right: "Silicon có tính axit (loại bốc mùi chua) sẽ ăn mòn lớp mạ kim loại, làm nẹp inox bị đen, rỉ ố. Phải dùng keo dán chuyên dụng Xbond, Titebond hoặc Silicon trung tính." },
        { wrong: "Dùng keo chà ron xi măng trắng cho nhà vệ sinh/bếp thay vì keo Epoxy.", right: "Ron xi măng thấm nước, hút nấm mốc đen xì. Khu vực ướt/nhiều dầu mỡ (bếp, WC, ban công) phải làm ron Epoxy (Saveto) để chống thấm tuyệt đối." },
        { wrong: "Dùng kính ốp bếp (kính cường lực) màu xanh non/xanh lơ quá lòe loẹt.", right: "Làm mất vẻ sang trọng (đặc biệt phong cách Modern/Quiet Luxury). Nên thay kính màu bằng kính sơn màu beige/xám, hoặc sang nhất là ốp cùng loại đá mặt bếp cuốn lên vách." },
        { wrong: "Thanh treo quần áo làm bằng ống inox/nhôm mỏng, không có chân đỡ giữa chịu lực.", right: "Treo nhiều áo khoác mùa đông nặng sẽ làm thanh sào bị cong oằn. Phải dùng ống thép đúc dày, tủ rộng >1m phải có bát đỡ ở giữa trần tủ." },
        { wrong: "Gỗ ốp ngoài trời (Ban công/logia) dùng gỗ thông thường hoặc ván HDF.", right: "Nắng mưa Việt Nam sẽ làm mục nát sau 1 mùa. Bắt buộc dùng Gỗ nhựa ngoài trời (WPC), gỗ Conwood xi măng, hoặc gỗ Teak tự nhiên xử lý ngâm dầu." },
        { wrong: "Sơn sắt mạ kẽm bằng sơn dầu thường thay vì sơn Epoxy 2 thành phần.", right: "Sơn dầu thường bám dính kém trên bề mặt sắt hộp mạ kẽm, cạo nhẹ là bong mảng to. Phải dùng sơn chuyên dụng cho mạ kẽm (Epoxy)." }
      ]
    }
  }
];

async function seed100Mistakes() {
  console.log('=== SEEDING 100 MISTAKES (2.5) ===');

  const { data: mod } = await sb.from('training_modules').select('id').eq('slug', 'design-knowledge').single();
  if (!mod) {
    console.log('Module 2 not found');
    return;
  }

  const { data: section } = await sb.from('training_sections')
    .select('id')
    .eq('module_id', mod.id)
    .eq('number', '2.5')
    .single();

  if (!section) {
    console.log('Section 2.5 not found');
    return;
  }

  // Xóa các subsection cũ (để tránh bị trùng lặp)
  await sb.from('training_subsections').delete().eq('section_id', section.id);

  // Chèn 100 lỗi (10 block x 10 lỗi)
  let order = 1;
  for (const block of MISTAKES_100) {
    await sb.from('training_subsections').insert({
      section_id: section.id,
      heading: block.heading,
      content_type: block.content_type,
      metadata: block.metadata,
      sort_order: order
    });
    console.log(`Inserted block ${order}: ${block.heading}`);
    order++;
  }

  console.log('✅ Đã cập nhật xong KHO TÀNG 100 LỖI THƯỜNG GẶP NỘI THẤT!');
}

seed100Mistakes();
