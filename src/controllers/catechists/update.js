// Import the CatechistServices class from the catechistServices module
import { CatechistServices } from '../../services/catechistServices.js';
// Import Boom for handling HTTP-friendly error objects
import Boom from '@hapi/boom';

export const updateOneCatechist = async (req, res, next) => {
  // Destructure the catechist ID and updated data from the request body
  const { id, newCatechistData } = req.body;

  if (!id || !newCatechistData) {
    return next(Boom.badRequest('Catechist ID and data are required'));
  }

  const catechistManager = new CatechistServices();

  try {
    await catechistManager.updateOne(id, newCatechistData);
    return res.status(200).json({
      success: true,
      message: 'Catechist updated successfully',
      authentication: res.locals.newUserToken,
    });
  } catch (err) {
    if (Boom.isBoom(err)) {
      return next(err);
    }
    next(Boom.serverUnavailable('Unable to update catechist in the database', err));
  }
};