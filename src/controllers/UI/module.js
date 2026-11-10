// Import Boom for handling HTTP-friendly errors
import Boom from '@hapi/boom';
// Import FormationServices for loading module records and related options
import { FormationServices } from '../../services/formationServices.js';
import { UserServices } from '../../services/userServices.js';

const modules = {
  guardians: {
    title: 'Acudientes',
    description: 'Registra y organiza a las personas responsables de acompañar a cada catequizando.',
    category: 'Comunidad',
    fields: [
      { key: 'tipoDocumento', label: 'Tipo de documento', required: true },
      { key: 'numeroDocumento', label: 'Número de documento', required: true },
      { key: 'nombres', label: 'Nombres', required: true },
      { key: 'apellidos', label: 'Apellidos', required: true },
      { key: 'fechaNacimiento', label: 'Fecha de nacimiento', type: 'date' },
      { key: 'direccion', label: 'Dirección' },
      { key: 'telefono', label: 'Teléfono', type: 'tel' },
      { key: 'correo', label: 'Correo', type: 'email' },
      { key: 'estado', label: 'Estado', type: 'select', required: true, options: ['activo', 'inactivo'], defaultValue: 'activo' },
    ],
    columns: [
      { key: 'numeroDocumento', label: 'Documento' },
      { key: 'nombres', label: 'Nombres' },
      { key: 'apellidos', label: 'Apellidos' },
      { key: 'telefono', label: 'Teléfono' },
      { key: 'correo', label: 'Correo' },
      { key: 'estado', label: 'Estado' },
    ],
    relation: 'Cada catequizando se vincula con un acudiente registrado.',
  },
  catechumens: {
    title: 'Catequizandos',
    description: 'Centraliza la información de las personas que participan en el proceso de catequesis.',
    category: 'Comunidad',
    fields: [
      { key: 'tipoDocumento', label: 'Tipo de documento', required: true },
      { key: 'numeroDocumento', label: 'Número de documento', type: 'number', min: 1, required: true },
      { key: 'nombres', label: 'Nombres', required: true },
      { key: 'apellidos', label: 'Apellidos', required: true },
      { key: 'fechaNacimiento', label: 'Fecha de nacimiento', type: 'date' },
      { key: 'direccion', label: 'Dirección' },
      { key: 'telefono', label: 'Teléfono', type: 'tel' },
      { key: 'correo', label: 'Correo', type: 'email' },
      { key: 'estado', label: 'Estado', type: 'select', required: true, options: ['activo', 'inactivo'], defaultValue: 'activo' },
      { key: 'idAcudiente', label: 'Acudiente responsable', type: 'reference', required: true },
    ],
    columns: [
      { key: 'numeroDocumento', label: 'Documento' },
      { key: 'nombres', label: 'Nombres' },
      { key: 'apellidos', label: 'Apellidos' },
      { key: 'acudienteNombres', label: 'Acudiente', secondaryKey: 'acudienteApellidos' },
      { key: 'telefono', label: 'Teléfono' },
      { key: 'estado', label: 'Estado' },
    ],
    relation: 'El registro requiere un acudiente existente.',
  },
  groups: {
    title: 'Grupos',
    description: 'Organiza los grupos por nivel, año, horario y espacio de encuentro.',
    category: 'Organización del proceso',
    fields: [
      { key: 'nombreGrupo', label: 'Nombre del grupo', required: true },
      { key: 'nivelCatequesis', label: 'Nivel de catequesis', required: true },
      { key: 'anio', label: 'Año', type: 'number', min: 2000, max: 2100, required: true },
      { key: 'horario', label: 'Horario' },
      { key: 'salon', label: 'Salón' },
      { key: 'cupoMaximo', label: 'Cupo máximo', type: 'number', min: 1, required: true },
      { key: 'estado', label: 'Estado', type: 'select', required: true, options: ['activo', 'inactivo'], defaultValue: 'activo' },
      { key: 'idCatequista', label: 'Catequista asignado', type: 'reference', optional: true },
    ],
    columns: [
      { key: 'nombreGrupo', label: 'Grupo' },
      { key: 'nivelCatequesis', label: 'Nivel' },
      { key: 'anio', label: 'Año' },
      { key: 'horario', label: 'Horario' },
      { key: 'catequistaNombres', label: 'Catequista', secondaryKey: 'catequistaApellidos' },
      { key: 'estado', label: 'Estado' },
    ],
    relation: 'Un grupo puede tener un catequista asignado y reúne las matrículas de sus participantes.',
  },
  enrollments: {
    title: 'Matrículas',
    description: 'Vincula a cada catequizando con un grupo y realiza seguimiento a su inscripción.',
    category: 'Organización del proceso',
    fields: [
      { key: 'fechaMatricula', label: 'Fecha de matrícula', type: 'date', required: true },
      { key: 'idCatequizando', label: 'Catequizando', type: 'reference', required: true },
      { key: 'idGrupo', label: 'Grupo', type: 'reference', required: true },
      { key: 'estado', label: 'Estado', type: 'select', required: true, options: ['activa', 'finalizada', 'retirada'], defaultValue: 'activa' },
      { key: 'observaciones', label: 'Observaciones', type: 'textarea' },
    ],
    columns: [
      { key: 'fechaMatricula', label: 'Fecha' },
      { key: 'catequizandoNombres', label: 'Catequizando', secondaryKey: 'catequizandoApellidos' },
      { key: 'nombreGrupo', label: 'Grupo' },
      { key: 'estado', label: 'Estado' },
      { key: 'observaciones', label: 'Observaciones' },
    ],
    relation: 'Cada matrícula relaciona un catequizando con un grupo.',
  },
  activities: {
    title: 'Actividades',
    description: 'Planifica los encuentros y actividades de formación asociados a cada grupo.',
    category: 'Seguimiento formativo',
    fields: [
      { key: 'descripcion', label: 'Descripción', type: 'textarea', required: true },
      { key: 'fechaActividad', label: 'Fecha de actividad', type: 'date', required: true },
      { key: 'idGrupo', label: 'Grupo', type: 'reference', required: true },
      { key: 'calificable', label: 'La actividad es calificable', type: 'checkbox' },
      {
        key: 'rutaPdf',
        label: 'Material PDF, Word o Excel',
        type: 'file',
        accept: '.pdf,.doc,.docx,.xls,.xlsx',
      },
      { key: 'estado', label: 'Estado', type: 'select', required: true, options: ['activa', 'inactiva'], defaultValue: 'activa' },
    ],
    columns: [
      { key: 'fechaActividad', label: 'Fecha' },
      { key: 'descripcion', label: 'Actividad' },
      { key: 'nombreGrupo', label: 'Grupo' },
      { key: 'rutaPdf', label: 'Material', type: 'link' },
      { key: 'calificable', label: 'Calificable', type: 'boolean' },
      { key: 'estado', label: 'Estado' },
    ],
    relation: 'Las actividades pertenecen a un grupo y pueden servir de base para registrar asistencias.',
  },
  attendance: {
    title: 'Asistencias',
    description: 'Consulta y registra asistencia y calificaciones por grupo y actividad.',
    category: 'Seguimiento formativo',
    fields: [
      { key: 'idCatequizando', label: 'Catequizando', type: 'reference', required: true },
      { key: 'idActividad', label: 'Actividad', type: 'reference', required: true },
      { key: 'asistio', label: 'Asistió', type: 'checkbox', defaultValue: true },
      { key: 'calificacion', label: 'Calificación (1.0 a 5.0)', type: 'number', min: 1, max: 5, step: 0.1 },
      { key: 'observaciones', label: 'Observaciones', type: 'textarea' },
    ],
    columns: [
      { key: 'fechaActividad', label: 'Fecha' },
      { key: 'nombreGrupo', label: 'Grupo' },
      { key: 'catequizandoNombres', label: 'Catequizando', secondaryKey: 'catequizandoApellidos' },
      { key: 'actividadDescripcion', label: 'Actividad' },
      { key: 'asistio', label: 'Asistió', type: 'boolean' },
      { key: 'calificacion', label: 'Calificación' },
    ],
    relation: 'Cada registro corresponde a un catequizando y una actividad.',
  },
};

