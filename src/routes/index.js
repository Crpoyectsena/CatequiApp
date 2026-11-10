// Import the Router class from Express
import { Router } from 'express';
// Import the UIRouter for handling user-interface-related routes
import { UIRouter } from './UIRouter.js';
// Import the userRouter for handling user-related routes
import { userRouter } from './userRouter.js';
// Import the catechistRouter for handling catechist-related routes
import { catechistRouter } from './catechistRouter.js';
// Import the moduleRouter for catechesis data operations
import { moduleRouter } from './moduleRouter.js';

// Set up the application routes
const routerApi = (app) => {
	// Create the router for versioned application routes
	const router = Router();

	// Mount all application routes under the API version prefix
	app.use('/app/v1', router);
	// Register the user-interface routes
	router.use('/', UIRouter);
	// Register user API routes
	router.use('/users', userRouter);
	// Register catechist API routes
	router.use('/catechists', catechistRouter);
	// Register API routes for catechesis modules
	router.use('/modules', moduleRouter);
};

// Export the route setup function for the application bootstrap
export default routerApi;