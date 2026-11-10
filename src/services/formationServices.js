// Import the data base pool of connections
import { pool } from '../DB/index.js';
// Import Boom for HTTP-friendly error objects
import Boom from '@hapi/boom';
// Import file-system helpers for private activity material
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
// Import path helpers for private activity material
import path from 'node:path';
// Import UUID generation for safe stored filenames
import { randomUUID } from 'node:crypto';
// Import the module directory path
import { fileURLToPath } from 'node:url';

const materialDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../storage/activity-material'
);
const materialTypes = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};
const maximumMaterialSize = 20 * 1024 * 1024;

const hasValidMaterialSignature = (extension, buffer) => {
  if (extension === '.pdf') {
    return buffer.subarray(0, 5).toString() === '%PDF-';
  }
  if (['.doc', '.xls'].includes(extension)) {
    return buffer.subarray(0, 8).equals(
      Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])
    );
  }
  return buffer.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]));
};

const moduleDefinitions = {
  guardians: {
    table: 'Acudientes',
    fields: ['tipoDocumento', 'numeroDocumento', 'nombres', 'apellidos', 'fechaNacimiento', 'direccion', 'telefono', 'correo', 'estado'],
    required: ['tipoDocumento', 'numeroDocumento', 'nombres', 'apellidos'],
    enums: { estado: ['activo', 'inactivo'] },
    resultColumns: ['id', 'tipoDocumento', 'numeroDocumento', 'nombres', 'apellidos', 'fechaNacimiento', 'direccion', 'telefono', 'correo', 'estado'],
    listQuery: `SELECT id, tipoDocumento, numeroDocumento, nombres, apellidos,
                       fechaNacimiento, direccion, telefono, correo, estado
                FROM Acudientes ORDER BY id ASC`,
  },
  catechumens: {
    table: 'Catequizandos',
    fields: ['tipoDocumento', 'numeroDocumento', 'nombres', 'apellidos', 'fechaNacimiento', 'direccion', 'telefono', 'correo', 'estado', 'idAcudiente'],
    required: ['tipoDocumento', 'numeroDocumento', 'nombres', 'apellidos', 'idAcudiente'],
    enums: { estado: ['activo', 'inactivo'] },
    references: { idAcudiente: ['Acudientes', true] },
    resultColumns: ['id', 'tipoDocumento', 'numeroDocumento', 'nombres', 'apellidos', 'fechaNacimiento', 'direccion', 'telefono', 'correo', 'estado', 'idAcudiente', 'acudienteNombres', 'acudienteApellidos'],
    listQuery: `SELECT c.id, c.tipoDocumento, c.numeroDocumento, c.nombres, c.apellidos,
                       c.fechaNacimiento, c.direccion, c.telefono, c.correo, c.estado,
                       c.idAcudiente, a.nombres AS acudienteNombres,
                       a.apellidos AS acudienteApellidos
                FROM Catequizandos c
                INNER JOIN Acudientes a ON a.id = c.idAcudiente
                ORDER BY c.id ASC`,
  },
  groups: {
    table: 'Grupos',
    fields: ['nombreGrupo', 'nivelCatequesis', 'anio', 'horario', 'salon', 'cupoMaximo', 'estado', 'idCatequista'],
    required: ['nombreGrupo', 'nivelCatequesis', 'anio', 'cupoMaximo'],
    enums: { estado: ['activo', 'inactivo'] },
    references: { idCatequista: ['Catequistas', false] },
    resultColumns: ['id', 'nombreGrupo', 'nivelCatequesis', 'anio', 'horario', 'salon', 'cupoMaximo', 'estado', 'idCatequista', 'catequistaNombres', 'catequistaApellidos'],
    listQuery: `SELECT g.id, g.nombreGrupo, g.nivelCatequesis, g.anio, g.horario,
                       g.salon, g.cupoMaximo, g.estado, g.idCatequista,
                       c.nombres AS catequistaNombres, c.apellidos AS catequistaApellidos
                FROM Grupos g
                LEFT JOIN Catequistas c ON c.id = g.idCatequista
                ORDER BY g.id ASC`,
  },
  enrollments: {
    table: 'Matriculas',
    fields: ['fechaMatricula', 'estado', 'observaciones', 'idCatequizando', 'idGrupo'],
    required: ['fechaMatricula', 'idCatequizando', 'idGrupo'],
    enums: { estado: ['activa', 'finalizada', 'retirada'] },
    references: { idCatequizando: ['Catequizandos', true], idGrupo: ['Grupos', true] },
    resultColumns: ['id', 'fechaMatricula', 'estado', 'observaciones', 'idCatequizando', 'idGrupo', 'catequizandoNombres', 'catequizandoApellidos', 'nombreGrupo'],
    listQuery: `SELECT m.id, m.fechaMatricula, m.estado, m.observaciones,
                       m.idCatequizando, m.idGrupo,
                       c.nombres AS catequizandoNombres, c.apellidos AS catequizandoApellidos,
                       g.nombreGrupo
                FROM Matriculas m
                INNER JOIN Catequizandos c ON c.id = m.idCatequizando
                INNER JOIN Grupos g ON g.id = m.idGrupo
                ORDER BY m.id DESC`,
  },
  activities: {
    table: 'Actividades',
    fields: ['descripcion', 'fechaActividad', 'calificable', 'rutaPdf', 'estado', 'idGrupo'],
    required: ['descripcion', 'fechaActividad', 'idGrupo'],
    enums: { estado: ['activa', 'inactiva'] },
    references: { idGrupo: ['Grupos', true] },
    resultColumns: ['id', 'descripcion', 'fechaActividad', 'calificable', 'rutaPdf', 'estado', 'idGrupo', 'nombreGrupo'],
    listQuery: `SELECT a.id, a.descripcion, a.fechaActividad, a.calificable,
                       a.rutaPdf, a.estado, a.idGrupo, g.nombreGrupo
                FROM Actividades a
                INNER JOIN Grupos g ON g.id = a.idGrupo
                ORDER BY a.fechaActividad DESC, a.id DESC`,
  },
  attendance: {
    table: 'Asistencias',
    fields: ['asistio', 'calificacion', 'observaciones', 'idCatequizando', 'idActividad'],
    required: ['asistio', 'idCatequizando', 'idActividad'],
    references: { idCatequizando: ['Catequizandos', true], idActividad: ['Actividades', true] },
    resultColumns: ['id', 'asistio', 'calificacion', 'observaciones', 'idCatequizando', 'idActividad', 'catequizandoNombres', 'catequizandoApellidos', 'actividadDescripcion', 'fechaActividad', 'nombreGrupo'],
    listQuery: `SELECT a.id, a.asistio, a.calificacion, a.observaciones,
                       a.idCatequizando, a.idActividad,
                       c.nombres AS catequizandoNombres, c.apellidos AS catequizandoApellidos,
                       ac.descripcion AS actividadDescripcion, ac.fechaActividad,
                       g.nombreGrupo
                FROM Asistencias a
                INNER JOIN Catequizandos c ON c.id = a.idCatequizando
                INNER JOIN Actividades ac ON ac.id = a.idActividad
                INNER JOIN Grupos g ON g.id = ac.idGrupo
                ORDER BY ac.fechaActividad DESC, a.id DESC`,
  },
};

