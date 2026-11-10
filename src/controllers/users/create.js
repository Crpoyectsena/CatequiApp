// Import the UserServices class from the userServices module
import { UserServices } from '../../services/userServices.js';
// Import Boom for handling HTTP-friendly error objects
import Boom from '@hapi/boom';

export const createOneUser = async (req, res, next) => {

  const { newUserData } = req.body || {};
  if (!newUserData || typeof newUserData !== 'object' || Array.isArray(newUserData)) {
    return next(Boom.badRequest('New user data is required'));
  }

  const newUser = {
    id: newUserData.id,
    tipoDocumento: newUserData.tipoDocumento,
    fechaNacimiento: newUserData.fechaNacimiento,
    idAcudiente: newUserData.idAcudiente,
    userName: newUserData.userName,
    password: newUserData.password,
    role: newUserData.role,
    email: newUserData.email,
    phone: newUserData.phone,
    address: newUserData.address,
    registrationNumber: newUserData.registrationNumber,
    program: newUserData.program,
    firstName: newUserData.firstName,
    middleName: newUserData.middleName,
    firstLastName: newUserData.firstLastName,
    secondLastName: newUserData.secondLastName,
  };

  // Instantiate the UserServices class to manage the users operations
  const userManager = new UserServices();

  try {
    // Attempt to create a new user using the provided data
    const response = await userManager.createOne(newUser);

    // If the user is created successfully, send a success response
    if (response.status === 'CREATED SUCCESSFULLY') {
      return res.status(201).json({
        success: true,
        message: 'User created successfully',
        // Include the new token in the response
        authentication: res.locals.newUserToken
      });
    }

  } catch (err) {
    if (Boom.isBoom(err)) {
      return next(err);
    }
    // Handle errors during user creation by sending a Boom error response
    const boomError = Boom.serverUnavailable(
      'Unable to create the user in the database',
      err
    );
    // Pass the Boom error to the next middleware in the stack
    next(boomError);
  }
};
