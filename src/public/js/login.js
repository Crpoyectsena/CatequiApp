const loginForm = document.getElementById('loginForm');
const wrongInput = document.getElementById('wrong-input');
const loginButton = document.getElementById('login-button');

loginForm.addEventListener('submit', async (event) => {
  if (event.defaultPrevented) {
    return;
  }
  event.preventDefault();

  const credentials = {
    userName: document.getElementById('username').value.trim(),
    password: document.getElementById('password').value,
  };

  wrongInput.textContent = '';
  loginButton.disabled = true;
  loginButton.textContent = 'Ingresando...';

  try {
    const response = await fetch('/app/v1/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credentials }),
    });

    if (response.ok) {
      window.location.assign('/app/v1/dashboard');
      return;
    }

    if (response.status === 404) {
      wrongInput.textContent = 'No encontramos ese usuario. Verifica los datos e inténtalo de nuevo.';
    } else if (response.status === 401) {
      wrongInput.textContent = 'La contraseña no es correcta. Verifícala e inténtalo de nuevo.';
    } else {
      wrongInput.textContent = 'No fue posible iniciar sesión. Inténtalo de nuevo más tarde.';
    }
    wrongInput.style.display = 'block';
  } catch {
    wrongInput.textContent = 'No se pudo conectar con el servidor. Comprueba tu conexión e inténtalo de nuevo.';
    wrongInput.style.display = 'block';
  } finally {
    loginButton.disabled = false;
    loginButton.textContent = 'Entrar a mi cuenta';
  }
});

const recoveryModal = document.getElementById('recovery-modal');
const closeRecoveryModal = () => {
  recoveryModal.hidden = true;
  document.getElementById('forgot-password').focus();
};

document.getElementById('forgot-password').addEventListener('click', () => {
  recoveryModal.hidden = false;
  document.getElementById('confirm-recovery').focus();
});

document.getElementById('close-recovery').addEventListener('click', closeRecoveryModal);
document.getElementById('confirm-recovery').addEventListener('click', closeRecoveryModal);

recoveryModal.addEventListener('click', (event) => {
  if (event.target === recoveryModal) {
    closeRecoveryModal();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !recoveryModal.hidden) {
    closeRecoveryModal();
  }
});
