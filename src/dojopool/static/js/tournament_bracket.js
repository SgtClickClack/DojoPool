import { safeSetInnerHTML } from '../utils/securityUtils.js';

class TournamentBracket {
  constructor(containerId, tournamentId) {
    this.container = document.getElementById(containerId);
    this.tournamentId = tournamentId;
    this.format = null;
    this.rounds = [];
    this.initialize();
  }

  async initialize() {
    try {
      await this.fetchBracketData();
      this.render();
    } catch (error) {
      console.error("Failed to initialize tournament bracket:", error);
      this.showError();
    }
  }

  async fetchBracketData() {
    const response = await fetch(
      `/api/v1/tournaments/${this.tournamentId}/brackets`,
    );
    if (!response.ok) {
      throw new Error("Failed to fetch bracket data");
    }
    const data = await response.json();
    this.format = data.format;
    this.rounds = Object.entries(data.brackets).sort(
      (a, b) => parseInt(a[0]) - parseInt(b[0]),
    );
  }

  render() {
    this.container.innerHTML = "";

    const bracketContainer = document.createElement("div");
    bracketContainer.className = "tournament-bracket__container";

    // Create rounds
    this.rounds.forEach(([roundNum, matches], roundIndex) => {
      const round = document.createElement("div");
      round.className = "tournament-bracket__round";
      round.dataset.round = roundNum;

      // Add round header
      const roundHeader = document.createElement("div");
      roundHeader.className = "tournament-bracket__round-header";
      roundHeader.textContent = this.getRoundName(roundNum, roundIndex);
      round.appendChild(roundHeader);

      // Create matches
      matches.forEach((match) => {
        const matchElement = this.createMatchElement(match);
        round.appendChild(matchElement);
      });

      bracketContainer.appendChild(round);
    });

    this.container.appendChild(bracketContainer);
    this.addConnectors();
  }

  createMatchElement(match) {
    const matchContainer = document.createElement("div");
    matchContainer.className = "tournament-bracket__match";
    matchContainer.dataset.matchId = match.id;

    const matchContent = document.createElement("div");
    matchContent.className = "tournament-bracket__match-content";

    // Player 1
    const player1 = document.createElement("div");
    player1.className = `tournament-bracket__player ${match.winner_id === match.player1_id ? "winner" : ""}`;
    const player1HTML = `
            <div class="tournament-bracket__player-info">
                <img src="${match.player1?.avatar_url || "/static/img/default-avatar.png"}" 
                     class="tournament-bracket__player-avatar" alt="">
                <span class="tournament-bracket__player-name">
                    ${match.player1?.username || "TBD"}
                </span>
            </div>
            <span class="tournament-bracket__player-score">${match.player1_score || "-"}</span>
        `;
    safeSetInnerHTML(player1, player1HTML);

    // Player 2
    const player2 = document.createElement("div");
    player2.className = `tournament-bracket__player ${match.winner_id === match.player2_id ? "winner" : ""}`;
    const player2HTML = `
            <div class="tournament-bracket__player-info">
                <img src="${match.player2?.avatar_url || "/static/img/default-avatar.png"}" 
                     class="tournament-bracket__player-avatar" alt="">
                <span class="tournament-bracket__player-name">
                    ${match.player2?.username || "TBD"}
                </span>
            </div>
            <span class="tournament-bracket__player-score">${match.player2_score || "-"}</span>
        `;
    safeSetInnerHTML(player2, player2HTML);

    matchContent.appendChild(player1);
    matchContent.appendChild(player2);
    matchContainer.appendChild(matchContent);

    // Add match status indicator
    const statusBadge = document.createElement("div");
    statusBadge.className = `tournament-bracket__match-status badge bg-${this.getStatusColor(match.status)}`;
    statusBadge.textContent = match.status;
    matchContainer.appendChild(statusBadge);

    // Add click handler for match updates if the match is ready
    if (match.status === "pending" && match.player1 && match.player2) {
      matchContainer.addEventListener("click", () =>
        this.handleMatchClick(match),
      );
    }

    return matchContainer;
  }

  addConnectors() {
    const rounds = this.container.querySelectorAll(
      ".tournament-bracket__round",
    );
    rounds.forEach((round, index) => {
      if (index < rounds.length - 1) {
        const matches = round.querySelectorAll(".tournament-bracket__match");
        matches.forEach((match, matchIndex) => {
          const connector = document.createElement("div");
          connector.className = "tournament-bracket__connector";
          match.appendChild(connector);
        });
      }
    });
  }

  getRoundName(roundNum, roundIndex) {
    const totalRounds = this.rounds.length;
    if (parseInt(roundNum) < 0) {
      return `Losers Round ${Math.abs(roundNum)}`;
    }

    switch (totalRounds - roundIndex) {
      case 1:
        return "Finals";
      case 2:
        return "Semi-Finals";
      case 3:
        return "Quarter-Finals";
      default:
        return `Round ${roundNum}`;
    }
  }

  getStatusColor(status) {
    switch (status) {
      case "pending":
        return "secondary";
      case "in_progress":
        return "primary";
      case "completed":
        return "success";
      case "cancelled":
        return "danger";
      default:
        return "secondary";
    }
  }

  handleMatchClick(match) {
    // Show match result modal
    const modal = document.getElementById("matchResultModal");
    if (modal) {
      const modalInstance = new bootstrap.Modal(modal);

      // Update modal content
      modal.querySelector(".player1-name").textContent = match.player1.username;
      modal.querySelector(".player2-name").textContent = match.player2.username;
      modal.querySelector(".player1-info img").src = match.player1.avatar_url;
      modal.querySelector(".player2-info img").src = match.player2.avatar_url;

      // Update form action
      const form = modal.querySelector("#matchResultForm");
      form.action = `/api/v1/tournaments/${this.tournamentId}/matches/${match.id}`;

      modalInstance.show();
    }
  }

  showError() {
    const errorHTML = `
            <div class="alert alert-danger" role="alert">
                Failed to load tournament bracket. Please try again later.
            </div>
        `;
    safeSetInnerHTML(this.container, errorHTML);
  }
}

// Initialize tournament bracket
document.addEventListener("DOMContentLoaded", function () {
  const bracketContainer = document.getElementById("tournamentBracket");
  if (bracketContainer) {
    const tournamentId = bracketContainer.dataset.tournamentId;
    new TournamentBracket("tournamentBracket", tournamentId);
  }
});
