// Import the UserServices class from the userServices module
import { UserServices } from '../../services/userServices.js';
// Import Boom to create HTTP-friendly error objects
import Boom from '@hapi/boom';

export const updateOneUser = async (req, res, next) => {

  // Extract user ID and new user data from the request body
  const { id, newUserData } = req.body || {};

  // Validate if the user ID and new data object is sent.
  if (
    !id ||
    !newUserData ||
    typeof newUserData !== 'object' ||
    Array.isArray(newUserData)
  ) {
    return next(Boom.badRequest('User ID and new user data are required'));
  }

  // Instantiate the UserServices class to manage user operations
  const userManager = new UserServices();

  try {
    // Attempt to update the user details in the database
    const response = await userManager.updateOne(id, newUserData);

    // If the update is successful, return a 201 response with a success message
    if (response.status === 'UPDATED SUCCESSFULLY') {
      return res.status(200).json({
        success: true,
        message: 'User updated successfully',
        passwordUpdated: response.passwordUpdated,
        // Include the new token in the response
        authentication: res.locals.newUserToken
      });
    } else {
      return res.status(404).json({
        success: false,
        message: 'User not found or update failed'
      });
    }

  } catch (err) {
    if (Boom.isBoom(err)) {
      return next(err);
    }
    // Handle errors during the update process by returning a 503 error
    const boomError = Boom.serverUnavailable(
      'Unable to update user in database',
      err
    );
    next(boomError);
  }
};
