// Import FormationServices for saving and reading private activity material
import { FormationServices } from '../../services/formationServices.js';
// Import Boom for HTTP-friendly error objects
import Boom from '@hapi/boom';

const formationManager = new FormationServices();

export const uploadActivityMaterial = async (req, res, next) => {
  const { groupId, filename } = req.query;
  if (!Buffer.isBuffer(req.body) || !groupId || !filename) {
    return next(Boom.badRequest('An activity file and its group are required'));
  }

  try {
    const result = await formationManager.uploadActivityMaterial(
      req.params.id,
      groupId,
      filename,
      req.get('content-type'),
      req.body,
      req.user.id
    );
    return res.status(200).json({
      success: true,
      message: 'Activity material uploaded successfully',
      url: result.url,
    });
  } catch (err) {
    if (Boom.isBoom(err)) {
      return next(err);
    }
    return next(Boom.serverUnavailable('Unable to upload activity material', err));
  }
};

export const downloadActivityMaterial = async (req, res, next) => {
  try {
    const material = await formationManager.readActivityMaterial(
      req.params.id,
      req.params.filename,
      req.user
    );
    return res
      .status(200)
      .type(material.contentType)
      .attachment(material.filename)
      .send(material.file);
  } catch (err) {
    if (Boom.isBoom(err)) {
      return next(err);
    }
    return next(Boom.serverUnavailable('Unable to retrieve activity material', err));
  }
};
