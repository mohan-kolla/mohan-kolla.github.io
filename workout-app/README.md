# Voice-Controlled Workout App

The **Voice-Controlled Workout App** is an interactive application designed to provide personalized workout advice, motivate users, and recommend exercises using voice commands and AI-powered conversational features.

---

## Features

### 🎤 **Voice Interaction**
- Engage with the app using **speech recognition** for a seamless hands-free experience.
- The assistant listens, confirms requests, and responds through **text-to-speech**.

### 🏋️ **Personalized Workouts**
- Get tailored exercise recommendations for muscle groups like chest, back, legs, arms, shoulders, and core.
- Exercises are fetched dynamically from the **ExerciseDB API**.

### 💬 **Motivational Interviewing**
- Encourages users to set goals and overcome challenges through motivational prompts.
- Reflective listening to engage users and help maintain consistency in their fitness journey.

### 📊 **User Assessment**
- Complete an interactive assessment to provide feedback on the app experience.
- Responses are collected and stored for further analysis.

### 🛠️ **User Profile Management**
- In-memory storage of user profiles for personalized interactions.

---

## Technologies Used

### Backend
- **Node.js**: Server runtime.
- **Express.js**: Web framework for API routes and application logic.
- **OpenAI API**: AI-based conversational interactions.
- **ExerciseDB API**: Fetches exercise recommendations.

### Frontend
- **HTML/CSS/JavaScript**: Core technologies for the interface.
- **Speech Recognition API**: For voice input.
- **Speech Synthesis API**: For voice output.

### Middleware & Utilities
- **dotenv**: Manages environment variables.
- **cors**: Configures cross-origin resource sharing.
- **axios**: Handles HTTP requests.

---

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/<your-username>/voice-controlled-workout-app.git
   cd voice-controlled-workout-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Create a `.env` file in the root directory.
   - Add the following:
     ```env
     PORT=5002
     OPENAI_API_KEY=your_openai_api_key
     RAPIDAPI_KEY=your_exercisedb_api_key
     ```

4. Run the application:
   ```bash
   npm start
   ```

5. Open your browser and navigate to:
   [http://localhost:5002](http://localhost:5002).

---

## Application Interface

Below is the HTML structure of the application’s main interface.

### `index.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Voice-Controlled Workout App</title>
  <!-- Add Bootstrap CSS -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="styles.css">
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f0f0f0;
      padding: 20px;
    }
    h1 {
      color: #2c3e50;
      font-size: 28px;
      margin-bottom: 20px;
    }
    @media (max-width: 768px) {
      h1 {
        font-size: 24px;
      }
    }
    .button-group {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-bottom: 20px;
    }
    .button-group .btn {
      flex: 1;
      min-width: 120px;
    }
    #status {
      position: absolute;
      top: 10px;
      right: 10px;
    }
    #exerciseTable {
      width: 100%;
      overflow-x: auto;
    }
    @media (max-width: 576px) {
      #exerciseTable th, #exerciseTable td {
        padding: 8px;
        font-size: 14px;
      }
    }
    #advice-container {
      position: relative;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1 class="mt-4 mb-4">Voice-Controlled Workout App</h1>
    <div class="button-group">
      <button id="beginConversationBtn" class="btn btn-success">Begin Conversation</button>
      <button id="endConversationBtn" class="btn btn-danger">End Conversation</button>
      <button id="clearHistoryBtn" class="btn btn-primary">Clear History</button>
      <button id="startAssessmentBtn" class="btn btn-info">Start Assessment</button>
    </div>

    <h2 class="mt-4">Workout Advice:</h2>
    <div id="advice-container" class="card mb-4">
      <div class="card-body d-flex align-items-center">
        <img id="avatarImage" src="listening.png" alt="Assistant Avatar" aria-label="Assistant Avatar in Listening Mode" style="width: 100px; height: auto; margin-right: 20px;">
        <div>
          <div id="status" class="badge bg-secondary" role="status" aria-live="polite">Ready</div>
          <div id="advice">Your instructions will appear here.</div>
          <div id="loader" style="display: none;">🤖 Processing...</div>
        </div>
      </div>
    </div>
    
    <h2>Exercises:</h2>
    <div class="table-responsive">
      <table id="exerciseTable" class="table table-striped">
        <!-- Table content will be dynamically added here -->
      </table>
    </div>

    <!-- Add the assessment area container -->
    <h2 class="mt-4">Assessment:</h2>
    <div id="assessmentArea" class="card p-3" aria-live="polite" role="region">
      <p class="text-muted">Complete this short assessment to help us improve the app. Respond to each question using voice commands.</p>
      <div id="assessmentContent"></div>
    </div>
  </div>

  <!-- Add Bootstrap JavaScript and Popper.js -->
  <script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.11.6/dist/umd/popper.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/js/bootstrap.min.js"></script>
  <script src="frontend.js"></script>
</body>
</html>
```

---

## API Endpoints

### `/api/create-workout` (POST)
Generates motivational responses based on user input.

### `/api/get-exercises` (POST)
Fetches exercises for a specific muscle group.

### `/api/update-challenges` (POST)
Updates the user’s challenges with reflective feedback.

### `/api/save-assessment` (POST)
Saves user assessment responses.

---

## Future Enhancements

- Integration with a database for persistent user profiles and assessment data.
- Advanced workout personalization using history and preferences.
- Integration with wearable fitness trackers for real-time data.
- UI/UX enhancements for a more engaging experience.

---

## License

This project is licensed under the MIT License. Feel free to use, modify, and distribute the application.

---

## Contributors

- **Mohan Kolla**  
  Graduate student passionate about AI-driven solutions for fitness and wellness.  
  📧 mokolla21@gmail.com

- **Javier Fernandez**  
 Graduate student

---

Feel free to contribute by submitting issues or pull requests! 😊

--- 