const getDefinition = (moduleName) => {
  const definition = moduleDefinitions[moduleName];
  if (!definition) {
    throw Boom.notFound('Formation module not found');
  }
  return definition;
};

const getAccessFilter = (moduleName, user, alias) => {
  if (!user || user.role === 'administrador') {
    return null;
  }

  const isActivities = moduleName === 'activities';
  const recordGroupExpression = isActivities
    ? `${alias}.${alias === 'moduleRecords' ? 'idGrupo' : 'id'}`
    : `${alias}.idActividad`;
  const groupIdsForCatechist = `SELECT g.id
    FROM Grupos g
    INNER JOIN Catequistas c ON c.id = g.idCatequista
    WHERE c.numeroDocumento = ?`;

  if (user.role === 'catequista') {
    return {
      sql: isActivities
        ? `${recordGroupExpression} IN (${groupIdsForCatechist})`
        : `${recordGroupExpression} IN (
            SELECT ac.id
            FROM Actividades ac
            WHERE ac.idGrupo IN (${groupIdsForCatechist})
          )`,
      params: [String(user.id)],
    };
  }

  if (['acudiente', 'catequizando'].includes(user.role) && moduleName === 'activities') {
    const catechumenCondition = user.role === 'acudiente'
      ? 'c.idAcudiente = (SELECT id FROM Acudientes WHERE numeroDocumento = ? LIMIT 1)'
      : 'c.numeroDocumento = ?';
    return {
      sql: `${recordGroupExpression} IN (
        SELECT DISTINCT m.idGrupo
        FROM Matriculas m
        INNER JOIN Catequizandos c ON c.id = m.idCatequizando
        WHERE ${catechumenCondition}
      )`,
      params: [String(user.id)],
    };
  }

  if (['acudiente', 'catequizando'].includes(user.role) && moduleName === 'catechumens') {
    const catechumenCondition = user.role === 'acudiente'
      ? `${alias}.idAcudiente = (SELECT id FROM Acudientes WHERE numeroDocumento = ? LIMIT 1)`
      : `${alias}.numeroDocumento = ?`;
    return {
      sql: catechumenCondition,
      params: [String(user.id)],
    };
  }

  if (['acudiente', 'catequizando'].includes(user.role) && moduleName === 'attendance') {
    const catechumenCondition = user.role === 'acudiente'
      ? 'c.idAcudiente = (SELECT id FROM Acudientes WHERE numeroDocumento = ? LIMIT 1)'
      : 'c.numeroDocumento = ?';
    return {
      sql: `${alias}.idCatequizando IN (
        SELECT c.id
        FROM Catequizandos c
        WHERE ${catechumenCondition}
          AND EXISTS (
            SELECT 1
            FROM Matriculas m
            INNER JOIN Actividades ac ON ac.idGrupo = m.idGrupo
            WHERE m.idCatequizando = c.id
              AND ac.id = ${alias}.idActividad
          )
      )`,
      params: [String(user.id)],
    };
  }

  return null;
};

