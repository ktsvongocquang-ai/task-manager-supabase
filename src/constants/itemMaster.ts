// Item Master "chung_cu" (căn hộ cải tạo) — mã CV-xxx, tên chuẩn có dấu, aliases để
// khớp tên gần đúng. Dựng từ Item_Master_Antigraviti.xlsx (Claude PC, phục hồi dấu từ
// dữ liệu Bảng giá nội bộ + skill bao-gia-noi-that). Bộ Nhà phố/Shop chưa có, dùng
// flattenPriceBook() làm nguồn tạm cho 2 loại hình đó.
// 12 dòng có note khác rỗng là các dòng Claude PC chưa chắc nghĩa gốc — dùng được
// ngay nhưng nên rà lại tên khi rảnh.

export interface ItemMasterEntry {
  code: string;
  name: string;
  unit: string;
  aliases: string[];
  category: string;
  subcategory: string;
  projectType: string;
  sourceKey: string;
  note: string;
}

export const ITEM_MASTER: ItemMasterEntry[] = [
  {
    "code": "CV-001",
    "name": "Tháo Dỡ Đồ Gỗ Cũ",
    "unit": "Hệ",
    "aliases": [
      "Tháo dỡ nội thất cũ",
      "Dọn đồ gỗ hiện hữu"
    ],
    "category": "1. Phá dỡ",
    "subcategory": "thao_do",
    "projectType": "chung_cu",
    "sourceKey": "thao_do_do_go_cu",
    "note": ""
  },
  {
    "code": "CV-002",
    "name": "Tháo Dỡ Tường",
    "unit": "m²",
    "aliases": [
      "Đập tường",
      "Phá tường ngăn"
    ],
    "category": "1. Phá dỡ",
    "subcategory": "thao_do",
    "projectType": "chung_cu",
    "sourceKey": "thao_do_tuong",
    "note": ""
  },
  {
    "code": "CV-003",
    "name": "Tháo Dỡ Cửa Ra Vào",
    "unit": "Hệ",
    "aliases": [
      "Tháo cửa đi",
      "Tháo cửa chính"
    ],
    "category": "1. Phá dỡ",
    "subcategory": "thao_do",
    "projectType": "chung_cu",
    "sourceKey": "thao_do_cua_ra_vao",
    "note": ""
  },
  {
    "code": "CV-004",
    "name": "Tháo Dỡ Cửa Nhôm",
    "unit": "Hệ",
    "aliases": [
      "Tháo cửa nhôm kính",
      "Tháo cửa sổ nhôm"
    ],
    "category": "1. Phá dỡ",
    "subcategory": "thao_do",
    "projectType": "chung_cu",
    "sourceKey": "thao_do_cua_nhom",
    "note": ""
  },
  {
    "code": "CV-005",
    "name": "Tháo Dỡ Trần & Hệ Thống Điện Âm Trần",
    "unit": "m²",
    "aliases": [
      "Tháo trần thạch cao kèm dây điện"
    ],
    "category": "1. Phá dỡ",
    "subcategory": "thao_do",
    "projectType": "chung_cu",
    "sourceKey": "thao_do_tran_dien",
    "note": "Cần xác nhận nghĩa gốc của 'điện' trong tên."
  },
  {
    "code": "CV-006",
    "name": "Tháo Lắp Hệ Lam Nhôm",
    "unit": "Hệ",
    "aliases": [
      "Tháo dỡ và lắp lại lam nhôm"
    ],
    "category": "1. Phá dỡ",
    "subcategory": "thao_do",
    "projectType": "chung_cu",
    "sourceKey": "thao_lap_he_lam_nhom",
    "note": ""
  },
  {
    "code": "CV-007",
    "name": "Vận Chuyển Xà Bần",
    "unit": "Hệ",
    "aliases": [
      "Vận chuyển rác xây dựng",
      "Chuyển xà bần đi đổ"
    ],
    "category": "1. Phá dỡ",
    "subcategory": "thao_do",
    "projectType": "chung_cu",
    "sourceKey": "van_chuyen_xa_ban",
    "note": ""
  },
  {
    "code": "CV-008",
    "name": "Cán Nền Xi Măng",
    "unit": "m²",
    "aliases": [
      "Cán nền",
      "Cán vữa nền"
    ],
    "category": "2. Xây thô / Hoàn thiện",
    "subcategory": "Sàn",
    "projectType": "chung_cu",
    "sourceKey": "can_nen_xi_mang",
    "note": ""
  },
  {
    "code": "CV-009",
    "name": "Thi Công Sàn Gỗ",
    "unit": "m²",
    "aliases": [
      "Lắp sàn gỗ",
      "Lát sàn gỗ công nghiệp"
    ],
    "category": "2. Xây thô / Hoàn thiện",
    "subcategory": "Sàn",
    "projectType": "chung_cu",
    "sourceKey": "thi_cong_san_go",
    "note": ""
  },
  {
    "code": "CV-010",
    "name": "Len Sàn Gỗ",
    "unit": "md (mét dài)",
    "aliases": [
      "Nẹp chân tường sàn gỗ",
      "Phào len chân sàn gỗ"
    ],
    "category": "2. Xây thô / Hoàn thiện",
    "subcategory": "Sàn",
    "projectType": "chung_cu",
    "sourceKey": "len_san_go",
    "note": ""
  },
  {
    "code": "CV-011",
    "name": "Nẹp Nhựa Kết Thúc",
    "unit": "Cây",
    "aliases": [
      "Nẹp kết thúc sàn",
      "Nẹp chuyển sàn"
    ],
    "category": "2. Xây thô / Hoàn thiện",
    "subcategory": "Sàn",
    "projectType": "chung_cu",
    "sourceKey": "nep_nhua_ket_thuc",
    "note": ""
  },
  {
    "code": "CV-012",
    "name": "Lát Gạch 300x600 / 600x600",
    "unit": "m²",
    "aliases": [
      "Lát gạch nền",
      "Lát sàn gạch"
    ],
    "category": "2. Xây thô / Hoàn thiện",
    "subcategory": "Sàn",
    "projectType": "chung_cu",
    "sourceKey": "lat_gach_300x600_600x600",
    "note": ""
  },
  {
    "code": "CV-013",
    "name": "Ngạch Đá Cửa",
    "unit": "Cái",
    "aliases": [
      "Bậu đá cửa",
      "Đá ngạch cửa"
    ],
    "category": "2. Xây thô / Hoàn thiện",
    "subcategory": "Sàn",
    "projectType": "chung_cu",
    "sourceKey": "ngach_da_cua",
    "note": ""
  },
  {
    "code": "CV-014",
    "name": "Đầm & Chống Thấm Cạnh Sàn",
    "unit": "Hệ",
    "aliases": [
      "Chống thấm mép sàn"
    ],
    "category": "2. Xây thô / Hoàn thiện",
    "subcategory": "Sàn",
    "projectType": "chung_cu",
    "sourceKey": "dam_va_chong_tham_canh_san",
    "note": "Cần xác nhận nghĩa gốc của 'dam' (đầm/đâm)."
  },
  {
    "code": "CV-015",
    "name": "Cải Tạo Sàn Bếp Nới Rộng",
    "unit": "Hệ",
    "aliases": [
      "Nới sàn bếp",
      "Cơi nới sàn bếp"
    ],
    "category": "2. Xây thô / Hoàn thiện",
    "subcategory": "Sàn",
    "projectType": "chung_cu",
    "sourceKey": "cai_tao_san_bep_noi_rong",
    "note": ""
  },
  {
    "code": "CV-016",
    "name": "Chống Thấm Sika Top Seal",
    "unit": "Hệ",
    "aliases": [
      "Chống thấm Sika",
      "Sơn chống thấm Sika TopSeal"
    ],
    "category": "2. Xây thô / Hoàn thiện",
    "subcategory": "Sàn",
    "projectType": "chung_cu",
    "sourceKey": "chong_tham_sika_top_seal",
    "note": ""
  },
  {
    "code": "CV-017",
    "name": "Cán Sàn Hoàn Thiện 5-7cm",
    "unit": "m²",
    "aliases": [
      "Cán nền dày 5-7cm"
    ],
    "category": "2. Xây thô / Hoàn thiện",
    "subcategory": "Sàn",
    "projectType": "chung_cu",
    "sourceKey": "can_san_hoan_thien_5_7cm",
    "note": ""
  },
  {
    "code": "CV-018",
    "name": "Xây Tường 100mm",
    "unit": "m²",
    "aliases": [
      "Xây tường gạch 100"
    ],
    "category": "2. Xây thô / Hoàn thiện",
    "subcategory": "Tường",
    "projectType": "chung_cu",
    "sourceKey": "xay_tuong_100mm",
    "note": ""
  },
  {
    "code": "CV-019",
    "name": "Tô Tường 1 Mặt",
    "unit": "m²",
    "aliases": [
      "Trát tường 1 mặt"
    ],
    "category": "2. Xây thô / Hoàn thiện",
    "subcategory": "Tường",
    "projectType": "chung_cu",
    "sourceKey": "to_tuong_1_mat",
    "note": ""
  },
  {
    "code": "CV-020",
    "name": "Đầm & Cạnh Tường",
    "unit": "m (mét dài)",
    "aliases": [
      "Xử lý cạnh tường"
    ],
    "category": "2. Xây thô / Hoàn thiện",
    "subcategory": "Tường",
    "projectType": "chung_cu",
    "sourceKey": "dam_va_canh_tuong",
    "note": "Cần xác nhận nghĩa gốc của 'dam' (đầm/đâm)."
  },
  {
    "code": "CV-021",
    "name": "Đà Lanh Tô",
    "unit": "Hệ",
    "aliases": [
      "Lanh tô cửa",
      "Dầm lanh tô"
    ],
    "category": "2. Xây thô / Hoàn thiện",
    "subcategory": "Tường",
    "projectType": "chung_cu",
    "sourceKey": "da_lanh_to",
    "note": "Cần xác nhận: 'đà lanh tô' hay 'dầm lanh tô'."
  },
  {
    "code": "CV-022",
    "name": "Đá Gác Cửa Ban Công",
    "unit": "Hệ",
    "aliases": [
      "Đá bậu cửa ban công"
    ],
    "category": "2. Xây thô / Hoàn thiện",
    "subcategory": "Tường",
    "projectType": "chung_cu",
    "sourceKey": "da_gac_cua_ban_cong",
    "note": "Cần xác nhận nghĩa gốc."
  },
  {
    "code": "CV-023",
    "name": "Hệ Khung Chỉ Thạch Cao",
    "unit": "m²",
    "aliases": [
      "Khung xương chỉ thạch cao"
    ],
    "category": "2. Xây thô / Hoàn thiện",
    "subcategory": "Tường",
    "projectType": "chung_cu",
    "sourceKey": "he_khung_chi_thach_cao",
    "note": ""
  },
  {
    "code": "CV-024",
    "name": "Ốp Gạch Tường WC",
    "unit": "m²",
    "aliases": [
      "Ốp gạch tường nhà vệ sinh"
    ],
    "category": "2. Xây thô / Hoàn thiện",
    "subcategory": "Tường",
    "projectType": "chung_cu",
    "sourceKey": "op_gach_tuong_wc",
    "note": ""
  },
  {
    "code": "CV-025",
    "name": "Nhân Công Tường Gạch Kính",
    "unit": "m²",
    "aliases": [
      "Thi công tường gạch kính"
    ],
    "category": "2. Xây thô / Hoàn thiện",
    "subcategory": "Tường",
    "projectType": "chung_cu",
    "sourceKey": "nc_tuong_gach_kinh",
    "note": ""
  },
  {
    "code": "CV-026",
    "name": "Chỉ Thạch Cao Đúc Vòm Cong",
    "unit": "m (mét dài)",
    "aliases": [
      "Phào thạch cao vòm cong"
    ],
    "category": "2. Xây thô / Hoàn thiện",
    "subcategory": "Tường",
    "projectType": "chung_cu",
    "sourceKey": "chi_thach_cao_duc_vom_cong",
    "note": ""
  },
  {
    "code": "CV-027",
    "name": "Trần Thạch Cao Phẳng",
    "unit": "m²",
    "aliases": [
      "Trần thạch cao trơn"
    ],
    "category": "2. Xây thô / Hoàn thiện",
    "subcategory": "Trần",
    "projectType": "chung_cu",
    "sourceKey": "tran_thach_cao_phang",
    "note": ""
  },
  {
    "code": "CV-028",
    "name": "Trần Thạch Cao WC Chống Ẩm",
    "unit": "m²",
    "aliases": [
      "Trần thạch cao chống ẩm nhà vệ sinh"
    ],
    "category": "2. Xây thô / Hoàn thiện",
    "subcategory": "Trần",
    "projectType": "chung_cu",
    "sourceKey": "tran_thach_cao_wc_chong_am",
    "note": ""
  },
  {
    "code": "CV-029",
    "name": "Nắp Thăm Trần Thường",
    "unit": "Cái",
    "aliases": [
      "Cửa thăm trần thường"
    ],
    "category": "2. Xây thô / Hoàn thiện",
    "subcategory": "Trần",
    "projectType": "chung_cu",
    "sourceKey": "nap_tham_tran_thuong",
    "note": ""
  },
  {
    "code": "CV-030",
    "name": "Nắp Thăm Trần Hệ Âm",
    "unit": "Cái",
    "aliases": [
      "Cửa thăm trần âm"
    ],
    "category": "2. Xây thô / Hoàn thiện",
    "subcategory": "Trần",
    "projectType": "chung_cu",
    "sourceKey": "nap_tham_tran_he_am",
    "note": ""
  },
  {
    "code": "CV-031",
    "name": "Cải Tạo Trần Lợp Tôn",
    "unit": "Gói",
    "aliases": [
      "Sửa trần mái tôn"
    ],
    "category": "2. Xây thô / Hoàn thiện",
    "subcategory": "Trần",
    "projectType": "chung_cu",
    "sourceKey": "cai_tao_tran_lop_tole",
    "note": ""
  },
  {
    "code": "CV-032",
    "name": "Nẹp Nhựa PS Trần",
    "unit": "Gói",
    "aliases": [
      "Nẹp PS trần thạch cao"
    ],
    "category": "2. Xây thô / Hoàn thiện",
    "subcategory": "Trần",
    "projectType": "chung_cu",
    "sourceKey": "nep_nhua_ps_tran",
    "note": ""
  },
  {
    "code": "CV-033",
    "name": "Sơn Bả Trần Tường Hoàn Thiện",
    "unit": "m²",
    "aliases": [
      "Bả sơn hoàn thiện trần tường"
    ],
    "category": "2. Xây thô / Hoàn thiện",
    "subcategory": "Sơn bả",
    "projectType": "chung_cu",
    "sourceKey": "son_ba_tran_tuong_hoan_thien",
    "note": ""
  },
  {
    "code": "CV-034",
    "name": "Vách Kính Cường Lực 10mm",
    "unit": "Hệ",
    "aliases": [
      "Vách kính cường lực dày 10mm"
    ],
    "category": "2. Xây thô / Hoàn thiện",
    "subcategory": "Kính vách",
    "projectType": "chung_cu",
    "sourceKey": "vach_kinh_cuong_luc_10mm",
    "note": ""
  },
  {
    "code": "CV-035",
    "name": "Gạch Sàn Lối Vào",
    "unit": "m²",
    "aliases": [
      "Gạch lát sảnh lối vào"
    ],
    "category": "3. Gạch ốp lát",
    "subcategory": "gach_op_lat",
    "projectType": "chung_cu",
    "sourceKey": "gach_san_loi_vao",
    "note": ""
  },
  {
    "code": "CV-036",
    "name": "Gạch Sàn Bếp",
    "unit": "m²",
    "aliases": [
      "Gạch lát nền bếp"
    ],
    "category": "3. Gạch ốp lát",
    "subcategory": "gach_op_lat",
    "projectType": "chung_cu",
    "sourceKey": "gach_san_bep",
    "note": ""
  },
  {
    "code": "CV-037",
    "name": "Gạch Ốp Tường WC",
    "unit": "m²",
    "aliases": [
      "Gạch ốp tường nhà vệ sinh"
    ],
    "category": "3. Gạch ốp lát",
    "subcategory": "gach_op_lat",
    "projectType": "chung_cu",
    "sourceKey": "gach_op_tuong_wc",
    "note": ""
  },
  {
    "code": "CV-038",
    "name": "Gạch Kính Đặc",
    "unit": "Viên",
    "aliases": [
      "Gạch kính lấy sáng"
    ],
    "category": "3. Gạch ốp lát",
    "subcategory": "gach_op_lat",
    "projectType": "chung_cu",
    "sourceKey": "gach_kinh_dac",
    "note": ""
  },
  {
    "code": "CV-039",
    "name": "Nhân Công Cải Tạo Điện",
    "unit": "m²",
    "aliases": [
      "Đi dây điện cải tạo"
    ],
    "category": "4. M&E (Điện – Nước – Điều hòa)",
    "subcategory": "me_dien_nuoc_dieu_hoa",
    "projectType": "chung_cu",
    "sourceKey": "nc_cai_tao_dien",
    "note": ""
  },
  {
    "code": "CV-040",
    "name": "Vật Tư Thi Công Điện Dự Kiến",
    "unit": "Hệ",
    "aliases": [
      "Vật tư điện dự trù"
    ],
    "category": "4. M&E (Điện – Nước – Điều hòa)",
    "subcategory": "me_dien_nuoc_dieu_hoa",
    "projectType": "chung_cu",
    "sourceKey": "vt_thi_cong_dien_du_kien",
    "note": ""
  },
  {
    "code": "CV-041",
    "name": "Nhân Công Cải Tạo Cấp Thoát Bếp",
    "unit": "Gói",
    "aliases": [
      "Cải tạo đường ống cấp thoát bếp"
    ],
    "category": "4. M&E (Điện – Nước – Điều hòa)",
    "subcategory": "me_dien_nuoc_dieu_hoa",
    "projectType": "chung_cu",
    "sourceKey": "nc_cai_tao_cap_thoat_bep",
    "note": ""
  },
  {
    "code": "CV-042",
    "name": "Hệ Chiếu Sáng Basic/Premium",
    "unit": "Hệ",
    "aliases": [
      "Hệ thống đèn Basic Premium"
    ],
    "category": "4. M&E (Điện – Nước – Điều hòa)",
    "subcategory": "me_dien_nuoc_dieu_hoa",
    "projectType": "chung_cu",
    "sourceKey": "he_chieu_sang_basic_premium",
    "note": ""
  },
  {
    "code": "CV-043",
    "name": "Đèn Chiếu Sáng Anfaco",
    "unit": "Cái",
    "aliases": [
      "Đèn downlight Anfaco"
    ],
    "category": "4. M&E (Điện – Nước – Điều hòa)",
    "subcategory": "me_dien_nuoc_dieu_hoa",
    "projectType": "chung_cu",
    "sourceKey": "den_chieu_sang_anfaco",
    "note": ""
  },
  {
    "code": "CV-044",
    "name": "Đèn Chiếu Điểm Anfaco",
    "unit": "Cái",
    "aliases": [
      "Đèn spotlight Anfaco",
      "Đèn rọi điểm"
    ],
    "category": "4. M&E (Điện – Nước – Điều hòa)",
    "subcategory": "me_dien_nuoc_dieu_hoa",
    "projectType": "chung_cu",
    "sourceKey": "den_chieu_diem_anfaco",
    "note": ""
  },
  {
    "code": "CV-045",
    "name": "Đèn Rọi Anfaco",
    "unit": "Cái",
    "aliases": [
      "Đèn rọi ray Anfaco"
    ],
    "category": "4. M&E (Điện – Nước – Điều hòa)",
    "subcategory": "me_dien_nuoc_dieu_hoa",
    "projectType": "chung_cu",
    "sourceKey": "den_roi_anfaco",
    "note": ""
  },
  {
    "code": "CV-046",
    "name": "Thanh Ray Nam Châm",
    "unit": "md (mét dài)",
    "aliases": [
      "Ray đèn nam châm",
      "Thanh magnetic track"
    ],
    "category": "4. M&E (Điện – Nước – Điều hòa)",
    "subcategory": "me_dien_nuoc_dieu_hoa",
    "projectType": "chung_cu",
    "sourceKey": "thanh_ray_nam_cham",
    "note": ""
  },
  {
    "code": "CV-047",
    "name": "Nối Ray Nam Châm",
    "unit": "Cái",
    "aliases": [
      "Khớp nối ray nam châm"
    ],
    "category": "4. M&E (Điện – Nước – Điều hòa)",
    "subcategory": "me_dien_nuoc_dieu_hoa",
    "projectType": "chung_cu",
    "sourceKey": "noi_ray_nam_cham",
    "note": ""
  },
  {
    "code": "CV-048",
    "name": "Nguồn Ray Nam Châm",
    "unit": "Cái",
    "aliases": [
      "Bộ nguồn ray nam châm"
    ],
    "category": "4. M&E (Điện – Nước – Điều hòa)",
    "subcategory": "me_dien_nuoc_dieu_hoa",
    "projectType": "chung_cu",
    "sourceKey": "nguon_ray_nam_cham",
    "note": ""
  },
  {
    "code": "CV-049",
    "name": "Đèn Nam Châm",
    "unit": "Cái",
    "aliases": [
      "Đèn track nam châm",
      "Đèn magnetic"
    ],
    "category": "4. M&E (Điện – Nước – Điều hòa)",
    "subcategory": "me_dien_nuoc_dieu_hoa",
    "projectType": "chung_cu",
    "sourceKey": "den_nam_cham",
    "note": ""
  },
  {
    "code": "CV-050",
    "name": "Quạt Hút Âm Trần",
    "unit": "Cái",
    "aliases": [
      "Quạt thông gió âm trần"
    ],
    "category": "4. M&E (Điện – Nước – Điều hòa)",
    "subcategory": "me_dien_nuoc_dieu_hoa",
    "projectType": "chung_cu",
    "sourceKey": "quat_hut_am_tran",
    "note": ""
  },
  {
    "code": "CV-051",
    "name": "Ống Đồng 6-12 Máy Lạnh",
    "unit": "m (mét dài)",
    "aliases": [
      "Ống đồng máy lạnh phi 6-12"
    ],
    "category": "4. M&E (Điện – Nước – Điều hòa)",
    "subcategory": "me_dien_nuoc_dieu_hoa",
    "projectType": "chung_cu",
    "sourceKey": "ong_dong_6_12_may_lanh",
    "note": ""
  },
  {
    "code": "CV-052",
    "name": "Ống Đồng 6-10 Máy Lạnh",
    "unit": "m (mét dài)",
    "aliases": [
      "Ống đồng máy lạnh phi 6-10"
    ],
    "category": "4. M&E (Điện – Nước – Điều hòa)",
    "subcategory": "me_dien_nuoc_dieu_hoa",
    "projectType": "chung_cu",
    "sourceKey": "ong_dong_6_10_may_lanh",
    "note": ""
  },
  {
    "code": "CV-053",
    "name": "Lắp Máy Lạnh Treo Tường",
    "unit": "Cái",
    "aliases": [
      "Lắp đặt điều hòa treo tường"
    ],
    "category": "4. M&E (Điện – Nước – Điều hòa)",
    "subcategory": "me_dien_nuoc_dieu_hoa",
    "projectType": "chung_cu",
    "sourceKey": "lap_may_lanh_treo_tuong",
    "note": ""
  },
  {
    "code": "CV-054",
    "name": "Vật Tư Phụ + Kệ Đỡ Máy Lạnh",
    "unit": "Máy",
    "aliases": [
      "Giá đỡ máy lạnh",
      "Vật tư phụ lắp máy lạnh"
    ],
    "category": "4. M&E (Điện – Nước – Điều hòa)",
    "subcategory": "me_dien_nuoc_dieu_hoa",
    "projectType": "chung_cu",
    "sourceKey": "vat_tu_phu_ke_do_may_lanh",
    "note": ""
  },
  {
    "code": "CV-055",
    "name": "Lắp Thiết Bị Vệ Sinh",
    "unit": "Bộ (WC)",
    "aliases": [
      "Lắp đặt TBVS"
    ],
    "category": "4. M&E (Điện – Nước – Điều hòa)",
    "subcategory": "me_dien_nuoc_dieu_hoa",
    "projectType": "chung_cu",
    "sourceKey": "lap_thiet_bi_ve_sinh",
    "note": ""
  },
  {
    "code": "CV-056",
    "name": "Vật Tư Phụ Lắp TBVS",
    "unit": "Gói",
    "aliases": [
      "Vật tư phụ thiết bị vệ sinh"
    ],
    "category": "4. M&E (Điện – Nước – Điều hòa)",
    "subcategory": "me_dien_nuoc_dieu_hoa",
    "projectType": "chung_cu",
    "sourceKey": "vat_tu_phu_lap_tbvs",
    "note": ""
  },
  {
    "code": "CV-057",
    "name": "Di Dời Đầu Báo Cháy",
    "unit": "Hệ",
    "aliases": [
      "Dời đầu báo khói PCCC"
    ],
    "category": "4. M&E (Điện – Nước – Điều hòa)",
    "subcategory": "me_dien_nuoc_dieu_hoa",
    "projectType": "chung_cu",
    "sourceKey": "di_doi_dau_bao_chay",
    "note": ""
  },
  {
    "code": "CV-058",
    "name": "Cửa Giấu Khuôn Tận Dụng",
    "unit": "Bộ",
    "aliases": [
      "Cửa giấu khuôn (khung cũ tận dụng)"
    ],
    "category": "5. Cửa & Vách ốp",
    "subcategory": "cua_va_vach_op",
    "projectType": "chung_cu",
    "sourceKey": "cua_giau_khuon_tan_dung",
    "note": ""
  },
  {
    "code": "CV-059",
    "name": "Cửa Giấu Khuôn Mới Khung Gỗ",
    "unit": "Bộ",
    "aliases": [
      "Cửa giấu khuôn khung gỗ mới"
    ],
    "category": "5. Cửa & Vách ốp",
    "subcategory": "cua_va_vach_op",
    "projectType": "chung_cu",
    "sourceKey": "cua_giau_khuon_moi_khung_go",
    "note": ""
  },
  {
    "code": "CV-060",
    "name": "Cửa Đi Thường Sơn 2K",
    "unit": "Bộ",
    "aliases": [
      "Cửa gỗ công nghiệp sơn 2K"
    ],
    "category": "5. Cửa & Vách ốp",
    "subcategory": "cua_va_vach_op",
    "projectType": "chung_cu",
    "sourceKey": "cua_di_thuong_son_2k",
    "note": ""
  },
  {
    "code": "CV-061",
    "name": "Cửa WC Gỗ Nhựa Sơn 2K",
    "unit": "Bộ",
    "aliases": [
      "Cửa nhà vệ sinh gỗ nhựa Composite sơn 2K"
    ],
    "category": "5. Cửa & Vách ốp",
    "subcategory": "cua_va_vach_op",
    "projectType": "chung_cu",
    "sourceKey": "cua_wc_go_nhua_son_2k",
    "note": ""
  },
  {
    "code": "CV-062",
    "name": "Hệ Cửa Slim Lùa",
    "unit": "m²",
    "aliases": [
      "Cửa lùa khung nhôm Slim"
    ],
    "category": "5. Cửa & Vách ốp",
    "subcategory": "cua_va_vach_op",
    "projectType": "chung_cu",
    "sourceKey": "he_cua_slim_lua",
    "note": ""
  },
  {
    "code": "CV-063",
    "name": "Hệ Cửa Lùa Ban Công Xingfa 93",
    "unit": "m²",
    "aliases": [
      "Cửa lùa nhôm Xingfa 93 ban công"
    ],
    "category": "5. Cửa & Vách ốp",
    "subcategory": "cua_va_vach_op",
    "projectType": "chung_cu",
    "sourceKey": "he_cua_lua_ban_cong_xinfa93",
    "note": ""
  },
  {
    "code": "CV-064",
    "name": "Bản Lề Âm Hafele",
    "unit": "Cái",
    "aliases": [
      "Bản lề âm bốn khớp Hafele"
    ],
    "category": "5. Cửa & Vách ốp",
    "subcategory": "cua_va_vach_op",
    "projectType": "chung_cu",
    "sourceKey": "ban_le_am_hafele",
    "note": ""
  },
  {
    "code": "CV-065",
    "name": "Tay Nắm + Khóa Cửa Hafele",
    "unit": "Bộ",
    "aliases": [
      "Bộ khóa tay nắm Hafele"
    ],
    "category": "5. Cửa & Vách ốp",
    "subcategory": "cua_va_vach_op",
    "projectType": "chung_cu",
    "sourceKey": "tay_nam_khoa_cua_hafele",
    "note": ""
  },
  {
    "code": "CV-066",
    "name": "Sơn Cửa WC 5 Lớp",
    "unit": "Bộ",
    "aliases": [
      "Sơn phủ cửa WC 5 lớp"
    ],
    "category": "5. Cửa & Vách ốp",
    "subcategory": "cua_va_vach_op",
    "projectType": "chung_cu",
    "sourceKey": "son_cua_wc_5_lop",
    "note": ""
  },
  {
    "code": "CV-067",
    "name": "Vách Ốp Cửa Giấu Khuôn Sơn 2K",
    "unit": "m²",
    "aliases": [
      "Vách ốp cùng bộ cửa giấu khuôn sơn 2K"
    ],
    "category": "5. Cửa & Vách ốp",
    "subcategory": "cua_va_vach_op",
    "projectType": "chung_cu",
    "sourceKey": "vach_op_cua_giau_khuon_son_2k",
    "note": ""
  },
  {
    "code": "CV-068",
    "name": "Vách Ốp Cửa Giấu Khuôn Melamine",
    "unit": "m²",
    "aliases": [
      "Vách ốp cửa giấu khuôn phủ Melamine"
    ],
    "category": "5. Cửa & Vách ốp",
    "subcategory": "cua_va_vach_op",
    "projectType": "chung_cu",
    "sourceKey": "vach_op_cua_giau_khuon_melamin",
    "note": ""
  },
  {
    "code": "CV-069",
    "name": "Gia Cố Trần Khung Sắt",
    "unit": "Hệ",
    "aliases": [
      "Gia cường trần bằng khung sắt"
    ],
    "category": "5. Cửa & Vách ốp",
    "subcategory": "cua_va_vach_op",
    "projectType": "chung_cu",
    "sourceKey": "gia_co_tran_khung_sat",
    "note": ""
  },
  {
    "code": "CV-070",
    "name": "Tủ Bếp Dưới Cao 800 Sâu 600",
    "unit": "md (mét dài)",
    "aliases": [
      "Tủ bếp dưới 800x600"
    ],
    "category": "6. Nội thất gỗ",
    "subcategory": "Tủ bếp",
    "projectType": "chung_cu",
    "sourceKey": "bep_duoi_cao800_sau600",
    "note": ""
  },
  {
    "code": "CV-071",
    "name": "Tủ Bếp Trên Cao 800 Sâu 350",
    "unit": "md (mét dài)",
    "aliases": [
      "Tủ bếp trên 800x350"
    ],
    "category": "6. Nội thất gỗ",
    "subcategory": "Tủ bếp",
    "projectType": "chung_cu",
    "sourceKey": "bep_tren_cao800_sau350",
    "note": ""
  },
  {
    "code": "CV-072",
    "name": "Tủ Bếp Bao Tủ Lạnh Sâu 600",
    "unit": "m²",
    "aliases": [
      "Tủ bao tủ lạnh sâu 600"
    ],
    "category": "6. Nội thất gỗ",
    "subcategory": "Tủ bếp",
    "projectType": "chung_cu",
    "sourceKey": "tu_bep_tu_lanh_sau600",
    "note": ""
  },
  {
    "code": "CV-073",
    "name": "Hệ Tủ Lạnh Combo 900x2500",
    "unit": "Hệ",
    "aliases": [
      "Tủ tích hợp tủ lạnh 900x2500"
    ],
    "category": "6. Nội thất gỗ",
    "subcategory": "Tủ bếp",
    "projectType": "chung_cu",
    "sourceKey": "he_tu_lanh_combo_900x2500",
    "note": ""
  },
  {
    "code": "CV-074",
    "name": "Quầy Đảo Bếp Cao 1000 Sâu 600",
    "unit": "md (mét dài)",
    "aliases": [
      "Đảo bếp 1000x600"
    ],
    "category": "6. Nội thất gỗ",
    "subcategory": "Tủ bếp",
    "projectType": "chung_cu",
    "sourceKey": "quay_dao_bep_cao1000_sau600",
    "note": ""
  },
  {
    "code": "CV-075",
    "name": "Mặt Đá Nung Kết Lamar",
    "unit": "m²",
    "aliases": [
      "Đá Solid Surface Lamar",
      "Mặt bàn đá Lamar"
    ],
    "category": "6. Nội thất gỗ",
    "subcategory": "Tủ bếp",
    "projectType": "chung_cu",
    "sourceKey": "mat_da_nung_ket_lamar",
    "note": ""
  },
  {
    "code": "CV-076",
    "name": "Mặt Đá Vicostone Q-Quartz",
    "unit": "m²",
    "aliases": [
      "Mặt đá thạch anh Vicostone QQuartz"
    ],
    "category": "6. Nội thất gỗ",
    "subcategory": "Tủ bếp",
    "projectType": "chung_cu",
    "sourceKey": "mat_da_vicostone_qquartz",
    "note": ""
  },
  {
    "code": "CV-077",
    "name": "Tủ Đồ Khô / Pha Chế",
    "unit": "m²",
    "aliases": [
      "Tủ kho đồ khô pha chế"
    ],
    "category": "6. Nội thất gỗ",
    "subcategory": "Tủ bếp",
    "projectType": "chung_cu",
    "sourceKey": "tu_do_kho_pha",
    "note": "Cần xác nhận nghĩa gốc ('kho pha')."
  },
  {
    "code": "CV-078",
    "name": "Tủ Bar Kệ Top",
    "unit": "m²",
    "aliases": [
      "Quầy bar mặt kệ"
    ],
    "category": "6. Nội thất gỗ",
    "subcategory": "Tủ bếp",
    "projectType": "chung_cu",
    "sourceKey": "tu_bar_ke_top",
    "note": ""
  },
  {
    "code": "CV-079",
    "name": "Tủ Bar Trên Cánh Kính",
    "unit": "md (mét dài)",
    "aliases": [
      "Tủ bar trên cửa kính"
    ],
    "category": "6. Nội thất gỗ",
    "subcategory": "Tủ bếp",
    "projectType": "chung_cu",
    "sourceKey": "tu_bar_tren_canh_kinh",
    "note": ""
  },
  {
    "code": "CV-080",
    "name": "Tủ Bar Dưới",
    "unit": "md (mét dài)",
    "aliases": [
      "Tủ bar phần dưới"
    ],
    "category": "6. Nội thất gỗ",
    "subcategory": "Tủ bếp",
    "projectType": "chung_cu",
    "sourceKey": "tu_bar_duoi",
    "note": ""
  },
  {
    "code": "CV-081",
    "name": "Tủ Áo Sâu Dưới 600",
    "unit": "m²",
    "aliases": [
      "Tủ quần áo sâu dưới 600"
    ],
    "category": "6. Nội thất gỗ",
    "subcategory": "Tủ áo / Trang trí",
    "projectType": "chung_cu",
    "sourceKey": "tu_ao_sau_duoi_600",
    "note": ""
  },
  {
    "code": "CV-082",
    "name": "Tủ Trang Trí Rượu/Giày Sâu Dưới 350",
    "unit": "m²",
    "aliases": [
      "Tủ rượu giày trang trí sâu dưới 350"
    ],
    "category": "6. Nội thất gỗ",
    "subcategory": "Tủ áo / Trang trí",
    "projectType": "chung_cu",
    "sourceKey": "tu_trang_tri_ruou_giay_sau_duoi_350",
    "note": ""
  },
  {
    "code": "CV-083",
    "name": "Tủ Quần Áo Cánh Nhôm Kính Master",
    "unit": "m²",
    "aliases": [
      "Tủ áo phòng master cánh nhôm kính"
    ],
    "category": "6. Nội thất gỗ",
    "subcategory": "Tủ áo / Trang trí",
    "projectType": "chung_cu",
    "sourceKey": "tu_quan_ao_canh_nhom_kinh_master",
    "note": ""
  },
  {
    "code": "CV-084",
    "name": "Hệ Tủ Đèn Cánh Kính Thủy",
    "unit": "m²",
    "aliases": [
      "Tủ có đèn, cánh kính thủy"
    ],
    "category": "6. Nội thất gỗ",
    "subcategory": "Tủ áo / Trang trí",
    "projectType": "chung_cu",
    "sourceKey": "he_tu_den_canh_kinh_thuy",
    "note": ""
  },
  {
    "code": "CV-085",
    "name": "Tủ Trang Trí Travertine Giả Đá",
    "unit": "m²",
    "aliases": [
      "Tủ trang trí đá Travertine giả"
    ],
    "category": "6. Nội thất gỗ",
    "subcategory": "Tủ áo / Trang trí",
    "projectType": "chung_cu",
    "sourceKey": "tu_trang_tri_travertine_gia_da",
    "note": ""
  },
  {
    "code": "CV-086",
    "name": "Tủ Console",
    "unit": "m²",
    "aliases": [
      "Bàn tủ console phòng khách"
    ],
    "category": "6. Nội thất gỗ",
    "subcategory": "Tủ áo / Trang trí",
    "projectType": "chung_cu",
    "sourceKey": "tu_console",
    "note": ""
  },
  {
    "code": "CV-087",
    "name": "Tủ Sách Lùa Cánh Kính",
    "unit": "m²",
    "aliases": [
      "Kệ sách cửa lùa kính"
    ],
    "category": "6. Nội thất gỗ",
    "subcategory": "Tủ áo / Trang trí",
    "projectType": "chung_cu",
    "sourceKey": "tu_sach_lua_canh_kinh",
    "note": ""
  },
  {
    "code": "CV-088",
    "name": "Tủ Sách Thường",
    "unit": "m²",
    "aliases": [
      "Kệ sách tiêu chuẩn"
    ],
    "category": "6. Nội thất gỗ",
    "subcategory": "Tủ áo / Trang trí",
    "projectType": "chung_cu",
    "sourceKey": "tu_sach_thuong",
    "note": ""
  },
  {
    "code": "CV-089",
    "name": "Tủ Lưu Trữ Phòng Khách",
    "unit": "m²",
    "aliases": [
      "Tủ kệ lưu trữ phòng khách"
    ],
    "category": "6. Nội thất gỗ",
    "subcategory": "Tủ áo / Trang trí",
    "projectType": "chung_cu",
    "sourceKey": "tu_luu_tru_phong_khach",
    "note": ""
  },
  {
    "code": "CV-090",
    "name": "Tủ Giày Cánh Panô Sơn 2K",
    "unit": "m²",
    "aliases": [
      "Tủ giày cánh phào chỉ sơn 2K"
    ],
    "category": "6. Nội thất gỗ",
    "subcategory": "Tủ áo / Trang trí",
    "projectType": "chung_cu",
    "sourceKey": "tu_giay_canh_pano_son_2k",
    "note": ""
  },
  {
    "code": "CV-091",
    "name": "Ngăn Kéo Tủ Giày Travertine",
    "unit": "Cái",
    "aliases": [
      "Hộc kéo tủ giày ốp Travertine"
    ],
    "category": "6. Nội thất gỗ",
    "subcategory": "Tủ áo / Trang trí",
    "projectType": "chung_cu",
    "sourceKey": "ngan_keo_tu_giay_travertine",
    "note": ""
  },
  {
    "code": "CV-092",
    "name": "Bàn Làm Việc / Kệ TV Dưới 1400",
    "unit": "Cái",
    "aliases": [
      "Bàn làm việc-kệ tivi dưới 1400"
    ],
    "category": "6. Nội thất gỗ",
    "subcategory": "Bàn kệ TV / Trang điểm",
    "projectType": "chung_cu",
    "sourceKey": "ban_lam_viec_ke_tv_duoi_1400",
    "note": ""
  },
  {
    "code": "CV-093",
    "name": "Bàn Làm Việc / Kệ TV Trên 1400",
    "unit": "md (mét dài)",
    "aliases": [
      "Bàn làm việc-kệ tivi trên 1400"
    ],
    "category": "6. Nội thất gỗ",
    "subcategory": "Bàn kệ TV / Trang điểm",
    "projectType": "chung_cu",
    "sourceKey": "ban_lam_viec_ke_tv_tren_1400",
    "note": ""
  },
  {
    "code": "CV-094",
    "name": "Bàn Làm Việc Mặt Đá Trắng Sứ",
    "unit": "Bộ",
    "aliases": [
      "Bàn làm việc mặt đá"
    ],
    "category": "6. Nội thất gỗ",
    "subcategory": "Bàn kệ TV / Trang điểm",
    "projectType": "chung_cu",
    "sourceKey": "ban_lam_viec_mat_da_trang_su",
    "note": "Cần xác nhận nghĩa gốc ('trang su')."
  },
  {
    "code": "CV-095",
    "name": "Bàn Trang Điểm Có Kính + Ghế",
    "unit": "Bộ",
    "aliases": [
      "Bàn trang điểm kèm gương, ghế"
    ],
    "category": "6. Nội thất gỗ",
    "subcategory": "Bàn kệ TV / Trang điểm",
    "projectType": "chung_cu",
    "sourceKey": "ban_trang_diem_co_kinh_ghe",
    "note": ""
  },
  {
    "code": "CV-096",
    "name": "Đảo Trang Điểm Panô Sơn 2K",
    "unit": "Hệ",
    "aliases": [
      "Bàn đảo trang điểm sơn 2K"
    ],
    "category": "6. Nội thất gỗ",
    "subcategory": "Bàn kệ TV / Trang điểm",
    "projectType": "chung_cu",
    "sourceKey": "dao_trang_diem_pano_son_2k",
    "note": ""
  },
  {
    "code": "CV-097",
    "name": "Kệ TV Dài Sơn 2K",
    "unit": "md (mét dài)",
    "aliases": [
      "Kệ tivi dài sơn 2K"
    ],
    "category": "6. Nội thất gỗ",
    "subcategory": "Bàn kệ TV / Trang điểm",
    "projectType": "chung_cu",
    "sourceKey": "ke_tv_dai_son_2k",
    "note": ""
  },
  {
    "code": "CV-098",
    "name": "Tủ Tivi Sơn 2K",
    "unit": "md (mét dài)",
    "aliases": [
      "Kệ tủ tivi sơn 2K"
    ],
    "category": "6. Nội thất gỗ",
    "subcategory": "Bàn kệ TV / Trang điểm",
    "projectType": "chung_cu",
    "sourceKey": "tu_tivi_son_2k",
    "note": ""
  },
  {
    "code": "CV-099",
    "name": "Gương 1400",
    "unit": "Cái",
    "aliases": [
      "Gương soi 1400mm"
    ],
    "category": "6. Nội thất gỗ",
    "subcategory": "Gương / Tab / Giường",
    "projectType": "chung_cu",
    "sourceKey": "guong_1400",
    "note": ""
  },
  {
    "code": "CV-100",
    "name": "Gương 1600",
    "unit": "Cái",
    "aliases": [
      "Gương soi 1600mm"
    ],
    "category": "6. Nội thất gỗ",
    "subcategory": "Gương / Tab / Giường",
    "projectType": "chung_cu",
    "sourceKey": "guong_1600",
    "note": ""
  },
  {
    "code": "CV-101",
    "name": "Gương 1800",
    "unit": "Cái",
    "aliases": [
      "Gương soi 1800mm"
    ],
    "category": "6. Nội thất gỗ",
    "subcategory": "Gương / Tab / Giường",
    "projectType": "chung_cu",
    "sourceKey": "guong_1800",
    "note": ""
  },
  {
    "code": "CV-102",
    "name": "Gương Quá Khổ Bạc Gỗ",
    "unit": "m²",
    "aliases": [
      "Gương lớn khổ rộng viền gỗ"
    ],
    "category": "6. Nội thất gỗ",
    "subcategory": "Gương / Tab / Giường",
    "projectType": "chung_cu",
    "sourceKey": "guong_qua_kho_bac_go",
    "note": "Cần xác nhận nghĩa gốc ('qua kho')."
  },
  {
    "code": "CV-103",
    "name": "Gương Soi Toàn Thân",
    "unit": "Tấm",
    "aliases": [
      "Gương toàn thân"
    ],
    "category": "6. Nội thất gỗ",
    "subcategory": "Gương / Tab / Giường",
    "projectType": "chung_cu",
    "sourceKey": "guong_soi_toan_than",
    "note": ""
  },
  {
    "code": "CV-104",
    "name": "Gương Soi Nhỏ",
    "unit": "Cái",
    "aliases": [
      "Gương soi cỡ nhỏ"
    ],
    "category": "6. Nội thất gỗ",
    "subcategory": "Gương / Tab / Giường",
    "projectType": "chung_cu",
    "sourceKey": "guong_soi_nho",
    "note": ""
  },
  {
    "code": "CV-105",
    "name": "Táp Đầu Giường",
    "unit": "Cái",
    "aliases": [
      "Kệ táp đầu giường"
    ],
    "category": "6. Nội thất gỗ",
    "subcategory": "Gương / Tab / Giường",
    "projectType": "chung_cu",
    "sourceKey": "tab_dau_guong",
    "note": ""
  },
  {
    "code": "CV-106",
    "name": "Giường Bọc Nệm Master",
    "unit": "Cái",
    "aliases": [
      "Giường bọc da/vải phòng master"
    ],
    "category": "6. Nội thất gỗ",
    "subcategory": "Gương / Tab / Giường",
    "projectType": "chung_cu",
    "sourceKey": "giuong_boc_nem_master",
    "note": ""
  },
  {
    "code": "CV-107",
    "name": "Giường Bãy Nhỏ",
    "unit": "m²",
    "aliases": [
      "Giường phòng ngủ nhỏ"
    ],
    "category": "6. Nội thất gỗ",
    "subcategory": "Gương / Tab / Giường",
    "projectType": "chung_cu",
    "sourceKey": "giuong_bay_nho",
    "note": "Cần xác nhận nghĩa gốc ('bay')."
  },
  {
    "code": "CV-108",
    "name": "Giường Có Hộc Kéo",
    "unit": "Cái",
    "aliases": [
      "Giường ngăn kéo"
    ],
    "category": "6. Nội thất gỗ",
    "subcategory": "Gương / Tab / Giường",
    "projectType": "chung_cu",
    "sourceKey": "giuong_co_hoc_keo",
    "note": ""
  },
  {
    "code": "CV-109",
    "name": "Tủ Tháp Đầu Giường",
    "unit": "md (mét dài)",
    "aliases": [
      "Tủ đầu giường dạng tháp"
    ],
    "category": "6. Nội thất gỗ",
    "subcategory": "Gương / Tab / Giường",
    "projectType": "chung_cu",
    "sourceKey": "tu_thap_dau_giuong",
    "note": ""
  },
  {
    "code": "CV-110",
    "name": "Vách Ốp Đầu Giường Gỗ",
    "unit": "m²",
    "aliases": [
      "Vách gỗ đầu giường"
    ],
    "category": "6. Nội thất gỗ",
    "subcategory": "Gương / Tab / Giường",
    "projectType": "chung_cu",
    "sourceKey": "vach_op_dau_giuong_go",
    "note": ""
  },
  {
    "code": "CV-111",
    "name": "Vách Ốp Đầu Giường Travertine",
    "unit": "m²",
    "aliases": [
      "Vách đá Travertine đầu giường"
    ],
    "category": "6. Nội thất gỗ",
    "subcategory": "Gương / Tab / Giường",
    "projectType": "chung_cu",
    "sourceKey": "vach_op_dau_giuong_travertine",
    "note": ""
  },
  {
    "code": "CV-112",
    "name": "Vách Ốp Nệm Đầu Giường",
    "unit": "Cái",
    "aliases": [
      "Vách bọc nệm đầu giường"
    ],
    "category": "6. Nội thất gỗ",
    "subcategory": "Gương / Tab / Giường",
    "projectType": "chung_cu",
    "sourceKey": "vach_op_nem_dau_giuong",
    "note": ""
  },
  {
    "code": "CV-113",
    "name": "Trần Ốp Gỗ Phòng Ngủ",
    "unit": "m²",
    "aliases": [
      "Trần gỗ phòng ngủ"
    ],
    "category": "6. Nội thất gỗ",
    "subcategory": "Gương / Tab / Giường",
    "projectType": "chung_cu",
    "sourceKey": "tran_op_go_phong_ngu",
    "note": ""
  },
  {
    "code": "CV-114",
    "name": "Vách Phẳng Ốp Tường",
    "unit": "m²",
    "aliases": [
      "Vách gỗ phẳng ốp tường"
    ],
    "category": "6. Nội thất gỗ",
    "subcategory": "Vách ốp & Kệ",
    "projectType": "chung_cu",
    "sourceKey": "vach_phang_op_tuong",
    "note": ""
  },
  {
    "code": "CV-115",
    "name": "Vách Lam Ốp Tường",
    "unit": "m²",
    "aliases": [
      "Vách lam gỗ ốp tường"
    ],
    "category": "6. Nội thất gỗ",
    "subcategory": "Vách ốp & Kệ",
    "projectType": "chung_cu",
    "sourceKey": "vach_lam_op_tuong",
    "note": ""
  },
  {
    "code": "CV-116",
    "name": "Vách Lam Ngăn Phòng",
    "unit": "m²",
    "aliases": [
      "Vách lam gỗ ngăn phòng"
    ],
    "category": "6. Nội thất gỗ",
    "subcategory": "Vách ốp & Kệ",
    "projectType": "chung_cu",
    "sourceKey": "vach_lam_ngan_phong",
    "note": ""
  },
  {
    "code": "CV-117",
    "name": "Vách CNC Sơn Đậm Cạnh",
    "unit": "m²",
    "aliases": [
      "Vách hoa văn CNC sơn cạnh"
    ],
    "category": "6. Nội thất gỗ",
    "subcategory": "Vách ốp & Kệ",
    "projectType": "chung_cu",
    "sourceKey": "vach_cnc_son_dam_canh",
    "note": "Cần xác nhận nghĩa gốc ('dam canh')."
  },
  {
    "code": "CV-118",
    "name": "Vách Ốp Tivi CNC Sơn 2K",
    "unit": "m²",
    "aliases": [
      "Vách tivi hoa văn CNC sơn 2K"
    ],
    "category": "6. Nội thất gỗ",
    "subcategory": "Vách ốp & Kệ",
    "projectType": "chung_cu",
    "sourceKey": "vach_op_tivi_cnc_son_2k",
    "note": ""
  },
  {
    "code": "CV-119",
    "name": "Vách Ốp Tivi Giả Đá 3D",
    "unit": "m²",
    "aliases": [
      "Vách tivi ốp đá giả 3D"
    ],
    "category": "6. Nội thất gỗ",
    "subcategory": "Vách ốp & Kệ",
    "projectType": "chung_cu",
    "sourceKey": "vach_op_tivi_gia_da_3d",
    "note": ""
  },
  {
    "code": "CV-120",
    "name": "Vách Ốp Kệ Rãnh Sơn 2K",
    "unit": "m²",
    "aliases": [
      "Vách kệ khe rãnh sơn 2K"
    ],
    "category": "6. Nội thất gỗ",
    "subcategory": "Vách ốp & Kệ",
    "projectType": "chung_cu",
    "sourceKey": "vach_op_ke_ron_son_2k",
    "note": "Cần xác nhận nghĩa gốc ('ron')."
  },
  {
    "code": "CV-121",
    "name": "Vách Ốp Che Cột",
    "unit": "md (mét dài)",
    "aliases": [
      "Ốp che cột gỗ"
    ],
    "category": "6. Nội thất gỗ",
    "subcategory": "Vách ốp & Kệ",
    "projectType": "chung_cu",
    "sourceKey": "vach_op_che_cot",
    "note": ""
  },
  {
    "code": "CV-122",
    "name": "Đường Nhôm Bo Cong R100",
    "unit": "md (mét dài)",
    "aliases": [
      "Nẹp nhôm bo góc R100"
    ],
    "category": "6. Nội thất gỗ",
    "subcategory": "Vách ốp & Kệ",
    "projectType": "chung_cu",
    "sourceKey": "duong_nhom_bo_cong_r100",
    "note": ""
  },
  {
    "code": "CV-123",
    "name": "Kệ Ngang Dày 34",
    "unit": "md (mét dài)",
    "aliases": [
      "Kệ trang trí ngang dày 34mm"
    ],
    "category": "6. Nội thất gỗ",
    "subcategory": "Vách ốp & Kệ",
    "projectType": "chung_cu",
    "sourceKey": "ke_ngang_day_34",
    "note": ""
  },
  {
    "code": "CV-124",
    "name": "Kệ Sách Không Cánh",
    "unit": "Cái",
    "aliases": [
      "Kệ sách hở",
      "Kệ sách không cửa"
    ],
    "category": "6. Nội thất gỗ",
    "subcategory": "Vách ốp & Kệ",
    "projectType": "chung_cu",
    "sourceKey": "ke_sach_khong_canh",
    "note": ""
  },
  {
    "code": "CV-125",
    "name": "Tủ Lavabo Dưới 1000 Thường",
    "unit": "Cái",
    "aliases": [
      "Tủ lavabo tiêu chuẩn dưới 1000"
    ],
    "category": "6. Nội thất gỗ",
    "subcategory": "Tủ lavabo WC",
    "projectType": "chung_cu",
    "sourceKey": "tu_lavabo_duoi_1000_thuong",
    "note": ""
  },
  {
    "code": "CV-126",
    "name": "Tủ Lavabo Dưới 1000 Luxury",
    "unit": "Cái",
    "aliases": [
      "Tủ lavabo cao cấp dưới 1000"
    ],
    "category": "6. Nội thất gỗ",
    "subcategory": "Tủ lavabo WC",
    "projectType": "chung_cu",
    "sourceKey": "tu_lavabo_duoi_1000_luxury",
    "note": ""
  },
  {
    "code": "CV-127",
    "name": "Tủ Lavabo Trên 1000",
    "unit": "md (mét dài)",
    "aliases": [
      "Tủ lavabo trên 1000"
    ],
    "category": "6. Nội thất gỗ",
    "subcategory": "Tủ lavabo WC",
    "projectType": "chung_cu",
    "sourceKey": "tu_lavabo_tren_1000",
    "note": ""
  },
  {
    "code": "CV-128",
    "name": "Đá Mặt Lavabo Trắng Sứ",
    "unit": "Bộ",
    "aliases": [
      "Mặt đá lavabo màu trắng sứ"
    ],
    "category": "6. Nội thất gỗ",
    "subcategory": "Tủ lavabo WC",
    "projectType": "chung_cu",
    "sourceKey": "da_mat_lavabo_trang_su",
    "note": ""
  },
  {
    "code": "CV-129",
    "name": "Tủ Gương Kính Thủy Dưới 1000",
    "unit": "Cái",
    "aliases": [
      "Tủ gương kính thủy dưới 1000"
    ],
    "category": "6. Nội thất gỗ",
    "subcategory": "Tủ lavabo WC",
    "projectType": "chung_cu",
    "sourceKey": "tu_guong_kinh_thuy_duoi_1000",
    "note": ""
  },
  {
    "code": "CV-130",
    "name": "Tủ Gương Kính Thủy Trên 1000",
    "unit": "md (mét dài)",
    "aliases": [
      "Tủ gương kính thủy trên 1000"
    ],
    "category": "6. Nội thất gỗ",
    "subcategory": "Tủ lavabo WC",
    "projectType": "chung_cu",
    "sourceKey": "tu_guong_kinh_thuy_tren_1000",
    "note": ""
  },
  {
    "code": "CV-131",
    "name": "Tủ Trang Trí WC (WPB)",
    "unit": "Cái",
    "aliases": [
      "Tủ trang trí nhà vệ sinh"
    ],
    "category": "6. Nội thất gỗ",
    "subcategory": "Tủ lavabo WC",
    "projectType": "chung_cu",
    "sourceKey": "tu_trang_tri_wc_wpb",
    "note": "Cần xác nhận viết tắt 'WPB'."
  },
  {
    "code": "CV-132",
    "name": "Tủ Máy Giặt",
    "unit": "m²",
    "aliases": [
      "Tủ bao máy giặt"
    ],
    "category": "6. Nội thất gỗ",
    "subcategory": "Tủ máy giặt",
    "projectType": "chung_cu",
    "sourceKey": "tu_may_giat",
    "note": ""
  },
  {
    "code": "CV-133",
    "name": "Tủ Máy Rửa Chén Phủ Laminate",
    "unit": "m²",
    "aliases": [
      "Tủ bao máy rửa chén phủ Laminate"
    ],
    "category": "6. Nội thất gỗ",
    "subcategory": "Tủ máy giặt",
    "projectType": "chung_cu",
    "sourceKey": "tu_may_rua_chen_nhua_lam",
    "note": ""
  },
  {
    "code": "CV-134",
    "name": "Bản Lề Hafele",
    "unit": "Cái",
    "aliases": [],
    "category": "6. Nội thất gỗ",
    "subcategory": "Phụ kiện Hafele",
    "projectType": "chung_cu",
    "sourceKey": "ban_le_hafele",
    "note": ""
  },
  {
    "code": "CV-135",
    "name": "Ray Kéo Hafele",
    "unit": "Bộ",
    "aliases": [
      "Ray trượt ngăn kéo Hafele"
    ],
    "category": "6. Nội thất gỗ",
    "subcategory": "Phụ kiện Hafele",
    "projectType": "chung_cu",
    "sourceKey": "ray_keo_hafele",
    "note": ""
  },
  {
    "code": "CV-136",
    "name": "LED Dây Thanh Nhôm Âm",
    "unit": "md (mét dài)",
    "aliases": [
      "Led dây trong thanh nhôm âm"
    ],
    "category": "6. Nội thất gỗ",
    "subcategory": "Đèn LED",
    "projectType": "chung_cu",
    "sourceKey": "led_day_thanh_nhom_am",
    "note": ""
  },
  {
    "code": "CV-137",
    "name": "LED Dây Không U Nhôm",
    "unit": "md (mét dài)",
    "aliases": [
      "Led dây không nẹp nhôm"
    ],
    "category": "6. Nội thất gỗ",
    "subcategory": "Đèn LED",
    "projectType": "chung_cu",
    "sourceKey": "led_day_khong_u_nhom",
    "note": ""
  },
  {
    "code": "CV-138",
    "name": "LED Hạt Thanh Nhôm Combo",
    "unit": "Gói",
    "aliases": [
      "Bộ LED hạt + thanh nhôm"
    ],
    "category": "6. Nội thất gỗ",
    "subcategory": "Đèn LED",
    "projectType": "chung_cu",
    "sourceKey": "led_hat_thanh_nhom_combo",
    "note": ""
  },
  {
    "code": "CV-139",
    "name": "Nguồn Tổ Ong",
    "unit": "Bộ",
    "aliases": [
      "Bộ nguồn LED tổ ong"
    ],
    "category": "6. Nội thất gỗ",
    "subcategory": "Đèn LED",
    "projectType": "chung_cu",
    "sourceKey": "nguon_to_ong",
    "note": ""
  },
  {
    "code": "CV-140",
    "name": "Cảm Biến Chạm Đóng Mở",
    "unit": "Cái",
    "aliases": [
      "Cảm biến cảm ứng đóng/mở ngăn kéo"
    ],
    "category": "6. Nội thất gỗ",
    "subcategory": "Đèn LED",
    "projectType": "chung_cu",
    "sourceKey": "cam_bien_cham_dong_mo",
    "note": ""
  },
  {
    "code": "CV-141",
    "name": "Vận Chuyển Lắp Đặt",
    "unit": "Gói",
    "aliases": [
      "Chi phí vận chuyển & lắp đặt nội thất"
    ],
    "category": "6. Nội thất gỗ",
    "subcategory": "Khác",
    "projectType": "chung_cu",
    "sourceKey": "van_chuyen_lap_dat",
    "note": ""
  },
  {
    "code": "CV-142",
    "name": "Phụ Phí Công Trình Ngoại Tỉnh (%)",
    "unit": "%",
    "aliases": [
      "Phụ phí công trình tỉnh xa"
    ],
    "category": "6. Nội thất gỗ",
    "subcategory": "Khác",
    "projectType": "chung_cu",
    "sourceKey": "cong_trinh_ngoai_tinh_percent",
    "note": ""
  },
  {
    "code": "CV-143",
    "name": "Giấy Dán Tường",
    "unit": "Cuộn",
    "aliases": [
      "Wallpaper"
    ],
    "category": "6. Nội thất gỗ",
    "subcategory": "Khác",
    "projectType": "chung_cu",
    "sourceKey": "giay_dan_tuong",
    "note": ""
  },
  {
    "code": "CV-144",
    "name": "Rèm 2 Lớp Cản Sáng 100%",
    "unit": "m dài",
    "aliases": [
      "Rèm 2 lớp chống nắng"
    ],
    "category": "7. Rèm màn",
    "subcategory": "rem_man",
    "projectType": "chung_cu",
    "sourceKey": "rem_2_lop_can_sang_100",
    "note": ""
  },
  {
    "code": "CV-145",
    "name": "Bốc Xếp Trạc Thải",
    "unit": "Gói",
    "aliases": [
      "Bốc xếp xà bần rác thải"
    ],
    "category": "8. Vệ sinh trạc thải",
    "subcategory": "ve_sinh_trac_thai",
    "projectType": "chung_cu",
    "sourceKey": "boc_xep_trac_thai",
    "note": ""
  },
  {
    "code": "CV-146",
    "name": "Dọn Vệ Sinh Dự Án",
    "unit": "Gói",
    "aliases": [
      "Tổng vệ sinh công trình"
    ],
    "category": "8. Vệ sinh trạc thải",
    "subcategory": "ve_sinh_trac_thai",
    "projectType": "chung_cu",
    "sourceKey": "don_ve_sinh_du_an",
    "note": ""
  },
  {
    "code": "CV-147",
    "name": "Nhân Công Trọn Gói / m² Sàn",
    "unit": "m² sàn",
    "aliases": [
      "Đơn giá nhân công trọn gói theo m2"
    ],
    "category": "nhan_cong_xay_dung",
    "subcategory": "nhan_cong_xay_dung",
    "projectType": "nha_o",
    "sourceKey": "nhan_cong_tron_goi_per_m2_san",
    "note": ""
  }
];

export const ITEM_MASTER_BY_CODE: Record<string, ItemMasterEntry> = Object.fromEntries(ITEM_MASTER.map(i => [i.code, i]));
export const ITEM_MASTER_BY_SOURCE_KEY: Record<string, ItemMasterEntry> = Object.fromEntries(ITEM_MASTER.filter(i => i.sourceKey).map(i => [i.sourceKey, i]));
