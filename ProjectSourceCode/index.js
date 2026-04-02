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

app.use(
  bodyParser.urlencoded({
    extended: true,
  })

);

//Endpoints 

app.get('/', (req, res) => {
  res.render('./pages/index', { user: req.session.user });
});

app.get('/register', (req, res) => {
  res.render('./pages/register', { user: req.session.user });
});
app.post('/register', async (req, res) => {
  const hash = await bcrypt.hash(req.body.password, 10);
  const query = 'INSERT INTO users(username, email, password) VALUES($1, $2, $3) RETURNING *;';
  db.any(query, [req.body.username, req.body.email, hash])
    .then(() => {
      res.status(200).json({message: 'Success'});
    })
    .catch(() => {
      res.status(400).json({message: 'Invalid input'});
    });
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
const auth = (req, res, next) => {
  if (!req.session.user) {
    // Default to login page.
    return res.redirect('/login');
  }
  next();
};
app.get('/dashboard', auth, (req, res) => {
  res.render('./pages/dashboard', { user: req.session.user });
});

app.get('/syllabi', auth, (req, res) => {
  res.render('./pages/syllabi', { user: req.session.user });
});

app.get('/welcome', (req, res) => {
  res.json({status: 'success', message: 'Welcome!'});
});

app.get('/test', (_req, res) => {
  res.redirect('/login');
});

module.exports = app.listen(3000);
console.log('Server is listening on port 3000');