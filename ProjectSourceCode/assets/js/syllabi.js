
document.getElementById('tabBar').addEventListener('click', e => {
const btn = e.target.closest('.tab-btn');
if (!btn) return;

document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));

btn.classList.add('active');
document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
});

const zone       = document.getElementById('uploadZone');
const input      = document.getElementById('fileInput');
const processing = document.getElementById('uploadProcessing');
const fill       = document.getElementById('processingFill');
const label      = document.getElementById('processingLabel');
const success    = document.getElementById('uploadSuccess');
const fileList   = document.getElementById('uploadFileList');

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

// show processing bar
processing.classList.remove('visible');
processing.style.color = '';
success.classList.remove('visible');
processing.classList.add('visible');
label.textContent = 'Reading file…';
fill.style.width = '0%';

// animate bar while upload is in flight
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
});}