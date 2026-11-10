const moduleName = document.body.dataset.module;
const moduleConfig = JSON.parse(document.getElementById('module-config').textContent);
const moduleOptions = JSON.parse(document.getElementById('module-options').textContent);
const tableBody = document.querySelector('#records-table tbody');
const searchInput = document.getElementById('record-search');
const feedback = document.getElementById('module-feedback');
const emptyRecords = document.getElementById('empty-records');
const modal = document.getElementById('record-modal');
const form = document.getElementById('record-form');
const formFeedback = document.getElementById('form-feedback');
const saveButton = document.getElementById('save-record');
const catechumenAccessFields = document.getElementById('catechumen-access-fields');
const guardianAccessFields = document.getElementById('guardian-access-fields');
const attendanceGroup = document.getElementById('attendance-group');
const attendanceGridWrapper = document.getElementById('attendance-grid-table-wrapper');
const attendanceGridFeedback = document.getElementById('attendance-grid-feedback');
const saveAttendanceGridButton = document.getElementById('save-attendance-grid');
let records = [];
const missingRequiredReferences = [];
let attendanceGridDirty = false;
let loadedAttendanceGroup = '';

const request = async (action, options = {}) => {
  const response = await fetch(`/app/v1/modules/${moduleName}/${action}`, {
    credentials: 'same-origin',
    ...options,
  });
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error(response.status === 401 || response.status === 403
      ? 'Tu sesión terminó. Inicia sesión nuevamente.'
      : 'El servidor no pudo completar la solicitud.');
  }
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.message || 'No fue posible completar la operación.');
  }
  return result;
};

const formatValue = (record, column) => {
  const value = record[column.key];
  if (value === null || value === undefined || value === '') {
    return '—';
  }
  if (column.type === 'boolean') {
    return value === true || value === 1 || value === '1' ? 'Sí' : 'No';
  }
  if (column.type === 'link') {
    return /^(https?:\/\/|\/)/i.test(String(value)) ? 'Abrir material' : '—';
  }
  const primary = String(value);
  if (!column.secondaryKey || !record[column.secondaryKey]) {
    return primary;
  }
  return `${primary} ${record[column.secondaryKey]}`;
};

const renderRecords = () => {
  const filter = searchInput.value.trim().toLocaleLowerCase('es');
  const visibleRecords = records.filter((record) =>
    moduleConfig.columns.some((column) =>
      formatValue(record, column).toLocaleLowerCase('es').includes(filter)
    )
  );
  tableBody.replaceChildren();

  for (const record of visibleRecords) {
    const row = document.createElement('tr');
    for (const column of moduleConfig.columns) {
      const cell = document.createElement('td');
      if (column.type === 'link' && formatValue(record, column) !== '—') {
        const link = document.createElement('a');
        link.href = record[column.key];
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = 'Abrir material';
        cell.appendChild(link);
      } else {
        cell.textContent = formatValue(record, column);
      }
      row.appendChild(cell);
    }

    if (moduleConfig.permissions.canEdit || moduleConfig.permissions.canDelete) {
      const actions = document.createElement('td');
      actions.className = 'record-actions';
      if (moduleConfig.permissions.canEdit) {
        const editButton = document.createElement('button');
        editButton.className = 'record-action edit-record';
        editButton.type = 'button';
        editButton.dataset.recordId = record.id;
        editButton.textContent = 'Editar';
        actions.appendChild(editButton);
      }
      if (moduleConfig.permissions.canDelete) {
        const deleteButton = document.createElement('button');
        deleteButton.className = 'record-action delete-record';
        deleteButton.type = 'button';
        deleteButton.dataset.recordId = record.id;
        deleteButton.textContent = 'Eliminar';
        actions.appendChild(deleteButton);
      }
      row.appendChild(actions);
    }
    tableBody.appendChild(row);
  }

  emptyRecords.hidden = visibleRecords.length > 0;
  emptyRecords.textContent = filter && records.length
    ? 'No se encontraron registros con esa búsqueda.'
    : moduleConfig.permissions.canCreate
      ? 'Aún no hay registros. Usa «Nuevo registro» para agregar el primero.'
      : 'No hay registros disponibles para mostrar.';
};

const loadRecords = async () => {
  feedback.textContent = '';
  try {
    const result = await request('listall');
    records = result.records;
    renderRecords();
  } catch (error) {
    feedback.textContent = error.message;
  }
};

const closeModal = () => {
  modal.hidden = true;
  formFeedback.textContent = '';
};

