// Import the UserServices class from the userServices module
import { UserServices } from '../../services/userServices.js';
// Import Boom for handling HTTP-friendly error objects
import Boom from '@hapi/boom';

export const dashboard = async (req, res, next) => {
  // Instantiate the UserServices class to manage user operations
  const userManager = new UserServices();
  try {
    // Extract the user id that the middleware saved in req.user
    const { id } = req.user;
    // Find the user record by ID
    const userData = await userManager.listOne(id);
    // Return rendering the template and send the username
    res.render('dashboard', {
      userName: userData.userName,
      activeModule: 'dashboard',
      userRole: userData.role,
    });
  } catch (err) {
    const boomError = Boom.notImplemented(
      'No es posible renderizar la vista de dashboard principal.',
      err);
    next(boomError);
  }
};
