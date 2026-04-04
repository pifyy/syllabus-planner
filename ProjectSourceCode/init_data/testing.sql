
INSERT INTO users 
    (userID, username, email, password)
VALUES
    (1, '123', '123@gmail.com', '$2a$10$h4qCcDTonTsWSlGqGQIguO7ebMgKLW5uGPbf0XjaGpkMLXUN5.QZm');
--This is the login for a student with username password of 123, 123

INSERT INTO classes
    (classID, className, professor)
VALUES
    (1,'CSCI 3308 Software Development and Tools', 'Sreesha Nath');

INSERT INTO meet_times
    (classID, dayOfTheWeek, type, time, location)
VALUES
    (1, 'monday', 'LEC', '15:35:00', 'ECCR 265'),
    (1, 'wednesday', 'LEC', '15:35:00', 'ECCR 265'),
    (1, 'thursday', 'LAB', '12:30:00', 'ECES 114');

INSERT INTO students_to_classes 
    (classID,userID)
VALUES
    (1,1);

INSERT INTO assignments
    (name, type, due, classID)
VALUES
    ('Lab 10', 'LAB', '2026-04-08 11:59:59', 1);



