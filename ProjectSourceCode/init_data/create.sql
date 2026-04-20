-- all table names should be changed for security reasons, however generic names for now for ease of development
CREATE TABLE IF NOT EXISTS users (
    userID SERIAL PRIMARY KEY,
    username VARCHAR(15) NOT NULL UNIQUE,
    email VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(60) NOT NULL,
    ai_provider INT NOT NULL DEFAULT 1 -- 0 = Google Gemini, 1 = Qwen
);

CREATE TABLE IF NOT EXISTS classes (
    classID SERIAL PRIMARY KEY,
    className VARCHAR(60) NOT NULL,
    term VARCHAR(20),
    section VARCHAR(10),
    professor VARCHAR(50) NOT NULL,
    classCode VARCHAR(10),
    textbook VARCHAR(1000),
    email VARCHAR(50),
    meta VARCHAR(1000)
);

CREATE TABLE IF NOT EXISTS meet_times (
    meetTimeID SERIAL PRIMARY KEY,
    classID INT,
    dayOfTheWeek INT NOT NULL,
    type VARCHAR(3) NOT NULL,-- REC/LEC/LAB/OFH (office hours)
    startTime TIME NOT NULL,
    endTime TIME NOT NULL,
    startDate DATE NOT NULL,
    endDate DATE NOT NULL,
    location VARCHAR(40) NOT NULL,-- For CU specifically ECCS 121 for example
    remote BOOLEAN NOT NULL -- for online classes
);

CREATE TABLE IF NOT EXISTS students_to_classes (
    classID INT,
    userID INT,
    FOREIGN KEY (classID) REFERENCES classes(classID),
    FOREIGN KEY (userID) REFERENCES users(userID)
);

CREATE TABLE IF NOT EXISTS assignments (
    assignmentID SERIAL PRIMARY KEY,
    classID INT NOT NULL,
    name VARCHAR(50) NOT NULL,
    type VARCHAR(10) NOT NULL,
    repeat BOOLEAN NOT NULL DEFAULT FALSE,
    dueDate DATE,
    dueTime TIME NOT NULL DEFAULT '23:59:00',
    location VARCHAR(1000), -- for in person exams and tests only
    userID INT, --can be null, potentially used for assignments created manually by specific users, something we dont want to share to other users
    FOREIGN KEY (classID) REFERENCES classes(classID),
    FOREIGN KEY (userID) REFERENCES users(userID)
);