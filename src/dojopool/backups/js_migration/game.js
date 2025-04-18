// Update player's location on the server
function updatePlayerLocation(position) {
  fetch("/api/update-location", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      lat: position.lat,
      lng: position.lng,
    }),
  }).catch((error) => {
    showError("Failed to update location. Please check your connection.");
  });
}

// Show success notification for coin collection
function showSuccess(message) {
  const successDiv = document.createElement("div");
  successDiv.className =
    "alert alert-success alert-dismissible fade show position-fixed bottom-0 start-50 translate-middle-x mb-3";
  successDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
  document.body.appendChild(successDiv);
  setTimeout(() => successDiv.remove(), 3000);
}

// Update score with animation
function updateScore(newScore) {
  const scoreElement = document.getElementById("player-score");
  const currentScore = parseInt(scoreElement.textContent);

  // Animate the score change
  let frame = 0;
  const frames = 20;
  const scoreIncrement = (newScore - currentScore) / frames;

  const animateScore = () => {
    frame++;
    if (frame <= frames) {
      scoreElement.textContent = Math.round(
        currentScore + scoreIncrement * frame,
      );
      requestAnimationFrame(animateScore);
    } else {
      scoreElement.textContent = newScore;
    }
  };

  animateScore();
}

// Check if player is close enough to collect coins
function checkCoinCollection(playerPos) {
  coins.forEach((coin, index) => {
    const coinPos = coin.marker.getPosition();
    const distance = google.maps.geometry.spherical.computeDistanceBetween(
      new google.maps.LatLng(playerPos.lat, playerPos.lng),
      coinPos,
    );

    if (distance <= COLLECTION_RADIUS) {
      collectCoin(coin, index);
    }
  });
}

// Update the nearby players list in the UI
function updateNearbyPlayersList(players) {
  const listContainer = document.getElementById("nearby-players-list");
  const template = document.getElementById("player-item-template");

  // Clear the current list
  listContainer.innerHTML = "";

  if (players.length === 0) {
    const emptyMessage = document.createElement("div");
    emptyMessage.className = "list-group-item text-muted";
    emptyMessage.textContent = "No players nearby";
    listContainer.appendChild(emptyMessage);
    return;
  }

  // Add each player to the list
  players.forEach((player) => {
    const playerItem = template.content.cloneNode(true);
    const container = playerItem.querySelector(".list-group-item");
    const nameSpan = container.querySelector(".player-name");
    const scoreSpan = container.querySelector(".badge");

    nameSpan.textContent = player.username;
    scoreSpan.textContent = `$${player.score}`;

    listContainer.appendChild(container);
  });
}

// Collect coin with animation
function collectCoin(coin, index) {
  // Start collection animation
  const marker = coin.marker;
  const startPos = marker.getPosition();
  const playerPos = playerMarker.getPosition();
  let frames = 0;
  const totalFrames = 30;

  const animateCollection = () => {
    frames++;
    if (frames <= totalFrames) {
      const progress = frames / totalFrames;
      const lat =
        startPos.lat() + (playerPos.lat() - startPos.lat()) * progress;
      const lng =
        startPos.lng() + (playerPos.lng() - startPos.lng()) * progress;
      marker.setPosition({ lat, lng });

      // Scale down the marker
      const scale = 1 - progress * 0.8;
      marker.setIcon({
        ...marker.getIcon(),
        scaledSize: new google.maps.Size(30 * scale, 30 * scale),
      });

      requestAnimationFrame(animateCollection);
    } else {
      // Send collection request to server after animation
      completeCollection(coin, index);
    }
  };

  animateCollection();
}

// Complete the coin collection on the server
function completeCollection(coin, index) {
  fetch("/api/collect-coin", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      coin_id: coin.id,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.status === "success") {
        coin.marker.setMap(null);
        coins.splice(index, 1);
        updateScore(data.new_score);
        showSuccess(`Collected $${coin.value} coin!`);

        // Spawn new coins if few remain
        if (coins.length < 3) {
          const playerPos = playerMarker.getPosition();
          spawnCoins({ lat: playerPos.lat(), lng: playerPos.lng() });
        }
      }
    })
    .catch((error) => {
      showError("Failed to collect coin. Please try again.");
    });
}
