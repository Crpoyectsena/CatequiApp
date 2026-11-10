// Import UserServices to update the authenticated user's personal profile
import { UserServices } from '../../services/userServices.js';
// Import Boom for HTTP-friendly error objects
import Boom from '@hapi/boom';

const userManager = new UserServices();

export const updateOwnProfile = async (req, res, next) => {
  const { profileData } = req.body || {};
  if (!profileData || typeof profileData !== 'object' || Array.isArray(profileData)) {
    return next(Boom.badRequest('Profile data is required'));
  }

  try {
    await userManager.updateOwnProfile(req.user.id, profileData);
    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
    });
  } catch (err) {
    if (Boom.isBoom(err)) {
      return next(err);
    }
    return next(Boom.serverUnavailable('Unable to update user profile', err));
  }
};
