// ********************** Initialize server **********************************

const server = require('../index'); //TODO: Make sure the path to your index.js is correctly added

// ********************** Import Libraries ***********************************

const chai = require('chai'); // Chai HTTP provides an interface for live integration testing of the API's.
const chaiHttp = require('chai-http');
chai.should();
chai.use(chaiHttp);
const {assert, expect} = chai;

// ********************** DEFAULT WELCOME TESTCASE ****************************

describe('Server!', () => {
  // Sample test case given to test / endpoint.
  it('Returns the default welcome message', done => {
    chai
      .request(server)
      .get('/welcome')
      .end((_err, res) => {
        expect(res).to.have.status(200);
        expect(res.body.status).to.equals('success');
        assert.strictEqual(res.body.message, 'Welcome!');
        done();
      });
  });
});

// *********************** TODO: WRITE 2 UNIT TESTCASES **************************

// Positive Test Case:
// API: /register
// Input: {username: 'testuser1', password: 'testpassword'}
// Expect: res.redirectTo(/login)
// Result: This test case should pass and redirect the user to the login page.
// Explanation: The testcase will call the /register API with a valid username and password
// and expects the API to redirct the user to the login page for thier first login.

describe('Testing Register API', () => {
  it('Positive : /register - valid new user', done => {
    chai
      .request(server)
      .post('/register')
      .send({username: 'testuser1', email: 'test1@test.com', password: 'testpassword'})
      .end((_err, res) => {
        //test case changed to reflect being redirected on successful user creation.
        expect(res).to.redirectTo(/\/login$/);
        done();
      });
  });

  // Negative Test Case:
  // API: /register
  // Input: {username: 'thisusernameistoolong', password: 'testpassword'}
  // Expect: res.status == 400 and res.body.message == 'Invalid input'
  // Result: This test case should fail registration and return a status 400 along with an "Invalid input" message.
  // Explanation: The testcase will call the /register API with a username that exceeds the
  // VARCHAR(15) limit in the database schema, causing the insert to fail with invalid input.

  it('Negative : /register - username exceeds max length', done => {
    chai
      .request(server)
      .post('/register')
      .send({username: 'thisusernameistoolong', email: 'test2@test.com', password: 'testpassword'})
      .end((_err, res) => {
        expect(res).to.have.status(400);
        expect(res.body.message).to.equals('Invalid input');
        done();
      });
  });
});

// ********************************************************************************

describe('Testing Redirect', () => {
  it('test route should redirect to /login with 302 HTTP status code', done => {
    chai
      .request(server)
      .get('/test')
      .redirects(0)
      .end((_err, res) => {
        res.should.have.status(302);
        res.should.redirectTo(/\/login$/);
        done();
      });
  });
});

describe('Testing Render', () => {
  it('test "/login" route should render with an html response', done => {
    chai
      .request(server)
      .get('/login')
      .end((_err, res) => {
        res.should.have.status(200);
        res.should.be.html;
        done();
      });
  });
});

//=======  EC UNIT TESTS
describe('File Upload Tests', () => {
  let agent;

  //this user is already in the testing.sql build file.
  const testUser = {
    username: '123',
    password: '123',
  };

  before(async () => {
    agent = chai.request.agent(app);
    //logs in the agent as a pre-created test user
    await agent
      .post('/login')
      .send({ 
        username: testUser.username, 
        password: testUser.password 
      });
  });

  it('should upload a file successfully', async () => {
      const validPdfBuffer = Buffer.from('%PDF-1.7\n%test data');

      const res = await agent
          .post('/syllabi/upload')
          .attach('syllabusFile', validPdfBuffer, 'test.pdf');
    //pass for valid file buffer
      expect(res).to.have.status(200);
      expect(res.body.status).to.equal('success');
      expect(res.body.message).to.equal('File uploaded successfully');
  });

  it('should fail to upload a file if it is not a PDF', async () => {
      const invalidBuffer = Buffer.from('invalid_data');

      const res = await agent
          .post('/syllabi/upload')
          .attach('syllabusFile', invalidBuffer, 'image.jpg');

      expect(res).to.have.status(400);
      expect(res.body.error).to.equal('Uploaded file is not a valid PDF');
  });
});
//======= Non lab related unit tests