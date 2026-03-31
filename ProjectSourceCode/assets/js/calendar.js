
const monthNames = ['January','February','March','April','May','June',
                    'July','August','September','October','November','December'];
const dayNames   = ['Su','Mo','Tu','We','Th','Fr','Sa'];
const today = new Date();
let viewYear     = today.getFullYear();
let viewMonth    = today.getMonth();
let selectedDate = new Date(today); 

// month calendar
function buildCalendar() {
    document.getElementById('calMonthTitle').textContent =
        monthNames[viewMonth] + ' ' + viewYear;

    const grid    = document.getElementById('dashCalDays');
    grid.innerHTML = '';

    const firstDay  = new Date(viewYear, viewMonth, 1).getDay();
    const daysTotal = new Date(viewYear, viewMonth + 1, 0).getDate();
    const colors = ['var(--gold)', 'var(--red-accent)', 'var(--deep-blue)'];

    // empty offset cells
    for (let i = 0; i < firstDay; i++) {
        const blank = document.createElement('div');
        blank.className = 'dash-day empty';
        grid.appendChild(blank);
    }

    // day cells
    for (let d = 1; d <= daysTotal; d++) {
        const cell = document.createElement('div');
        cell.className = 'dash-day';
        cell.textContent = d;

        // event dot will be fully implemented but I have no database to connect to !
        const randomColor = Math.floor(Math.random() * 6);
        if (randomColor < 3) {
            cell.classList.add('has-event');
            cell.style.setProperty('--cell-color', colors[randomColor]);
        }

        // today at a glance
        const isToday = (d === today.getDate() &&
                         viewMonth === today.getMonth() &&
                         viewYear  === today.getFullYear());
        if (isToday) cell.classList.add('today');

        // selected date at a glance
        const isSelected = (d === selectedDate.getDate() &&
                            viewMonth === selectedDate.getMonth() &&
                            viewYear  === selectedDate.getFullYear());
        if (isSelected) cell.classList.add('selected');

        // event listener for updating the selcted date and week strip!
        cell.addEventListener('click', () => {
            grid.querySelectorAll('.dash-day.selected')
                .forEach(el => el.classList.remove('selected'));
            cell.classList.add('selected');
            selectedDate = new Date(viewYear, viewMonth, d);
            buildWeekStrip(selectedDate);
        });

        grid.appendChild(cell);
    }
}

document.getElementById('prevMonth').addEventListener('click', () => {
    viewMonth--;
    if (viewMonth < 0) { viewMonth = 11; viewYear--; }
    buildCalendar();
});

document.getElementById('nextMonth').addEventListener('click', () => {
    viewMonth++;
    if (viewMonth > 11) { viewMonth = 0; viewYear++; }
    buildCalendar();
});

// week at a glance strip
function buildWeekStrip(anchorDate) {
    const strip = document.getElementById('dashWeekStrip');
    strip.innerHTML = '';

    for (let offset = -3; offset <= 3; offset++) {
        const day = new Date(anchorDate);
        day.setDate(anchorDate.getDate() + offset);

        const cell = document.createElement('div');
        cell.className = 'dash-week-day';

        // anchor day is always active when the strip is built
        if (offset === 0) cell.classList.add('active');

        cell.innerHTML =
            '<div class="day-name">' + dayNames[day.getDay()] + '</div>' +
            '<div class="day-num">'  + day.getDate()           + '</div>';

        cell.addEventListener('click', () => {
            strip.querySelectorAll('.dash-week-day')
                 .forEach(el => el.classList.remove('active'));
            cell.classList.add('active');
        });

        strip.appendChild(cell);
    }
}

buildCalendar();
buildWeekStrip(selectedDate);
