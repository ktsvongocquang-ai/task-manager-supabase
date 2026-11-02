-- Phan quyen xem du an theo 3 cap: Admin (toan bo) - Quan ly thi cong / Giam Sat (chi du an duoc giao).
-- Bang moi, doc lap voi profiles.construction_project_id (van giu nguyen cho vai tro Khach hang).
CREATE TABLE IF NOT EXISTS construction_project_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES construction_projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(project_id, user_id)
);
ALTER TABLE construction_project_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "construction_project_members_authenticated_all" ON construction_project_members;
CREATE POLICY "construction_project_members_authenticated_all" ON construction_project_members
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
