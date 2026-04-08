-- all table names should be changed for security reasons, however generic names for now for ease of development
CREATE TABLE IF NOT EXISTS users (
    userID SERIAL PRIMARY KEY,
    username VARCHAR(15) NOT NULL UNIQUE,
    email VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(60) NOT NULL
    --Add any settings saved for individual users
);

CREATE TABLE IF NOT EXISTS classes (
    classID SERIAL PRIMARY KEY,
    className VARCHAR(60) NOT NULL,
    term VARCHAR(20) NOT NULL,
    section VARCHAR(10) NOT NULL,
    professor VARCHAR(50) NOT NULL,
    classCode VARCHAR(10) NOT NULL,
    textbook VARCHAR(1000), -- Needs much larger character limit to store textbook info. 
    email VARCHAR(50),
    meta VARCHAR(1000)
);
CREATE TABLE IF NOT EXISTS meet_times (
    meetTimeID SERIAL PRIMARY KEY,
    classID INT NOT NULL,
    dayOfTheWeek INT NOT NULL,
    type INT NOT NULL,-- REC/LEC/LAB/OFH (office hours)
    startTime TIME NOT NULL,
    endTime TIME NOT NULL,
    startDate DATE NOT NULL,
    endDate DATE NOT NULL,
    location VARCHAR(40) NOT NULL,
    remote BOOLEAN NOT NULL
);
CREATE TABLE IF NOT EXISTS assignments (
    assignmentID SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    type VARCHAR(10) NOT NULL,
    repeat BOOLEAN NOT NULL,
    dueDate DATE,
    dueTime TIME NOT NULL,
    location VARCHAR(50), -- for in person exams and tests only
    classID INT,
    userID INT --can be null, potentially used for assignments created manually by specific users, something we dont want to share to other users
);

CREATE TABLE IF NOT EXISTS students_to_classes (
    classID INT,
    userID INT,
    FOREIGN KEY (classID) REFERENCES classes(classID),
    FOREIGN KEY (userID) REFERENCES users(userID)
);
CREATE TABLE IF NOT EXISTS classes_to_assignments (
    classID INT, 
    assignmentID INT,
    FOREIGN KEY (classID) REFERENCES classes(classID),
    FOREIGN KEY (assignmentID) REFERENCES assignments(assignmentID)
);
CREATE TABLE IF NOT EXISTS classes_to_meet_times (
    classID INT, 
    meetTimeID INT,
    FOREIGN KEY (classID) REFERENCES classes(classID),
    FOREIGN KEY (meetTimeID) REFERENCES meet_times(meetTimeID)
);
INSERT INTO users (username, email, password) VALUES ('testuser', 'test@mail.com', '$2b$10$KIXQJHjTnZsGg5qjLh8SOuXU1r7v3m9yQeZtqzZtHkVhYp0i1C'); -- password is "password"