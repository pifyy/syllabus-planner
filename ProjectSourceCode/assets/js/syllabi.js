// ── Tab switching ──
const tabBar = document.getElementById('tabBar');
if (tabBar) {
  tabBar.addEventListener('click', e => {
    const btn = e.target.closest('.tab-btn');
    if (!btn) return;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
  });
}

// ── Upload: auto-submit on file select or drop ──
const zone       = document.getElementById('uploadZone');
const input      = document.getElementById('fileInput');
const processing = document.getElementById('uploadProcessing');
const fill       = document.getElementById('processingFill');
const label      = document.getElementById('processingLabel');
const success    = document.getElementById('uploadSuccess');

zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
zone.addEventListener('drop', e => {
  e.preventDefault();
  zone.classList.remove('drag-over');
  handleFile(e.dataTransfer.files[0]);
});

input.addEventListener('change', () => handleFile(input.files[0]));

function handleFile(file) {
  if (!file) return;

  processing.classList.remove('visible');
  processing.style.color = '';
  success.classList.remove('visible');
  processing.classList.add('visible');
  label.textContent = 'Reading file…';
  fill.style.width = '0%';
  fill.style.background = '';

  const steps = [
    { w: '30%', t: 300,  msg: 'Uploading file…' },
    { w: '60%', t: 900,  msg: 'Validating…' },
    { w: '85%', t: 1600, msg: 'Almost there…' },
  ];
  steps.forEach(s => {
    setTimeout(() => {
      fill.style.width = s.w;
      label.textContent = s.msg;
    }, s.t);
  });

  const formData = new FormData();
  formData.append('syllabusFile', file);

  fetch('/syllabi/upload', { method: 'POST', body: formData })
    .then(res => res.json())
    .then(data => {
      fill.style.width = '100%';
      if (data.status === 'success') {
        setTimeout(() => {
          processing.classList.remove('visible');
          success.classList.add('visible');
          setTimeout(() => window.location.reload(), 1200);
        }, 400);
      } else {
        label.textContent = data.error || 'Upload failed.';
        processing.style.color = 'var(--red-accent, #e05252)';
        fill.style.background = 'var(--red-accent, #e05252)';
      }
    })
    .catch(() => {
      fill.style.width = '100%';
      label.textContent = 'Upload failed. Please try again.';
      processing.style.color = 'var(--red-accent, #e05252)';
    });
}

// ── Helpers ──
function getActiveClassID() {
  const panel = document.querySelector('.tab-panel.active');
  return panel ? panel.dataset.classid : null;
}

// ── Assignment modal ──
const asgBackdrop  = document.getElementById('assignmentModalBackdrop');
const asgForm      = document.getElementById('assignmentForm');
const asgTitle     = document.getElementById('assignmentModalTitle');
const asgID        = document.getElementById('asgAssignmentID');
const asgClassID   = document.getElementById('asgClassID');
const asgName      = document.getElementById('asgName');
const asgDate      = document.getElementById('asgDate');
const asgTime      = document.getElementById('asgTime');
const asgType      = document.getElementById('asgType');
const asgError     = document.getElementById('asgError');
const asgDeleteBtn = document.getElementById('asgDeleteBtn');
const asgSubmitBtn = document.getElementById('asgSubmitBtn');

function openAddAssignment() {
  const classID = getActiveClassID();
  if (!classID) return;

  asgTitle.textContent      = 'Add Assignment';
  asgSubmitBtn.textContent  = 'Add Assignment';
  asgID.value               = '';
  asgClassID.value          = classID;
  asgName.value             = '';
  asgDate.value             = '';
  asgTime.value             = '';
  asgType.value             = 'Assignment';
  asgError.textContent      = '';
  asgDeleteBtn.style.display = 'none';
  asgBackdrop.classList.add('visible');
  asgName.focus();
}

function openEditAssignment(row) {
  asgTitle.textContent      = 'Edit Assignment';
  asgSubmitBtn.textContent  = 'Save Changes';
  asgID.value               = row.dataset.assignmentid;
  asgClassID.value          = '';
  asgName.value             = row.dataset.name  || '';
  asgDate.value             = row.dataset.duedate || '';
  asgTime.value             = row.dataset.duetime || '';
  asgType.value             = row.dataset.type  || 'Assignment';
  asgError.textContent      = '';
  asgDeleteBtn.style.display = '';
  asgBackdrop.classList.add('visible');
  asgName.focus();
}

function closeAssignmentModal() {
  asgBackdrop.classList.remove('visible');
}

document.getElementById('assignmentModalClose').addEventListener('click', closeAssignmentModal);
document.getElementById('asgCancelBtn').addEventListener('click', closeAssignmentModal);
asgBackdrop.addEventListener('click', e => { if (e.target === asgBackdrop) closeAssignmentModal(); });