const formationManager = new FormationServices();
const userManager = new UserServices();

export const moduleView = async (req, res, next) => {
  const module = modules[req.params.module];
  if (!module) {
    return next(Boom.notFound('No se encontró el módulo solicitado'));
  }

  try {
    const userData = await userManager.listOne(req.user.id);
    const userContext = {
      id: userData.id,
      role: String(userData.role).trim().toLowerCase(),
    };
    const [records, options] = await Promise.all([
      formationManager.listAll(req.params.module, userContext),
      userContext.role === 'catequista' ||
        (userContext.role === 'administrador' &&
          !['activities', 'attendance'].includes(req.params.module))
        ? formationManager.listOptions(req.params.module, userContext)
        : {},
    ]);

    const permissions = {
      canCreate: userContext.role === 'administrador' &&
        !['activities', 'attendance'].includes(req.params.module),
      canEdit: userContext.role === 'administrador' &&
        !['activities', 'attendance'].includes(req.params.module),
      canDelete: userContext.role === 'administrador' &&
        !['activities', 'attendance'].includes(req.params.module),
      canUseAttendanceGrid: userContext.role === 'catequista' &&
        req.params.module === 'attendance',
    };
    if (userContext.role === 'catequista' && req.params.module === 'activities') {
      permissions.canCreate = true;
    }
    const moduleForRole = { ...module };
    if (req.params.module === 'attendance' && userContext.role === 'administrador') {
      moduleForRole.description = 'Consulta los reportes generales de asistencia y calificaciones.';
    } else if (
      req.params.module === 'attendance' &&
      ['acudiente', 'catequizando'].includes(userContext.role)
    ) {
      moduleForRole.description = 'Consulta el historial de asistencia y calificaciones de tu proceso.';
    } else if (
      req.params.module === 'activities' &&
      ['acudiente', 'catequizando'].includes(userContext.role)
    ) {
      moduleForRole.description = 'Consulta y descarga el material de apoyo de tus grupos.';
    }

    return res.render('module', {
      activeModule: req.params.module,
      module: moduleForRole,
      records,
      options,
      userRole: userContext.role,
      permissions,
    });
  } catch (err) {
    if (Boom.isBoom(err)) {
      return next(err);
    }
    return next(Boom.serverUnavailable('No es posible cargar los datos del módulo.', err));
  }
};
