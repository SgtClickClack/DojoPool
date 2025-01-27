// Generated type definitions

function updatePlayerLocation(position: any): any {
    // Implementation
}

function showSuccess(message: any): any {
    // Implementation
}

function updateScore(newScore: any): any {
    // Implementation
}

function checkCoinCollection(playerPos: any): any {
    // Implementation
}

function updateNearbyPlayersList(players: any): any {
    // Implementation
}

function collectCoin(coin: any, index: any): any {
    // Implementation
}

function completeCollection(coin: any, index: any): any {
    // Implementation
}

// Type imports


// Update player's location on the server
function updatePlayerLocation(position: any): any {
  fetch('/api/update-location', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      lat: position.lat,
      lng: position.lng,
    }),
  }).catch((error) => {
    showError('Failed to update location. Please check your connection.');
  });
}

// Show success notification for coin collection
function showSuccess(message: any): any {
  const successDiv: any = document.createElement('div');
  successDiv.className =
    'alert alert-success alert-dismissible fade show position-fixed bottom-0 start-50 translate-middle-x mb-3';
  successDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
  document.body.appendChild(successDiv);
  setTimeout(() => successDiv.remove(), 3000);
}

// Update score with animation
function updateScore(newScore: any): any {
  const scoreElement: any = document.getElementById('player-score');
  const currentScore: any = parseInt(scoreElement.textContent);

  // Animate the score change
  let frame = 0;
  const frames: any = 20;
  const scoreIncrement: any = (newScore - currentScore) / frames;

  const animateScore: any = () => {
    frame++;
    if (frame <= frames) {
      scoreElement.textContent = Math.round(
        currentScore + scoreIncrement * frame
      );
      requestAnimationFrame(animateScore);
    } else {
      scoreElement.textContent = newScore;
    }
  };

  animateScore();
}

// Check if player is close enough to collect coins
function checkCoinCollection(playerPos: any): any {
  coins.forEach((coin, index) => {
    const coinPos: any = coin.marker.getPosition();
    const distance: any = google.maps.geometry.spherical.computeDistanceBetween(
      new google.maps.LatLng(playerPos.lat, playerPos.lng),
      coinPos
    );

    if (distance <= COLLECTION_RADIUS) {
      collectCoin(coin, index);
    }
  });
}

// Update the nearby players list in the UI
function updateNearbyPlayersList(players: any): any {
  const listContainer: any = document.getElementById('nearby-players-list');
  const template: any = document.getElementById('player-item-template');

  // Clear the current list
  listContainer.innerHTML = '';

  if (players.length === 0) {
    const emptyMessage: any = document.createElement('div');
    emptyMessage.className = 'list-group-item text-muted';
    emptyMessage.textContent = 'No players nearby';
    listContainer.appendChild(emptyMessage);
    return;
  }

  // Add each player to the list
  players.forEach((player) => {
    const playerItem: any = template.content.cloneNode(true);
    const container: any = playerItem.querySelector('.list-group-item');
    const nameSpan: any = container.querySelector('.player-name');
    const scoreSpan: any = container.querySelector('.badge');

    nameSpan.textContent = player.username;
    scoreSpan.textContent = `$${player.score}`;

    listContainer.appendChild(container);
  });
}

// Collect coin with animation
function collectCoin(coin, index) {
  // Start collection animation
  const marker: any = coin.marker;
  const startPos: any = marker.getPosition();
  const playerPos: any = playerMarker.getPosition();
  let frames = 0;
  const totalFrames: any = 30;

  const animateCollection: any = () => {
    frames++;
    if (frames <= totalFrames) {
      const progress: any = frames / totalFrames;
      const lat: any =
        startPos.lat() + (playerPos.lat() - startPos.lat()) * progress;
      const lng: any =
        startPos.lng() + (playerPos.lng() - startPos.lng()) * progress;
      marker.setPosition({ lat, lng });

      // Scale down the marker
      const scale: any = 1 - progress * 0.8;
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
  fetch('/api/collect-coin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      coin_id: coin.id,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.status === 'success') {
        coin.marker.setMap(null);
        coins.splice(index, 1);
        updateScore(data.new_score);
        showSuccess(`Collected $${coin.value} coin!`);

        // Spawn new coins if few remain
        if (coins.length < 3) {
          const playerPos: any = playerMarker.getPosition();
          spawnCoins({ lat: playerPos.lat(), lng: playerPos.lng() });
        }
      }
    })
    .catch((error) => {
      showError('Failed to collect coin. Please try again.');
    });
}
