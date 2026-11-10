USE catequi_db;

-- Enforce the catechesis grading scale on databases that already exist.
ALTER TABLE Asistencias
  ADD CONSTRAINT chkAsistenciasCalificacion
    CHECK (calificacion IS NULL OR (calificacion >= 1.0 AND calificacion <= 5.0));
