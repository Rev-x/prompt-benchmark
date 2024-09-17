# Project Setup Instructions

Follow these steps to set up and run the project:

1. Clone the repository:

   ```
   git clone git@github.com:slanglabs-projects/prompt-benchmark.git
   ```
2. Install Node.js (if not already installed): the command is for mac users only windows users please navigate to the Node website and download the installation file for the given version below directly.

   ```
   brew install node
   ```
3. Verify Node.js and npm versions:

   ```
   node -v
   npm -v
   ```

   You should see version **22.5.1** for Node.js and **10.8.2** for npm.
4. Environment Variable Setup:
   Create a .env file under prompt-benchmark(root) directory using the below template:

   ```
      OPENAI_API_KEY = " " 

      FIREBASEKEY_CREDENTIALS = '<Make a new python project on firestore and get the JSON credentials from configuration and paste it here.>'

      API_BASE_URL = "http://0.0.0.0:8080"
   ```

   Now, create another .env file under client/leaderboard-app directory using the below template:

   ```
      REACT_APP_API_BASE_URL= http://0.0.0.0:8080

      REACT_APP_MIXPANEL_TOKEN = <Create a mixpanel project and paste your project token here in order to track events.>
   ```
5. Navigate to the project(root) directory and install dependencies:

   ```
   cd prompt-benchmark
   npm install
   ```
6. Initiate FastAPI services:

   ```
   python start.py
   ```
7. Install project dependencies(node modules) in Client(react) Directory:

   ```
   cd client/leaderboard-app
   npm install
   ```
8. Start the project:

   ```
   npm start
   ```

The project should now be running. Open your browser and navigate to the local server address (typically `http://localhost:3000`) to view the application.
