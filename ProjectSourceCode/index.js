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
const pdfParse = require('pdf-parse'); // to extract text from PDFs for text-only models.

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
const QWEN_API_URL = 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions';

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
    res.status(400).json({ message: 'Invalid input' });
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
      req.session.save(() => {
        res.redirect('/dashboard');
      });
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

app.get('/syllabi', auth, async (req, res) => {
  try {
    const uid = req.session.user.userid;

    // Fetch all classes the user is enrolled in, with their assignments
    const assignmentRows = await db.any(`
      SELECT
        c.classID, c.className, c.classCode, c.term, c.section, c.professor, c.textbook,
        a.assignmentID, a.name AS assignmentName, a.type AS assignmentType,
        a.dueDate, a.dueTime, a.repeat
      FROM students_to_classes sc
      JOIN classes c ON sc.classID = c.classID
      LEFT JOIN assignments a ON a.classID = c.classID
      WHERE sc.userID = $1
      ORDER BY c.classID, a.dueDate ASC NULLS LAST
    `, [uid]);

    // Fetch lecture meeting times (type = 1) for schedule display
    const meetRows = await db.any(`
      SELECT c.classID, mt.dayOfTheWeek, mt.startTime, mt.endTime, mt.location
      FROM students_to_classes sc
      JOIN classes c ON sc.classID = c.classID
      JOIN meet_times mt ON mt.classID = c.classID AND mt.type = 'LEC'
      WHERE sc.userID = $1
      ORDER BY c.classID, mt.dayOfTheWeek
    `, [uid]);

    const dayLabels = ['Su', 'M', 'T', 'W', 'Th', 'F', 'Sa'];
    const typeStyles = {
      'Exam':       { dot: 'red',   tag: 'exam'   },
      'Quiz':       { dot: 'gold',  tag: 'quiz'   },
      'Assignment': { dot: 'blue',  tag: 'assign' },
      'Project':    { dot: 'terra', tag: 'proj'   },
      'Lab':        { dot: 'green', tag: 'lab'    },
    };

    const classMap = {};

    for (const row of assignmentRows) {
      if (!classMap[row.classid]) {
        classMap[row.classid] = {
          classID:     row.classid,
          className:   row.classname,
          classCode:   row.classcode,
          term:        row.term,
          section:     row.section,
          professor:   row.professor,
          textbook:    row.textbook || '',
          assignments: [],
          meetTimes:   []
        };
      }
      if (row.assignmentid) {
        const style = typeStyles[row.assignmenttype] || { dot: 'blue', tag: 'assign' };
        const rawDate = row.duedate ? new Date(row.duedate).toISOString().slice(0, 10) : '';
        classMap[row.classid].assignments.push({
          assignmentID: row.assignmentid,
          name:         row.assignmentname,
          type:         row.assignmenttype,
          dueDate:      row.duedate
            ? new Date(row.duedate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : null,
          dueTime:      row.duetime ? row.duetime.slice(0, 5) : null,
          rawDueDate:   rawDate,
          rawDueTime:   row.duetime ? row.duetime.slice(0, 5) : '',
          dotClass:     style.dot,
          tagClass:     style.tag
        });
      }
    }

    for (const row of meetRows) {
      if (classMap[row.classid]) {
        classMap[row.classid].meetTimes.push({
          dayLabel:  dayLabels[row.dayoftheweek],
          startTime: row.starttime ? row.starttime.slice(0, 5) : '',
          endTime:   row.endtime   ? row.endtime.slice(0, 5)   : '',
          location:  row.location
        });
      }
    }

    // Build a condensed schedule string by grouping days that share the same time slot
    for (const cls of Object.values(classMap)) {
      if (cls.meetTimes.length > 0) {
        const timeGroups = {};
        for (const mt of cls.meetTimes) {
          const key = `${mt.startTime}-${mt.endTime}`;
          if (!timeGroups[key]) timeGroups[key] = { days: [], startTime: mt.startTime, endTime: mt.endTime, location: mt.location };
          timeGroups[key].days.push(mt.dayLabel);
        }
        cls.scheduleStr = Object.values(timeGroups)
          .map(g => `${g.days.join('')} ${g.startTime}–${g.endTime}`)
          .join(', ');
        cls.location = cls.meetTimes[0].location;
      }
    }

    const classes = Object.values(classMap);
    if (classes.length > 0) classes[0].isFirst = true;

    res.render('./pages/syllabi', {
      user: req.session.user,
      classes,
      hasClasses: classes.length > 0
    });
  } catch (err) {
    console.error('SYLLABI ERROR:', err);
    res.render('./pages/syllabi', {
      user: req.session.user,
      classes: [],
      hasClasses: false
    });
  }
});

app.get('/officehours', auth, (req, res) => {
  res.render('./pages/officehours', { user: req.session.user });
});

app.get('/settings', auth, (req, res) => {
  res.render('./pages/settings', { user: req.session.user });
});

app.get('/welcome', (req, res) => {
  res.json({status: 'success', message: 'Welcome!'});
});

// Day string -> int (matches JS Date.getDay(): Su=0, M=1, T=2, W=3, Th=4, F=5, Sa=6)
function parseDayString(dayStr) {
  if (!dayStr) return [];
  const map = { 'Su': 0, 'M': 1, 'T': 2, 'W': 3, 'Th': 4, 'F': 5, 'Sa': 6 };
  const tokens = dayStr.match(/Th|Su|Sa|M|T|W|F/g) || [];
  return tokens.map(d => map[d]).filter(n => n !== undefined);
}

// Parse "HH:MM-HH:MM" into { startTime, endTime } with seconds appended
function parseTimeRange(timeStr) {
  const [start, end] = timeStr.split('-');
  return { startTime: start.trim() + ':00', endTime: end.trim() + ':00' };
}

// Parse "YYYY-MM-DD - YYYY-MM-DD" into { startDate, endDate }
function parseDateRange(datesStr) {
  if (!datesStr) return { startDate: null, endDate: null };
  const [startDate, endDate] = datesStr.split(' - ').map(s => s.trim());
  return { startDate, endDate };
}
function parseTime(timeStr, defaultTime = '23:59:59') {
  if (!timeStr) return defaultTime;
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;
  return timeRegex.test(timeStr.trim()) ? timeStr.trim() : defaultTime;
}

// Return all dates (YYYY-MM-DD) where the given weekday falls between startDate and endDate
function getOccurrencesOfDay(dayInt, startDateStr, endDateStr) {
  const dates = [];
  const current = new Date(startDateStr + 'T00:00:00');
  const end = new Date(endDateStr + 'T00:00:00');
  while (current.getDay() !== dayInt && current <= end) current.setDate(current.getDate() + 1);
  while (current <= end) {
    dates.push(current.toISOString().slice(0, 10));
    current.setDate(current.getDate() + 7);
  }
  return dates;
}
/*
Quite a large function, but here is an overview:
1. We first check if the file uploaded is a PDF, and if not we return an error. This is done for security purposes as well as to ensure we are processing the proper file
2. We use our constructed prompt to send the file to either the Gemini API or the Qwen API depending on the users settings. This is done in the ai_provider field of the user table in our database. 
  0 = Gemini, 1 = Qwen (default for now)
3. After sending the request we get a json response with the important information
4. There are several parcing functions to extract the relavent information from the response and put it in the proper format for our database. 
5. If everything is okay a success message is returned.
*/
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
  // ai_provider: 0 = Google Gemini, 1 = Qwen (default)
  const prompt = `Analize the given syllabus and extract the following information in the json format specified:
  {
  "professor": "Professor Name",
  "class_code": "CSCI 3308",
  "class_name": "Software Development",
  "term": "Spring 2026",
  "office_hours": [
    {
      "day": "T",
      "time": "10:00-11:30",
      "location": "Office 123",
      "remote": false
    },
    {
      "day": "Th",
      "time": "14:00-15:30",
      "location": "Zoom (link on Canvas)",
      "remote": true
    }
  ],
  "textbooks": "Textbook Title by Author Name,
  "sections": [
    {
      "section": "001",
      "meeting_times": [
        {
          "day": "M",
          "start-time": "15:35",
          "end-time": "16:25",
          "dates": "2026-01-08 - 2026-04-24",
          "location": "ECCR 265",
          "remote": false
        },
        {
          "day": "W",
          "start-time": "15:35",
          "end-time": "16:25",
          "dates": "2026-01-08 - 2026-04-24",
          "location": "ECCR 265",
          "remote": false
        }
      ],
      "assignments": [
        {
          "assignment": "Lab Exercises (Part A & B)",
          "type": "Assignment",
          "repeat": true,
          "due_date": "W",
          "time": "23:59"
        },
        {
          "assignment": "Weekly Quiz",
          "type": "Quiz",
          "repeat": true,
          "due_date": "Th",
          "time": "23:59"
        },
        {
          "assignment": "Exam 1",
          "type": "Exam",
          "repeat": false,
          "due_date": "2026-02-11",
          "time": "16:00"
        },
        {
          "assignment": "Lecture Participation",
          "type": "Assignment",
          "repeat": true,
          "due_date": "MW",
          "time": null
        }
      ]
    }
  ]
}
When analyzing the syllabus, make sure to use SQL date format (yyyy/mm/dd) for all dates with a single assignment, and for repeating assignments use the day of the week (M,T,W,Th,F). For repeating assignments with multiple due days, concatenate the days together (e.g. MW for assignments due on both Monday and Wednesday). If time is not specified for an assignment, return null for the time field. If there are no textbooks listed in the syllabus, return null for the textbooks field. Make sure to only extract information that is explicitly stated in the syllabus and do not make any assumptions or inferences. Adhere strictly to the given json format, if there is no data for a specific section, make the value null. Assignment types should be only "Exam", "Quiz", "Assignment", or "Project".`;

  const aiProvider = req.session.user.ai_provider ?? 1;
  let parcedResponse;

  if (aiProvider === 0) {
    // --- Google Gemini ---
    let response;
    try {
      response = await gemini.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            parts: [
              { text: prompt },
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
    } catch (err) {
      console.error('Error calling Gemini API:', err);
      return res.status(500).json({ error: 'An error occurred while processing the syllabus. Please try again later.' });
    }
    const data = JSON.parse(response.text);
    parcedResponse = Array.isArray(data) ? data[0] : data;
    console.log('Parsed response from Gemini API:', parcedResponse);
  } else {
    // --- Qwen via Alibaba Cloud DashScope (OpenAI-compatible) ---
    // qwen3.5-flash is a text model, so we extract the PDF text and include it inline.
    let pdfText;
    try {
      const parsed = await pdfParse(req.file.buffer);
      pdfText = parsed.text;
    } catch (err) {
      console.error('Error extracting PDF text:', err);
      return res.status(500).json({ error: 'An error occurred while reading the syllabus PDF. Please try again later.' });
    }

    // Truncate to avoid oversized requests
    const truncatedText = pdfText.slice(0, 15000);

    let qwenResponse;
    try {
      qwenResponse = await axios.post(
        QWEN_API_URL,
        {
          model: 'qwen3.5-flash',
          messages: [
            { role: 'user', content: `${prompt}\n\nSyllabus content:\n${truncatedText}` },
          ],
          enable_thinking: false,  // disable Qwen3 thinking mode so the response is plain JSON
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.QWEN_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (err) {
      console.error('Error calling Qwen API:', err.response?.data || err.message);
      return res.status(500).json({ error: 'An error occurred while processing the syllabus. Please try again later.' });
    }

    const rawContent = qwenResponse.data.choices[0].message.content;
    // Strip markdown code fences if model wraps output in ```json ... ```
    const jsonStr = rawContent.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    const data = JSON.parse(jsonStr);
    parcedResponse = Array.isArray(data) ? data[0] : data;
    console.log('Parsed response from Qwen API:', parcedResponse);
  }
  // For now we just return the parsed response, but down the line we will want to insert this info into our database and link it to the user that uploaded it.
  const professor = parcedResponse.professor;
  const className = parcedResponse.class_name;
  const classCode = parcedResponse.class_code;
  const term = parcedResponse.term;
  const textbook = parcedResponse.textbooks;
  const uid = req.session.user.userid;
  const dayOrder = ['Su', 'M', 'T', 'W', 'Th', 'F', 'Sa'];
  try {
    const existingClassID = await db.any('SELECT classID FROM classes WHERE professor = $1 AND className = $2 AND classCode = $3 AND term = $4', [professor, className, classCode, term]);
    if(existingClassID[1]) {
      //for loop because we upload all sections to the database. We enroll the student in all sections, and they can opt out of the ones they arent in. not very elagent but will be fixed. 
      for (const classObj of existingClassID) {
        try{
          await db.none ('INSERT INTO students_to_classes(classID, userID) VALUES($1, $2)', [classObj.classid, uid]);
          console.log('Enrolled in class with ID:', classObj.classid);
        }
        catch (err) {
          console.error('Error enrolling in existing class:', err);
          return res.status(500).json({ error: 'An error occurred while enrolling in the class. Please try again later.' });
        }
        
      }
    } else {
      //we need to create all assignments, meet times, office hours, sections, and link everything together, then add student to class
      const sections = parcedResponse.sections;
      if(sections){
        for (const section of sections) {
        try {
          const newClassID = await db.one('INSERT INTO classes(className, term, section, professor, classCode, textbook) VALUES($1, $2, $3, $4, $5, $6) RETURNING classID', [className, term, section.section, professor, classCode, textbook]);
          console.log('Created class with ID:', newClassID);
          await db.none('INSERT INTO students_to_classes(classID, userID) VALUES($1, $2)', [newClassID.classid, uid]);
          console.log('Enrolled in class with ID:', newClassID);
          //adding meeting times for section
          for (const meetTime of section.meeting_times) {
            const dayStr = meetTime.day;
            const dayInts = parseDayString(dayStr);
            const startTime = meetTime['start-time'] || '00:00:00';
            const endTime = meetTime['end-time'] || '00:00:00';
            let dates; 
            if (meetTime.dates){
              dates = parseDateRange(meetTime.dates);
            }
            else {
              if (term.toLowerCase().includes('spring')) {
                dates = { startDate: `${new Date().getFullYear()}/01/01`, endDate: `${new Date().getFullYear()}/05/31` };
              } else if (term.toLowerCase().includes('summer')) {
                dates = { startDate: `${new Date().getFullYear()}/06/01`, endDate: `${new Date().getFullYear()}/08/31` };
              } else if (term.toLowerCase().includes('fall')) {
                dates = { startDate: `${new Date().getFullYear()}/09/01`, endDate: `${new Date().getFullYear()}/12/31` };
              } else {
                if (new Date().getMonth() < 5) {
                  dates = { startDate: `${new Date().getFullYear()}/01/01`, endDate: `${new Date().getFullYear()}/05/31` };
                } else if (new Date().getMonth() < 8) {
                  dates = { startDate: `${new Date().getFullYear()}/06/01`, endDate: `${new Date().getFullYear()}/08/31` };
                } else {
                  dates = { startDate: `${new Date().getFullYear()}/09/01`, endDate: `${new Date().getFullYear()}/12/31` };
                }
              }
            }
            const location = meetTime.location || 'TBD';
            const remote = meetTime.remote || false;
            const query = 'INSERT INTO meet_times(classID, dayOfTheWeek, type, startTime, endTime, startDate, endDate, location, remote) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9)';
            for (const dayInt of dayInts) {
              try{
                await db.none(query, [newClassID.classid, dayInt, "LEC", startTime, endTime, dates.startDate, dates.endDate, location, remote]);
                console.log(`Added meet time for class ${newClassID.classid} on day ${dayInt}`);
              }
              catch (err) {                
                console.error('Error adding meet time:', err);
                return res.status(500).json({ error: 'An error occurred while adding meet times. Please try again later.' });
               }
            }
            //adding assignments for section
            for (const assignment of section.assignments) {
              const assignmentName = assignment.assignment;
              const type = assignment.type;
              const repeat = assignment.repeat;
              const time = parseTime(assignment.time);
              if (repeat) {
                const dueDayStr = assignment.due_date;
                if (!dueDayStr) {
                  console.warn('Repeating assignment missing due_date, skipping:', assignmentName);
                  continue;
                }
                const dueDayInts = parseDayString(dueDayStr);
                for (const dayInt of dueDayInts) {
                  const occurances = getOccurrencesOfDay(dayInt, dates.startDate, dates.endDate);
                  for(const occurence of occurances) {
                      const dueDate = occurence;
                      try {
                        await db.none('INSERT INTO assignments(classID, name, type, repeat, dueDate, dueTime) VALUES($1, $2, $3, $4, $5, $6)', [newClassID.classid, assignmentName, type, repeat, dueDate, time]);
                        console.log(`Added repeating assignment ${assignmentName} for class ${newClassID.classid} on day ${dueDate}`); 
                      }
                      catch (err) {
                        console.error('Error adding repeating assignment:', err);
                        return res.status(500).json({ error: 'An error occurred while adding assignments. Please try again later.' });
                      }
                    }
                  }
              } else {
                const dueDate = assignment.due_date;
                try {
                  await db.none('INSERT INTO assignments(classID, name, type, repeat, dueDate, dueTime) VALUES($1, $2, $3, $4, $5, $6)', [newClassID.classid, assignmentName, type, repeat, dueDate, time]);
                  console.log(`Added one-time assignment ${assignmentName} for class ${newClassID.classid} due on ${dueDate}`);
                }
                catch (err) {
                  console.error('Error adding one-time assignment:', err);
                  return res.status(500).json({ error: 'An error occurred while adding assignments. Please try again later.' });
                }
              }
            }
          }
        }
        catch (err) {
          console.error('Error creating class and enrolling:', err);
          return res.status(500).json({ error: 'An error occurred while creating the class and enrolling. Please try again later.' });
        }
      } 
      }
    }
  } catch (err) {
    console.error('DB INSERTION ERROR!');
    res.status(400).json({ status: 'error', message: err.message });
  }
  return res.status(200).json({ status: 'success', message: 'File uploaded and processed successfully'});
});

// Create a new assignment
app.post('/assignments', auth, async (req, res) => {
  try {
    const uid = req.session.user.userid;
    const { classID, name, type, dueDate, dueTime } = req.body;

    // Verify enrollment
    const enrollment = await db.oneOrNone(
      'SELECT 1 FROM students_to_classes WHERE classID = $1 AND userID = $2',
      [classID, uid]
    );
    if (!enrollment) return res.status(403).json({ error: 'Not enrolled in this class' });

    await db.none(
      `INSERT INTO assignments (classID, name, type, dueDate, dueTime, repeat, userID)
       VALUES ($1, $2, $3, $4, $5, false, $6)`,
      [classID, name, type, dueDate || null, dueTime || null, uid]
    );

    res.json({ status: 'success' });
  } catch (err) {
    console.error('CREATE ASSIGNMENT ERROR:', err);
    res.status(500).json({ error: err.message });
  }
});

// Edit an assignment
app.put('/assignments/:id', auth, async (req, res) => {
  try {
    const uid = req.session.user.userid;
    const assignmentID = parseInt(req.params.id);
    const { name, type, dueDate, dueTime } = req.body;

    // Verify the assignment belongs to a class the user is enrolled in
    const check = await db.oneOrNone(
      `SELECT a.assignmentID FROM assignments a
       JOIN students_to_classes sc ON sc.classID = a.classID
       WHERE a.assignmentID = $1 AND sc.userID = $2`,
      [assignmentID, uid]
    );
    if (!check) return res.status(403).json({ error: 'Not authorized' });

    await db.none(
      'UPDATE assignments SET name = $1, type = $2, dueDate = $3, dueTime = $4 WHERE assignmentID = $5',
      [name, type, dueDate || null, dueTime || null, assignmentID]
    );

    res.json({ status: 'success' });
  } catch (err) {
    console.error('EDIT ASSIGNMENT ERROR:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete an assignment
app.delete('/assignments/:id', auth, async (req, res) => {
  try {
    const uid = req.session.user.userid;
    const assignmentID = parseInt(req.params.id);

    const check = await db.oneOrNone(
      `SELECT a.assignmentID FROM assignments a
       JOIN students_to_classes sc ON sc.classID = a.classID
       WHERE a.assignmentID = $1 AND sc.userID = $2`,
      [assignmentID, uid]
    );
    if (!check) return res.status(403).json({ error: 'Not authorized' });

    await db.none('DELETE FROM assignments WHERE assignmentID = $1', [assignmentID]);

    res.json({ status: 'success' });
  } catch (err) {
    console.error('DELETE ASSIGNMENT ERROR:', err);
    res.status(500).json({ error: err.message });
  }
});

// Edit class details (only fields the user can reasonably change)
app.put('/syllabi/class/:classID', auth, async (req, res) => {
  try {
    const uid = req.session.user.userid;
    const classID = parseInt(req.params.classID);
    const { className, classCode, term, professor, textbook } = req.body;

    const enrollment = await db.oneOrNone(
      'SELECT 1 FROM students_to_classes WHERE classID = $1 AND userID = $2',
      [classID, uid]
    );
    if (!enrollment) return res.status(403).json({ error: 'Not enrolled in this class' });

    await db.none(
      'UPDATE classes SET className = $1, classCode = $2, term = $3, professor = $4, textbook = $5 WHERE classID = $6',
      [className, classCode, term, professor, textbook || null, classID]
    );

    res.json({ status: 'success' });
  } catch (err) {
    console.error('EDIT CLASS ERROR:', err);
    res.status(500).json({ error: err.message });
  }
});

// Remove class from user profile (unenroll — does not delete the class record itself)
app.delete('/syllabi/class/:classID', auth, async (req, res) => {
  try {
    const uid = req.session.user.userid;
    const classID = parseInt(req.params.classID);

    await db.none(
      'DELETE FROM students_to_classes WHERE classID = $1 AND userID = $2',
      [classID, uid]
    );

    res.json({ status: 'success' });
  } catch (err) {
    console.error('REMOVE CLASS ERROR:', err);
    res.status(500).json({ error: err.message });
  }
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