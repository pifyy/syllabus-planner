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
    professor VARCHAR(50) NOT NULL,
    textbook VARCHAR(100),
    officeHours VARCHAR(50),
    email VARCHAR(50),
    meta VARCHAR(1000),
    SyllabusFileLocation VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS meet_times (
    classID INT,
    dayOfTheWeek VARCHAR(20) NOT NULL,
    type VARCHAR(3) NOT NULL,-- REC/LEC/LAB/OFH (office hours)
    time TIME NOT NULL,
    location VARCHAR(40) NOT NULL-- For CU specifically ECCS 121 for example
);

CREATE TABLE IF NOT EXISTS students_to_classes (
    classID INT,
    userID INT,
    FOREIGN KEY (classID) REFERENCES classes(classID),
    FOREIGN KEY (userID) REFERENCES users(userID)
);

CREATE TABLE IF NOT EXISTS assignments (
    assignmentID SERIAL PRIMARY KEY,
    type VARCHAR(10) NOT NULL,
    name VARCHAR(50) NOT NULL,
    due TIMESTAMP NOT NULL,
    location VARCHAR(50), -- for in person exams and tests only
    classID INT NOT NULL,
    userID INT, --can be null, potentially used for assignments created manually by specific users, something we dont want to share to other users
    FOREIGN KEY (classID) REFERENCES classes(classID),
    FOREIGN KEY (userID) REFERENCES users(userID)
);