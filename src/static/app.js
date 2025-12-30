document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message and reset activity select
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        // Add participants list (unstyled) with remove buttons
        const participantsHeader = document.createElement("p");
        participantsHeader.innerHTML = "<strong>Participants:</strong>";

        const participantsListEl = document.createElement("ul");
        participantsListEl.className = "participants-list";
        participantsListEl.setAttribute("aria-label", `Participants for ${name}`);
        participantsListEl.style.paddingLeft = "0";

        if (details.participants && details.participants.length > 0) {
          details.participants.forEach((p) => {
            const li = document.createElement("li");

            const span = document.createElement("span");
            span.className = "participant-email";
            span.textContent = p;

            const removeBtn = document.createElement("button");
            removeBtn.className = "participant-remove";
            removeBtn.title = `Unregister ${p}`;
            removeBtn.setAttribute("aria-label", `Unregister ${p}`);
            removeBtn.innerHTML = "✖";

            removeBtn.addEventListener("click", async (e) => {
              e.preventDefault();
              if (!confirm(`Are you sure you want to unregister ${p} from ${name}?`)) {
                return;
              }
              try {
                const res = await fetch(`/activities/${encodeURIComponent(name)}/unregister?email=${encodeURIComponent(p)}`, { method: "DELETE" });
                const data = await res.json();
                if (res.ok) {
                  messageDiv.textContent = data.message;
                  messageDiv.className = "success";
                  messageDiv.classList.remove("hidden");
                  // Refresh activities and reset message after a delay
                  fetchActivities();
                  setTimeout(() => messageDiv.classList.add("hidden"), 4000);
                } else {
                  messageDiv.textContent = data.detail || "Failed to unregister participant";
                  messageDiv.className = "error";
                  messageDiv.classList.remove("hidden");
                }
              } catch (error) {
                messageDiv.textContent = "Failed to unregister. Please try again.";
                messageDiv.className = "error";
                messageDiv.classList.remove("hidden");
                console.error("Error unregistering participant:", error);
              }
            });

            li.appendChild(span);
            li.appendChild(removeBtn);
            participantsListEl.appendChild(li);
          });
        } else {
          const li = document.createElement("li");
          li.textContent = "No participants yet";
          participantsListEl.appendChild(li);
        }

        activityCard.appendChild(participantsHeader);
        activityCard.appendChild(participantsListEl);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities list to show the newly registered participant
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
