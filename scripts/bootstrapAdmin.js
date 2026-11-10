// Import the readline interface for collecting administrator details
import { createInterface } from 'node:readline/promises';
// Import the existing password hashing helper
import { hashPassword } from '../src/utils/auth/passwordHash.js';
// Import the database connection pool
import { pool } from '../src/DB/index.js';

const promptHidden = (label) => new Promise((resolve, reject) => {
  if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== 'function') {
    reject(new Error('Run this command from an interactive terminal'));
    return;
  }

  process.stdout.write(label);
  process.stdin.setRawMode(true);
  process.stdin.resume();

  let value = '';
  const onData = (input) => {
    for (const character of input.toString()) {
      if (character === '\u0003') {
        process.stdin.removeListener('data', onData);
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdout.write('\n');
        reject(new Error('Administrator setup cancelled'));
        return;
      }

      if (character === '\r' || character === '\n') {
        process.stdin.removeListener('data', onData);
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdout.write('\n');
        resolve(value);
        return;
      }

      if (character === '\u007f' || character === '\b') {
        value = value.slice(0, -1);
      } else {
        value += character;
      }
    }
  };

  process.stdin.on('data', onData);
});

const promptText = async (label) => {
  const readline = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    return (await readline.question(label)).trim();
  } finally {
    readline.close();
  }
};

const createInitialAdmin = async () => {
  try {
    const [existingAdmins] = await pool.query(
      'SELECT id FROM Users WHERE role = ? LIMIT 1',
      ['administrador']
    );

    if (existingAdmins.length > 0) {
      throw new Error('An administrator account already exists');
    }

    const id = Number(await promptText('Document ID: '));
    const userName = await promptText('Username: ');
    const email = await promptText('Email: ');
    const firstName = await promptText('First name: ');
    const firstLastName = await promptText('First last name: ');
    const password = await promptHidden('Password (8-72 characters): ');
    const passwordConfirmation = await promptHidden('Confirm password: ');

    if (!Number.isSafeInteger(id) || id < 1 || id > 2147483647) {
      throw new Error('Document ID must be a positive integer');
    }
    if (!userName || userName.length > 50) {
      throw new Error('Username is required and must not exceed 50 characters');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 100) {
      throw new Error('A valid email address is required');
    }
    if (!firstName || firstName.length > 50 ||
        !firstLastName || firstLastName.length > 50) {
      throw new Error('First name and first last name are required');
    }
    if (password.length < 8 || password.length > 72) {
      throw new Error('Password must contain between 8 and 72 characters');
    }
    if (password !== passwordConfirmation) {
      throw new Error('Passwords do not match');
    }

    const passwordHash = await hashPassword(password);
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [admins] = await connection.query(
        'SELECT id FROM Users WHERE role = ? LIMIT 1 FOR UPDATE',
        ['administrador']
      );
      if (admins.length > 0) {
        throw new Error('An administrator account already exists');
      }

      await connection.query(
        `INSERT INTO Users (
          id, userName, password, role, email, firstName, firstLastName
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, userName, passwordHash, 'administrador', email, firstName, firstLastName]
      );

      await connection.commit();
      process.stdout.write('Administrator account created successfully.\n');
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } finally {
    await pool.end();
  }
};

try {
  await createInitialAdmin();
} catch (error) {
  process.stderr.write(`Unable to create administrator: ${error.message}\n`);
  process.exitCode = 1;
}
