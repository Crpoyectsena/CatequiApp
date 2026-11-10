const accountModal = document.getElementById('account-modal');
const accountForm = document.getElementById('account-form');
const accountFeedback = document.getElementById('account-form-feedback');
const accountsFeedback = document.getElementById('accounts-feedback');
const accountsBody = document.querySelector('#accounts-table tbody');
const accountsEmpty = document.getElementById('accounts-empty');
const saveAccountButton = document.getElementById('save-account');
const roleSelect = document.getElementById('role');
const catechumenFields = document.getElementById('catechumen-account-fields');
const catechumenGuardian = document.getElementById('catechumen-guardian');
const catechumenGuardiansAvailable = catechumenGuardian.options.length > 1;
const currentUserId = document.querySelector('.accounts-content').dataset.currentUserId;
let accounts = [];
let editingAccount = null;

const updateRoleFields = () => {
  const isCatechumen = roleSelect.value === 'catequizando';
  catechumenFields.hidden = editingAccount || !isCatechumen;
  document.getElementById('email').required = editingAccount || !isCatechumen;
  document.getElementById('phone').required = !editingAccount && !isCatechumen;
  catechumenGuardian.required = !editingAccount && isCatechumen;
  saveAccountButton.disabled =
    !editingAccount && isCatechumen && !catechumenGuardiansAvailable;
};

const showAccountModal = () => {
  accountForm.reset();
  editingAccount = null;
  document.getElementById('account-modal-title').textContent = 'Crear cuenta';
  document.querySelector('.account-modal-heading .accounts-kicker').textContent = 'NUEVO ACCESO';
  document.getElementById('save-account').textContent = 'Crear cuenta';
  for (const id of ['document', 'document-type', 'password']) {
    const input = document.getElementById(id);
    input.disabled = false;
    input.required = id !== 'password';
  }
  document.getElementById('document').readOnly = false;
  document.getElementById('document-label').hidden = false;
  document.getElementById('document').hidden = false;
  document.getElementById('document-type-label').hidden = false;
  document.getElementById('document-type').hidden = false;
  document.getElementById('password-label').hidden = false;
  document.getElementById('password').hidden = false;
  document.getElementById('password').disabled = false;
  document.getElementById('password-label').textContent = 'Contraseña inicial';
  document.getElementById('password-note').textContent =
    'Si la dejas vacía, se usará el documento de identidad.';
  document.getElementById('address').value = '';
  document.getElementById('registration-number').value = '';
  document.getElementById('program').value = '';
  roleSelect.disabled = false;
  updateRoleFields();
  accountFeedback.textContent = '';
  accountModal.hidden = false;
  document.getElementById('document').focus();
};

const showEditAccountModal = (account) => {
  accountForm.reset();
  editingAccount = account;
  document.getElementById('account-modal-title').textContent = 'Editar cuenta';
  document.querySelector('.account-modal-heading .accounts-kicker').textContent = 'ACTUALIZAR ACCESO';
  document.getElementById('save-account').textContent = 'Guardar cambios';
  document.getElementById('document').value = account.id;
  document.getElementById('document').readOnly = true;
  document.getElementById('document').required = false;
  document.getElementById('document').hidden = true;
  document.getElementById('document-label').hidden = true;
  document.getElementById('document-type').hidden = true;
  document.getElementById('document-type-label').hidden = true;
  document.getElementById('document-type').disabled = true;
  document.getElementById('password').hidden = false;
  document.getElementById('password-label').hidden = false;
  document.getElementById('password').disabled = false;
  document.getElementById('password').required = false;
  document.getElementById('password-label').textContent = 'Nueva contraseña';
  document.getElementById('password-note').textContent =
    'La contraseña actual no se muestra. Déjala vacía para conservarla.';
  roleSelect.disabled = true;
  document.getElementById('names').value =
    [account.firstName, account.middleName].filter(Boolean).join(' ');
  document.getElementById('surnames').value =
    [account.firstLastName, account.secondLastName].filter(Boolean).join(' ');
  document.getElementById('userName').value = account.userName || '';
  document.getElementById('email').value = account.email || '';
  document.getElementById('phone').value = account.phone || '';
  document.getElementById('address').value = account.address || '';
  document.getElementById('registration-number').value = account.registrationNumber || '';
  document.getElementById('program').value = account.program || '';
  roleSelect.value = account.role;
  updateRoleFields();
  accountFeedback.textContent = '';
  accountModal.hidden = false;
  document.getElementById('names').focus();
};