asgForm.addEventListener('submit', async e => {
  e.preventDefault();
  asgError.textContent = '';
  const isEdit = !!asgID.value;

  const body = {
    name:    asgName.value,
    type:    asgType.value,
    dueDate: asgDate.value || null,
    dueTime: asgTime.value || null,
  };

  const url    = isEdit ? `/assignments/${asgID.value}` : '/assignments';
  const method = isEdit ? 'PUT' : 'POST';

  if (!isEdit) body.classID = asgClassID.value;

  try {
    const res  = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.status === 'success') {
      closeAssignmentModal();
      window.location.reload();
    } else {
      asgError.textContent = data.error || 'Something went wrong.';
    }
  } catch {
    asgError.textContent = 'Network error. Please try again.';
  }
});

asgDeleteBtn.addEventListener('click', async () => {
  if (!asgID.value) return;
  asgError.textContent = '';
  try {
    const res  = await fetch(`/assignments/${asgID.value}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.status === 'success') {
      closeAssignmentModal();
      window.location.reload();
    } else {
      asgError.textContent = data.error || 'Failed to delete.';
    }
  } catch {
    asgError.textContent = 'Network error. Please try again.';
  }
});

// FAB button
const fabAdd = document.getElementById('fabAdd');
if (fabAdd) fabAdd.addEventListener('click', openAddAssignment);

// Clickable assignment rows
document.querySelectorAll('.assignment-row').forEach(row => {
  row.addEventListener('click', () => openEditAssignment(row));
});

// ── Edit class modal ──
const editBackdrop  = document.getElementById('editModalBackdrop');
const editForm      = document.getElementById('editClassForm');
const editClassID   = document.getElementById('editClassID');
const editClassName = document.getElementById('editClassName');
const editClassCode = document.getElementById('editClassCode');
const editTerm      = document.getElementById('editTerm');
const editProfessor = document.getElementById('editProfessor');
const editTextbook  = document.getElementById('editTextbook');
const editError     = document.getElementById('editError');

function openEditModal(btn) {
  editClassID.value   = btn.dataset.classid;
  editClassName.value = btn.dataset.classname || '';
  editClassCode.value = btn.dataset.classcode || '';
  editTerm.value      = btn.dataset.term      || '';
  editProfessor.value = btn.dataset.professor  || '';
  editTextbook.value  = btn.dataset.textbook  || '';
  editError.textContent = '';
  editBackdrop.classList.add('visible');
}

function closeEditModal() { editBackdrop.classList.remove('visible'); }

document.getElementById('editModalClose').addEventListener('click', closeEditModal);
document.getElementById('editCancelBtn').addEventListener('click', closeEditModal);
editBackdrop.addEventListener('click', e => { if (e.target === editBackdrop) closeEditModal(); });

editForm.addEventListener('submit', async e => {
  e.preventDefault();
  editError.textContent = '';
  try {
    const res = await fetch(`/syllabi/class/${editClassID.value}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        className: editClassName.value,
        classCode: editClassCode.value,
        term:      editTerm.value,
        professor: editProfessor.value,
        textbook:  editTextbook.value,
      }),
    });
    const data = await res.json();
    if (data.status === 'success') { closeEditModal(); window.location.reload(); }
    else editError.textContent = data.error || 'Failed to save changes.';
  } catch {
    editError.textContent = 'Network error. Please try again.';
  }
});

// ── Remove class modal ──
const removeBackdrop  = document.getElementById('removeModalBackdrop');
const removeClassName = document.getElementById('removeClassName');
const removeError     = document.getElementById('removeError');
let   pendingRemoveID = null;

function openRemoveModal(btn) {
  pendingRemoveID = btn.dataset.classid;
  removeClassName.textContent = btn.dataset.classname || 'this class';
  removeError.textContent = '';
  removeBackdrop.classList.add('visible');
}

function closeRemoveModal() { removeBackdrop.classList.remove('visible'); pendingRemoveID = null; }

document.getElementById('removeModalClose').addEventListener('click', closeRemoveModal);
document.getElementById('removeCancelBtn').addEventListener('click', closeRemoveModal);
removeBackdrop.addEventListener('click', e => { if (e.target === removeBackdrop) closeRemoveModal(); });

document.getElementById('removeConfirmBtn').addEventListener('click', async () => {
  if (!pendingRemoveID) return;
  removeError.textContent = '';
  try {
    const res  = await fetch(`/syllabi/class/${pendingRemoveID}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.status === 'success') { closeRemoveModal(); window.location.reload(); }
    else removeError.textContent = data.error || 'Failed to remove class.';
  } catch {
    removeError.textContent = 'Network error. Please try again.';
  }
});

// ── Wire up class Edit / Remove buttons ──
document.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', () => openEditModal(btn)));
document.querySelectorAll('.remove-btn').forEach(btn => btn.addEventListener('click', () => openRemoveModal(btn)));
