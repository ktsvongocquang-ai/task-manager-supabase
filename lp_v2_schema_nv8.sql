-- ============================================================
-- LP v2 — NV8 bổ sung: hàm submit_lp_lead
-- Chạy SAU lp_v2_schema.sql, cùng project Supabase chính.
--
-- Vì sao cần hàm riêng thay vì insert/update thẳng từ client: yêu cầu
-- "cùng số điện thoại gửi lại trong 10 phút thì chỉ cập nhật lead cũ"
-- đòi hỏi SELECT + UPDATE trên bảng leads — nhưng RLS leads (NV2) cố
-- tình KHÔNG cấp SELECT/UPDATE cho anon (tránh lộ số điện thoại khách
-- hàng khác qua API công khai). Hàm SECURITY DEFINER dưới đây cho phép
-- khách ẩn danh gọi đúng 1 thao tác hẹp (nộp lead) mà không đọc được
-- bảng leads.
-- ============================================================

CREATE OR REPLACE FUNCTION submit_lp_lead(
  p_name text,
  p_phone text,
  p_call_time text,
  p_message text,
  p_seg text,
  p_sale_code text,
  p_source text,
  p_utm jsonb,
  p_intent text,
  p_gift text,
  p_estimate jsonb,
  p_lead_score text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_id uuid;
BEGIN
  SELECT id INTO existing_id FROM leads
  WHERE phone = p_phone AND created_at > now() - interval '10 minutes'
  ORDER BY created_at DESC
  LIMIT 1;

  IF existing_id IS NOT NULL THEN
    UPDATE leads SET
      name = p_name,
      call_time = COALESCE(p_call_time, call_time),
      message = COALESCE(p_message, message),
      seg = COALESCE(p_seg, seg),
      sale_code = COALESCE(p_sale_code, sale_code),
      source = COALESCE(p_source, source),
      utm = COALESCE(p_utm, utm),
      intent = COALESCE(p_intent, intent),
      gift = COALESCE(p_gift, gift),
      estimate = COALESCE(p_estimate, estimate),
      lead_score = COALESCE(p_lead_score, lead_score)
    WHERE id = existing_id;
    RETURN existing_id;
  ELSE
    INSERT INTO leads (name, phone, call_time, message, seg, sale_code, source, utm, intent, gift, estimate, lead_score)
    VALUES (p_name, p_phone, p_call_time, p_message, p_seg, p_sale_code, p_source, p_utm, p_intent, p_gift, p_estimate, p_lead_score)
    RETURNING id INTO existing_id;
    RETURN existing_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION submit_lp_lead(text, text, text, text, text, text, text, jsonb, text, text, jsonb, text) TO anon, authenticated;
