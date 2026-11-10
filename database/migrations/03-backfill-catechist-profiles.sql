USE catequi_db;

-- Create a catechist profile for each existing catechist account that lacks one.
INSERT INTO Catequistas (
  tipoDocumento, numeroDocumento, nombres, apellidos,
  telefono, correo, direccion, estado
)
SELECT
  'CC',
  CAST(Users.id AS CHAR),
  TRIM(CONCAT_WS(' ', Users.firstName, Users.middleName)),
  TRIM(CONCAT_WS(' ', Users.firstLastName, Users.secondLastName)),
  Users.phone,
  Users.email,
  Users.address,
  'activo'
FROM Users
WHERE LOWER(TRIM(Users.role)) = 'catequista'
  AND NOT EXISTS (
    SELECT 1
    FROM Catequistas
    WHERE Catequistas.numeroDocumento COLLATE utf8mb4_unicode_ci =
          CAST(Users.id AS CHAR) COLLATE utf8mb4_unicode_ci
  );
