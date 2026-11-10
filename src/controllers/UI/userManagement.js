// Import the UserServices class to retrieve registered accounts
import { UserServices } from '../../services/userServices.js';
// Import Boom for HTTP-friendly error objects
import Boom from '@hapi/boom';

export const userManagementView = async (req, res, next) => {
  const userManager = new UserServices();
  try {
    const [users, guardianOptions] = await Promise.all([
      userManager.listAll(),
      userManager.listGuardianOptions(),
    ]);
    return res.render('userManagement', {
      activeModule: 'accounts',
      users,
      guardianOptions,
      currentUserId: req.user.id,
      userRole: 'administrador',
    });
  } catch (err) {
    if (Boom.isBoom(err)) {
      return next(err);
    }
    return next(Boom.serverUnavailable('No es posible cargar las cuentas de usuario.', err));
  }
};
