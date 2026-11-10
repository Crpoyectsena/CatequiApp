const profileForm = document.getElementById('profile-form');
const profileFeedback = document.getElementById('profile-feedback');
const editProfileButton = document.getElementById('edit-profile');
const saveProfileButton = document.getElementById('save-profile');

const setEditing = (isEditing) => {
  profileForm.hidden = !isEditing;
  document.querySelector('.details-grid').hidden = isEditing;
  editProfileButton.hidden = isEditing;
  profileFeedback.textContent = '';
  if (isEditing) {
    document.getElementById('first-name').focus();
  }
};

editProfileButton.addEventListener('click', () => setEditing(true));
document.getElementById('cancel-profile').addEventListener('click', () => setEditing(false));

profileForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!profileForm.reportValidity()) {
    return;
  }

  const profileData = Object.fromEntries(new FormData(profileForm).entries());
  saveProfileButton.disabled = true;
  saveProfileButton.textContent = 'Guardando…';
  profileFeedback.textContent = '';

  try {
    const response = await fetch('/app/v1/users/profile', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileData }),
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'No fue posible guardar los cambios.');
    }
    window.location.reload();
  } catch (error) {
    profileFeedback.textContent = error.message;
  } finally {
    saveProfileButton.disabled = false;
    saveProfileButton.textContent = 'Guardar';
  }
});
