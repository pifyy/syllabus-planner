// ── Calendar Background Generation ─ spline.design
const calBg = document.getElementById('calendarBg');
if (!calBg) throw new Error('calendarBg not found — skipping calendar init');
const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const dayHeaders = ['S','M','T','W','T','F','S'];
const daysInMonth = [31,28,31,30,31,30,31,31,30,31,30,31];

const cards = [];
const numCards = 18;

function createCalCard(index) {
  const card = document.createElement('div');
  card.className = 'cal-card';

  const monthIdx = Math.floor(Math.random() * 12);
  const startDay = Math.floor(Math.random() * 7);
  const totalDays = daysInMonth[monthIdx];
  const highlightDays = new Set();

  while (highlightDays.size < 2 + Math.floor(Math.random() * 3)) {
    highlightDays.add(1 + Math.floor(Math.random() * totalDays));
  }

  const dueDays = new Set();
  while (dueDays.size < 1 + Math.floor(Math.random() * 2)) {
    const d = 1 + Math.floor(Math.random() * totalDays);
    if (!highlightDays.has(d)) dueDays.add(d);
  }

  let html = `<div class="cal-month">${months[monthIdx]} 2026</div><div class="cal-grid">`;

  dayHeaders.forEach(d => {
    html += `<div class="cal-day header">${d}</div>`;
  });

  for (let i = 0; i < startDay; i++) {
    html += `<div class="cal-day empty"></div>`;
  }

  for (let d = 1; d <= totalDays; d++) {
    const cls = highlightDays.has(d) ? 'highlight' : dueDays.has(d) ? 'due' : '';
    html += `<div class="cal-day ${cls}">${d}</div>`;
  }

  html += '</div>';
  card.innerHTML = html;

  // Position
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const col = index % 6;
  const row = Math.floor(index / 6);
  const baseX = (col / 6) * vw + Math.random() * (vw / 8);
  const baseY = row * (vh / 3) + Math.random() * (vh / 5);

  card.style.left = baseX + 'px';
  card.style.top = baseY + 'px';

  const rotation = (Math.random() - 0.5) * 16;
  const scale = 0.75 + Math.random() * 0.35;
  card.style.transform = `rotate(${rotation}deg) scale(${scale})`;
  card.style.opacity = 0.55 + Math.random() * 0.35;

  // Float animation data
  const data = {
    el: card,
    baseX,
    baseY,
    rotation,
    scale,
    floatSpeedX: 0.2 + Math.random() * 0.4,
    floatSpeedY: 0.15 + Math.random() * 0.35,
    floatAmpX: 8 + Math.random() * 18,
    floatAmpY: 6 + Math.random() * 14,
    phaseX: Math.random() * Math.PI * 2,
    phaseY: Math.random() * Math.PI * 2,
    isDragging: false,
    dragOffsetX: 0,
    dragOffsetY: 0
  };

  // Click to toggle active
  card.addEventListener('click', (e) => {
    if (data.wasDragged) return;
    card.classList.toggle('active');
  });

  // Drag functionality
  let startDragX, startDragY;
  card.addEventListener('mousedown', (e) => {
    data.isDragging = true;
    data.wasDragged = false;
    startDragX = e.clientX;
    startDragY = e.clientY;
    const rect = card.getBoundingClientRect();
    data.dragOffsetX = e.clientX - rect.left;
    data.dragOffsetY = e.clientY - rect.top;
    card.style.zIndex = 50;
    card.style.transition = 'none';
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!data.isDragging) return;
    if (Math.abs(e.clientX - startDragX) > 4 || Math.abs(e.clientY - startDragY) > 4) {
      data.wasDragged = true;
    }
    data.baseX = e.clientX - data.dragOffsetX;
    data.baseY = e.clientY - data.dragOffsetY;
    card.style.left = data.baseX + 'px';
    card.style.top = data.baseY + 'px';
    card.style.transform = `rotate(${data.rotation}deg) scale(${data.scale * 1.05})`;
  });

  document.addEventListener('mouseup', () => {
    if (data.isDragging) {
      data.isDragging = false;
      card.style.zIndex = '';
      card.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease, background 0.3s ease';
    }
  });

  calBg.appendChild(card);
  cards.push(data);
}

for (let i = 0; i < numCards; i++) {
  createCalCard(i);
}

// ── Float Animation ──
let time = 0;
function animateFloat() {
  time += 0.008;
  cards.forEach(c => {
    if (c.isDragging) return;
    const dx = Math.sin(time * c.floatSpeedX + c.phaseX) * c.floatAmpX;
    const dy = Math.cos(time * c.floatSpeedY + c.phaseY) * c.floatAmpY;
    c.el.style.left = (c.baseX + dx) + 'px';
    c.el.style.top = (c.baseY + dy) + 'px';
  });
  requestAnimationFrame(animateFloat);
}
animateFloat();

