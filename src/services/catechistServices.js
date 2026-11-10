// import the data base pool of connections
import { pool } from '../DB/index.js';
// boom allows managing possible errors
import Boom from '@hapi/boom';

// create the catechist services class
export class CatechistServices {

  async createOne(newCatechist) {
    try {
      // searches the database if there is a catechist with this document number
      const [rows] = await pool.query(
        'SELECT * FROM Catequistas WHERE numeroDocumento = ?',
        [newCatechist.numeroDocumento]
      );

      // if the catechist exists, reject the insertion
      if (rows.length > 0) {
        throw Boom.conflict('Catechist document number already exists');
      }

      // create a new record in the database
      await pool.query(
        `INSERT INTO Catequistas (
          tipoDocumento, numeroDocumento, nombres, apellidos,
          telefono, correo, direccion, estado
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newCatechist.tipoDocumento,
          newCatechist.numeroDocumento,
          newCatechist.nombres,
          newCatechist.apellidos,
          newCatechist.telefono,
          newCatechist.correo,
          newCatechist.direccion,
          newCatechist.estado || 'activo',
        ]
      );

      // return a success response
      return { status: 'CREATED SUCCESSFULLY' };
    } catch (err) {
      // return a Boom error if there's an exception
      throw Boom.boomify(err, {
        message: 'Unable to create new catechist',
      });
    }
  }

  async updateOne(id, newCatechistData) {
    if (!id || !newCatechistData) {
      throw Boom.badRequest('No catechist ID or data provided');
    }

    try {
      // update the record in the database
      const [result] = await pool.query(
        `UPDATE Catequistas
         SET tipoDocumento = ?, numeroDocumento = ?, nombres = ?,
             apellidos = ?, telefono = ?, correo = ?, direccion = ?,
             estado = ?
         WHERE id = ?`,
        [
          newCatechistData.tipoDocumento,
          newCatechistData.numeroDocumento,
          newCatechistData.nombres,
          newCatechistData.apellidos,
          newCatechistData.telefono,
          newCatechistData.correo,
          newCatechistData.direccion,
          newCatechistData.estado,
          id,
        ]
      );

      if (result.affectedRows === 0) {
        throw Boom.notFound('Catechist not found');
      }

      return { status: 'UPDATED SUCCESSFULLY' };
    } catch (err) {
      throw Boom.boomify(err, {
        message: 'Unable to update catechist',
      });
    }
  }

  async deleteOne(id) {
    if (!id) {
      throw Boom.badRequest('No catechist ID provided');
    }

    try {
      const [result] = await pool.query(
        'DELETE FROM Catequistas WHERE id = ?',
        [id]
      );

      if (result.affectedRows === 0) {
        throw Boom.notFound('Catechist not found');
      }

      return { status: 'DELETED SUCCESSFULLY' };
    } catch (err) {
      throw Boom.boomify(err, {
        message: 'Unable to delete catechist',
      });
    }
  }

  async listOne(id) {
    if (!id) {
      throw Boom.badRequest('No catechist ID provided');
    }

    try {
      const [rows] = await pool.query(
        `SELECT id, tipoDocumento, numeroDocumento, nombres, apellidos,
                telefono, correo, direccion, estado, createdAt, updatedAt
         FROM Catequistas WHERE id = ?`,
        [id]
      );

      if (rows.length === 0) {
        throw Boom.notFound('Catechist not found');
      }

      return rows[0];
    } catch (err) {
      throw Boom.boomify(err, {
        message: 'Unable to find catechist',
      });
    }
  }

  async listAll() {
    try {
      const [rows] = await pool.query(
        `SELECT id, tipoDocumento, numeroDocumento, nombres, apellidos,
                telefono, correo, direccion, estado
         FROM Catequistas ORDER BY id ASC`
      );

      if (!rows.length) {
        return [];
      }

      return [...rows];
    } catch (err) {
      throw Boom.boomify(err, {
        message: 'Unable to find catechists',
      });
    }
  }
}