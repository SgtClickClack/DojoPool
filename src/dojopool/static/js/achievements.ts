// Generated type definitions

function loadAchievements(): any {
    // Implementation
}

function loadLeaderboard(): any {
    // Implementation
}

function updateAchievementStats(achievements: any): any {
    // Implementation
}

function renderAchievementList(container: any, achievements: any, filter: any): any {
    // Implementation
}

function filterAchievementsByType(achievements: any, filter: any): any {
    // Implementation
}

function createAchievementCard(achievement: any): any {
    // Implementation
}

function renderLeaderboard(leaderboard: any): any {
    // Implementation
}

function showAchievementDetails(achievement: any): any {
    // Implementation
}

function showError(message: any): any {
    // Implementation
}

// Type imports


document.addEventListener('DOMContentLoaded', function () {
  const achievementLists: any = document.querySelectorAll('.achievement-list');
  const leaderboardList: any = document.querySelector('.leaderboard-list');
  const achievementDetailsModal: any = new bootstrap.Modal(
    document.getElementById('achievementDetailsModal')
  );

  // Load achievements and leaderboard
  loadAchievements();
  loadLeaderboard();

  // Achievement list filtering
  document.querySelectorAll('[data-bs-toggle="pill"]').forEach((tab) => {
    tab.addEventListener('shown.bs.tab', function (e) {
      const filter: any = e.target.getAttribute('data-bs-target').replace('#', '');
      filterAchievements(filter);
    });
  });

  async function loadAchievements(): any {
    try {
      const response: any = await fetch('/api/v1/achievements');
      const data: any = await response.json();

      // Update achievement stats
      updateAchievementStats(data.achievements);

      // Render achievement lists
      achievementLists.forEach((list) => {
        const filter: any = list.getAttribute('data-filter');
        renderAchievementList(list, data.achievements, filter);
      });
    } catch (error) {
      console.error('Failed to load achievements:', error);
      showError('Failed to load achievements. Please try again later.');
    }
  }

  async function loadLeaderboard(): any {
    try {
      const response: any = await fetch('/api/v1/achievements/leaderboard');
      const data: any = await response.json();
      renderLeaderboard(data.leaderboard);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
      showError('Failed to load leaderboard. Please try again later.');
    }
  }

  function updateAchievementStats(achievements: any): any {
    const totalPoints: any = achievements.reduce(
      (sum, a) => sum + (a.completed ? a.points : 0),
      0
    );
    const completedCount: any = achievements.filter((a) => a.completed).length;
    const inProgressCount: any = achievements.filter(
      (a) => !a.completed && a.progress > 0
    ).length;

    document.querySelector('.total-points').textContent = totalPoints;
    document.querySelector('.completed-count').textContent = completedCount;
    document.querySelector('.in-progress-count').textContent = inProgressCount;
  }

  function renderAchievementList(container, achievements, filter) {
    // Filter achievements based on the selected tab
    const filteredAchievements: any = filterAchievementsByType(achievements, filter);

    // Clear loading spinner
    container.innerHTML = '';

    if (filteredAchievements.length === 0) {
      container.innerHTML = `
                <div class="text-center py-5">
                    <p class="text-muted mb-0">No achievements found</p>
                </div>
            `;
      return;
    }

    // Create achievement cards
    filteredAchievements.forEach((achievement) => {
      const card: any = createAchievementCard(achievement);
      container.appendChild(card);

      // Add click handler for achievement details
      card.addEventListener('click', () => showAchievementDetails(achievement));
    });
  }

  function filterAchievementsByType(achievements, filter) {
    switch (filter) {
      case 'completed':
        return achievements.filter((a) => a.completed);
      case 'in_progress':
        return achievements.filter((a) => !a.completed && a.progress > 0);
      default:
        return achievements;
    }
  }

  function createAchievementCard(achievement: any): any {
    const progress: any = achievement.target_value
      ? (achievement.progress / achievement.target_value) * 100
      : 0;
    const card: any = document.createElement('div');
    card.className =
      'achievement-card mb-3 p-3 bg-light rounded cursor-pointer';

    card.innerHTML = `
            <div class="d-flex align-items-center">
                <img src="${achievement.icon_url || '/static/img/default-achievement.png'}" 
                     class="achievement-icon me-3" width="48" height="48" alt="">
                <div class="flex-grow-1">
                    <h5 class="mb-1">${achievement.name}</h5>
                    <p class="text-muted mb-2 small">${achievement.description}</p>
                    <div class="progress" style="height: 6px;">
                        <div class="progress-bar ${achievement.completed ? 'bg-success' : ''}" 
                             role="progressbar" 
                             style="width: ${progress}%"></div>
                    </div>
                    <div class="d-flex justify-content-between align-items-center mt-2">
                        <small class="text-muted">${achievement.progress} / ${achievement.target_value}</small>
                        <span class="badge bg-primary">${achievement.points} points</span>
                    </div>
                </div>
                ${achievement.completed ? '<i class="bi bi-check-circle-fill text-success ms-3"></i>' : ''}
            </div>
        `;

    return card;
  }

  function renderLeaderboard(leaderboard: any): any {
    leaderboardList.innerHTML = '';

    if (leaderboard.length === 0) {
      leaderboardList.innerHTML = `
                <div class="text-center py-5">
                    <p class="text-muted mb-0">No leaderboard data available</p>
                </div>
            `;
      return;
    }

    leaderboard.forEach((entry, index) => {
      const item: any = document.createElement('div');
      item.className =
        'leaderboard-item d-flex align-items-center p-3 border-bottom';

      item.innerHTML = `
                <div class="position-indicator me-3 ${index < 3 ? 'text-warning' : 'text-muted'}">
                    ${index + 1}
                </div>
                <div class="user-info flex-grow-1">
                    <div class="d-flex align-items-center">
                        <img src="${entry.user_avatar || '/static/img/default-avatar.png'}" 
                             class="rounded-circle me-2" width="32" height="32" alt="">
                        <span class="username">${entry.username || 'Anonymous'}</span>
                    </div>
                </div>
                <div class="points-info text-end">
                    <span class="badge bg-primary">${entry.points} points</span>
                </div>
            `;

      leaderboardList.appendChild(item);
    });
  }

  function showAchievementDetails(achievement: any): any {
    const modal: any = document.getElementById('achievementDetailsModal');
    const progress: any = achievement.target_value
      ? (achievement.progress / achievement.target_value) * 100
      : 0;

    // Update modal content
    modal.querySelector('.achievement-icon').src =
      achievement.icon_url || '/static/img/default-achievement.png';
    modal.querySelector('.achievement-name').textContent = achievement.name;
    modal.querySelector('.achievement-description').textContent =
      achievement.description;
    modal.querySelector('.progress-value').textContent =
      `${achievement.progress} / ${achievement.target_value}`;
    modal.querySelector('.progress-bar').style.width = `${progress}%`;
    modal.querySelector('.achievement-points').textContent =
      `${achievement.points} points`;
    modal.querySelector('.achievement-completed-date').textContent =
      achievement.completed_at
        ? new Date(achievement.completed_at).toLocaleDateString()
        : 'Not completed';

    // Add share button if achievement is completed
    const shareContainer: any = modal.querySelector('.share-container');
    if (achievement.completed) {
      if (!shareContainer.querySelector('.share-button')) {
        new ShareButton(shareContainer, {
          type: 'achievement',
          id: achievement.id,
          buttonClass: 'btn-outline-primary btn-sm',
          buttonText: 'Share Achievement',
          onShare: () => {
            // Track sharing analytics or trigger other actions
            console.log('Achievement shared:', achievement.name);
          },
        });
      }
    } else {
      shareContainer.innerHTML = '';
    }

    achievementDetailsModal.show();
  }

  function showError(message: any): any {
    const errorAlert: any = document.createElement('div');
    errorAlert.className = 'alert alert-danger alert-dismissible fade show';
    errorAlert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

    document
      .querySelector('.container')
      .insertBefore(errorAlert, document.querySelector('.row'));
  }
});
