# syllabus-planner
### SyllabAI
Contributors: Pierce Le (pifyy), Jaron King (jaronking427), Korah Coulter (koco2800-create), Alexander Morgan (Sepiormon), Payton Dozois (pado7343), Nathan Novankham (nano6166)
Description:
SyllabAI takes the concept of backwards planning and removes the labor from students. Backwards planning is the idea of planning out every scholastic due date and responsibility so that you can plan how to manage time by visualizing when some weeks may require more effort. This allows you to have a balanced approach to accomplishing your academic tasks and helps to avoid cramming. Typically, finding every assignment due date and entering it into a calendar takes a lot of time/effort. SyllabAI allows users to upload PDF versions of their class syllabi where our imbedded AI will parse the document for assignment and due date information and automatically load it into an on-site calendar. In this calendar you will see color coding to indicate when one week is heavier than others so that you can best plan for these challenges. What would normally take hours of hunting down syllabi, assignments, and due dates, now can be done in a matter of minutes. The AI also finds instructor office hours and compiles them in one easy-to-access spot so that you do not have to continuously hunt down this information. All of this makes it easier for students to manage their semester!

Technology Stack Used: Node.js, Express.js, Handlebars, PostgreSQL, Docker Compose, Bootstrap, JavaScript, CSS, pg-promise, express-session, bcryptjs, multer, Axios, and both the Gemini API and Qwen API for document parsing.

Prerequisites to run the application: Docker Desktop installed and running, WSL integration, Git installed, a .env file in ProjectSourceCode/ with required environment variables(
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=syllabus_planner
SESSION_SECRET=secret123), 
internet access for API feature.

Instructions on how to run the application locally: clone the repo, then from within navigate to project source folder: cd ProjectSourceCode, make sure to include a configured .env file, start the application with Docker Compose: docker compose up -d, open the app in a browser at http://localhost:3000

How to run tests: From the ProjectSourceCode directory, run the test suite using Docker Compose. The current setup runs tests as part of the container startup process before launching the app

Link to deployed app: https://syllabi.frolicking.space/
