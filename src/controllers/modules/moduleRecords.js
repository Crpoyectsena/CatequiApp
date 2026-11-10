// Import the FormationServices class for module data operations
import { FormationServices } from '../../services/formationServices.js';
// Import UserServices to create catechumen accounts with their profiles
import { UserServices } from '../../services/userServices.js';
// Import Boom for HTTP-friendly error objects
import Boom from '@hapi/boom';

const recordManager = new FormationServices();
const userManager = new UserServices();

const handleError = (err, next, message) => {
  if (Boom.isBoom(err)) {
    return next(err);
  }
  return next(Boom.serverUnavailable(message, err));
};

export const listAllRecords = async (req, res, next) => {
  try {
    const records = await recordManager.listAll(req.params.module, req.user);
    return res.status(200).json({ success: true, records });
  } catch (err) {
    return handleError(err, next, 'Unable to retrieve records');
  }
};

export const listOneRecord = async (req, res, next) => {
  const { id } = req.body || {};
  if (!id) {
    return next(Boom.badRequest('Record ID is required'));
  }
  try {
    const record = await recordManager.listOne(req.params.module, id, req.user);
    return res.status(200).json({ success: true, record });
  } catch (err) {
    return handleError(err, next, 'Unable to retrieve record');
  }
};

export const listModuleOptions = async (req, res, next) => {
  try {
    const options = await recordManager.listOptions(req.params.module, req.user);
    return res.status(200).json({ success: true, options });
  } catch (err) {
    return handleError(err, next, 'Unable to retrieve form options');
  }
};

export const listAttendanceGrid = async (req, res, next) => {
  try {
    const grid = await recordManager.listAttendanceGrid(req.query.groupId);
    return res.status(200).json({ success: true, grid });
  } catch (err) {
    return handleError(err, next, 'Unable to retrieve attendance grid');
  }
};

export const saveAttendanceGrid = async (req, res, next) => {
  const { groupId, entries } = req.body || {};
  if (!groupId || !Array.isArray(entries)) {
    return next(Boom.badRequest('A group and attendance entries are required'));
  }
  try {
    const result = await recordManager.saveAttendanceGrid(groupId, entries);
    return res.status(200).json({
      success: true,
      message: 'Attendance and grades saved successfully',
      saved: result.saved,
    });
  } catch (err) {
    return handleError(err, next, 'Unable to save attendance grid');
  }
};

export const createOneRecord = async (req, res, next) => {
  const { record } = req.body || {};
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    return next(Boom.badRequest('Record data is required'));
  }
  try {
    if (['catechumens', 'guardians'].includes(req.params.module)) {
      const currentUser = await userManager.listOne(req.user.id);
      if (String(currentUser.role).trim().toLowerCase() !== 'administrador') {
        return next(Boom.forbidden('Administrator access is required to create community accounts'));
      }
      if (req.params.module === 'guardians') {
        await userManager.createOneFromGuardian(record);
        return res.status(201).json({
          success: true,
          message: 'Guardian profile and user account created successfully',
        });
      }
      await userManager.createOneFromCatechumen(record);
      return res.status(201).json({
        success: true,
        message: 'Catechumen profile and user account created successfully',
      });
    }

    const result = await recordManager.createOne(req.params.module, record);
    return res.status(201).json({
      success: true,
      message: 'Record created successfully',
      id: result.id,
    });
  } catch (err) {
    return handleError(err, next, 'Unable to create record');
  }
};

export const updateOneRecord = async (req, res, next) => {
  const { id, record } = req.body || {};
  if (!id || !record || typeof record !== 'object' || Array.isArray(record)) {
    return next(Boom.badRequest('Record ID and data are required'));
  }
  try {
    await recordManager.updateOne(req.params.module, id, record);
    return res.status(200).json({
      success: true,
      message: 'Record updated successfully',
      id: Number(id),
    });
  } catch (err) {
    return handleError(err, next, 'Unable to update record');
  }
};

export const deleteOneRecord = async (req, res, next) => {
  const { id } = req.body || {};
  if (!id) {
    return next(Boom.badRequest('Record ID is required'));
  }
  try {
    await recordManager.deleteOne(req.params.module, id);
    return res.status(200).json({ success: true, message: 'Record deleted successfully' });
  } catch (err) {
    return handleError(err, next, 'Unable to delete record');
  }
};
