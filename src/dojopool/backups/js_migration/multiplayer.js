let socket;
let currentRoom = null;
let activeChallenge = null;

// Initialize socket connection and event handlers
function initMultiplayer() {
  socket = io();

  socket.on("connect", () => {
    console.log("Connected to server");
    joinNearbyChat();
  });

  socket.on("user_joined", (data) => {
    addChatMessage(`${data.user} joined the area`, "system");
  });

  socket.on("new_message", (data) => {
    addChatMessage(`${data.user}: ${data.message}`);
  });

  socket.on("challenge_received", (data) => {
    if (data.challenger_id !== currentPlayerId) {
      showChallengeNotification(data);
    }
  });

  socket.on("challenge_started", (data) => {
    activeChallenge = {
      id: data.challenge_id,
      startTime: new Date(data.start_time),
      duration: data.duration,
      players: data.players,
    };
    showChallengeStarted(data);
    startChallengeTimer();
  });

  socket.on("challenge_declined", (data) => {
    if (activeChallenge && activeChallenge.id === data.challenge_id) {
      activeChallenge = null;
      showError(`${data.decliner} declined your challenge`);
    }
  });

  socket.on("score_updated", (data) => {
    if (activeChallenge && activeChallenge.id === data.challenge_id) {
      updateChallengeScore(data);
    }
  });

  socket.on("challenge_ended", (data) => {
    if (activeChallenge && activeChallenge.id === data.challenge_id) {
      showChallengeResults(data);
      activeChallenge = null;
    }
  });

  // Set up chat input handler
  const chatInput = document.getElementById("chat-input");
  const sendButton = document.getElementById("send-message");

  sendButton.addEventListener("click", () => {
    sendChatMessage();
  });

  chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      sendChatMessage();
    }
  });

  // Set up challenge button handlers
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("challenge-btn")) {
      const playerItem = e.target.closest(".list-group-item");
      const playerName = playerItem.querySelector(".player-name").textContent;
      const playerId = playerItem.dataset.playerId;
      showChallengeModal(playerName, playerId);
    }
  });

  const sendChallengeBtn = document.getElementById("send-challenge");
  sendChallengeBtn.addEventListener("click", () => {
    const playerId = document.getElementById("challenge-player-id").value;
    sendChallenge(playerId);
  });
}

// Join nearby chat room based on current location
function joinNearbyChat() {
  if (!playerMarker) return;

  const pos = playerMarker.getPosition();
  fetch("/multiplayer/api/join-chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      lat: pos.lat(),
      lng: pos.lng(),
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.status === "success") {
        currentRoom = data.room;
        addChatMessage("Joined local chat", "system");
      }
    })
    .catch((error) => {
      console.error("Error joining chat:", error);
      showError("Failed to join local chat");
    });
}

// Send chat message
function sendChatMessage() {
  const chatInput = document.getElementById("chat-input");
  const message = chatInput.value.trim();

  if (!message) return;

  fetch("/multiplayer/api/send-message", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: message,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.status === "success") {
        chatInput.value = "";
      }
    })
    .catch((error) => {
      console.error("Error sending message:", error);
      showError("Failed to send message");
    });
}

// Add message to chat container
function addChatMessage(message, type = "user") {
  const chatContainer = document.getElementById("chat-messages");
  const messageDiv = document.createElement("div");
  messageDiv.className = `chat-message ${type}-message`;
  messageDiv.textContent = message;
  chatContainer.appendChild(messageDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Show challenge modal
function showChallengeModal(playerName, playerId) {
  const modal = document.getElementById("challengeModal");
  document.getElementById("challenge-player-name").textContent = playerName;
  document.getElementById("challenge-player-id").value = playerId;
  new bootstrap.Modal(modal).show();
}

// Send challenge to nearby player
function sendChallenge(targetUserId) {
  const duration = document.getElementById("challenge-duration").value;

  fetch("/multiplayer/api/challenge-player", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      target_user_id: targetUserId,
      duration: parseInt(duration),
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.status === "success") {
        const modal = document.getElementById("challengeModal");
        bootstrap.Modal.getInstance(modal).hide();
        showSuccess("Challenge sent!");
      }
    })
    .catch((error) => {
      console.error("Error sending challenge:", error);
      showError("Failed to send challenge");
    });
}

