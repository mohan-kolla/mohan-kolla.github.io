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

// Function to initialize speech recognition
function initializeSpeechAPI() {
    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.continuous = false;

    recognition.onstart = () => {
        setAvatarState("listening");
        document.getElementById("status").textContent = "Listening...";
    };

    recognition.onend = () => {
        if (currentAvatarState === "listening") {
            recognition.start();
        }
    };

    recognition.onresult = async function(event) {
        const transcript = event.results[0][0].transcript.toLowerCase();
        console.log('You said:', transcript);
        
        if (awaitingConfirmation) {
            handleConfirmation(transcript);
        } else {
            await handleWorkoutRequest(transcript);
        }
    };
}

// Function to start conversation
function startConversation() {
    initializeSpeechAPI();
    recognition.start();
    const welcomeMessage = "Hello! I'm your workout assistant. What muscle group would you like to work on today?";
    speak(welcomeMessage);
    updateConversationHistory("Trainer", welcomeMessage);
}

// Function to stop conversation
function stopConversation() {
    if (recognition) {
        recognition.stop();
    }
    synth.cancel();
    setAvatarState("listening");
    const message = "Conversation ended. Click 'Begin Conversation' to start again.";
    updateConversationHistory("System", message);
    document.getElementById("status").textContent = "Ready";
}

// Function to clear conversation history
function clearConversationHistory() {
    const adviceDiv = document.getElementById("advice");
    if (adviceDiv) {
        adviceDiv.innerHTML = "Your instructions will appear here.";
    }
    conversationHistory = [];
}

// Function to speak text
function speak(text) {
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    utterance.onstart = () => {
        setAvatarState("talking");
    };

    utterance.onend = () => {
        setAvatarState("listening");
        if (recognition && currentAvatarState === "listening") {
            recognition.start();
        }
    };

    synth.speak(utterance);
}

// Function to update conversation history
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

// Function to handle workout requests
async function handleWorkoutRequest(transcript) {
    // Check for muscle groups in the transcript
    const muscleGroups = ["chest", "back", "legs", "arms", "shoulders", "core"];
    for (const group of muscleGroups) {
        if (transcript.includes(group)) {
            muscleGroup = group;
            const confirmMessage = `I heard you want to work on ${group}. Is that correct? Please say yes or no.`;
            speak(confirmMessage);
            updateConversationHistory("Trainer", confirmMessage);
            awaitingConfirmation = true;
            return;
        }
    }

    // If no muscle group is found
    const helpMessage = "I didn't catch a specific muscle group. Please mention which area you'd like to work on: chest, back, legs, arms, shoulders, or core.";
    speak(helpMessage);
    updateConversationHistory("Trainer", helpMessage);
}

// Function to handle confirmation
async function handleConfirmation(transcript) {
    if (transcript.includes("yes")) {
        awaitingConfirmation = false;
        const processingMessage = "Great! Let me fetch some exercises for you.";
        updateConversationHistory("Trainer", processingMessage);
        
        try {
            const response = await fetch('/api/get-exercises', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ muscleGroup }),
            });
            
            const data = await response.json();
            displayExercises(data.exercises);
            
        } catch (error) {
            console.error('Error:', error);
            updateConversationHistory("System", "Sorry, there was an error fetching exercises.");
        }
    } else if (transcript.includes("no")) {
        awaitingConfirmation = false;
        const retryMessage = "Okay, let's try again. What muscle group would you like to work on?";
        speak(retryMessage);
        updateConversationHistory("Trainer", retryMessage);
    } else {
        const clarifyMessage = "Please say 'yes' or 'no' to confirm the muscle group.";
        speak(clarifyMessage);
        updateConversationHistory("Trainer", clarifyMessage);
    }
}

