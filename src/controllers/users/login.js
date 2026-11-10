// Import the UserServices class from the userServices module
import { UserServices } from '../../services/userServices.js';
// Import Boom to create HTTP-friendly error objects
import Boom from '@hapi/boom';
// Import jwt library to manage tokens
import jwt from 'jsonwebtoken';
// Import configuration settings
import { config } from '../../config/config.js';

export const loginUser = async (req, res, next) => {

  // Extract credentials only when the request body contains a valid object
  const credentials = req.body?.credentials;
  if (!credentials || typeof credentials !== 'object' || Array.isArray(credentials)) {
    return next(Boom.badRequest('Username and password are required'));
  }
  const { userName, password } = credentials;

  // Validate if the username and password is sent.
  if (typeof userName !== 'string' || !userName.trim() ||
      typeof password !== 'string' || !password) {
    return next(Boom.badRequest('Username and password are required'));
  }

  // Instantiate the UserServices class to manage user operations
  const userManager = new UserServices();

  try {
    // Attempt to log in the user by validating the credentials
    const response = await userManager.login(userName, password);

    let message = "";

    // Handle different outcomes of the login attempt
    switch (response.status) {
      case 'user not found':
        // If the user is not found in the database, return a 404 error view
        message = "Usuario incorrecto. Por favor verifique e intente de nuevo.";
        return res.status(404).render("authError", { message: message, type: "user" });
      case 'wrong password':
        // If the password is incorrect, return a 401 error view
        message = "Contraseña incorrecta. Por favor verifique e intente de nuevo.";
        return res.status(401).render("authError", { message: message, type: "password" });
      case 'logged':
        // If login is successful send a cookie with the token
        res.cookie('authentication', response.token, { httpOnly: true });
        // Decode the token to get the user ID
        const decoded = jwt.verify(response.token, config.authAppJwtKey);
        // Get username from DB using the ID in the token
        const userRecord = await userManager.listOne(decoded.id);
        // Render the dashboard with the account details required by the shared navigation
        return res.status(200).render('dashboard', {
          userName: userRecord.userName,
          activeModule: 'dashboard',
          userRole: userRecord.role,
        });
      default:
        // Handle any unexpected cases with a 500 error
        return next(Boom.badImplementation('Servicio no disponible'));
    }
  } catch (err) {
    if (Boom.isBoom(err)) {
      return next(err);
    }
    // Handle errors during the login process by returning a 503 error
    return next(Boom.serverUnavailable(
      'Unable to verify user credentials in the database',
      err
    ));
  }
};
