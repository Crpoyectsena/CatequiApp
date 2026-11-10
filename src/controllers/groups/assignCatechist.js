// Import the GroupServices class from the groupServices module
import { GroupServices } from '../../services/groupServices.js';
// Import Boom for handling HTTP-friendly error objects
import Boom from '@hapi/boom';

export const assignCatechistToGroup = async (req, res, next) => {
  // Destructure the group ID and catechist ID from the request body
  const { id, idCatequista } = req.body;

  if (!id || !idCatequista) {
    return next(Boom.badRequest('Group ID and catechist ID are required'));
  }

  const groupManager = new GroupServices();

  try {
    const response = await groupManager.assignCatechist(id, idCatequista);

    if (response.status === 'ASSIGNED SUCCESSFULLY') {
      return res.status(200).json({
        success: true,
        message: 'Catechist assigned to group successfully',
        authentication: res.locals.newUserToken,
      });
    }
  } catch (err) {
    if (Boom.isBoom(err)) {
      return next(err);
    }
    next(Boom.serverUnavailable('Unable to assign catechist to group', err));
  }
};