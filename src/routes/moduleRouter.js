// Import the Router class from Express
import { Router } from 'express';
// Import the middleware to verify authentication tokens
import { authAppVerifyToken } from '../middlewares/tokenHandlers/authAppTokenHandler.js';
// Import the role and module action guard
import { requireModuleAccess } from '../middlewares/tokenHandlers/roleAccess.js';
// Import Express raw body parsing for local activity file uploads
import express from 'express';
// Import activity material upload and download controllers
import {
  downloadActivityMaterial,
  uploadActivityMaterial,
} from '../controllers/modules/activityMaterial.js';
// Import the module record controllers
import {
  createOneRecord,
  deleteOneRecord,
  listAttendanceGrid,
  listAllRecords,
  listModuleOptions,
  listOneRecord,
  saveAttendanceGrid,
  updateOneRecord,
} from '../controllers/modules/moduleRecords.js';

export const moduleRouter = Router();

moduleRouter.use(
  // Verify the user's session before accessing any module endpoint
  authAppVerifyToken
);

moduleRouter.use(
  // Resolve the module name before checking role permissions
  '/:module',
  // Deny module actions that are not granted to the user's role
  requireModuleAccess
);

moduleRouter.post(
  // Route path to upload material to a catechist's own activity
  '/activities/:id/material',
  // Parse the file bytes without adding a multipart dependency
  express.raw({ type: '*/*', limit: '20mb' }),
  // Controller to validate and store activity material
  uploadActivityMaterial
);

moduleRouter.get(
  // Route path to download authorized activity material
  '/activities/:id/material/:filename',
  // Controller to authorize and return the activity file
  downloadActivityMaterial
);

moduleRouter.get(
  // Route path to retrieve the attendance grid for a group
  '/attendance/grid',
  // Controller to return students, activities, and recorded attendance
  listAttendanceGrid
);

moduleRouter.post(
  // Route path to save attendance grid changes for a group
  '/attendance/grid',
  // Controller to save attendance and grades
  saveAttendanceGrid
);

moduleRouter.get(
  // Route path to retrieve all records for a catechesis module
  '/:module/listall',
  // Controller to return the module records
  listAllRecords
);

moduleRouter.get(
  // Route path to retrieve related records for module form fields
  '/:module/options',
  // Controller to return the form options
  listModuleOptions
);

moduleRouter.post(
  // Route path to retrieve one module record
  '/:module/listone',
  // Controller to return the selected record
  listOneRecord
);

moduleRouter.post(
  // Route path to create a module record
  '/:module/create',
  // Controller to store the submitted record
  createOneRecord
);

moduleRouter.post(
  // Route path to update a module record
  '/:module/update',
  // Controller to update the submitted record
  updateOneRecord
);

moduleRouter.post(
  // Route path to delete a module record
  '/:module/delete',
  // Controller to remove the selected record
  deleteOneRecord
);
