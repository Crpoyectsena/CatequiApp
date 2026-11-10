// Import the CatechistServices class from the catechistServices module
import { CatechistServices } from '../../services/catechistServices.js';
// Import Boom for handling HTTP-friendly error objects
import Boom from '@hapi/boom';

export const deleteOneCatechist = async (req, res, next) => {
  // Destructure the catechist ID from the request body
  const { id } = req.body;

  if (!id) {
    return next(Boom.badRequest('Catechist ID is required'));
  }

  const catechistManager = new CatechistServices();

  try {
    await catechistManager.deleteOne(id);
    return res.status(200).json({
      success: true,
      message: 'Catechist deleted successfully',
      authentication: res.locals.newUserToken,
    });
  } catch (err) {
    if (Boom.isBoom(err)) {
      return next(err);
    }
    next(Boom.serverUnavailable('Unable to delete catechist from the database', err));
  }
};