// Import the EnrollmentServices class from the enrollmentServices module
import { EnrollmentServices } from '../../services/enrollmentServices.js';
// Import Boom for handling HTTP-friendly error objects
import Boom from '@hapi/boom';

export const changeEnrollmentStatus = async (req, res, next) => {
  // Destructure the enrollment ID and new status from the body
  const { id, estado } = req.body;

  if (!id || !estado) {
    return next(Boom.badRequest('Enrollment ID and status are required'));
  }

  const enrollmentManager = new EnrollmentServices();

  try {
    const response = await enrollmentManager.changeStatus(id, estado);

    if (response.status === 'STATUS UPDATED SUCCESSFULLY') {
      return res.status(200).json({
        success: true,
        message: 'Enrollment status updated successfully',
        authentication: res.locals.newUserToken,
      });
    }
  } catch (err) {
    if (Boom.isBoom(err)) {
      return next(err);
    }
    next(Boom.serverUnavailable('Unable to update enrollment status', err));
  }
};