// Import the Router class from Express
import { Router } from 'express';
// Import the middleware to verify tokens from the authentication app
import { authAppVerifyToken } from
'../middlewares/tokenHandlers/authAppTokenHandler.js';
// Import the controllers functions to manage user interfaces templates
import { loginForm } from '../controllers/UI/loginForm.js';
import { dashboard } from '../controllers/UI/dashboard.js';
import { profile } from '../controllers/UI/profile.js';
// Import the controller for the catechist management view
import { catechistsView } from '../controllers/UI/catechists.js';
// Import the controller that renders catechesis module interfaces
import { moduleView } from '../controllers/UI/module.js';
// Import the controller that renders administrator user management
import { userManagementView } from '../controllers/UI/userManagement.js';
// Import the middleware that restricts account management to administrators
import { requireAdministrator } from '../middlewares/tokenHandlers/requireAdministrator.js';
// Import role guards for catechist management and module views
import { requireModuleAccess, requireRoles } from '../middlewares/tokenHandlers/roleAccess.js';

// Create a new Router instance
export const UIRouter = Router();

// Define a GET route for login view
UIRouter.get(
  // Route path display the login view
  '/',
  // Controller function to render a login template
  loginForm
);

// Redirect public registration requests to the login page
UIRouter.get(
  // Route path for the disabled public registration page
  '/register',
  // Keep account creation private to administrators
  (req, res) => res.redirect('/app/v1/')
);


// Define a GET route for dashboard view
UIRouter.get(
  // Route path display the dashboard view
  '/dashboard',
  // Middleware to verify the token before proceeding to the controller
  authAppVerifyToken,
  // Controller function to render a dashboard template
  dashboard
);

// Define a GET route for certificate academic form view
UIRouter.get(
  // Route path display the certificate academic form view
  '/profile',
  // Middleware to verify the token before proceeding to the controller
  authAppVerifyToken,
  // Controller function to render a dashboard template
  profile
);

// Define a GET route for the catechist management view
UIRouter.get(
  // Route path to display catechist management
  '/catechists',
  // Middleware to verify the token before proceeding to the controller
  authAppVerifyToken,
  // Restrict catechist directory access to administrators
  requireRoles('administrador'),
  // Controller function to render the catechist management template
  catechistsView
);

// Define a GET route for the remaining catechesis module interfaces
UIRouter.get(
  // Route path to display administrator user management
  '/users/manage',
  // Middleware to verify the token before proceeding to the controller
  authAppVerifyToken,
  // Middleware to restrict account management to administrators
  requireAdministrator,
  // Controller function to render the user management view
  userManagementView
);

// Define a GET route for the remaining catechesis module interfaces
UIRouter.get(
  // Route path identifies the module to display
  '/modules/:module',
  // Middleware to verify the token before proceeding to the controller
  authAppVerifyToken,
  // Allow only modules granted to the authenticated role
  requireModuleAccess,
  // Controller function to render the selected module interface
  moduleView
);
