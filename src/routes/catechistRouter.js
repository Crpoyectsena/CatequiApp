// Import the Router class from Express
import { Router } from 'express';
// Import the middleware to verify tokens from the authentication app
import { authAppVerifyToken } from
  '../middlewares/tokenHandlers/authAppTokenHandler.js';
// Import the role guard for catechist administration
import { requireRoles } from '../middlewares/tokenHandlers/roleAccess.js';
// Import the controllers functions to manage catechists
import { createOneCatechist } from '../controllers/catechists/create.js';
import { listOneCatechist } from '../controllers/catechists/listOne.js';
import { listAllCatechists } from '../controllers/catechists/listAll.js';
import { updateOneCatechist } from '../controllers/catechists/update.js';
import { deleteOneCatechist } from '../controllers/catechists/delete.js';

// Create a new Router instance
export const catechistRouter = Router();

catechistRouter.use(
  // Verify the user's session before any catechist endpoint
  authAppVerifyToken,
  // Restrict catechist administration to administrators
  requireRoles('administrador')
);

// Define a POST route to create a catechist
catechistRouter.post(
  // Route path to create a catechist
  '/create',
  // Controller function to create the catechist
  createOneCatechist
);

// Define a POST route to list one catechist
catechistRouter.post(
  // Route path to list one catechist
  '/listone',
  // Controller function to list one catechist
  listOneCatechist
);

// Define a GET route to list all catechists
catechistRouter.get(
  // Route path to list all catechists
  '/listall',
  // Controller function to list all catechists
  listAllCatechists
);

// Define a POST route to update a catechist
catechistRouter.post(
  // Route path to update a catechist
  '/update',
  // Controller function to update the catechist
  updateOneCatechist
);

// Define a POST route to delete a catechist
catechistRouter.post(
  // Route path to delete a catechist
  '/delete',
  // Controller function to delete the catechist
  deleteOneCatechist
);