const normalizeData = (definition, data, partial = false) => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw Boom.badRequest('Module data is required');
  }

  const values = {};
  for (const field of definition.fields) {
    if (!Object.hasOwn(data, field)) {
      if (!partial && definition.required.includes(field)) {
        throw Boom.badRequest(`Missing required field: ${field}`);
      }
      continue;
    }

    let value = data[field];
    if (typeof value === 'string') {
      value = value.trim();
    }

    if (value === '' || value === undefined) {
      value = null;
    }

    if (definition.required.includes(field) && value === null) {
      throw Boom.badRequest(`Missing required field: ${field}`);
    }

    if (value !== null && definition.enums?.[field] && !definition.enums[field].includes(value)) {
      throw Boom.badRequest(`Invalid value for field: ${field}`);
    }

    if (value !== null && definition.references?.[field]) {
      const numericValue = Number(value);
      if (!Number.isInteger(numericValue) || numericValue < 1) {
        throw Boom.badRequest(`Invalid reference for field: ${field}`);
      }
      value = numericValue;
    }

    if (value !== null && ['anio', 'cupoMaximo'].includes(field)) {
      const numericValue = Number(value);
      if (!Number.isInteger(numericValue) || numericValue < 1) {
        throw Boom.badRequest(`Invalid numeric value for field: ${field}`);
      }
      value = numericValue;
    }

    if (value !== null && ['asistio', 'calificable'].includes(field)) {
      if (![true, false, 1, 0, '1', '0', 'true', 'false'].includes(value)) {
        throw Boom.badRequest(`Invalid boolean value for field: ${field}`);
      }
      value = value === true || value === 1 || value === '1' || value === 'true';
    }

    if (value !== null && field === 'calificacion') {
      const numericValue = Number(value);
      if (
        !Number.isFinite(numericValue) ||
        numericValue < 1 ||
        numericValue > 5 ||
        Math.round(numericValue * 10) !== numericValue * 10
      ) {
        throw Boom.badRequest('Grade must be between 1.0 and 5.0 with at most one decimal place');
      }
      value = numericValue;
    }

    values[field] = value;
  }

  return values;
};

export class FormationServices {
  async listAll(moduleName, user) {
    const definition = getDefinition(moduleName);
    try {
      const accessFilter = getAccessFilter(
        moduleName,
        user,
        { activities: 'g', attendance: 'a', catechumens: 'c' }[moduleName] || 'a'
      );
      const orderBy = definition.listQuery.match(/ORDER BY[\s\S]*$/i)?.[0] || '';
      let query = definition.listQuery.replace(/ORDER BY[\s\S]*$/i, '');
      if (accessFilter) {
        query += ` WHERE ${accessFilter.sql}`;
      }
      query += ` ${orderBy}`;
      const [rows] = await pool.query(query, accessFilter?.params || []);
      return rows;
    } catch (err) {
      throw Boom.boomify(err, { message: 'Unable to retrieve formation records' });
    }
  }

