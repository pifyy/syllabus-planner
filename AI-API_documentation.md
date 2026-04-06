# AI-Implementation
A quick documentation writeup of how the AI-API works in this project, so we can test and build features for other components. 
## API Steps
1. User uploads document to the website
2. Request is sent to the index.js api using the [multer middleware](https://expressjs.com/en/resources/middleware/multer.html) (extension of express.js)
3. Uploaded file is converted to raw text and then sent to the AI provider for computation
4. Response is returned in a JSON format. We parce the response, then append to database.
5. User gets syllabus data from the database.
## API response
An example class with a well structured syllabus. 
```json
{
  "professor": "Donald Wilkerson",
  "class_code": "PHYS 3050",
  "office_hours": "M, W, F before 2:00 (by arrangement); T, TH brief Zoom meetings before 11:00 (sometimes available)",
  "location": "Zoom or Duane F-437",
  "meeting_times": "TTh 11:00-12:15",
  "textbooks": [
    "Scientific Writing and Communication: Papers, Proposals and Presentations by Angelika Hofmann"
  ],
  "assignments": [
    {
      "assignment": "Mid Term Performance Grade (Ungraded assignments, Brainstorming/Prospectus Worksheets, participation)",
      "due_date": "03/02/2026",
      "repeat" : false
    },
    {
      "assignment": "Personal Statement (2-3 pages)",
      "due_date": "03/07/2026",
      "repeat" : false
    },
    {
      "assignment": "Detailed Reader Report on a peer's final project",
      "due_date": "04/25/2026",
      "repeat" : false
    },
    {
      "assignment": "Power Point Presentation (10-12 minutes)",
      "due_date": "04/14/2026",
      "repeat" : false
    },
    {
      "assignment": "Final Term Project (10-15 pages)",
      "due_date": "04/27/2026",
      "repeat" : false
    }
  ]
}
```
- To parse some of this data REGEX may need to be implemented. Specifically with gathering the weekday codes (MTWThF), and extracting essential information from woridier sections. 
- We may also consider adding a page to the website where the student can input their class section as some sections have different meet times.
## Adding to Database (Should discuss before fully implementing, as this may not be the best approach)
There should be 3 main databases:
- User Database (Student Database)
  - Contains username, email, password
- Class Database
  - Contains the top level of the data of the json response (Professor, class code, meet time, location, etc)
- Assignment Database
  - Contains every assignment of every class on the website (Assignment, due date)
With these three databases we can connect the user to the class database to manage all of their semester's classes. Then we can connect the class to the assignment database so each class can display its assignments.

