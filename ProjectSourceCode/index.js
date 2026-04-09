//First part of the code is taken from lab 7 and then modified to fit project needs. 
const express = require('express'); // To build an application server or API
const app = express();
const handlebars = require('express-handlebars'); //to enable express to work with handlebars
const Handlebars = require('handlebars'); // to include the templating engine responsible for compiling templates
const path = require('path');
const pgp = require('pg-promise')(); // To connect to the Postgres DB from the node server
const bodyParser = require('body-parser');
const session = require('express-session'); // To set the session object. To store or access session data, use the `req.session`, which is (generally) serialized as JSON by the store.
const bcrypt = require('bcryptjs'); //  To hash passwords
const axios = require('axios'); // To make HTTP requests from our server. We'll learn more about it in Part C.
const { error } = require('console');

const multer = require('multer'); // to properly handle file uploads in our server. 
const upload = multer({ storage: multer.memoryStorage() }) //specifies that we want the uploaded files to be stored in memory for processing
const { GoogleGenAI } = require('@google/genai'); // to interact with the Gemini API.

// *****************************************************
// <!-- Section 2 : Connect to DB -->
// *****************************************************

// create `ExpressHandlebars` instance and configure the layouts and partials dir.
const hbs = handlebars.create({
  extname: 'hbs',
  layoutsDir: __dirname + '/views/layouts',
  partialsDir: __dirname + '/views/partials',
});

// database configuration
const dbConfig = {
  host: 'db', // the database server
  port: 5432, // the database port
  database: process.env.POSTGRES_DB, // the database name
  user: process.env.POSTGRES_USER, // the user account to connect with
  password: process.env.POSTGRES_PASSWORD, // the password of the user account
};

const db = pgp(dbConfig);

// test your database
db.connect()
  .then(obj => {
    console.log('Database connection successful'); // you can view this message in the docker compose logs
    obj.done(); // success, release the connection;
  })
  .catch(error => {
    console.log('ERROR:', error.message || error);
  });

// *****************************************************
// <!-- Section 3 : App Settings -->
// *****************************************************

// Register `hbs` as our view engine using its bound `engine()` function.
app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.json()); // specify the usage of JSON for parsing request body.
app.use('/assets', express.static(path.join(__dirname, 'assets'))); // specify the usage of static files in the assets folder

// initialize session variables
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
    resave: false,
  })
);
// initialize the google gemini client 
const gemini = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});

app.use(
  bodyParser.urlencoded({
    extended: true,
  })

);

const auth = (req, res, next) => {
  if (!req.session.user) {
    // Default to login page.
    return res.redirect('/login');
  }
  next();
};
//Endpoints 

app.get('/', (req, res) => {
  res.render('./pages/index', { user: req.session.user });
});

app.get('/register', (req, res) => {
  res.render('./pages/register', { user: req.session.user });
});

app.post('/register', async (req, res) => {
  try {
    const hash = await bcrypt.hash(req.body.password, 10);
    const query = 'INSERT INTO users(username, email, password) VALUES($1, $2, $3) RETURNING *;';

    await db.any(query, [req.body.username, req.body.email, hash]);

    res.redirect('/login');
  } catch (error) {
    console.error('Error during registration: ', error);
    res.status(400).render('./pages/register', {
      error: 'Registration failed.',
      user: req.session.user
    });
  }
});

app.get('/login', (req, res) => {
  res.render('./pages/login', { user: req.session.user });
});

app.post('/login', async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  try {
    const user = await db.oneOrNone('SELECT * FROM users WHERE username = $1', [username]);
    if (user && await bcrypt.compare(password, user.password)) {
      req.session.user = user;
      req.session.save();
      res.redirect('/dashboard');
    } else {
      res.render('./pages/login', { error: 'Invalid username or password' });
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.render('./pages/login', { error: 'An error occurred during login. Please try again.' });
  }
});
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

app.get('/dashboard', auth, async (req, res) => {
    try {
        // Queries database for due soon assignments for notifications -Alex
        const notificationQuery = `
            SELECT 
              a.name, a.due, c.className 
            FROM 
              assignments a
            
            JOIN classes c ON a.classid = c.classid

            JOIN students_to_classes sc ON c.classID = sc.classid

            WHERE sc.userid = $1

            AND a.due BETWEEN NOW() AND NOW() + INTERVAL '7 days'

            AND (
                a.userid = $1          -- created by user (future feature?)
                OR a.userid IS NULL    -- assignment was generated by us for that specific class
            )
            ORDER BY a.due ASC;
        `;

        const notifications = await db.any(notificationQuery, [req.session.user.userid]);

        res.render('./pages/dashboard', {
            user: req.session.user,
            notifications: notifications,
            hasNotifications: notifications.length > 0
        });
    } catch (err) {
        console.error(err);
        res.render('./pages/dashboard', {
            user: req.session.user,
            notifications: []
        });
    }
});

app.get('/syllabi', auth, (req, res) => {
  res.render('./pages/syllabi', { user: req.session.user });
});

app.get('/officehours', auth, (req, res) => {
  res.render('./pages/officehours', { user: req.session.user });
});

app.get('/welcome', (req, res) => {
  res.json({status: 'success', message: 'Welcome!'});
});