  async listOne(moduleName, id, user) {
    const definition = getDefinition(moduleName);
    if (!id || !Number.isInteger(Number(id)) || Number(id) < 1) {
      throw Boom.badRequest('A valid record ID is required');
    }

    try {
      const accessFilter = getAccessFilter(moduleName, user, 'moduleRecords');
      const query = `SELECT ${definition.resultColumns.join(', ')}
         FROM (${definition.listQuery.replace(/ORDER BY[\s\S]*$/i, '')}) AS moduleRecords
         WHERE moduleRecords.id = ?${accessFilter ? ` AND ${accessFilter.sql}` : ''}`;
      const [rows] = await pool.query(query, [
        Number(id),
        ...(accessFilter?.params || []),
      ]);
      if (rows.length === 0) {
        throw Boom.notFound('Formation record not found');
      }
      return rows[0];
    } catch (err) {
      throw Boom.boomify(err, { message: 'Unable to retrieve formation record' });
    }
  }

  async createOne(moduleName, data) {
    const definition = getDefinition(moduleName);
    const values = normalizeData(definition, data);
    try {
      await this.validateReferences(definition, values);
      await this.validateAttendanceGrade(moduleName, null, values);
      const fields = Object.keys(values);
      const placeholders = fields.map(() => '?').join(', ');
      const [result] = await pool.query(
        `INSERT INTO ${definition.table} (${fields.join(', ')}) VALUES (${placeholders})`,
        fields.map((field) => values[field])
      );
      return { status: 'CREATED SUCCESSFULLY', id: result.insertId };
    } catch (err) {
      throw this.translateDatabaseError(err, 'Unable to create formation record');
    }
  }

  async updateOne(moduleName, id, data) {
    const definition = getDefinition(moduleName);
    if (!id || !Number.isInteger(Number(id)) || Number(id) < 1) {
      throw Boom.badRequest('A valid record ID is required');
    }
    const values = normalizeData(definition, data, true);
    const fields = Object.keys(values);
    if (fields.length === 0) {
      throw Boom.badRequest('At least one field is required');
    }

    try {
      await this.validateReferences(definition, values);
      await this.validateAttendanceGrade(moduleName, Number(id), values);
      const [result] = await pool.query(
        `UPDATE ${definition.table} SET ${fields.map((field) => `${field} = ?`).join(', ')} WHERE id = ?`,
        [...fields.map((field) => values[field]), Number(id)]
      );
      if (result.affectedRows === 0) {
        const [rows] = await pool.query(
          `SELECT id FROM ${definition.table} WHERE id = ?`,
          [Number(id)]
        );
        if (rows.length === 0) {
          throw Boom.notFound('Formation record not found');
        }
      }
      return { status: 'UPDATED SUCCESSFULLY' };
    } catch (err) {
      throw this.translateDatabaseError(err, 'Unable to update formation record');
    }
  }

  async deleteOne(moduleName, id) {
    const definition = getDefinition(moduleName);
    if (!id || !Number.isInteger(Number(id)) || Number(id) < 1) {
      throw Boom.badRequest('A valid record ID is required');
    }

    try {
      const [result] = await pool.query(
        `DELETE FROM ${definition.table} WHERE id = ?`,
        [Number(id)]
      );
      if (result.affectedRows === 0) {
        throw Boom.notFound('Formation record not found');
      }
      return { status: 'DELETED SUCCESSFULLY' };
    } catch (err) {
      throw this.translateDatabaseError(err, 'Unable to delete formation record');
    }
  }

