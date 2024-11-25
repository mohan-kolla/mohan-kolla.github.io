import OpenAI from "openai";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const app = express();
const port = process.env.PORT || 5000;

// Middleware setup
app.use(cors());
app.use(express.json());

// Handle directory pathing
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// User profile in-memory storage
let userProfiles = {};

// Helper function to manage memory and update user profile
const updateUserProfile = (userId, data) => {
  if (!userProfiles[userId]) {
    userProfiles[userId] = {};
  }
  userProfiles[userId] = { ...userProfiles[userId], ...data };
};

// Predefined prompt variations for motivational interviewing
const promptVariations = {
  askAboutGoalImportance: [
    "Why is this fitness goal important to you?",
    "Can you share more about why achieving this goal matters to you?",
    "What makes this goal meaningful for you?",
  ],
  askAboutChallenges: [
    "What do you think will be your biggest challenge?",
    "Can you tell me more about the obstacles you might face?",
    "What do you see as the most difficult part of reaching your goal?",
  ],
  encouragement: [
    "You're on the right track, and I can see you're committed!",
    "You're doing great, let's keep moving forward!",
    "It's great that you're making this effort. Stay focused, and we can get there together!",
  ],
};

// Utility function to pick a random variation of a prompt
const getRandomPrompt = (promptArray) => {
  const index = Math.floor(Math.random() * promptArray.length);
  return promptArray[index];
};

// Route to handle personalized workout creation with motivational interviewing
app.post("/api/create-workout", async (req, res) => {
  const { userId, fitnessGoal, userResponse } = req.body;

  if (fitnessGoal) {
    updateUserProfile(userId, { fitnessGoal });
  }

  const userProfile = userProfiles[userId] || {};
  const goal = userProfile.fitnessGoal || "get fit";
  const challenges = userProfile.challenges || "consistency";

  try {
    const importancePrompt = getRandomPrompt(promptVariations.askAboutGoalImportance);
    const challengesPrompt = getRandomPrompt(promptVariations.askAboutChallenges);
    const encouragementPrompt = getRandomPrompt(promptVariations.encouragement);

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      temperature: 0.8,
      messages: [
        {
          role: "system",
          content: `You are a personal trainer skilled in motivational interviewing and active listening. Your job is to help users create a workout plan and stay motivated.`,
        },
        { role: "user", content: `The user's goal is to ${goal}. Their main challenge is ${challenges}.` },
        { role: "assistant", content: importancePrompt },
        { role: "user", content: userResponse },
        {
          role: "assistant",
          content: `${encouragementPrompt} Let's now focus on ${goal}. ${challengesPrompt}`,
        },
      ],
    });

    const personalizedResponse = completion.data.choices[0].message.content;

    if (userResponse) {
      updateUserProfile(userId, { userResponse });
    }

    res.json({
      state: "talking", // Indicate the AI is responding
      response: personalizedResponse,
    });
  } catch (error) {
    console.error("Error creating workout:", error.message);
    res.status(500).json({ error: "Failed to process the workout program.", state: "listening" });
  }
});


// Route to get exercise suggestions based on muscle group using ExerciseDB API
app.post("/api/get-exercises", async (req, res) => {
  const { muscleGroup } = req.body;

  const options = {
    method: "GET",
    url: "https://exercisedb.p.rapidapi.com/exercises/bodyPart/" + muscleGroup,
    headers: {
      "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
      "X-RapidAPI-Host": "exercisedb.p.rapidapi.com",
    },
  };

  try {
    const response = await axios.request(options);
    const exercises = response.data;

    const formattedExercises = exercises.map((exercise) => ({
      name: exercise.name,
      equipment: exercise.equipment,
      targetMuscle: exercise.target,
    }));

    res.json({
      state: "talking", // Indicate the AI is responding with exercise suggestions
      exercises: formattedExercises,
    });
  } catch (error) {
    console.error("Error fetching exercises from ExerciseDB:", error.message);
    res.status(500).json({ error: "Failed to fetch exercises from ExerciseDB.", state: "listening" });
  }
});


// Example route for updating user challenges (reflective listening)
app.post("/api/update-challenges", async (req, res) => {
  const { userId, challengeResponse } = req.body;

  updateUserProfile(userId, { challenges: challengeResponse });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      temperature: 0.7, // Slightly higher temperature for varied responses
      messages: [
        {
          role: "system",
          content: "You are a personal trainer using motivational interviewing to understand the user's challenges.",
        },
        { role: "user", content: `The user said their main challenge is: ${challengeResponse}` },
        { role: "assistant", content: `It's really important that you're recognizing this challenge. How do you feel about finding ways to overcome it?` },
      ],
    });

    const reflectiveResponse = completion.data.choices[0].message.content;

    res.json({ response: reflectiveResponse });
  } catch (error) {
    console.error("Error updating challenges:", error.message);
    res.status(500).json({ error: "Failed to process the challenge update." });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