const hideAccountModal = () => {
  accountModal.hidden = true;
  accountFeedback.textContent = '';
  editingAccount = null;
};

const readAccountsResponse = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error('No fue posible comunicarse con el servicio de cuentas.');
  }
  const data = await response.json();
  if (response.status === 401 || response.status === 403) {
    throw new Error('Tu sesión no tiene permiso para administrar cuentas.');
  }
  return data;
};

const appendTextCell = (row, value) => {
  const cell = document.createElement('td');
  cell.textContent = value || '—';
  row.appendChild(cell);
};

const renderAccounts = (users) => {
  accounts = users;
  accountsBody.replaceChildren();
  for (const user of users) {
    const row = document.createElement('tr');
    const fullName = [user.firstName, user.middleName, user.firstLastName, user.secondLastName]
      .filter(Boolean)
      .join(' ');
    appendTextCell(row, user.id);
    appendTextCell(row, fullName);
    appendTextCell(row, user.userName);
    appendTextCell(row, user.email);
    appendTextCell(row, user.phone);
    const roleCell = document.createElement('td');
    const roleBadge = document.createElement('span');
    roleBadge.className = 'role-badge';
    roleBadge.textContent = user.role;
    roleCell.appendChild(roleBadge);
    row.appendChild(roleCell);
    const actionsCell = document.createElement('td');
    actionsCell.className = 'account-actions';
    const editButton = document.createElement('button');
    editButton.className = 'account-action';
    editButton.type = 'button';
    editButton.dataset.accountAction = 'edit';
    editButton.dataset.accountId = user.id;
    editButton.textContent = 'Editar';
    actionsCell.appendChild(editButton);
    if (String(user.id) !== String(currentUserId)) {
      const deleteButton = document.createElement('button');
      deleteButton.className = 'account-action account-action-danger';
      deleteButton.type = 'button';
      deleteButton.dataset.accountAction = 'delete';
      deleteButton.dataset.accountId = user.id;
      deleteButton.textContent = 'Eliminar';
      actionsCell.appendChild(deleteButton);
    }
    row.appendChild(actionsCell);
    accountsBody.appendChild(row);
  }
  accountsEmpty.hidden = users.length > 0;
  accountsEmpty.textContent = 'Aún no hay cuentas registradas.';
};

const loadAccounts = async () => {
  accountsFeedback.textContent = '';
  try {
    const response = await fetch('/app/v1/users/listall', { credentials: 'same-origin' });
    const data = await readAccountsResponse(response);
    if (response.status === 404 && Array.isArray(data.users)) {
      renderAccounts([]);
      return;
    }
    if (!response.ok || !data.success || !Array.isArray(data.users)) {
      throw new Error(data.message || 'No fue posible cargar las cuentas.');
    }
    renderAccounts(data.users);
  } catch (error) {
    accountsFeedback.textContent = error.message;
  }
};

document.getElementById('create-account').addEventListener('click', showAccountModal);
roleSelect.addEventListener('change', updateRoleFields);
document.getElementById('close-account-modal').addEventListener('click', hideAccountModal);
document.getElementById('cancel-account').addEventListener('click', hideAccountModal);

