// Import the pool for validating catechist group assignments
import { pool } from '../../DB/index.js';
// Import UserServices to load the authenticated user's current role
import { UserServices } from '../../services/userServices.js';
// Import Boom for HTTP-friendly authorization errors
import Boom from '@hapi/boom';

const userManager = new UserServices();
const validRoles = ['administrador', 'catequista', 'acudiente', 'catequizando'];

const getCurrentUser = async (req, res) => {
  const user = await userManager.listOne(req.user.id);
  const role = String(user.role).trim().toLowerCase();
  if (!validRoles.includes(role)) {
    throw Boom.forbidden('Your account role is not authorized');
  }
  req.user.role = role;
  res.locals.userRole = role;
  return user;
};

const isCatechistAssignedToGroup = async (userId, groupId) => {
  const [rows] = await pool.query(
    `SELECT g.id
     FROM Grupos g
     INNER JOIN Catequistas c ON c.id = g.idCatequista
     WHERE c.numeroDocumento = ? AND g.id = ?`,
    [String(userId), Number(groupId)]
  );
  return rows.length > 0;
};

export const requireRoles = (...roles) => async (req, res, next) => {
  try {
    const user = await getCurrentUser(req, res);
    if (!roles.includes(String(user.role).trim().toLowerCase())) {
      return next(Boom.forbidden('You do not have permission to access this resource'));
    }
    return next();
  } catch (err) {
    if (Boom.isBoom(err)) {
      return next(err);
    }
    return next(Boom.serverUnavailable('Unable to verify role permissions', err));
  }
};

export const requireSelfOrAdministrator = async (req, res, next) => {
  try {
    const user = await getCurrentUser(req, res);
    if (
      user.role !== 'administrador' &&
      String(req.body?.id ?? req.body?.credentials?.id) !== String(req.user.id)
    ) {
      return next(Boom.forbidden('You can only access your own account'));
    }
    return next();
  } catch (err) {
    if (Boom.isBoom(err)) {
      return next(err);
    }
    return next(Boom.serverUnavailable('Unable to verify account permissions', err));
  }
};

export const requireModuleAccess = async (req, res, next) => {
  try {
    const user = await getCurrentUser(req, res);
    const role = user.role;
    const moduleName = req.params.module || req.path.split('/')[1];
    const route = req.path;
    const isRead = req.method === 'GET' || route.endsWith('/listone');
    const isGrid = route.startsWith('/attendance/grid');
    let allowed = false;

    if (role === 'administrador') {
      allowed = moduleName !== 'attendance' || (isRead && !isGrid);
      if (moduleName === 'attendance' && route.endsWith('/options')) {
        allowed = false;
      }
      if (moduleName === 'activities' && !isRead) {
        allowed = false;
      }
    } else if (role === 'catequista') {
      allowed = ['activities', 'attendance'].includes(moduleName);
      const isActivityMaterialUpload = /^\/activities\/\d+\/material$/.test(route);
      if (
        moduleName === 'activities' &&
        !isRead &&
        route !== '/activities/create' &&
        !isActivityMaterialUpload
      ) {
        allowed = false;
      }
      if (moduleName === 'attendance' && !isRead && !isGrid) {
        allowed = false;
      }
      if (moduleName === 'attendance' && isGrid) {
        const groupId = isRead ? req.query.groupId : req.body?.groupId;
        if (!groupId || !(await isCatechistAssignedToGroup(req.user.id, groupId))) {
          allowed = false;
        }
      }
      if (moduleName === 'activities' && !isRead && allowed) {
        const groupId = isActivityMaterialUpload
          ? req.query.groupId
          : req.body?.record?.idGrupo;
        if (!groupId || !(await isCatechistAssignedToGroup(req.user.id, groupId))) {
          allowed = false;
        }
      }
    } else if (['acudiente', 'catequizando'].includes(role)) {
      const isReadOnlyPage =
        route === `/modules/${moduleName}` &&
        ['activities', 'attendance', 'catechumens'].includes(moduleName);
      const isActivityMaterialDownload =
        req.method === 'GET' && /^\/activities\/\d+\/material\/[^/]+$/.test(route);
      allowed = isRead &&
        (isReadOnlyPage ||
          isActivityMaterialDownload ||
          [
            '/activities/listall',
            '/activities/listone',
            '/attendance/listall',
            '/attendance/listone',
            '/catechumens/listall',
            '/catechumens/listone',
          ]
            .includes(route));
    }

    if (!allowed) {
      return next(Boom.forbidden('Your role does not have permission for this module action'));
    }
    return next();
  } catch (err) {
    if (Boom.isBoom(err)) {
      return next(err);
    }
    return next(Boom.serverUnavailable('Unable to verify module permissions', err));
  }
};
