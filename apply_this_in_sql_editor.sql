-- 1) Công trình tiêu biểu
UPDATE landing_featured_projects SET construction_time = '35 ngày', project_type = NULL WHERE id = '714ed8f1-ebd9-4ac0-a177-42d62c487cd9';
UPDATE landing_featured_projects SET info = '65m² — Đà Nẵng' WHERE id = 'baa8e571-9d2a-4a87-8b4c-2fff93937049';
UPDATE landing_featured_projects SET title = '[DQH] Căn hộ Vinhomes Landmark' WHERE id = '0fbb6101-8ca7-4b92-9d75-2ff25ada8209';

-- 2) 6 người đầu đội ngũ (ghi đè 6 dòng mẫu cũ)
UPDATE landing_team_members SET group_key='design', sort_order=1, name='Võ Ngọc Quang', role='CEO, Kiến trúc sư – Người sáng lập', avatar_url='https://cms.dqharchitects.vn/uploads/small_doi_ngu_dqh_architects_vo_ngoc_quang_0d46e21be1.jpg' WHERE id = 'becb3bdb-2194-448b-be9a-16883d2059d9';
UPDATE landing_team_members SET group_key='design', sort_order=2, name='Nguyễn Công Minh', role='Quản lý dự án', avatar_url='https://cms.dqharchitects.vn/uploads/small_doi_ngu_dqh_architects_nguyen_cong_minh_8fd26905be.jpg' WHERE id = '1b680404-e75f-4ce4-a427-1de39b2fcd37';
UPDATE landing_team_members SET group_key='design', sort_order=3, name='Phạm Văn Quang', role='Quản lý thi công', avatar_url='https://cms.dqharchitects.vn/uploads/small_doi_ngu_dqh_architects_pham_van_quang_2b992b54db.jpg' WHERE id = '26d1876c-ec8e-4338-bd94-2842b7586cc0';
UPDATE landing_team_members SET group_key='design', sort_order=4, name='Trần Công Tiến', role='Giám đốc xưởng sản xuất', avatar_url='https://cms.dqharchitects.vn/uploads/small_doi_ngu_dqh_architects_tran_cong_tien_cad6e41c1f.jpg' WHERE id = 'bfbab6a5-8b96-4472-8a02-cfdec6678690';
UPDATE landing_team_members SET group_key='design', sort_order=5, name='Ngô Thanh Thi', role='Trưởng nhóm thiết kế nội thất', avatar_url='https://cms.dqharchitects.vn/uploads/small_doi_ngu_dqh_architects_ngo_thanh_thi_ab615263e4.jpg' WHERE id = '8fedd09d-3d00-41d5-ab78-ed678b6166b3';
UPDATE landing_team_members SET group_key='design', sort_order=6, name='Ngô Hữu Thắng', role='Kiến trúc sư, thiết kế nội thất', avatar_url='https://cms.dqharchitects.vn/uploads/small_doi_ngu_dqh_architects_ngo_huu_thang_f536bb1517.jpg' WHERE id = '2039d8ca-adc9-47c2-9a32-e3a52f711f6f';

-- 3) Thông tin công ty
UPDATE landing_company_info SET
  history_text = 'Thành lập ngày 30/12/2020, DQH Architects là đơn vị Design & Build: thiết kế, sản xuất nội thất tại xưởng và thi công do cùng một đội chịu trách nhiệm, phục vụ căn hộ, nhà phố, biệt thự và công trình thương mại.',
  history_image = 'https://yiuokvszyaqqjksshybn.supabase.co/storage/v1/object/public/landing-media/1792997882267-3xybecv.webp',
  vision_text = 'Trở thành đơn vị Design & Build được khách hàng tin tưởng tại TP.HCM – nơi mỗi công trình là một lời hứa được giữ đúng, từ bản vẽ đầu tiên đến ngày bàn giao.',
  vision_image = 'https://yiuokvszyaqqjksshybn.supabase.co/storage/v1/object/public/landing-media/1792995464085-g1st407.webp',
  philosophy_text = '"Làm nghề tử tế" — chúng tôi tin rằng sự tinh tế nằm ở từng chi tiết nhỏ: đường ron gạch thẳng tắp, bản lề đóng êm không tiếng động, và một cam kết không bao giờ thất hứa với khách hàng.',
  philosophy_image = 'https://yiuokvszyaqqjksshybn.supabase.co/storage/v1/object/public/landing-media/1792997882267-3xybecv.webp',
  founded_date = '30/12/2020',
  scale_value = NULL,
  scale_note = NULL,
  address_value = '105-107 Trần Văn Dư, Phường 13, Tân Bình, TP.HCM',
  address_note = 'Văn phòng DQH Architects',
  project_types = 'Căn hộ · Nhà phố · Biệt thự · Văn phòng · Cửa hàng · Spa · Quán cà phê',
  legal_name = 'Công ty TNHH TM & Kiến Trúc Xây Dựng DQH',
  tax_code = NULL
WHERE id = 1;