  async listOptions(moduleName, user) {
    const definition = getDefinition(moduleName);
    try {
      const optionSources = new Set(
        Object.values(definition.references || {}).map(([table]) => table)
      );
      const options = {};

      for (const table of optionSources) {
        if (table === 'Acudientes') {
          const [rows] = await pool.query(
            'SELECT id, nombres, apellidos, numeroDocumento FROM Acudientes ORDER BY nombres, apellidos'
          );
          options.idAcudiente = rows.map((row) => ({
            id: row.id,
            label: `${row.nombres} ${row.apellidos} · ${row.numeroDocumento}`,
          }));
        } else if (table === 'Catequizandos') {
          const catechistFilter = user?.role === 'catequista'
            ? `WHERE c.id IN (
                 SELECT m.idCatequizando
                 FROM Matriculas m
                 INNER JOIN Grupos g ON g.id = m.idGrupo
                 INNER JOIN Catequistas ct ON ct.id = g.idCatequista
                 WHERE ct.numeroDocumento = ? AND m.estado = 'activa'
               )`
            : '';
          const [rows] = await pool.query(
            `SELECT c.id, c.nombres, c.apellidos, c.numeroDocumento
             FROM Catequizandos c
             ${catechistFilter}
             ORDER BY c.nombres, c.apellidos`,
            user?.role === 'catequista' ? [String(user.id)] : []
          );
          options.idCatequizando = rows.map((row) => ({
            id: row.id,
            label: `${row.nombres} ${row.apellidos} · ${row.numeroDocumento}`,
          }));
        } else if (table === 'Catequistas') {
          const [rows] = await pool.query(
            'SELECT id, nombres, apellidos FROM Catequistas ORDER BY nombres, apellidos'
          );
          options.idCatequista = rows.map((row) => ({
            id: row.id,
            label: `${row.nombres} ${row.apellidos}`,
          }));
        } else if (table === 'Grupos') {
          const catechistFilter = user?.role === 'catequista'
            ? `WHERE idCatequista = (
                 SELECT id FROM Catequistas WHERE numeroDocumento = ? LIMIT 1
               )`
            : '';
          const [rows] = await pool.query(
            `SELECT id, nombreGrupo, nivelCatequesis
             FROM Grupos ${catechistFilter} ORDER BY nombreGrupo`,
            user?.role === 'catequista' ? [String(user.id)] : []
          );
          options.idGrupo = rows.map((row) => ({
            id: row.id,
            label: `${row.nombreGrupo} · ${row.nivelCatequesis}`,
          }));
        } else if (table === 'Actividades') {
          const catechistFilter = user?.role === 'catequista'
            ? `WHERE idGrupo IN (
                 SELECT g.id
                 FROM Grupos g
                 INNER JOIN Catequistas c ON c.id = g.idCatequista
                 WHERE c.numeroDocumento = ?
               )`
            : '';
          const [rows] = await pool.query(
            `SELECT id, descripcion, fechaActividad, idGrupo
             FROM Actividades ${catechistFilter}
             ORDER BY fechaActividad DESC`,
            user?.role === 'catequista' ? [String(user.id)] : []
          );
          options.idActividad = rows.map((row) => ({
            id: row.id,
            label: `${row.fechaActividad} · ${row.descripcion.slice(0, 70)}`,
            idGrupo: row.idGrupo,
          }));
        }
      }

      if (moduleName === 'attendance') {
        const catechistFilter = user?.role === 'catequista'
          ? `WHERE idCatequista = (
               SELECT id FROM Catequistas WHERE numeroDocumento = ? LIMIT 1
             )`
          : '';
        const [rows] = await pool.query(
          `SELECT id, nombreGrupo, nivelCatequesis, anio
           FROM Grupos ${catechistFilter}
           ORDER BY anio DESC, nombreGrupo`,
          user?.role === 'catequista' ? [String(user.id)] : []
        );
        options.idGrupo = rows.map((row) => ({
          id: row.id,
          label: `${row.nombreGrupo} · ${row.nivelCatequesis} · ${row.anio}`,
        }));
      }

      return options;
    } catch (err) {
      throw Boom.boomify(err, { message: 'Unable to retrieve form options' });
    }
  }

