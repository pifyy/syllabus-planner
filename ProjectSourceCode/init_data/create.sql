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
    location VARCHAR(50) NOT NULL,
    time VARCHAR(20) NOT NULL,
    textbook VARCHAR(100) NOT NULL,
    officeHours VARCHAR(50) NOT NULL,
    email VARCHAR(50) NOT NULL,
    meta VARCHAR(1000) NOT NULL,
    SyllabusFileLocation VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS students_to_classes (
    classID INT,
    userID INT,
    PRIMARY KEY (classID, userID),
    FOREIGN KEY (classID) REFERENCES classes(classID),
    FOREIGN KEY (userID) REFERENCES users(userID)
);

CREATE TABLE IF NOT EXISTS assignments (
    assignmentID SERIAL PRIMARY KEY,
    type VARCHAR(10) NOT NULL, -- Increased to fit 'homework' (8 chars)
    name VARCHAR(50) NOT NULL,
    due DATE NOT NULL,
    classID INT,
    FOREIGN KEY (classID) REFERENCES classes(classID)
);