INSERT INTO users
    (userID, username, email, password)
VALUES
    (0, '123', '123@gmail.com', '$2a$10$h4qCcDTonTsWSlGqGQIguO7ebMgKLW5uGPbf0XjaGpkMLXUN5.QZm');
--This is the login for a student with username password of 123, 123

-- Class 1 keeps its explicit ID because other inserts below reference it.
INSERT INTO classes
    (classID, className, professor)
VALUES
    (1, 'CSCI 3308 Software Development and Tools', 'Sreesha Nath');

-- Additional classes for calendar difficulty testing.
-- No explicit classID: SERIAL assigns them 2, 3, 4 in insert order.
INSERT INTO classes
    (className, professor)
VALUES
    ('CSCI 3104 Algorithms',        'Rhonda Hoenigman'),
    ('PHYS 1120 General Physics 2', 'John Cumalat'),
    ('MATH 2400 Calculus 3',        'Keli Parker');

INSERT INTO meet_times
    (classID, dayOfTheWeek, type, time, location)
VALUES
    (1, 'monday',    'LEC', '15:35:00', 'ECCR 265'),
    (1, 'wednesday', 'LEC', '15:35:00', 'ECCR 265'),
    (1, 'thursday',  'LAB', '12:30:00', 'ECES 114'),
    (2, 'tuesday',   'LEC', '11:00:00', 'MUEN E050'),
    (2, 'thursday',  'LEC', '11:00:00', 'MUEN E050'),
    (3, 'monday',    'LEC', '10:00:00', 'DUAN G1B30'),
    (3, 'friday',    'LEC', '10:00:00', 'DUAN G1B30'),
    (3, 'wednesday', 'LAB', '14:00:00', 'DUAN G2B77'),
    (4, 'tuesday',   'LEC', '13:00:00', 'MATH 100'),
    (4, 'thursday',  'LEC', '13:00:00', 'MATH 100');

INSERT INTO students_to_classes
    (classID, userID)
VALUES
    (1, 0),
    (2, 0),
    (3, 0),
    (4, 0);

-- ============================================================
-- Assignments for testing the calendar difficulty system.
-- Student is enrolled in 4 classes, so week thresholds are:
--   Easy:    < 19 points
--   Medium:  19 - 23 points
--   Hard:    > 23 points
-- Point values per assignment type:
--   EXAM = 10, PROJ = 6, LAB = 4, QUIZ = 3, HW = 2
-- ============================================================

-- Week 1 (Mar 30 - Apr 5): LIGHT week -> should render EASY
-- Total: 2 + 2 + 3 = 7 points
INSERT INTO assignments (name, type, due, classID) VALUES
    ('HW 1: Git Basics',        'HW',   '2026-03-30 23:59:59', 1),
    ('HW 1: Proof Warmup',      'HW',   '2026-04-02 23:59:59', 2),
    ('Quiz 1: Vectors',         'QUIZ', '2026-04-03 23:59:59', 3);

-- Week 2 (Apr 6 - Apr 12): MODERATE week -> should render MEDIUM
-- Total: 4 + 2 + 10 + 2 + 3 = 21 points
INSERT INTO assignments (name, type, due, classID) VALUES
    ('Lab 10: Docker Setup',    'LAB',  '2026-04-08 11:59:59', 1),
    ('CSCI 3308 Homework',      'HW',   '2026-04-08 23:59:59', 1),
    ('Midterm Exam',            'EXAM', '2026-04-09 11:00:00', 2),
    ('HW 5: Integration',       'HW',   '2026-04-10 23:59:59', 4),
    ('Quiz 3: Circuits',        'QUIZ', '2026-04-10 23:59:59', 3);

-- Week 3 (Apr 13 - Apr 19): HEAVY week -> should render HARD
-- Total: 10 + 6 + 4 + 6 + 2 = 28 points
INSERT INTO assignments (name, type, due, classID) VALUES
    ('Physics Midterm',         'EXAM', '2026-04-14 10:00:00', 3),
    ('Group Project Milestone', 'PROJ', '2026-04-15 23:59:59', 1),
    ('Lab 11: Magnetism',       'LAB',  '2026-04-15 23:59:59', 3),
    ('Algorithms Project',      'PROJ', '2026-04-17 23:59:59', 2),
    ('HW 6: Line Integrals',    'HW',   '2026-04-17 23:59:59', 4);

-- Week 4 (Apr 20 - Apr 26): BOUNDARY at exactly 19 points -> should render MEDIUM
-- Confirms the <= boundary: 19 is Medium, not Easy.
-- Total: 6 + 4 + 3 + 3 + 3 = 19 points
INSERT INTO assignments (name, type, due, classID) VALUES
    ('Final Project Draft',     'PROJ', '2026-04-21 23:59:59', 1),
    ('Lab 12: Optics',          'LAB',  '2026-04-22 23:59:59', 3),
    ('Quiz 4: Series',          'QUIZ', '2026-04-23 23:59:59', 4),
    ('Quiz 2: Graphs',          'QUIZ', '2026-04-23 23:59:59', 2),
    ('Quiz: Docker',            'QUIZ', '2026-04-24 23:59:59', 1);
