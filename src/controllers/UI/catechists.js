// Import the CatechistServices class from the catechistServices module
import { CatechistServices } from '../../services/catechistServices.js';
import { UserServices } from '../../services/userServices.js';
// Import Boom for handling HTTP-friendly error objects
import Boom from '@hapi/boom';

export const catechistsView = async (req, res, next) => {
  // Instantiate the CatechistServices class
  const catechistManager = new CatechistServices();
  const userManager = new UserServices();
  try {
    const [catechists, userData] = await Promise.all([
      catechistManager.listAll(),
      userManager.listOne(req.user.id),
    ]);
    res.render('catechists', {
      catechists: catechists || [],
      activeModule: 'catechists',
      userRole: userData.role,
    });
  } catch (err) {
    if (Boom.isBoom(err)) {
      return next(err);
    }
    next(Boom.serverUnavailable('No es posible cargar la vista de gestión de catequistas.', err));
  }
};