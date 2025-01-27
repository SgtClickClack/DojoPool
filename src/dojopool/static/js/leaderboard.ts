// Generated type definitions

class LeaderboardManager {
    // Properties and methods
}

// Type imports


class LeaderboardManager {
  constructor() {
    this.currentCategory = 'overall';
    this.currentPeriod = null;
    this.initializeEventListeners();
    this.loadLeaderboard();
  }

  initializeEventListeners() {
    document.querySelectorAll('[data-bs-toggle="tab"]').forEach((tab) => {
      tab.addEventListener('shown.bs.tab', (event) => {
        const category: any = event.target.id.replace('-tab', '');
        this.currentCategory = category;
        this.loadLeaderboard();
      });
    });
  }

  async loadLeaderboard() {
    try {
      const response: any = await fetch(
        `/api/leaderboard?category=${this.currentCategory}&period=${this.currentPeriod || ''}`
      );
      const data: any = await response.json();
      this.renderLeaderboard(data);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      this.showError('Failed to load leaderboard data');
    }
  }

  renderLeaderboard(entries) {
    const tableBody: any = document.getElementById(
      `${this.currentCategory}Leaderboard`
    );
    tableBody.innerHTML = '';

    entries.forEach((entry) => {
      const row: any = document.createElement('tr');
      row.innerHTML = `
                <td class="text-center">
                    <span class="badge bg-${this.getRankBadgeColor(entry.rank)}">${entry.rank}</span>
                </td>
                <td>
                    <div class="d-flex align-items-center">
                        <img src="${entry.avatar_url}" class="rounded-circle me-2" width="32" height="32" alt="${entry.username}">
                        <a href="/users/${entry.user_id}" class="text-decoration-none">${entry.username}</a>
                    </div>
                </td>
                <td>${entry.score.toLocaleString()}</td>
                <td>${entry.win_rate}%</td>
                <td>${entry.tournaments_won}</td>
            `;
      tableBody.appendChild(row);
    });
  }

  getRankBadgeColor(rank) {
    if (rank === 1) return 'warning'; // Gold
    if (rank === 2) return 'secondary'; // Silver
    if (rank === 3) return 'danger'; // Bronze
    return 'primary';
  }

  showError(message) {
    // Create and show error toast or alert
    const alertDiv: any = document.createElement('div');
    alertDiv.className = 'alert alert-danger alert-dismissible fade show';
    alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
    document.querySelector('.container').prepend(alertDiv);
  }
}

// Initialize leaderboard when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new LeaderboardManager();
});