const openCreateForm = () => {
  form.reset();
  document.getElementById('record-id').value = '';
  document.getElementById('record-modal-title').textContent = 'Nuevo registro';
  if (catechumenAccessFields) {
    catechumenAccessFields.hidden = false;
    for (const input of catechumenAccessFields.querySelectorAll('input')) {
      input.disabled = false;
      input.required = true;
    }
  }
  if (guardianAccessFields) {
    guardianAccessFields.hidden = true;
    for (const input of guardianAccessFields.querySelectorAll('input')) {
      input.disabled = true;
      input.required = false;
    }
  }
  if (moduleName === 'guardians' && guardianAccessFields) {
    guardianAccessFields.hidden = false;
    for (const input of guardianAccessFields.querySelectorAll('input')) {
      input.disabled = false;
      input.required = true;
    }
  }
  formFeedback.textContent = '';
  saveButton.disabled = missingRequiredReferences.length > 0;
  if (missingRequiredReferences.length > 0) {
    formFeedback.textContent = `Registra primero: ${missingRequiredReferences.join(', ')}.`;
  }
  modal.hidden = false;
  const firstField = form.querySelector('input:not([type="hidden"]), select, textarea');
  firstField?.focus();
};

const openEditForm = (record) => {
  form.reset();
  document.getElementById('record-id').value = record.id;
  document.getElementById('record-modal-title').textContent = 'Editar registro';
  if (catechumenAccessFields) {
    catechumenAccessFields.hidden = true;
    for (const input of catechumenAccessFields.querySelectorAll('input')) {
      input.disabled = true;
      input.required = false;
    }
  }
  if (guardianAccessFields) {
    guardianAccessFields.hidden = true;
    for (const input of guardianAccessFields.querySelectorAll('input')) {
      input.disabled = true;
      input.required = false;
    }
  }

  for (const field of moduleConfig.fields) {
    const input = document.getElementById(`field-${field.key}`);
    if (field.type === 'file') {
      continue;
    }
    const value = record[field.key];
    if (field.type === 'checkbox') {
      input.checked = value === true || value === 1 || value === '1';
    } else {
      input.value = value === null || value === undefined
        ? ''
        : String(value).slice(0, 10);
    }
  }

  formFeedback.textContent = '';
  saveButton.disabled = false;
  modal.hidden = false;
  form.querySelector('input:not([type="hidden"]), select, textarea')?.focus();
};

const readFormData = () => {
  const record = {};
  for (const field of moduleConfig.fields) {
    const input = document.getElementById(`field-${field.key}`);
    if (field.type === 'file') {
      continue;
    } else if (field.type === 'checkbox') {
      record[field.key] = input.checked;
    } else if (field.type === 'reference') {
      record[field.key] = input.value ? Number(input.value) : null;
    } else if (field.type === 'number') {
      record[field.key] = input.value === '' ? null : Number(input.value);
    } else {
      record[field.key] = input.value.trim() || null;
    }
  }
  if (moduleName === 'catechumens' && !document.getElementById('record-id').value) {
    record.userName = document.getElementById('catechumen-user-name').value.trim();
    record.password = document.getElementById('catechumen-password').value;
  }
  if (moduleName === 'guardians' && !document.getElementById('record-id').value) {
    record.userName = document.getElementById('guardian-user-name').value.trim();
    record.password = document.getElementById('guardian-password').value;
  }
  return record;
};

document.getElementById('create-record')?.addEventListener('click', openCreateForm);
document.getElementById('close-record-modal')?.addEventListener('click', closeModal);
document.getElementById('cancel-record')?.addEventListener('click', closeModal);
searchInput.addEventListener('input', renderRecords);

modal?.addEventListener('click', (event) => {
  if (event.target === modal) {
    closeModal();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && modal && !modal.hidden) {
    closeModal();
  }
});

