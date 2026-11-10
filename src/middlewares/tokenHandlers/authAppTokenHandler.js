
import { config } from '../../config/config.js';
import { signUserToken } from '../../utils/auth/tokenSign.js';
import jwt from 'jsonwebtoken';

export const authAppVerifyToken = (req, res, next) => {

  const authenticationToken = req.cookies?.authentication;

  let message = "";

  // Check for the presence of the authentication token
  if (!authenticationToken) {
    res.clearCookie('authentication');
    message = "Acceso denegado. Para acceder a este recurso, por favor inicie sección.";
    return res.status(403).render("authError", { message: message, type: "no-token" });
  }

  // Verify the token using the secret key
  jwt.verify(authenticationToken, config.authAppJwtKey, (err, decoded) => {
    if (err) {
      // Handle specific JWT errors
      if (err.name === 'TokenExpiredError') {
        res.clearCookie('authentication');
        message = "La sesión se ha finalizado, por favor inicie sección e inténtelo de nuevo.";
        return res.status(401).render("authError", { message: message, type: "token-exp" });
      } else {
        res.clearCookie('authentication');
        message = "Acceso denegado. Los datos del usuario no son validos, por favor inicie sección e inténtelo de nuevo.";
        return res.status(401).render("authError", { message: message, type: "token-inv" });
      }
    }

    if (
      !decoded ||
      typeof decoded !== 'object' ||
      !Number.isSafeInteger(Number(decoded.id)) ||
      Number(decoded.id) < 1
    ) {
      res.clearCookie('authentication');
      message = "Acceso denegado. Los datos del usuario no son validos, por favor inicie sesión e inténtelo de nuevo.";
      return res.status(401).render("authError", { message: message, type: "token-inv" });
    }

    // Extract user data from the decoded token
    const userData = {
      id: Number(decoded.id),
    };

    // Regenerate a new token for the user
    const newUserToken = signUserToken(userData, config.authAppJwtKey, '1h');

    // Send the new token in a cookie to the client
    res.cookie('authentication', newUserToken, { httpOnly: true });

    // Attach user data to the request object for later use
    req.user = { ...decoded, id: Number(decoded.id) };

    // Proceed to the next middleware or controller
    next();
  });
};
