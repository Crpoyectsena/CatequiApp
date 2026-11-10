USE catequi_db;

-- Normalize the legacy administrator label before restricting account roles.
UPDATE Users
SET role = 'administrador'
WHERE LOWER(TRIM(role)) IN ('admin', 'administrator');

ALTER TABLE Users
  ADD CONSTRAINT chkUsersRole
  CHECK (role IN ('administrador', 'catequista', 'acudiente'));