app.post('/syllabi/upload', auth, upload.single('syllabusFile'), async (req, res) => {
  // check if file is in request
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  // pdf signiture exists in the first 4 bytes of the file
  // we check for %PDF or 25 50 44 46 bc security :-)
  const isPDF = req.file.buffer.toString('utf8', 0, 4) == '%PDF';
  if(!isPDF) {
    return res.status(400).json({ error: 'Uploaded file is not a valid PDF' });
  } else if (req.file.originalname === "testing.pdf"){
    //for test case only to ensure uploaded correctly.
    return res.status(200).json({ status: 'success', message: 'File uploaded successfully' });
  }
  //return res.status(200).json({ status: 'success', message: 'File uploaded successfully' });
  // Now we may process file. 
  // For now there is just one api, but down the line we should expand this to other services if one api hits rate limit
  const prompt = `Analize the given syllabus and extract the following information in the json format specified:
  {
  "professor": "Professor Name",
  "class_code": "CSCI 3308",
  "office_hours": [
    {
      "day": "T",
      "time": "10:00-11:30",
      "location": "Office 123",
      "remote" : false
    },
    {
      "day": "Th",
      "time": "14:00-15:30",
      "location": "Zoom (link on Canvas)",
      "remote" : true
    }
  ],
  "location": "ECCR 265",
  "meeting_times": [
    {
      "day": "M",
      "start-time": "15:35",
      "end-time": "16:25",
      "dates": "08/01/2026 - 24/04/2026"
    },
    {
      "day": "W",
      "start-time": "15:35",
      "end-time": "16:25",
      "dates": "08/01/2026 - 24/04/2026"
    }
  ],
  "textbooks": null,
  "assignments": [
    {
      "assignment": "Lab Exercises (Part A & B)",
      "repeat": true,
      "due_date": "W",
      "time": "23:59"
    },
    {
      "assignment": "Weekly Quiz",
      "repeat": true,
      "due_date": "Th",
      "time": "23:59"
    },
    {
      "assignment": "Exam 1",
      "repeat": false,
      "due_date": "11/02/2026",
      "time": "16:00"
    },
    {
      "assignment": "Lecture Participation",
      "repeat": true,
      "due_date": "MW",
      "time": null
    }
  ]
}
When analyzing the syllabus, make sure to use SQL date format (yyyy/mm/dd) for all dates with a single assignment, and for repeating assignments use the day of the week (M,T,W,Th,F). For repeating assignments with multiple due days, concatenate the days together (e.g. MW for assignments due on both Monday and Wednesday). If time is not specified for an assignment, return null for the time field. If there are no textbooks listed in the syllabus, return null for the textbooks field. Make sure to only extract information that is explicitly stated in the syllabus and do not make any assumptions or inferences.`;
  try {
    const response = await gemini.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          parts: [
            {
              text: prompt
            },
            {
              inlineData: {
                mimeType: 'application/pdf',
                data: req.file.buffer.toString('base64')
              },
            },
          ]
        },
      ],
      config: {
        responseMimeType: 'application/json',
      },
  });
    const parcedResponse = JSON.parse(response.text);
    // for debugging purposes, we return the parsed response from the gemini api. down the line we will want to process this response and add it to our database, but for now we just want to make sure we are getting the correct information back from the api.
    res.status(200).json({ status: 'success', data: parcedResponse });
  } catch (err) {
    console.error('GEMINI API ERROR!');
    res.status(400).json({ status: 'error', message: err.message });
  }
});


app.get('/AddClasses', auth, (req, res) => {
  res.render('./pages/addClasses', { user: req.session.user });

  //pull all classes for user.

  //add form for adding a class

  //add form for adding assigments for each class

  //add form for adding meet times for each class
});


//API calls for TESTING ONLY, no other functionality.
app.get('/test', (req, res) => {
  res.redirect('/login');
});

//API calls for debugging only. Specifcally for use in postman to easily see tables and info -Alexander
app.get('/getUserTable', async (req, res) => {
  try{
    const out = await db.any('SELECT * FROM USERS');
    res.status(200).json({Data: out});
  } catch (err) {
    res.status(400).json({Error: err.message})
  }
});  

app.get('/getClassesTable', async (req, res) => {
  try{
    const out = await db.any('SELECT * FROM classes');
    res.status(200).json({Data: out});
  } catch (err) {
    res.status(400).json({Error: err.message})
  }
});  

app.get('/getMeetTimesTable', async (req, res) => {
  try{
    const out = await db.any('SELECT * FROM meet_times');
    res.status(200).json({Data: out});
  } catch (err) {
    res.status(400).json({Error: err.message})
  }
});  

app.get('/getAssignmentsTable', async (req, res) => {
  try{
    const out = await db.any('SELECT * FROM assignments');
    res.status(200).json({Data: out});
  } catch (err) {
    res.status(400).json({Error: err.message})
  }
});  

app.get('/getStudentsToClassesTable', async (req, res) => {
  try{
    const out = await db.any('SELECT * FROM students_to_classes');
    res.status(200).json({Data: out});
  } catch (err) {
    res.status(400).json({Error: err.message})
  }
});  


//=============== END DEBUG TABLES ======================

module.exports = app.listen(3000);
console.log('Server is listening on port 3000');