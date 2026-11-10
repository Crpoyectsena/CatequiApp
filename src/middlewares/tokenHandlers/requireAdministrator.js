// Import the UserServices class to retrieve the authenticated user's current role
import { UserServices } from '../../services/userServices.js';
// Import Boom for HTTP-friendly authorization errors
import Boom from '@hapi/boom';

const userManager = new UserServices();

export const requireAdministrator = async (req, res, next) => {
  try {
    const user = await userManager.listOne(req.user.id);

    if (String(user.role).trim().toLowerCase() !== 'administrador') {
      return next(Boom.forbidden('Administrator access is required'));
    }

    res.locals.userRole = 'administrador';
    return next();
  } catch (err) {
    if (Boom.isBoom(err)) {
      return next(err);
    }
    return next(Boom.serverUnavailable('Unable to verify administrator permissions', err));
  }
};
