// Global variables
let recognition;
let synth = window.speechSynthesis;
let awaitingConfirmation = false;
let muscleGroup = '';
let conversationHistory = [];
let currentAvatarState = "listening";

const avatarStates = {
    listening: "listening.png",
    talking: "talking.png"
};

// Initialize speech recognition
function initializeSpeechAPI() {
    try {
        recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        recognition.continuous = false;

        recognition.onstart = () => {
            setAvatarState("listening");
            updateStatus("Listening...");
        };

        recognition.onend = () => {
            if (currentAvatarState === "listening" && recognition) {
                recognition.start();
            }
        };

        recognition.onerror = (event) => {
            console.error("Speech recognition error:", event.error);
            updateStatus("Error occurred. Please restart the conversation.");
        };

        recognition.onresult = async (event) => {
            const transcript = event.results[0][0].transcript.toLowerCase();
            console.log('User said:', transcript);

            if (awaitingConfirmation) {
                handleConfirmation(transcript);
            } else {
                await handleWorkoutRequest(transcript);
            }
        };
    } catch (error) {
        console.error("Speech API initialization error:", error);
        updateStatus("Speech recognition is not supported in your browser.");
    }
}

// Start the conversation
function startConversation() {
    initializeSpeechAPI();
    recognition.start();
    const welcomeMessage = "Hello! I'm your workout assistant. What muscle group would you like to work on today?";
    speak(welcomeMessage);
    updateConversationHistory("Trainer", welcomeMessage);
}

// Stop the conversation
function stopConversation() {
    if (recognition) {
        recognition.stop();
    }
    synth.cancel();
    setAvatarState("listening");
    updateStatus("Conversation stopped. Click 'Start Conversation' to begin again.");
    updateConversationHistory("System", "Conversation ended.");
}

// Clear conversation history
function clearConversationHistory() {
    const adviceDiv = document.getElementById("advice");
    if (adviceDiv) {
        adviceDiv.innerHTML = "Your instructions will appear here.";
    }
    conversationHistory = [];
}

// Speak text using Speech Synthesis
function speak(text) {
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);

    utterance.onstart = () => setAvatarState("talking");
    utterance.onend = () => setAvatarState("listening");

    try {
        synth.speak(utterance);
    } catch (error) {
        console.error("Speech synthesis error:", error);
        updateStatus("Error speaking. Please try again.");
    }
}

// Update conversation history
function updateConversationHistory(speaker, message) {
    conversationHistory.push({ speaker, message });

    const adviceDiv = document.getElementById("advice");
    if (adviceDiv) {
        const messageElement = document.createElement("p");
        messageElement.innerHTML = `<strong>${speaker}:</strong> ${message}`;
        adviceDiv.appendChild(messageElement);
        adviceDiv.scrollTop = adviceDiv.scrollHeight;
    }
}

// Update status on the page
function updateStatus(message) {
    const statusDiv = document.getElementById("status");
    if (statusDiv) {
        statusDiv.textContent = message;
    }
}

// Handle workout requests
async function handleWorkoutRequest(transcript) {
    const muscleGroups = ["chest", "back", "legs", "arms", "shoulders", "core"];
    const foundGroup = muscleGroups.find((group) => transcript.includes(group));

    if (foundGroup) {
        muscleGroup = foundGroup;
        awaitingConfirmation = true;
        const confirmMessage = `I heard you want to work on ${muscleGroup}. Is that correct? Please say yes or no.`;
        speak(confirmMessage);
        updateConversationHistory("Trainer", confirmMessage);
    } else {
        const helpMessage = "I didn't catch a specific muscle group. Please mention: chest, back, legs, arms, shoulders, or core.";
        speak(helpMessage);
        updateConversationHistory("Trainer", helpMessage);
    }
}

// Handle confirmation
async function handleConfirmation(transcript) {
    if (transcript.includes("yes")) {
        awaitingConfirmation = false;
        const processingMessage = "Great! Let me fetch some exercises for you.";
        speak(processingMessage);
        updateConversationHistory("Trainer", processingMessage);

        try {
            const response = await fetch('/api/get-exercises', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ muscleGroup }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.exercises && data.exercises.length > 0) {
                displayExercises(data.exercises);
            } else {
                speak("No exercises found for that muscle group.");
                updateConversationHistory("Trainer", "No exercises found.");
            }
        } catch (error) {
            console.error("Error fetching exercises:", error);
            speak("Sorry, I couldn't fetch exercises right now.");
            updateConversationHistory("System", "Error fetching exercises.");
        }
    } else if (transcript.includes("no")) {
        awaitingConfirmation = false;
        speak("Okay, let's try again. What muscle group would you like to work on?");
    } else {
        speak("Please say yes or no.");
    }
}

// Display exercises in a table
function displayExercises(exercises) {
    const table = document.getElementById("exerciseTable");
    if (!table) return;

    table.innerHTML = `
        <thead>
            <tr>
                <th>Exercise</th>
                <th>Equipment</th>
                <th>Target Muscle</th>
            </tr>
        </thead>
        <tbody>
            ${exercises.map(ex => `
                <tr>
                    <td>${ex.name}</td>
                    <td>${ex.equipment}</td>
                    <td>${ex.targetMuscle}</td>
                </tr>
            `).join('')}
        </tbody>
    `;

    const exerciseList = exercises.map(ex => ex.name).join(", ");
    const message = `Here are some exercises for your ${muscleGroup}: ${exerciseList}`;
    speak(message);
    updateConversationHistory("Trainer", message);
}

// Set the avatar state
function setAvatarState(state) {
    currentAvatarState = state;
    const avatarImage = document.getElementById("avatarImage");
    if (avatarImage) {
        avatarImage.src = avatarStates[state];
    }
}

// Add event listeners when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const beginConversationBtn = document.getElementById('beginConversationBtn');
    const endConversationBtn = document.getElementById('endConversationBtn');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');

    if (beginConversationBtn) {
        beginConversationBtn.addEventListener('click', startConversation);
    }
    if (endConversationBtn) {
        endConversationBtn.addEventListener('click', stopConversation);
    }
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', clearConversationHistory);
    }
});
