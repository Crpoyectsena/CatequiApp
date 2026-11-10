// import the data base pool of connections
import { pool } from '../DB/index.js';
// boom allows managing possible errors
import Boom from '@hapi/boom';

// create the catechumen services class
export class CatechumenServices {

  async createOne(newCatechumen) {
    try {
      // the catechumen must belong to a registered guardian
      const [guardians] = await pool.query(
        'SELECT id FROM Acudientes WHERE id = ?',
        [newCatechumen.idAcudiente]
      );

      if (guardians.length === 0) {
        throw Boom.notFound('Guardian not found');
      }

      // the document number must be unique
      const [rows] = await pool.query(
        'SELECT * FROM Catequizandos WHERE numeroDocumento = ?',
        [newCatechumen.numeroDocumento]
      );

      if (rows.length > 0) {
        throw Boom.conflict('Catechumen document number already exists');
      }

      await pool.query(
        `INSERT INTO Catequizandos (
          tipoDocumento, numeroDocumento, nombres, apellidos,
          fechaNacimiento, direccion, telefono, correo, estado, idAcudiente
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newCatechumen.tipoDocumento,
          newCatechumen.numeroDocumento,
          newCatechumen.nombres,
          newCatechumen.apellidos,
          newCatechumen.fechaNacimiento,
          newCatechumen.direccion,
          newCatechumen.telefono,
          newCatechumen.correo,
          newCatechumen.estado || 'activo',
          newCatechumen.idAcudiente,
        ]
      );

      return { status: 'CREATED SUCCESSFULLY' };
    } catch (err) {
      throw Boom.boomify(err, {
        message: 'Unable to create new catechumen',
      });
    }
  }

  async updateOne(id, newCatechumenData) {
    if (!id || !newCatechumenData) {
      throw Boom.badRequest('No catechumen ID or data provided');
    }

    try {
      const [result] = await pool.query(
        `UPDATE Catequizandos
         SET tipoDocumento = ?, numeroDocumento = ?, nombres = ?,
             apellidos = ?, fechaNacimiento = ?, direccion = ?,
             telefono = ?, correo = ?, estado = ?, idAcudiente = ?
         WHERE id = ?`,
        [
          newCatechumenData.tipoDocumento,
          newCatechumenData.numeroDocumento,
          newCatechumenData.nombres,
          newCatechumenData.apellidos,
          newCatechumenData.fechaNacimiento,
          newCatechumenData.direccion,
          newCatechumenData.telefono,
          newCatechumenData.correo,
          newCatechumenData.estado,
          newCatechumenData.idAcudiente,
          id,
        ]
      );

      if (result.affectedRows === 0) {
        throw Boom.notFound('Catechumen not found');
      }

      return { status: 'UPDATED SUCCESSFULLY' };
    } catch (err) {
      throw Boom.boomify(err, {
        message: 'Unable to update catechumen',
      });
    }
  }

  async deleteOne(id) {
    if (!id) {
      throw Boom.badRequest('No catechumen ID provided');
    }

    try {
      const [result] = await pool.query(
        'DELETE FROM Catequizandos WHERE id = ?',
        [id]
      );

      if (result.affectedRows === 0) {
        throw Boom.notFound('Catechumen not found');
      }

      return { status: 'DELETED SUCCESSFULLY' };
    } catch (err) {
      throw Boom.boomify(err, {
        message: 'Unable to delete catechumen',
      });
    }
  }

  async listOne(id) {
    if (!id) {
      throw Boom.badRequest('No catechumen ID provided');
    }

    try {
      // join the guardian data so the view can show it in real time
      const [rows] = await pool.query(
        `SELECT c.id, c.tipoDocumento, c.numeroDocumento, c.nombres,
                c.apellidos, c.fechaNacimiento, c.direccion, c.telefono,
                c.correo, c.estado, c.idAcudiente,
                a.nombres AS acudienteNombres,
                a.apellidos AS acudienteApellidos,
                a.telefono AS acudienteTelefono
         FROM Catequizandos c
         INNER JOIN Acudientes a ON a.id = c.idAcudiente
         WHERE c.id = ?`,
        [id]
      );

      if (rows.length === 0) {
        throw Boom.notFound('Catechumen not found');
      }

      return rows[0];
    } catch (err) {
      throw Boom.boomify(err, {
        message: 'Unable to find catechumen',
      });
    }
  }

  async listAll() {
    try {
      const [rows] = await pool.query(
        `SELECT c.id, c.tipoDocumento, c.numeroDocumento, c.nombres,
                c.apellidos, c.fechaNacimiento, c.direccion, c.telefono,
                c.correo, c.estado, c.idAcudiente,
                a.nombres AS acudienteNombres,
                a.apellidos AS acudienteApellidos
         FROM Catequizandos c
         INNER JOIN Acudientes a ON a.id = c.idAcudiente
         ORDER BY c.id ASC`
      );

      if (!rows.length) {
        return [];
      }

      return [...rows];
    } catch (err) {
      throw Boom.boomify(err, {
        message: 'Unable to find catechumens',
      });
    }
  }
}