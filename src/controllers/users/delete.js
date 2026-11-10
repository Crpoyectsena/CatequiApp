
// Import the UserServices class from the userServices module
import { UserServices } from '../../services/userServices.js';
// Import Boom for handling HTTP-friendly error objects
import Boom from '@hapi/boom';

export const deleteOneUser = async (req, res, next) => {

  // Extract the user ID from the request body
  const { id } = req.body || {};

  // Validate if the user ID is sent.
  if (!id) {
    return next(Boom.badRequest('User ID is required for deletion'));
  }
  if (String(id) === String(req.user.id)) {
    return next(Boom.forbidden('You cannot delete your own account'));
  }

  // Instantiate the UserServices class to manage the user operations
  const userManager = new UserServices();

  try {
    // Attempt to delete the user by the provided ID
    const response = await userManager.deleteOne(id);

    // If the user is deleted successfully, send a success response
    if (response.status === 'DELETED SUCCESSFULLY') {
      return res.status(200).json({
        success: true,
        message: 'User deleted successfully',
        // Include the new token in the response
        authentication: res.locals.newUserToken
      });
    }

  } catch (err) {
    if (Boom.isBoom(err)) {
      return next(err);
    }
    // Handle errors during user deletion by sending a Boom error response
    const boomError = Boom.serverUnavailable(
      'Unable to delete the user from the database',
      err
    );
    // Pass the Boom error to the next middleware in the stack
    next(boomError);
  }
};