  async listAttendanceGrid(groupId) {
    const numericGroupId = Number(groupId);
    if (!Number.isInteger(numericGroupId) || numericGroupId < 1) {
      throw Boom.badRequest('A valid group is required');
    }

    try {
      const [[groups], [students], [activities], [attendance]] = await Promise.all([
        pool.query(
          'SELECT id, nombreGrupo, nivelCatequesis, anio FROM Grupos WHERE id = ?',
          [numericGroupId]
        ),
        pool.query(
          `SELECT DISTINCT c.id, c.numeroDocumento, c.nombres, c.apellidos
           FROM Matriculas m
           INNER JOIN Catequizandos c ON c.id = m.idCatequizando
           WHERE m.idGrupo = ? AND m.estado = 'activa'
           ORDER BY c.apellidos, c.nombres`,
          [numericGroupId]
        ),
        pool.query(
          `SELECT id, descripcion, fechaActividad, calificable
           FROM Actividades
           WHERE idGrupo = ?
           ORDER BY fechaActividad, id`,
          [numericGroupId]
        ),
        pool.query(
          `SELECT a.id, a.idCatequizando, a.idActividad, a.asistio,
                  a.calificacion, a.observaciones
           FROM Asistencias a
           INNER JOIN Actividades ac ON ac.id = a.idActividad
           WHERE ac.idGrupo = ?`,
          [numericGroupId]
        ),
      ]);

      if (groups.length === 0) {
        throw Boom.notFound('Group not found');
      }

      return { group: groups[0], students, activities, attendance };
    } catch (err) {
      if (Boom.isBoom(err)) {
        throw err;
      }
      throw Boom.boomify(err, { message: 'Unable to retrieve attendance grid' });
    }
  }

  async uploadActivityMaterial(activityId, groupId, originalName, contentType, fileBuffer, userId) {
    const numericActivityId = Number(activityId);
    const numericGroupId = Number(groupId);
    const extension = path.extname(String(originalName || '')).toLowerCase();
    if (
      !Number.isInteger(numericActivityId) ||
      numericActivityId < 1 ||
      !Number.isInteger(numericGroupId) ||
      numericGroupId < 1 ||
      !Buffer.isBuffer(fileBuffer) ||
      fileBuffer.length === 0 ||
      fileBuffer.length > maximumMaterialSize ||
      !materialTypes[extension] ||
      contentType !== materialTypes[extension] ||
      !hasValidMaterialSignature(extension, fileBuffer)
    ) {
      throw Boom.badRequest('Upload a valid PDF, Word, or Excel file up to 20 MB');
    }

    const [activities] = await pool.query(
      `SELECT a.id, a.idGrupo, a.rutaPdf, c.numeroDocumento AS catechistDocument
       FROM Actividades a
       INNER JOIN Grupos g ON g.id = a.idGrupo
       LEFT JOIN Catequistas c ON c.id = g.idCatequista
       WHERE a.id = ? AND a.idGrupo = ?`,
      [numericActivityId, numericGroupId]
    );
    if (activities.length === 0) {
      throw Boom.notFound('Activity not found in the selected group');
    }
    if (String(activities[0].catechistDocument) !== String(userId)) {
      throw Boom.forbidden('You can only upload material to your assigned groups');
    }

    const filename = `${randomUUID()}${extension}`;
    const filePath = path.join(materialDirectory, filename);
    const materialUrl = `/app/v1/modules/activities/${numericActivityId}/material/${filename}`;
    let fileCreated = false;
    try {
      await mkdir(materialDirectory, { recursive: true });
      await writeFile(filePath, fileBuffer, { flag: 'wx' });
      fileCreated = true;
      await pool.query(
        'UPDATE Actividades SET rutaPdf = ? WHERE id = ? AND idGrupo = ?',
        [materialUrl, numericActivityId, numericGroupId]
      );
      return { status: 'UPLOADED SUCCESSFULLY', url: materialUrl };
    } catch (err) {
      if (fileCreated) {
        await unlink(filePath);
      }
      if (Boom.isBoom(err)) {
        throw err;
      }
      throw Boom.boomify(err, { message: 'Unable to save activity material' });
    }
  }