// Function to display exercises
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
            ${exercises.map(exercise => `
                <tr>
                    <td>${exercise.name}</td>
                    <td>${exercise.equipment}</td>
                    <td>${exercise.targetMuscle}</td>
                </tr>
            `).join('')}
        </tbody>
    `;

    const exerciseList = exercises.map(ex => ex.name).join(", ");
    const message = `Here are some exercises for your ${muscleGroup}: ${exerciseList}`;
    speak(message);
    updateConversationHistory("Trainer", message);
}

// Function to manage avatar state
function setAvatarState(state) {
    currentAvatarState = state;
    const avatarImage = document.getElementById("avatarImage");
    if (avatarImage) {
        avatarImage.src = avatarStates[state];
        console.log(`Avatar state changed to: ${state}`);
    }
}

// Assessment functionality
function startAssessment() {
    const questions = [
        "I found the workout assistant easy to interact with.",
        "The exercise recommendations provided by the assistant were helpful.",
        "I felt engaged during my interaction with the workout assistant.",
        "I trust the workout assistant to provide accurate exercise advice.",
        "I would use this workout assistant regularly for my fitness routine."
    ];

    let currentQuestion = 0;
    const responses = {};

    // Initialize speech recognition specifically for assessment
    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.continuous = false;

    recognition.onstart = () => {
        setAvatarState("listening");
        document.getElementById("status").textContent = "Listening for assessment...";
    };

    recognition.onend = () => {
        if (currentAvatarState === "listening") {
            recognition.start();
        }
    };

    // Special handler for assessment responses
    recognition.onresult = function(event) {
        const response = event.results[0][0].transcript.toLowerCase();
        console.log('Assessment response:', response);
        updateConversationHistory("User", response);

        // Process the response
        if (response.includes("strongly agree") || 
            response.includes("agree") || 
            response.includes("neutral") || 
            response.includes("disagree") || 
            response.includes("strongly disagree")) {
            
            // Save the response
            responses[`Question ${currentQuestion + 1}`] = {
                question: questions[currentQuestion],
                answer: response
            };

            // Move to next question
            currentQuestion++;
            
            // Check if we have more questions
            if (currentQuestion < questions.length) {
                // Ask next question
                setTimeout(() => {
                    const nextQuestion = `Question ${currentQuestion + 1}: ${questions[currentQuestion]}. 
                        Please respond with Strongly Agree, Agree, Neutral, Disagree, or Strongly Disagree.`;
                    speak(nextQuestion);
                    updateConversationHistory("Trainer", nextQuestion);
                }, 1000);
            } else {
                // Assessment complete
                finishAssessment(responses);
            }
        } else {
            // Invalid response
            const message = "Please respond with one of these options: Strongly Agree, Agree, Neutral, Disagree, or Strongly Disagree.";
            speak(message);
            updateConversationHistory("Trainer", message);
        }
    };

    // Start the assessment
    recognition.start();
    const firstQuestion = `Question 1: ${questions[0]}. Please respond with Strongly Agree, Agree, Neutral, Disagree, or Strongly Disagree.`;
    speak(firstQuestion);
    updateConversationHistory("Trainer", firstQuestion);
}

function finishAssessment(responses) {
    if (recognition) {
        recognition.stop();
    }
    
    const completionMessage = "Thank you for completing the assessment!";
    speak(completionMessage);
    updateConversationHistory("Trainer", completionMessage);

    // Save assessment results
    fetch('/api/save-assessment', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ responses }),
    })
    .then(response => response.json())
    .then(data => {
        console.log('Assessment saved:', data);
    })
    .catch(error => {
        console.error('Error saving assessment:', error);
    });
}

// Add event listeners when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const beginConversationBtn = document.getElementById('beginConversationBtn');
    const endConversationBtn = document.getElementById('endConversationBtn');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    const startAssessmentBtn = document.getElementById('startAssessmentBtn');

    if (beginConversationBtn) {
        beginConversationBtn.addEventListener('click', startConversation);
    }

    if (endConversationBtn) {
        endConversationBtn.addEventListener('click', stopConversation);
    }

    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', clearConversationHistory);
    }

    if (startAssessmentBtn) {
        startAssessmentBtn.addEventListener('click', startAssessment);
    }
});
  
  
  
