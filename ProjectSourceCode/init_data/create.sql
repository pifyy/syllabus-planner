CREATE TABLE IF NOT EXISTS users (
    username VARCHAR(15) PRIMARY KEY,
    password VARCHAR(60) NOT NULL,
    Enrolled VARCHAR(20) FORIGN KEY,
);

CREATE TABLE IF NOT EXISTS classes (
    classID VARCHAR(20) PRIMARY KEY,
    className VARCHAR(60) NOT NULL,
    classSyllabusLocation VARCHAR(100),
);