  async readActivityMaterial(activityId, filename, user) {
    const numericActivityId = Number(activityId);
    if (
      !Number.isInteger(numericActivityId) ||
      numericActivityId < 1 ||
      typeof filename !== 'string' ||
      path.basename(filename) !== filename ||
      !/^[0-9a-f-]+\.(pdf|doc|docx|xls|xlsx)$/i.test(filename)
    ) {
      throw Boom.badRequest('A valid activity material file is required');
    }

    try {
      const [activities] = await pool.query(
        `SELECT a.id, a.idGrupo, a.rutaPdf
         FROM Actividades a
         WHERE a.id = ?`,
        [numericActivityId]
      );
      if (
        activities.length === 0 ||
        activities[0].rutaPdf !==
          `/app/v1/modules/activities/${numericActivityId}/material/${filename}`
      ) {
        throw Boom.notFound('Activity material not found');
      }

      const role = String(user.role).trim().toLowerCase();
      if (role === 'catequista') {
        const [assignments] = await pool.query(
          `SELECT g.id
           FROM Grupos g
           INNER JOIN Catequistas c ON c.id = g.idCatequista
           WHERE g.id = ? AND c.numeroDocumento = ?`,
          [activities[0].idGrupo, String(user.id)]
        );
        if (assignments.length === 0) {
          throw Boom.forbidden('You can only access material from your assigned groups');
        }
      } else if (role === 'acudiente' || role === 'catequizando') {
        const identityCondition = role === 'acudiente'
          ? 'c.idAcudiente = (SELECT id FROM Acudientes WHERE numeroDocumento = ? LIMIT 1)'
          : 'c.numeroDocumento = ?';
        const [students] = await pool.query(
          `SELECT c.id
           FROM Catequizandos c
           INNER JOIN Matriculas m ON m.idCatequizando = c.id
           WHERE ${identityCondition} AND m.idGrupo = ?
           LIMIT 1`,
          [String(user.id), activities[0].idGrupo]
        );
        if (students.length === 0) {
          throw Boom.forbidden('You can only access material for your catechesis process');
        }
      } else if (role !== 'administrador') {
        throw Boom.forbidden('Your role cannot access activity material');
      }

      const filePath = path.join(materialDirectory, filename);
      return {
        file: await readFile(filePath),
        filename,
        contentType: materialTypes[path.extname(filename).toLowerCase()],
      };
    } catch (err) {
      if (Boom.isBoom(err)) {
        throw err;
      }
      if (err.code === 'ENOENT') {
        throw Boom.notFound('Activity material file not found');
      }
      throw Boom.boomify(err, { message: 'Unable to read activity material' });
    }
  }

