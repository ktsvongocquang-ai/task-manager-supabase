-- ═══════════════════════════════════════════════════════════
-- HỒ SƠ THIẾT KẾ — Cho phép NHIỀU link Google Drive / hạng mục
-- (trước đây mỗi hạng mục chỉ 1 link — giờ cho thêm mới, không đè cái cũ)
-- Run this in Supabase SQL Editor — chạy SAU project_doc_links_schema.sql
-- ═══════════════════════════════════════════════════════════

ALTER TABLE project_doc_links DROP CONSTRAINT IF EXISTS project_doc_links_project_id_category_key;