tableBody.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-record-id]');
  if (!button) {
    return;
  }

  const record = records.find((item) => String(item.id) === button.dataset.recordId);
  if (!record) {
    feedback.textContent = 'No se encontró el registro seleccionado. Actualiza la lista.';
    return;
  }

  if (button.classList.contains('edit-record')) {
    openEditForm(record);
    return;
  }

  if (!window.confirm('¿Deseas eliminar este registro? Esta acción no se puede deshacer.')) {
    return;
  }

  button.disabled = true;
  try {
    await request('delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: record.id }),
    });
    feedback.textContent = 'Registro eliminado correctamente.';
    await loadRecords();
  } catch (error) {
    feedback.textContent = error.message;
    button.disabled = false;
  }
});

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!form.reportValidity()) {
    return;
  }

  const id = document.getElementById('record-id').value;
  const action = id ? 'update' : 'create';
  const record = readFormData();
  const materialInput = document.getElementById('field-rutaPdf');
  const materialFile = materialInput?.files?.[0];
  const body = id
    ? { id: Number(id), record }
    : { record };

  saveButton.disabled = true;
  saveButton.textContent = 'Guardando...';
  formFeedback.textContent = '';
  try {
    const result = await request(action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (moduleName === 'activities' && materialFile) {
      try {
        await uploadActivityMaterial(result.id || Number(id), record.idGrupo, materialFile);
      } catch (error) {
        closeModal();
        await loadRecords();
        feedback.textContent = `La actividad se guardó, pero el material no se pudo subir: ${error.message}`;
        return;
      }
    }
    closeModal();
    feedback.textContent = result.message;
    await loadRecords();
  } catch (error) {
    formFeedback.textContent = error.message;
  } finally {
    saveButton.disabled = false;
    saveButton.textContent = 'Guardar registro';
  }
});

const uploadActivityMaterial = async (activityId, groupId, file) => {
  const extension = file.name.split('.').pop().toLowerCase();
  const contentTypes = {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };
  const contentType = contentTypes[extension];
  if (!contentType || file.size === 0 || file.size > 20 * 1024 * 1024) {
    throw new Error('Selecciona un PDF, Word o Excel válido de máximo 20 MB.');
  }

  const response = await fetch(
    `/app/v1/modules/activities/${activityId}/material?groupId=${encodeURIComponent(groupId)}&filename=${encodeURIComponent(file.name)}`,
    {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': contentType },
      body: file,
    }
  );
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.message || 'No fue posible subir el archivo.');
  }
};

if (modal) {
  for (const field of moduleConfig.fields) {
    if (field.type !== 'reference') {
      continue;
    }
    const select = document.getElementById(`field-${field.key}`);
    const options = moduleOptions[field.key] || [];
    if (field.required && options.length === 0) {
      select.disabled = true;
      select.options[0].textContent = 'Primero registra los elementos relacionados';
      missingRequiredReferences.push(field.label.toLocaleLowerCase('es'));
    }
  }
}

const renderAttendanceGrid = (grid) => {
  attendanceGridWrapper.replaceChildren();
  if (grid.students.length === 0 || grid.activities.length === 0) {
    const placeholder = document.createElement('p');
    placeholder.className = 'attendance-grid-placeholder';
    placeholder.textContent = grid.students.length === 0
      ? 'El grupo no tiene catequizandos con matrícula activa.'
      : 'El grupo todavía no tiene actividades registradas.';
    attendanceGridWrapper.appendChild(placeholder);
    return;
  }

  const attendanceByPair = new Map(
    grid.attendance.map((item) => [
      `${item.idCatequizando}:${item.idActividad}`,
      item,
    ])
  );
  const table = document.createElement('table');
  table.className = 'attendance-grid-table';
  const head = document.createElement('thead');
  const headerRow = document.createElement('tr');
  const studentHeading = document.createElement('th');
  studentHeading.scope = 'col';
  studentHeading.className = 'attendance-student-heading';
  studentHeading.textContent = 'Catequizando';
  headerRow.appendChild(studentHeading);

  for (const activity of grid.activities) {
    const heading = document.createElement('th');
    heading.scope = 'col';
    const title = document.createElement('span');
    title.textContent = activity.descripcion;
    const date = document.createElement('small');
    date.textContent = String(activity.fechaActividad).slice(0, 10);
    heading.append(title, date);
    headerRow.appendChild(heading);
  }
  head.appendChild(headerRow);
  table.appendChild(head);

  const body = document.createElement('tbody');
  for (const student of grid.students) {
    const row = document.createElement('tr');
    const studentCell = document.createElement('th');
    studentCell.scope = 'row';
    studentCell.className = 'attendance-student';
    const studentName = document.createElement('span');
    studentName.textContent = `${student.nombres} ${student.apellidos}`;
    const studentDocument = document.createElement('small');
    studentDocument.textContent = student.numeroDocumento;
    studentCell.append(studentName, studentDocument);
    row.appendChild(studentCell);

    for (const activity of grid.activities) {
      const cell = document.createElement('td');
      const activityId = activity.id;
      const attendance = attendanceByPair.get(`${student.id}:${activityId}`);
      const cellContainer = document.createElement('div');
      cellContainer.className = 'attendance-grid-cell';
      cellContainer.dataset.studentId = student.id;
      cellContainer.dataset.activityId = activityId;

      const status = document.createElement('select');
      status.className = 'attendance-status';
      status.setAttribute('aria-label', `Asistencia de ${student.nombres} a ${activity.descripcion}`);
      status.innerHTML = '<option value="">Sin registrar</option><option value="true">Asistió</option><option value="false">No asistió</option>';
      if (attendance) {
        status.options[0].disabled = true;
        status.value = attendance.asistio === true ||
          attendance.asistio === 1 ||
          attendance.asistio === '1' ? 'true' : 'false';
      }

      const grade = document.createElement('input');
      grade.type = 'number';
      grade.className = 'attendance-grade';
      grade.min = '1';
      grade.max = '5';
      grade.step = '0.1';
      grade.disabled = activity.calificable !== true &&
        activity.calificable !== 1 &&
        activity.calificable !== '1';
      grade.placeholder = grade.disabled ? 'No aplica' : 'Nota';
      grade.setAttribute('aria-label', `Calificación de ${student.nombres} en ${activity.descripcion}`);
      if (
        !grade.disabled &&
        attendance?.calificacion !== null &&
        attendance?.calificacion !== undefined
      ) {
        grade.value = attendance.calificacion;
      }
      cellContainer.append(status, grade);
      cell.appendChild(cellContainer);
      row.appendChild(cell);
    }
    body.appendChild(row);
  }
  table.appendChild(body);
  attendanceGridWrapper.appendChild(table);
};

