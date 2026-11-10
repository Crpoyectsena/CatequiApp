const initializeLoginValidation = () => {
  const usernameField = document.getElementById('username');
  const passwordField = document.getElementById('password');
  const wrongInput = document.getElementById('wrong-input');
  const form = document.querySelector('.form-box');

  usernameField.addEventListener('input', validateUsernameField);
  usernameField.addEventListener('blur', validateUsernameField);

  passwordField.addEventListener('input', validatePasswordField);
  passwordField.addEventListener('blur', validatePasswordField);

  const redShadow = '0px 5px 5px rgba(194, 18, 18, 0.6)';
  const blackShadow = '0px 5px 5px rgba(0, 0, 0, 0.6)';

  function validateUsernameField() {
    const isValid = usernameField.value.trim().length > 0 &&
      usernameField.value.length <= 50;

    if (!isValid) {
      usernameField.style.boxShadow = redShadow;
      showError('Escribe un nombre de usuario válido (máximo 50 caracteres).');
      return false;
    } else {
      clearError(usernameField);
      return true;
    }
  }

  function validatePasswordField() {
    const isValid = passwordField.value.length > 0 && passwordField.value.length <= 72;

    if (!isValid) {
      passwordField.style.boxShadow = redShadow;
      showError('La contraseña debe tener entre 1 y 72 caracteres.');
      return false;
    } else {
      clearError(passwordField);
      return true;
    }
  }

  function showError(message) {
    wrongInput.style.display = 'flex';
    wrongInput.textContent = message;
  }

  function clearError(field) {
    wrongInput.style.display = 'none';
    wrongInput.textContent = '';
    field.style.boxShadow = blackShadow;
  }

  form.addEventListener('submit', (event) => {
    const isUsernameValid = validateUsernameField();
    const isPasswordValid = validatePasswordField();

    if (!isUsernameValid || !isPasswordValid) {
      event.preventDefault();
      showError('Por favor, corrige los datos antes de continuar.');
    }
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeLoginValidation, { once: true });
} else {
  initializeLoginValidation();
}
