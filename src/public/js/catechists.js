// Store the currently loaded catechists for client-side updates
let catechistsCache = [];

// Open the modal in "create" mode
function openForm() {
  document.getElementById('modal-title').textContent = 'Nuevo catequista';
  document.getElementById('catechist-form').reset();
  document.getElementById('id').value = '';
  document.getElementById('account-user-name').disabled = false;
  document.getElementById('account-password').disabled = false;
  document.getElementById('account-user-name').required = true;
  document.getElementById('account-password').required = true;
  document.getElementById('telefono').required = true;
  document.getElementById('correo').required = true;
  document.getElementById('modal-overlay').classList.add('open');
}

// Close the modal and clear errors
function closeForm() {
  document.getElementById('modal-overlay').classList.remove('open');
  document.getElementById('form-error').style.display = 'none';
}

// Load all catechists from the API and render the table in real time
async function loadCatechists() {
  try {
    const response = await fetch('/app/v1/catechists/listall');
    const data = await response.json();

    if (response.status === 200 && data.success && Array.isArray(data.catechists)) {
      catechistsCache = data.catechists;
      renderTable(catechistsCache);
      clearError();
    } else if (response.status === 404 && Array.isArray(data.catechists)) {
      catechistsCache = [];
      renderTable([]);
      clearError();
    } else {
      showError(data.message || 'No fue posible cargar los catequistas');
    }
  } catch (error) {
    showError('Error de conexión con el servidor');
  }
}

// Render the catechist rows inside the table body
function renderTable(catechists) {
  const tbody = document.querySelector('#catechists-table tbody');
  tbody.innerHTML = '';

  if (catechists.length === 0) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 8;
    cell.textContent = 'Aún no hay catequistas registrados.';
    row.appendChild(cell);
    tbody.appendChild(row);
    return;
  }

  catechists.forEach(function (c) {
    const row = document.createElement('tr');
    const values = [
      c.id,
      `${c.tipoDocumento || ''} ${c.numeroDocumento || ''}`.trim(),
      c.nombres,
      c.apellidos,
      c.telefono,
      c.correo,
      c.estado,
    ];

    values.forEach((value) => {
      const cell = document.createElement('td');
      cell.textContent = value || '—';
      row.appendChild(cell);
    });

    const actions = document.createElement('td');
    actions.className = 'actions-cell';
    const editButton = document.createElement('button');
    editButton.className = 'action-button primary';
    editButton.dataset.action = 'edit';
    editButton.dataset.catechistId = c.id;
    editButton.textContent = 'Editar';
    const deleteButton = document.createElement('button');
    deleteButton.className = 'action-button danger';
    deleteButton.dataset.action = 'delete';
    deleteButton.dataset.catechistId = c.id;
    deleteButton.textContent = 'Eliminar';
    actions.append(editButton, deleteButton);
    row.appendChild(actions);
    tbody.appendChild(row);
  });
}

// Fill the form with the selected catechist data and open the modal
async function editCatechist(id) {
  try {
    const response = await fetch('/app/v1/catechists/listone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    const data = await response.json();

    if (response.status === 200 && data.success) {
      const c = data.catechist;
      document.getElementById('modal-title').textContent = 'Editar catequista';
      document.getElementById('id').value = c.id;
      document.getElementById('tipoDocumento').value = c.tipoDocumento;
      document.getElementById('numeroDocumento').value = c.numeroDocumento;
      document.getElementById('nombres').value = c.nombres;
      document.getElementById('apellidos').value = c.apellidos;
      document.getElementById('telefono').value = c.telefono || '';
      document.getElementById('correo').value = c.correo || '';
      document.getElementById('direccion').value = c.direccion || '';
      document.getElementById('estado').value = c.estado;
      document.getElementById('account-user-name').value = '';
      document.getElementById('account-password').value = '';
      document.getElementById('account-user-name').disabled = true;
      document.getElementById('account-password').disabled = true;
      document.getElementById('account-user-name').required = false;
      document.getElementById('account-password').required = false;
      document.getElementById('telefono').required = false;
      document.getElementById('correo').required = false;
      document.getElementById('modal-overlay').classList.add('open');
    }
  } catch (error) {
    showError('Error de conexión con el servidor');
  }
}

// Delete a catechist by ID after user confirmation
async function deleteCatechist(id) {
  if (!window.confirm('¿Está seguro de eliminar este catequista?')) {
    return;
  }

  try {
    const response = await fetch('/app/v1/catechists/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    const data = await response.json();

    if (response.status === 200 && data.success) {
      // Update the table in real time after a successful deletion
      await loadCatechists();
    } else {
      showError(data.message || 'Error al eliminar el catequista');
    }
  } catch (error) {
    showError('Error de conexión con el servidor');
  }
}

// Handle the form submit for both create and update
async function handleSubmit(event) {
  event.preventDefault();

  const id = document.getElementById('id').value;

  const payload = {
    tipoDocumento: document.getElementById('tipoDocumento').value,
    numeroDocumento: document.getElementById('numeroDocumento').value,
    nombres: document.getElementById('nombres').value,
    apellidos: document.getElementById('apellidos').value,
    telefono: document.getElementById('telefono').value,
    correo: document.getElementById('correo').value,
    direccion: document.getElementById('direccion').value,
    estado: document.getElementById('estado').value,
    userName: document.getElementById('account-user-name').value.trim(),
    password: document.getElementById('account-password').value,
  };

  const isUpdate = Boolean(id);
  const url = isUpdate
    ? '/app/v1/catechists/update'
    : '/app/v1/catechists/create';
  const body = isUpdate
    ? JSON.stringify({ id: Number(id), newCatechistData: payload })
    : JSON.stringify({ newCatechistData: payload });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body
    });
    const data = await response.json();

    if (response.status === 201 || response.status === 200) {
      closeForm();
      // Refresh the table in real time after the change
      await loadCatechists();
    } else {
      showError(data.message || 'Error al guardar el catequista');
    }
  } catch (error) {
    showError('Error de conexión con el servidor');
  }
}

// Show an error message inside the form
function showError(message) {
  const errorElement = document.getElementById('modal-overlay').classList.contains('open')
    ? document.getElementById('form-error')
    : document.getElementById('wrong-input');
  errorElement.textContent = message;
  errorElement.style.display = 'block';
}

function clearError() {
  document.getElementById('wrong-input').style.display = 'none';
  document.getElementById('form-error').style.display = 'none';
}

// Handle actions on both server-rendered and dynamically rendered catechist rows
document.addEventListener('DOMContentLoaded', function () {
  const tbody = document.querySelector('#catechists-table tbody');

  tbody.addEventListener('click', function (event) {
    const button = event.target.closest('button[data-action]');
    if (!button) {
      return;
    }

    const id = Number(button.dataset.catechistId);
    if (button.dataset.action === 'edit') {
      editCatechist(id);
    } else if (button.dataset.action === 'delete') {
      deleteCatechist(id);
    }
  });

  loadCatechists();
});