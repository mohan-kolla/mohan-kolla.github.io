  function showUnderConstruction(event) {
    event.preventDefault(); // Stop the default navigation
    document.getElementById("underConstructionModal").style.display = "block";
    
    // Optionally hide the modal after a few seconds:
    setTimeout(function() {
      document.getElementById("underConstructionModal").style.display = "none";
      // Optionally, if you want to then navigate to the link, uncomment the next line:
      // window.location.href = event.currentTarget.href;
    }, 3000); // 3 seconds delay
  }