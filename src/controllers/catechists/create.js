// Import the CatechistServices class from the catechistServices module
import { UserServices } from '../../services/userServices.js';
// Import Boom for handling HTTP-friendly error objects
import Boom from '@hapi/boom';

export const createOneCatechist = async (req, res, next) => {
  // Destructure the new catechist data from the request body
  const { newCatechistData } = req.body || {};

  // Validate if the catechist data is sent
  if (!newCatechistData || typeof newCatechistData !== 'object' ||
      Array.isArray(newCatechistData) || !newCatechistData.numeroDocumento) {
    return next(Boom.badRequest('Catechist data is required'));
  }

  const userManager = new UserServices();

  try {
    const response = await userManager.createOneFromCatechist(newCatechistData);

    if (response.status === 'CREATED SUCCESSFULLY') {
      return res.status(201).json({
        success: true,
        message: 'Catechist profile and user account created successfully',
        // Include the new token in the response
        authentication: res.locals.newUserToken,
      });
    }
  } catch (err) {
    // Let Boom errors thrown by the service pass through untouched
    if (Boom.isBoom(err)) {
      return next(err);
    }
    // Handle unexpected errors with a Boom response
    const boomError = Boom.serverUnavailable(
      'Unable to create the catechist in the database',
      err
    );
    next(boomError);
  }
};