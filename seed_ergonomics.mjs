import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

const ERGONOMICS = [
  {
    heading: "Phòng khách",
    content_type: "table",
    metadata: {
      table: {
        columns: ["Hạng mục", "Kích thước chuẩn", "Ghi chú"],
        rows: [
          ["Sofa 2 chỗ", "W 1400–1600 × D 800–900 × H seat 420–450mm", "Seat depth 550–650mm"],
          ["Sofa 3 chỗ", "W 2000–2400 × D 850–950 × H seat 420–450mm", "Phòng nhỏ chọn ≤2200mm"],
          ["Sofa góc L", "W 2400–2800 × D 2000–2400", "Chân dài 1600–2000mm"],
          ["Bàn cà phê", "W 1000–1400 × D 500–700 × H 350–450mm", "H bàn ≤ mặt đệm sofa + 50mm"],
          ["Bàn sofa side table", "Ø 400–600 × H 500–600mm", "Ngang hoặc cao hơn tay vịn sofa 0–50mm"],
          ["Kệ TV / Console", "W 1200–2000 × D 350–450 × H 400–550mm", "Tâm TV cách sàn 1000–1100mm (ngồi xem)"],
          ["Khoảng sofa → TV", "2500–3500mm", "TV 55\": ≥2500mm. TV 65\": ≥3000mm. TV 75\": ≥3500mm"],
          ["Khoảng sofa → bàn cà phê", "400–500mm", "Đủ đi qua + đặt chân thoải mái"],
          ["Lối đi chính phòng khách", "≥900mm", "Lối đi phụ: ≥600mm"],
          ["Kệ treo tường / tranh", "Tâm cách sàn 1450–1550mm", "Trên sofa: cách đỉnh lưng sofa 150–200mm"],
          ["Thảm trải sàn", "Bao phủ 2 chân trước sofa", "Thường 1600×2300 hoặc 2000×3000mm"],
          ["Rèm cửa", "Rộng hơn khung cửa sổ mỗi bên 150–200mm", "Treo sát trần, chạm sàn hoặc cách sàn 10–20mm"],
        ]
      }
    }
  },
  {
    heading: "Phòng ngủ",
    content_type: "table",
    metadata: {
      table: {
        columns: ["Hạng mục", "Kích thước chuẩn", "Ghi chú"],
        rows: [
          ["Giường đơn", "W 1000–1200 × L 2000mm", "Trẻ em có thể dùng 900×1900mm"],
          ["Giường đôi Queen", "W 1600 × L 2000mm", "Phổ biến nhất cho couple"],
          ["Giường đôi King", "W 1800 × L 2000mm", "Phòng ≥16m² mới dùng King"],
          ["Giường đôi Super King", "W 2000 × L 2000mm", "Phòng ≥20m²"],
          ["Chiều cao mặt nệm từ sàn", "500–600mm (kể cả nệm)", "Chuẩn ngồi: đầu gối gập 90°"],
          ["Lối đi 2 bên giường", "≥600mm mỗi bên", "Tối thiểu 1 bên 400–450mm nếu phòng hẹp"],
          ["Táp đầu giường", "W 400–550 × D 350–450 × H ngang mặt nệm ±50mm", "H thường 550–650mm"],
          ["Tủ quần áo cánh mở", "W theo nhu cầu × D 580–600 × H 2200–2400mm", "D ≥580mm cho móc áo ngang"],
          ["Tủ quần áo cánh lùa", "W theo nhu cầu × D 600–650mm", "D thêm 50mm cho ray lùa"],
          ["Khoảng giường → tủ áo", "≥800mm", "Đủ mở cánh tủ + đứng chọn đồ"],
          ["Bàn trang điểm", "W 800–1200 × D 400–500 × H 730–760mm", "Ghế H 420–450mm"],
          ["Ổ cắm đầu giường", "Cao ngang mặt táp hoặc trên 50–100mm", "Mỗi bên 1 ổ đôi + 1 USB"],
          ["Đèn đọc sách đầu giường", "Cao mặt nệm + 500–600mm", "Đèn wall sconce: 350–400mm trên mặt nệm"],
          ["Quạt trần", "Ø 1200–1400mm cho phòng 15–20m²", "Đáy quạt cách sàn ≥2300mm"],
        ]
      }
    }
  },
  {
    heading: "Bếp",
    content_type: "table",
    metadata: {
      table: {
        columns: ["Hạng mục", "Kích thước chuẩn", "Ghi chú"],
        rows: [
          ["Mặt bếp (countertop)", "H 850–900mm từ FFL", "Người thấp 1m55: 850mm. Người cao 1m75: 900mm"],
          ["Chiều sâu tủ bếp dưới", "D 550–600mm (phủ bì)", "Mặt đá nhô ra 20–30mm so với cánh tủ"],
          ["Tủ bếp trên", "D 300–350mm × H 600–900mm", "Đáy tủ trên cách mặt bếp 550–650mm (chuẩn 600mm)"],
          ["Backsplash (tấm chắn)", "H tối thiểu 50mm, full: từ mặt bếp đến đáy tủ trên", "Full backsplash dễ lau chùi hơn"],
          ["Đảo bếp (island)", "W ≥900mm × D ≥600mm", "Lối đi xung quanh đảo: ≥900mm, lý tưởng 1000–1200mm"],
          ["Bar counter", "H 900–1050mm", "Bar 900mm → ghế 600–650mm. Bar 1050mm → ghế 750–800mm"],
          ["Khoảng bếp nấu → chậu rửa", "400–600mm bàn soạn", "Không bao giờ để sát nhau"],
          ["Máy hút mùi → mặt bếp", "Bếp gas: 650–750mm. Bếp từ: 550–650mm", "Quá cao → hút yếu, quá thấp → cấn đầu"],
          ["Bồn rửa → góc tường", "≥300mm 1 bên", "Phải có khoảng đặt bát/chén sau rửa"],
          ["Tủ lạnh → tủ bếp", "Filler panel 30–50mm giữa tủ lạnh và tủ bếp", "Tránh cánh tủ lạnh cấn ngăn kéo bếp"],
          ["Ổ cắm mặt bếp", "Cao 1050–1150mm từ FFL, 2–3 ổ", "Cho máy xay, ấm đun, máy pha cà phê"],
          ["Thùng rác âm tủ", "Hộc W ≥300mm cạnh bồn rửa", "Thùng cao 350–400mm, check H hộc dưới bồn rửa"],
        ]
      }
    }
  },
  {
    heading: "Phòng tắm · WC",
    content_type: "table",
    metadata: {
      table: {
        columns: ["Hạng mục", "Kích thước chuẩn", "Ghi chú"],
        rows: [
          ["Bồn cầu (tim → tường bên)", "≥400mm", "Cách lavabo/vách tắm ≥350mm"],
          ["Bồn cầu (trước mặt)", "Khoảng trống ≥600mm phía trước", "Tối thiểu để ngồi thoải mái"],
          ["Bồn cầu treo", "Mặt ngồi cách FFL 400–430mm", "Khung Geberit sâu 150–200mm"],
          ["Lavabo đặt bàn (vessel)", "Mặt đá = 850 − H chậu. Chậu H 120–150mm → đá ở 700–730mm", "Mặt chậu (rim) chuẩn ≈850mm"],
          ["Lavabo âm bàn (undermount)", "Mặt đá H 800–850mm", "Thông dụng nhất"],
          ["Lavabo treo tường", "Mép trên H 800–850mm từ FFL", "WC nhỏ không có tủ lavabo"],
          ["Gương phòng tắm", "Cạnh dưới: 1000–1050mm. Cạnh trên: 1850–1900mm", "Gương cao 800–900mm phục vụ H 1m55–1m80"],
          ["Vòi sen đứng (tay sen)", "H 1900–2100mm từ FFL", "Tay sen gắn ray trượt linh hoạt nhất"],
          ["Vòi sen trần (rain shower)", "H 2100–2200mm từ FFL", "Đầu sen Ø 200–300mm"],
          ["Hốc tường shower (niche)", "W = N × (gạch + ron) − ron. H ≥300mm", "Sâu 80–100mm. Vẽ trước khi ốp gạch"],
          ["Vách kính tắm", "Kính 8–10mm. H 1800–2000mm", "Bậc ngăn nước sàn 20–30mm"],
          ["Ổ cắm WC", "Cách nguồn nước ≥600mm. H 1100–1300mm", "Loại IP44 có nắp đậy chống ẩm"],
          ["Phễu thu sàn", "Nằm đúng giao điểm ron gạch", "Sàn dốc 1–2% về phía phễu"],
          ["FFL sàn WC", "Thấp hơn hành lang 15–20mm", "Ngưỡng cửa có gờ chặn nước"],
        ]
      }
    }
  },
  {
    heading: "Bàn ăn · Ghế ăn",
    content_type: "table",
    metadata: {
      table: {
        columns: ["Hạng mục", "Kích thước chuẩn", "Ghi chú"],
        rows: [
          ["Bàn ăn 4 người", "W 800–900 × L 1200–1400mm", "Mỗi người cần W ≥600mm"],
          ["Bàn ăn 6 người", "W 900–1000 × L 1600–1800mm", "Hình chữ nhật phổ biến nhất"],
          ["Bàn ăn 8 người", "W 1000 × L 2000–2200mm", "Hoặc bàn tròn Ø 1200–1500mm"],
          ["Bàn tròn 4 người", "Ø 900–1100mm", "Ø 900mm hơi chật, lý tưởng Ø 1000mm"],
          ["Bàn tròn 6 người", "Ø 1200–1400mm", "Phòng cần ≥ Ø bàn + 1600mm (800mm mỗi bên)"],
          ["Chiều cao bàn ăn", "H 730–760mm", "Chuẩn quốc tế"],
          ["Ghế ăn", "H seat 430–460mm × W 450–550mm", "Chênh lệch H bàn − H ghế = 270–300mm"],
          ["Khoảng bàn → tường phía sau", "≥800mm", "Có lối đi phía sau: ≥1100mm"],
          ["Khoảng giữa 2 ghế", "≥50mm giữa 2 mép ghế", "Để kéo ghế ra/vào thoải mái"],
          ["Đèn thả bàn ăn", "Đáy đèn cách mặt bàn 700–800mm", "Đèn dài: 2/3 chiều dài bàn"],
        ]
      }
    }
  },
  {
    heading: "Cửa · Hành lang · Cầu thang",
    content_type: "table",
    metadata: {
      table: {
        columns: ["Hạng mục", "Kích thước chuẩn", "Ghi chú"],
        rows: [
          ["Cửa đi phòng ngủ/khách", "W 800–900 × H 2100–2400mm", "Cửa kịch trần H 2400–2700mm cần top guide"],
          ["Cửa WC", "W 700–800mm", "Nên mở ra ngoài hoặc cửa lùa nếu WC nhỏ"],
          ["Cửa chính/đi chung", "W 900–1000mm", "2 cánh: W 1200–1600mm"],
          ["Hành lang", "W ≥900mm (tối thiểu 800mm)", "Hành lang dài ≥1000mm để khoan khoái"],
          ["Cầu thang bản thang", "W ≥900mm thông thủy", "Cần vác đồ: 1000–1100mm"],
          ["Bậc thang — riser (cổ bậc)", "H 155–175mm", "Tất cả bậc phải đều nhau"],
          ["Bậc thang — tread (mặt bậc)", "≥250mm", "Lý tưởng 280–300mm"],
          ["Lan can cầu thang", "H 850–900mm từ mũi bậc", "Thanh đứng cách nhau ≤100mm"],
          ["Tay vịn phụ (trẻ em)", "H 550–650mm", "Nếu nhà có trẻ nhỏ"],
          ["Chiều cao thông thủy dưới cầu thang", "≥2100mm", "Đo từ sàn dưới đến đáy dầm/bậc trên"],
          ["Công tắc đèn", "H 1100–1300mm từ FFL", "Phía tay nắm cửa, cách mép cửa ≥150mm"],
          ["Ổ cắm", "H 300–400mm từ FFL", "Bếp: 1050–1150mm. Đầu giường: ngang mặt táp"],
        ]
      }
    }
  },
  {
    heading: "Bàn làm việc · Khu vực study",
    content_type: "table",
    metadata: {
      table: {
        columns: ["Hạng mục", "Kích thước chuẩn", "Ghi chú"],
        rows: [
          ["Bàn làm việc", "W 1200–1600 × D 600–750 × H 730–760mm", "Màn 27\": D ≥700mm"],
          ["Ghế làm việc", "H seat 420–520mm (có điều chỉnh)", "Tay vịn ghế chui vừa dưới bàn"],
          ["Khoảng đầu gối dưới bàn", "H ≥650mm × D ≥450mm", "Cho chân co duỗi thoải mái"],
          ["Kệ sách treo tường", "D 200–300mm × H giữa 2 tầng 280–350mm", "Sách A4 cao 300mm"],
          ["Tủ sách đứng", "D 300–350mm × H tùy", "Kệ MDF 18mm: max 800mm không đỡ giữa"],
          ["Đèn bàn làm việc", "H 400–500mm", "Ánh sáng 4000K, CRI ≥90"],
          ["Khoảng mắt → màn hình", "500–700mm", "Tâm màn hình ngang tầm mắt hoặc thấp hơn 50mm"],
          ["Ổ cắm bàn làm việc", "2–3 ổ + USB. Âm mặt bàn hoặc cạnh tường phía sau", "Rãnh luồn dây cable management"],
        ]
      }
    }
  },
  {
    heading: "Trần · Khe rèm · Khe đèn",
    content_type: "table",
    metadata: {
      table: {
        columns: ["Hạng mục", "Kích thước chuẩn", "Ghi chú"],
        rows: [
          ["Trần thông thủy phòng khách", "≥2700mm sau hạ trần", "Nhà phố HCM trần thô thường 3200–3500mm"],
          ["Trần thông thủy phòng ngủ", "≥2500mm sau hạ trần", "Chấp nhận 2400mm nếu trần thô thấp"],
          ["Trần thông thủy hành lang", "≥2400mm", "Có thể hạ sâu hơn để giấu ống AC/gió"],
          ["Khe rèm 1 lớp", "W ≥200mm × sâu ≥150mm", "1 thanh ray rèm vải hoặc voan"],
          ["Khe rèm 2 lớp", "W ≥300mm × sâu ≥150mm", "2 ray: voan + rèm chính"],
          ["Khe rèm điện", "Thêm ổ cắm 220V ở 1 đầu ray", "Motor rèm cần không gian 100×100mm ở đầu ray"],
          ["Khe đèn hắt (cove light)", "W khe 120–150mm. Lip che cao 40–60mm", "LED cách lip 30–50mm. Profile nhôm có mica frosted"],
          ["Hạ trần giật cấp", "Bậc giật cấp H 100–200mm × W 200–400mm", "Giật cấp quá hẹp (<200mm) khó thi công, xấu"],
          ["Shadow gap (khe âm)", "W 8–12mm × sâu 15–20mm", "Sơn đen bên trong. Nẹp nhôm L ẩn nếu cần"],
          ["Access panel điều hòa", "≥400×400mm", "Ở đúng vị trí dàn lạnh / van nước để bảo trì"],
          ["Đèn downlight âm trần", "Khoảng cách giữa 2 đèn: 1.2–1.5m", "Cách tường 600–800mm. Không rọi thẳng đầu giường"],
          ["Quạt trần", "Đáy quạt cách sàn ≥2300mm", "Phòng ≤15m²: Ø ≤1200mm. 15–25m²: Ø 1200–1400mm"],
        ]
      }
    }
  },
  {
    heading: "Tủ bếp chi tiết (hộc · phụ kiện)",
    content_type: "table",
    metadata: {
      table: {
        columns: ["Hạng mục", "Kích thước chuẩn", "Ghi chú"],
        rows: [
          ["Hộc ngăn kéo Tandembox", "W hộc: W ray + 42mm (21mm mỗi bên)", "Ray 500mm → hộc sâu ≥520mm"],
          ["Hộc tủ pull-out gia vị", "W rổ + 2×18mm ván + khe → tủ ≥190–200mm phủ bì", "Rổ tiêu chuẩn: 150mm"],
          ["Hộc lò nướng âm", "W 560–600mm × H 590–600mm × D ≥550mm", "Check spec từng model trước khi vẽ"],
          ["Hộc máy rửa bát", "W thông thủy 598–600mm", "Check bản lề tủ bên cạnh có cấn không"],
          ["Khoang chứa thùng rác", "H thùng + ray (16mm) + khe (20mm) ≤ H hộc", "Hộc dưới bồn rửa thường thấp hơn → check"],
          ["Ngăn kéo nội bộ (inner drawer)", "H tổng = H dưới + H inner + 2×ray + khe", "Không được vượt H hộc trừ mặt đá"],
          ["Cánh lift-up Aventos HF", "Cánh H 480–1040mm", "Khoảng đỉnh tủ → trần ≥ H cánh × 0.5"],
          ["Cánh lift-up Aventos HK-S", "Cánh H 200–500mm", "Cho tủ bếp trên nhỏ"],
          ["Cánh lift-up Aventos HL", "Cánh H 300–580mm (parallel lift)", "Khoảng đỉnh tủ → trần ≥50mm"],
          ["Bản lề cốc (cup hinge)", "Nhô vào hộc 10–12mm", "Tính clearance khi có thiết bị âm bên cạnh"],
          ["Ray soft-close", "Tủ sâu ≥ ray + 30–40mm (cho cơ cấu giảm chấn)", "Ray 550mm → tủ sâu ≥580–600mm phủ bì"],
          ["Len chân tủ bếp", "H 80–120mm × lùi vào 50–60mm", "Che chân tủ, dễ đứng sát mặt bếp"],
        ]
      }
    }
  },
  {
    heading: "Điều hòa · Thông gió",
    content_type: "table",
    metadata: {
      table: {
        columns: ["Hạng mục", "Kích thước chuẩn", "Ghi chú"],
        rows: [
          ["Dàn lạnh treo tường → trần", "≥150–200mm phía trên", "Cho miệng hút gió, không ép sát trần"],
          ["Dàn lạnh treo → tường bên", "≥100mm mỗi bên", "Để bảo trì, lắp đặt"],
          ["Cục nóng → khoảng thoáng", "Trước: ≥500mm. Sau: ≥300mm", "Không đặt trong hộp kín"],
          ["Ống gen đường ống lạnh", "Φ 60–80mm", "Âm sẵn trong tường/trần từ giai đoạn thô"],
          ["Ống thoát nước ngưng", "Dốc ≥1% về phía thoát", "Dẫn đến phễu WC hoặc ban công"],
          ["BTU ước tính", "Diện tích (m²) × 600–700 BTU", "Hướng Tây/nhiều kính: ×1.2–1.3"],
          ["Miệng thổi (supply grille)", "Vẽ riêng trên bản vẽ trần", "Hướng thổi không rọi thẳng vào người"],
          ["Miệng hút (return air grille)", "Vẽ riêng, cách miệng thổi ≥1500mm", "Không để gần nhau → đoản mạch gió"],
          ["Quạt hút WC kín", "Lưu lượng ≥80 m³/h", "Bắt buộc nếu WC không có cửa sổ"],
          ["Khe thông gió tủ walk-in", "Lỗ thông gió hoặc cửa gió ≥150×150mm", "Tránh tích ẩm, nấm mốc"],
        ]
      }
    }
  },
];

