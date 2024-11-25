// Function to fetch exercises and handle AI states
async function fetchExercisesForMuscleGroup(muscleGroup) {
    try {
      const response = await fetch("/api/get-exercises", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ muscleGroup }),
      });
  
      const data = await response.json();
  
      // Handle missing or unexpected responses
      if (!data || !data.exercises) {
        throw new Error("No exercises found");
      }
  
      // Update avatar state
      setAvatarState(data.state || "listening"); // Fallback to listening
  
      // Display exercises in a table
      displayExercisesInTable(data.exercises);
    } catch (error) {
      console.error("Error fetching exercises:", error);
      document.getElementById("advice").textContent = "An error occurred while fetching exercises.";
      setAvatarState("listening"); // Reset to listening state
    }
  }
  

  async function handleWorkoutRequest(request) {
    let extractedMuscleGroup = request.match(/(?:workout|train|exercise) my (.*)/)?.[1];
  
    if (extractedMuscleGroup) {
      muscleGroup = extractedMuscleGroup;
      updateConversationHistory("User", request);
  
      setAvatarState("talking"); // AI is processing
      const confirmation = `You want to workout your ${muscleGroup}, is that correct? Please say 'yes' or 'no'.`;
      updateConversationHistory("Trainer", confirmation);
  
      awaitingConfirmation = true;
      setAvatarState("listening"); // Return to listening
    } else if (!awaitingConfirmation) {
      updateConversationHistory("User", request);
  
      // Suggest alternative responses
      const response = `I'm sorry, I didn't catch that. Can you specify which muscle group you want to work on? For example, say "Workout my biceps."`;
      updateConversationHistory("Trainer", response);
  
      setAvatarState("listening");
    }
  }
  
  

let currentAvatarState = "listening"; // Keep track of the current state

function setAvatarState(state) {
    if (currentAvatarState === state) return; // Avoid redundant updates
  
    const avatarImage = document.getElementById("avatarImage");
    const status = document.getElementById("status");
    const loader = document.getElementById("loader");
  
    if (state === "listening") {
      avatarImage.src = "listening.png";
      avatarImage.alt = "Listening";
      status.textContent = "Listening...";
      loader.style.display = "none"; // Hide loader
    } else if (state === "talking") {
      avatarImage.src = "talking.png";
      avatarImage.alt = "Talking";
      status.textContent = "Talking...";
      loader.style.display = "block"; // Show loader
    }
  
    currentAvatarState = state; // Update the current state
  }
  

  function resetState() {
    awaitingConfirmation = false;
    muscleGroup = "";
  
    // Clear conversation history
    updateConversationHistory("Trainer", "Ready to start a new conversation!");
  
    // Clear displayed exercises
    const table = document.getElementById("exerciseTable");
    if (table) table.innerHTML = ""; // Clear table content
  
    setAvatarState("listening"); // Reset avatar state
  }
  
  
  