  async saveAttendanceGrid(groupId, entries) {
    const numericGroupId = Number(groupId);
    if (!Number.isInteger(numericGroupId) || numericGroupId < 1 || !Array.isArray(entries)) {
      throw Boom.badRequest('A valid group and attendance entries are required');
    }

    const normalizedEntries = entries.map((entry) => {
      if (
        !entry ||
        !Number.isInteger(Number(entry.idCatequizando)) ||
        Number(entry.idCatequizando) < 1 ||
        !Number.isInteger(Number(entry.idActividad)) ||
        Number(entry.idActividad) < 1 ||
        ![true, false, 1, 0, '1', '0', 'true', 'false'].includes(entry.asistio)
      ) {
        throw Boom.badRequest('Each attendance entry requires a student, activity, and attendance status');
      }

      const grade = entry.calificacion === '' || entry.calificacion === undefined
        ? null
        : entry.calificacion === null
          ? null
          : Number(entry.calificacion);
      if (
        grade !== null &&
        (!Number.isFinite(grade) || grade < 1 || grade > 5 || Math.round(grade * 10) !== grade * 10)
      ) {
        throw Boom.badRequest('Grade must be between 1.0 and 5.0 with at most one decimal place');
      }

      return {
        idCatequizando: Number(entry.idCatequizando),
        idActividad: Number(entry.idActividad),
        asistio: entry.asistio === true || entry.asistio === 1 ||
          entry.asistio === '1' || entry.asistio === 'true',
        calificacion: grade,
        observaciones: typeof entry.observaciones === 'string'
          ? entry.observaciones.trim() || null
          : null,
      };
    });

    const uniqueEntries = new Set(
      normalizedEntries.map((entry) => `${entry.idCatequizando}:${entry.idActividad}`)
    );
    if (uniqueEntries.size !== normalizedEntries.length) {
      throw Boom.badRequest('Duplicate attendance entries are not allowed');
    }

    let connection;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      const [groups] = await connection.query(
        'SELECT id FROM Grupos WHERE id = ?',
        [numericGroupId]
      );
      if (groups.length === 0) {
        throw Boom.notFound('Group not found');
      }

      if (normalizedEntries.length > 0) {
        const [validPairs] = await connection.query(
          `SELECT m.idCatequizando, ac.id AS idActividad, ac.calificable
           FROM Matriculas m
           INNER JOIN Actividades ac ON ac.idGrupo = m.idGrupo
           WHERE m.idGrupo = ? AND m.estado = 'activa'`,
          [numericGroupId]
        );
        const validPairSet = new Set(
          validPairs.map((pair) => `${pair.idCatequizando}:${pair.idActividad}`)
        );
        const gradableActivityIds = new Set(
          validPairs
            .filter((pair) => pair.calificable === true || pair.calificable === 1 || pair.calificable === '1')
            .map((pair) => Number(pair.idActividad))
        );
        if (normalizedEntries.some((entry) =>
          !validPairSet.has(`${entry.idCatequizando}:${entry.idActividad}`) ||
          (entry.calificacion !== null && !gradableActivityIds.has(entry.idActividad))
        )) {
          throw Boom.badRequest('Students and activities must belong to the selected group, and grades require a gradable activity');
        }

        for (const entry of normalizedEntries) {
          await connection.query(
            `INSERT INTO Asistencias (
              asistio, calificacion, observaciones, idCatequizando, idActividad
            ) VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              asistio = VALUES(asistio),
              calificacion = VALUES(calificacion),
              observaciones = VALUES(observaciones)`,
            [
              entry.asistio,
              entry.calificacion,
              entry.observaciones,
              entry.idCatequizando,
              entry.idActividad,
            ]
          );
        }
      }

      await connection.commit();
      return { status: 'UPDATED SUCCESSFULLY', saved: normalizedEntries.length };
    } catch (err) {
      if (connection) {
        await connection.rollback();
      }
      if (Boom.isBoom(err)) {
        throw err;
      }
      throw this.translateDatabaseError(err, 'Unable to save attendance grid');
    } finally {
      connection?.release();
    }
  }

  async validateReferences(definition, values) {
    for (const [field, [table, required]] of Object.entries(definition.references || {})) {
      const value = values[field];
      if (value === undefined) {
        continue;
      }
      if (value === null) {
        if (required) {
          throw Boom.badRequest(`A value is required for ${field}`);
        }
        continue;
      }
      const [rows] = await pool.query(`SELECT id FROM ${table} WHERE id = ?`, [value]);
      if (rows.length === 0) {
        throw Boom.badRequest(`The selected record for ${field} does not exist`);
      }
    }
  }

  async validateAttendanceGrade(moduleName, recordId, values) {
    if (
      moduleName !== 'attendance' ||
      (values.calificacion === undefined && values.idActividad === undefined)
    ) {
      return;
    }

    let activityId = values.idActividad;
    let grade = values.calificacion;
    if (recordId && (activityId === undefined || grade === undefined)) {
      const [records] = await pool.query(
        'SELECT idActividad, calificacion FROM Asistencias WHERE id = ?',
        [recordId]
      );
      if (records.length === 0) {
        throw Boom.notFound('Attendance record not found');
      }
      if (activityId === undefined) {
        activityId = records[0].idActividad;
      }
      if (grade === undefined) {
        grade = records[0].calificacion;
      }
    }
    if (grade === undefined || grade === null) {
      return;
    }

    const [activities] = await pool.query(
      'SELECT calificable FROM Actividades WHERE id = ?',
      [activityId]
    );
    if (
      activities.length === 0 ||
      !(activities[0].calificable === true || activities[0].calificable === 1 || activities[0].calificable === '1')
    ) {
      throw Boom.badRequest('Grades can only be recorded for gradable activities');
    }
  }

  translateDatabaseError(err, message) {
    if (Boom.isBoom(err)) {
      if (err.output.statusCode === 500 && err.data?.code === 'ER_DUP_ENTRY') {
        return Boom.conflict('A record with the same unique value already exists');
      }
      if (err.output.statusCode === 500 && err.data?.code === 'ER_ROW_IS_REFERENCED_2') {
        return Boom.conflict('This record is being used by another module');
      }
      return err;
    }
    if (err.code === 'ER_DUP_ENTRY') {
      return Boom.conflict('A record with the same unique value already exists');
    }
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return Boom.badRequest('A related record no longer exists');
    }
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      return Boom.conflict('This record is being used by another module');
    }
    return Boom.boomify(err, { message });
  }
}