async function seed() {
  console.log('=== CẬP NHẬT KÍCH THƯỚC CHUẨN (2.2) ===');

  const { data: mod } = await sb.from('training_modules').select('id').eq('slug', 'design-knowledge').single();
  if (!mod) { console.log('Module not found'); return; }

  const { data: section } = await sb.from('training_sections')
    .select('id').eq('module_id', mod.id).eq('number', '2.2').single();
  if (!section) { console.log('Section 2.2 not found'); return; }

  // Xóa subsections cũ
  await sb.from('training_subsections').delete().eq('section_id', section.id);

  let order = 1;
  for (const block of ERGONOMICS) {
    await sb.from('training_subsections').insert({
      section_id: section.id,
      heading: block.heading,
      content_type: block.content_type,
      metadata: block.metadata,
      sort_order: order
    });
    console.log(`✓ ${order}. ${block.heading}`);
    order++;
  }

  // Update title + lead
  await sb.from('training_sections').update({
    title: 'Kích thước chuẩn (Ergonomics)',
    content: 'Kích thước chuẩn không phải để giới hạn sáng tạo — đó là sàn an toàn cho mọi quyết định thiết kế.'
  }).eq('id', section.id);

  console.log(`\n✅ Xong! ${ERGONOMICS.length} bảng kích thước chuẩn.`);
}

seed();
