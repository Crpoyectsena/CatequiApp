// Define a GET route for the catechist management view
UIRouter.get(
  // Route path display the catechist management view
  '/catechists',
  // Middleware to verify the token before proceeding to the controller
  authAppVerifyToken,
  // Controller function to render the catechist management template
  catechistsView
);