accountsBody.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-account-action]');
  if (!button) {
    return;
  }

  const account = accounts.find((item) => String(item.id) === button.dataset.accountId);
  if (!account) {
    accountsFeedback.textContent = 'No se encontró la cuenta seleccionada. Actualiza la lista.';
    return;
  }
  if (button.dataset.accountAction === 'edit') {
    showEditAccountModal(account);
    return;
  }
  if (!window.confirm(`¿Eliminar la cuenta de ${account.userName}? Esta acción no se puede deshacer.`)) {
    return;
  }

  button.disabled = true;
  try {
    const response = await fetch('/app/v1/users/delete', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: account.id }),
    });
    const data = await readAccountsResponse(response);
    if (!response.ok || !data.success) {
      throw new Error(data.message || 'No fue posible eliminar la cuenta.');
    }
    await loadAccounts();
    if (!accountsFeedback.textContent) {
      accountsFeedback.textContent = 'Cuenta eliminada correctamente.';
    }
  } catch (error) {
    accountsFeedback.textContent = error.message;
    button.disabled = false;
  }
});

accountModal.addEventListener('click', (event) => {
  if (event.target === accountModal) {
    hideAccountModal();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !accountModal.hidden) {
    hideAccountModal();
  }
});

accountForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!accountForm.reportValidity()) {
    return;
  }

  const fullName = document.getElementById('names').value.trim().split(/\s+/);
  const surnames = document.getElementById('surnames').value.trim().split(/\s+/);
  const isEditing = Boolean(editingAccount);
  const accountBeingEdited = editingAccount;
  const newUserData = {
    id: Number(document.getElementById('document').value),
    tipoDocumento: document.getElementById('document-type').value,
    userName: document.getElementById('userName').value.trim(),
    password: document.getElementById('password').value,
    role: document.getElementById('role').value,
    email: document.getElementById('email').value.trim() ||
      `catequizando-${document.getElementById('document').value}@catequiapp.local`,
    phone: document.getElementById('phone').value.trim() || 'No registrado',
    address: document.getElementById('address').value.trim() || null,
    registrationNumber: document.getElementById('registration-number').value.trim() || null,
    program: document.getElementById('program').value.trim() || null,
    firstName: fullName.shift(),
    middleName: fullName.join(' ') || null,
    firstLastName: surnames.shift(),
    secondLastName: surnames.join(' ') || null,
  };
  if (newUserData.role === 'catequizando') {
    if (!isEditing) {
      newUserData.fechaNacimiento = document.getElementById('catechumen-birth-date').value || null;
      newUserData.idAcudiente = Number(catechumenGuardian.value);
    }
  }

  saveAccountButton.disabled = true;
  saveAccountButton.textContent = isEditing ? 'Guardando...' : 'Creando...';
  accountFeedback.textContent = '';

  try {
    const response = await fetch(
      isEditing ? '/app/v1/users/update' : '/app/v1/users/create',
      {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isEditing
            ? { id: accountBeingEdited.id, newUserData }
            : { newUserData }
        ),
      }
    );
    const data = await readAccountsResponse(response);
    if (!response.ok || !data.success) {
      throw new Error(data.message || 'No fue posible guardar la cuenta.');
    }
    hideAccountModal();
    await loadAccounts();
    if (!accountsFeedback.textContent) {
      accountsFeedback.textContent = isEditing
        ? data.passwordUpdated
          ? 'Cuenta actualizada y contraseña cambiada correctamente.'
          : 'Cuenta actualizada correctamente.'
        : newUserData.role === 'catequista'
          ? 'Cuenta y ficha de catequista creadas correctamente.'
          : newUserData.role === 'acudiente'
            ? 'Cuenta y ficha de acudiente creadas correctamente.'
            : newUserData.role === 'catequizando'
              ? 'Cuenta y ficha de catequizando creadas correctamente.'
              : 'Cuenta creada correctamente.';
    }
  } catch (error) {
    accountFeedback.textContent = error.message;
  } finally {
    saveAccountButton.disabled =
      !isEditing && roleSelect.value === 'catequizando' && !catechumenGuardiansAvailable;
    saveAccountButton.textContent = isEditing ? 'Guardar cambios' : 'Crear cuenta';
  }
});

loadAccounts();