const loadAttendanceGrid = async (groupId) => {
  attendanceGridFeedback.textContent = '';
  attendanceGridDirty = false;
  saveAttendanceGridButton.disabled = true;
  loadedAttendanceGroup = groupId;

  if (!groupId) {
    attendanceGridWrapper.replaceChildren();
    const placeholder = document.createElement('p');
    placeholder.className = 'attendance-grid-placeholder';
    placeholder.textContent = 'Selecciona un grupo para ver la cuadrícula de estudiantes y actividades.';
    attendanceGridWrapper.appendChild(placeholder);
    return;
  }

  try {
    const result = await request(`grid?groupId=${encodeURIComponent(groupId)}`);
    renderAttendanceGrid(result.grid);
  } catch (error) {
    attendanceGridFeedback.textContent = error.message;
  }
};

if (attendanceGroup) {
  attendanceGroup.addEventListener('change', async () => {
    const nextGroup = attendanceGroup.value;
    if (
      attendanceGridDirty &&
      !window.confirm('Hay cambios sin guardar. ¿Deseas descartarlos y cambiar de grupo?')
    ) {
      attendanceGroup.value = loadedAttendanceGroup;
      return;
    }
    await loadAttendanceGrid(nextGroup);
  });

  attendanceGridWrapper.addEventListener('input', () => {
    attendanceGridDirty = true;
    saveAttendanceGridButton.disabled = false;
  });
  attendanceGridWrapper.addEventListener('change', () => {
    attendanceGridDirty = true;
    saveAttendanceGridButton.disabled = false;
  });

  saveAttendanceGridButton.addEventListener('click', async () => {
    const entries = [];
    let invalidGradeInput = null;
    for (const cell of attendanceGridWrapper.querySelectorAll('.attendance-grid-cell')) {
      const status = cell.querySelector('.attendance-status');
      const grade = cell.querySelector('.attendance-grade');
      if (grade.value && !status.value) {
        attendanceGridFeedback.textContent = 'Selecciona si asistió cada estudiante que tenga una calificación.';
        status.focus();
        return;
      }
      if (!grade.reportValidity()) {
        invalidGradeInput = grade;
        break;
      }
      if (!status.value) {
        continue;
      }
      entries.push({
        idCatequizando: Number(cell.dataset.studentId),
        idActividad: Number(cell.dataset.activityId),
        asistio: status.value === 'true',
        calificacion: grade.value === '' ? null : Number(grade.value),
      });
    }

    if (invalidGradeInput) {
      invalidGradeInput.focus();
      return;
    }
    if (entries.length === 0) {
      attendanceGridFeedback.textContent = 'No hay registros seleccionados para guardar.';
      return;
    }

    saveAttendanceGridButton.disabled = true;
    saveAttendanceGridButton.textContent = 'Guardando...';
    try {
      const result = await request('grid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId: Number(attendanceGroup.value), entries }),
      });
      await loadAttendanceGrid(attendanceGroup.value);
      attendanceGridFeedback.textContent = `${result.message} (${result.saved} registros).`;
      await loadRecords();
    } catch (error) {
      attendanceGridFeedback.textContent = error.message;
      saveAttendanceGridButton.disabled = false;
    } finally {
      saveAttendanceGridButton.textContent = 'Guardar cambios';
    }
  });
}

loadRecords();
