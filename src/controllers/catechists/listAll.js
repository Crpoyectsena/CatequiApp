// Import the CatechistServices class from the catechistServices module
import { CatechistServices } from '../../services/catechistServices.js';
// Import Boom for handling HTTP-friendly error objects
import Boom from '@hapi/boom';

export const listAllCatechists = async (req, res, next) => {
  const catechistManager = new CatechistServices();

  try {
    // Attempt to retrieve all catechists
    const allRecords = await catechistManager.listAll();

    if (allRecords && allRecords.length > 0) {
      return res.status(200).json({
        success: true,
        message: 'Catechists retrieved successfully',
        authentication: res.locals.newUserToken,
        catechists: allRecords,
      });
    } else {
      return res.status(404).json({
        success: false,
        message: 'No catechists found',
        authentication: res.locals.newUserToken,
        catechists: [],
      });
    }
  } catch (err) {
    if (Boom.isBoom(err)) {
      return next(err);
    }
    const boomError = Boom.serverUnavailable(
      'Unable to retrieve catechists from the database',
      err
    );
    next(boomError);
  }
};