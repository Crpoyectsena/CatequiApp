USE catequi_db;

-- Extend the account role constraint to allow catechumen accounts.
ALTER TABLE Users
  DROP CHECK chkUsersRole,
  ADD CONSTRAINT chkUsersRole
    CHECK (role IN ('administrador', 'catequista', 'acudiente', 'catequizando'));