// Show challenge notification
function showChallengeNotification(data) {
  const notification = document.createElement("div");
  notification.className =
    "alert alert-info alert-dismissible fade show position-fixed top-50 start-50 translate-middle";
  notification.innerHTML = `
        ${data.challenger} challenged you to a ${data.duration / 60} minute coin collection competition!
        <div class="mt-2">
            <button class="btn btn-sm btn-success me-2" onclick="respondToChallenge('${data.challenge_id}', true)">Accept</button>
            <button class="btn btn-sm btn-danger" onclick="respondToChallenge('${data.challenge_id}', false)">Decline</button>
        </div>
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
  document.body.appendChild(notification);
}

// Respond to challenge
function respondToChallenge(challengeId, accept) {
  fetch("/multiplayer/api/respond-to-challenge", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      challenge_id: challengeId,
      accept: accept,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.status === "success" && accept) {
        showSuccess("Challenge accepted!");
      }
    })
    .catch((error) => {
      console.error("Error responding to challenge:", error);
      showError("Failed to respond to challenge");
    });
}

// Show challenge started notification
function showChallengeStarted(data) {
  const opponent = data.players.find((p) => p.id !== currentPlayerId);
  showSuccess(
    `Challenge against ${opponent.name} started! Time remaining: ${data.duration / 60} minutes`,
  );

  // Create challenge scoreboard
  const scoreboard = document.createElement("div");
  scoreboard.id = "challenge-scoreboard";
  scoreboard.className =
    "position-fixed top-0 end-0 m-3 bg-dark p-3 rounded shadow";
  scoreboard.innerHTML = `
        <h5>Challenge Scoreboard</h5>
        <div id="challenge-timer" class="text-warning mb-2"></div>
        <div id="challenge-scores">
            ${data.players
              .map(
                (p) => `
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <span>${p.name}</span>
                    <span id="score-${p.id}">0</span>
                </div>
            `,
              )
              .join("")}
        </div>
    `;
  document.body.appendChild(scoreboard);
}

// Update challenge score
function updateChallengeScore(data) {
  const scoreElement = document.getElementById(`score-${data.player_id}`);
  if (scoreElement) {
    scoreElement.textContent = data.new_score;
  }
}

// Start challenge timer
function startChallengeTimer() {
  const timerElement = document.getElementById("challenge-timer");

  const updateTimer = () => {
    if (!activeChallenge) return;

    const now = new Date();
    const elapsed = (now - activeChallenge.startTime) / 1000;
    const remaining = activeChallenge.duration - elapsed;

    if (remaining <= 0) {
      timerElement.textContent = "Challenge ended!";
      return;
    }

    const minutes = Math.floor(remaining / 60);
    const seconds = Math.floor(remaining % 60);
    timerElement.textContent = `Time remaining: ${minutes}:${seconds.toString().padStart(2, "0")}`;

    requestAnimationFrame(updateTimer);
  };

  updateTimer();
}

// Show challenge results
function showChallengeResults(data) {
  const scoreboard = document.getElementById("challenge-scoreboard");
  if (scoreboard) {
    scoreboard.remove();
  }

  const resultsModal = document.createElement("div");
  resultsModal.className = "modal fade";
  resultsModal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Challenge Results</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <h4 class="text-center mb-4">${data.winner.name} wins!</h4>
                    <div class="final-scores">
                        ${Object.entries(data.scores)
                          .map(
                            ([id, score]) => `
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <span>${id === data.winner.id ? "👑 " : ""}${User.query.get(parseInt(id)).username}</span>
                                <span>$${score}</span>
                            </div>
                        `,
                          )
                          .join("")}
                    </div>
                </div>
            </div>
        </div>
    `;
  document.body.appendChild(resultsModal);
  new bootstrap.Modal(resultsModal).show();
}

// Initialize multiplayer features when the page loads
document.addEventListener("DOMContentLoaded", initMultiplayer);
