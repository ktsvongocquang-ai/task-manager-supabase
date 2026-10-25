-- Migration trước chỉ xoá placeholder [MẪU] cho Chuẩn DQH (house_villa).
-- Chuẩn JUX (apartment) vẫn còn "[MẪU] Đồng Tâm, ..." — xoá nốt để landing
-- page tự ẩn dòng Vật liệu cho tới khi admin nhập đối tác thật.
update landing_pricing_standards
set material_partners = null
where category = 'apartment' and standard = 'jux' and material_partners ilike '[MẪU]%';
