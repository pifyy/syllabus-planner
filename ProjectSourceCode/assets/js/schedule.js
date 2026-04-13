/* ── Study Plan ── */
(function () {
  const loading  = document.getElementById('schedLoading');
  const empty    = document.getElementById('schedEmpty');
  const errorEl  = document.getElementById('schedError');
  const results  = document.getElementById('schedResults');
  const cards    = document.getElementById('schedCards');
  const refresh  = document.getElementById('refreshBtn');

  const urgencyMeta = {
    overdue:        { label: 'Overdue',        cls: 'urgency-overdue'  },
    today:          { label: 'Start Today',    cls: 'urgency-today'    },
    soon:           { label: 'Start Soon',     cls: 'urgency-soon'     },
    upcoming:       { label: 'Coming Up',      cls: 'urgency-upcoming' },
    plenty_of_time: { label: 'Plenty of Time', cls: 'urgency-plenty'   },
  };

  const typeDot = {
    'EXAM': 'red',
    'QUIZ': 'gold',
    'LAB':  'gold',
    'HW':   'blue',
    'PROJ': 'terra',
  };

  function show(el)  { el.style.display = ''; }
  function hide(el)  { el.style.display = 'none'; }

  function generate() {
    hide(empty); hide(errorEl); hide(results);
    show(loading);
    refresh.disabled = true;

    fetch('/schedule/generate', { method: 'POST' })
      .then(r => r.json())
      .then(data => {
        hide(loading);
        refresh.disabled = false;
        if (data.status === 'success') {
          if (!data.recommendations || data.recommendations.length === 0) {
            show(empty);
          } else {
            render(data.recommendations);
            show(results);
          }
        } else {
          showError(data.message || 'Could not generate plan.');
        }
      })
      .catch(() => {
        hide(loading);
        refresh.disabled = false;
        showError('Network error. Please try again.');
      });
  }

  function render(recs) {
    cards.innerHTML = recs.map(rec => {
      const meta    = urgencyMeta[rec.urgency] || urgencyMeta.upcoming;
      const dotCls  = typeDot[(rec.type || '').toUpperCase()] || 'blue';
      const daysMsg = rec.days_to_complete === 1
        ? '1 day to complete'
        : `${rec.days_to_complete} days to complete`;

      return `
        <div class="sched-card">
          <div class="sched-card-left">
            <div class="preview-dot ${dotCls}" style="flex-shrink:0;margin-top:3px;"></div>
            <div class="sched-card-body">
              <div class="sched-card-name">${rec.assignment}</div>
              <div class="sched-card-class">${rec.class}</div>
              <div class="sched-card-tip">${rec.tip}</div>
            </div>
          </div>
          <div class="sched-card-right">
            <span class="sched-urgency-badge ${meta.cls}">${meta.label}</span>
            <div class="sched-start-date">Start by <strong>${rec.start_by_label}</strong></div>
            <div class="sched-due-date">Due ${rec.due_label}</div>
            <div class="sched-days-est">${daysMsg}</div>
          </div>
        </div>`;
    }).join('');
  }

  function showError(msg) {
    errorEl.textContent = msg;
    show(errorEl);
  }

  refresh.addEventListener('click', generate);

  // Auto-generate on load
  if (window.SCHED_ASSIGNMENTS && window.SCHED_ASSIGNMENTS.length > 0) {
    generate();
  } else {
    hide(loading);
    show(empty);
  }
})();
