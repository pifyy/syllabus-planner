# User Acceptance Testing
### Uploading the PDF and viewing the accuracy of the generated syllabus content. 
- In this test case we will use multiple different syllabi from different departments on campus to see if the user gets similar results with different syllabus formats. 
- Other students from different colleges in the university will be asked to participate and upload their syllabi from this semester’s classes. Then they will be asked to respond with how accurate their information is. 
- The testing will be done on a cloud environment that is invite only
- A couple of user acceptance testers could be my friends in other colleges. Arts & Sciences, Business, CMCI, etc.
### User data is stored and re-accessed upon login on each user account. 
- We will have a set of users (who have created accounts) upload documents and user information (email, username, password, profile picture, syllabus so that their personal calendar is complete). They will document the information that was uploaded and how it was presented to them, then they will logout. They should be able to log back in with their unique username and password and access all of their previously entered data with no discrepancies. 
- The test data will include user entered data including email, username, password, profile picture, syllabus, and their personal calendar created by the website. 
- Test environment: on a cloud environment that is invite only.
The test results should be that the user view of both their profile page and main page should be the same before and after logging out of their account. 
- User acceptance testers will be members of universities that have access to a syllabus that they can upload to the site.
- The actual results will be included upon testing in week 4
### User calendar is accurate. 
- We let users create an account, and upload their syllabi, then we instruct them to navigate to the calendar. They then test that the generated calendar is accurate to the calendar that they have. 
- The test data will be the user syllabus. 
- The test environment will be a version of the finished product running on the cloud so that it is easily accessible
- The test results will either be positive (the calendar is accurate to their personal calendar), or negative (the calendar does not look anything like their personal school calendar). 
- The user acceptance testers will be other University students. 
User Acceptance Testing Record

### Test Case 1: A user attempts to upload the PDF and viewing the accuracy of the generated syllabus content.

We had four friends from our classes upload syllabi this week. 1 Business 1 CMCI 2 Arts and Sciences. Results were a little mixed depending on the syllabus format. The business ones however came out the cleanest probably because the formatting was pretty standard, less due dates, clear date headers. The CMCI results were inaccurate due to an unconventional table format a bunch of assignments were either missing a day or shifted. Arts and sciences was in the middle. Readings and exam dates came fine but recurring information such as discussions every Friday got pulled in as a one time event instead of repeating throughout the semester. 

What the users were doing: Uploading their PDF and going through the generated content to see if it matched their syllabus.
Reasoning: They wanted to see if this would actually save them time instead of putting everything manually into their calendar.  
Was the behavior consistent with the use case? For the most part it was consistent, however one user tried to upload a word Doc which we hadn’t accounted for. Another tried to drag in two syllabi at the same time.
Deviation reasons: we hadn’t made it super clear on the upload page which files were going to break.
Changes we made: added a note on the upload page that it has to be a PDF, fixed the parser to handle table style syllabi. 

### Test Case 2: User data is stored and re-accessed upon login on each user account.

For this one we had 3 testers create accounts with the full email, username, password and upload a syllabus. They each wrote down or memorized their login then logged out and logged back in. All three were able to get back in with their credentials and the application worked as intended. 

What the users were doing: logging in and checking that their stuff was still there.
Reasoning: nobody wants to redo all that setup every time they log in.
Was the behavior consistent with the use case? Yes, this one went pretty smoothly.
Deviations: nothing major. One tester tried to log in with their email instead of their username because they forgot which one we use. Worth noting because that's probably going to keep happening.
Changes made: updated the login form to accept either email or username so people don't get stuck on that. Also added a "forgot username" link since we already had a forgot password one.

### Test Case 3: Color coded weeks by difficulty

The same testers from above uploaded their syllabus and then went to the calendar page to see how each week was color coded based on workload. The idea is that weeks with multiple exams or big projects stacked up should show up in red, and less workload heavy weeks should show up in green so users can plan ahead.  A couple testers said that the colors were not intuitive at first so we had opted for a change for green for light yellow for medium and red for heavy but one tester assumed that red meant something was overdue.

What the users were doing: scrolling through their semester on the calendar view and checking if the difficulty colors matched how stressful they actually expected each week to be.
Reasoning: they wanted to know if this would actually be useful for planning their schedule, like knowing when to pick up extra shifts at work or when to block off study time.
Was the behavior consistent with the use case? Mostly. A few testers immediately tried to click on a week to see what was making it heavy, which we hadn't built out yet.
Deviations: the difficulty algorithm was weighing everyone to the same standard (two exams per week creating a hard week) yet we didn’t account for students with only one class.
Changes made: tweaked the algorithm to weight exams and projects higher than regular assignments and different amounts of classes had different thresholds. Added a hover/click on each week that shows what's contributing to the difficulty rating. Added a colorblind-friendly mode in settings that uses patterns instead of just colors.

### Test Case 4: Office hour parsing
We had testers check if the office hours from their syllabi were getting picked up and added to their calendar correctly. This one was rougher than I expected. Office hours are written so differently across syllabi that the parser had a hard time with a lot of them. The Business syllabi were straightforward, stuff like "Office Hours: MW 2-3pm in KOBL 375" got picked up fine. But the CMCI one said something like "I'm available after class or by appointment, just shoot me an email" which obviously didn't translate into a calendar event at all.

One tester also pointed out that her professor's office hours changed mid-semester and the syllabus had both the old and new times listed with a note about when the change happens. We just grabbed the first one we saw.

What the users were doing: checking their calendar for the recurring office hour blocks and seeing if the times, locations, and which professor/TA matched what was in the syllabus.
Reasoning: they actually want to go to office hours when they need help and having it in their calendar makes them way more likely to remember and actually show up.
Was the behavior consistent with the use case? For the most part. A couple testers were confused about whether office hours were supposed to show up on the calendar at all because they didn't see them at first (turns out the parser missed them entirely on those syllabi).
Deviations: one tester tried to manually add office hours when she saw they were missing, which again is something we haven't really built an editing flow for outside of what we added in test case 3.
Changes made: improved the parser to look for TA office hours in addition to the professor's, and to handle a few more common phrasings. Added a flag that shows up if we couldn't find office hours at all so the user knows to add them manually instead of assuming the professor doesn't have any. Mid-semester changes are still tricky and we're punting on that for now since it's not super common.
