// Generated type definitions

class VenueInfoWindow {
  // Properties and methods
}

// Type imports

/**
 * Custom info window component for displaying venue information
 */
export default class VenueInfoWindow {
  constructor() {
    this.container = document.createElement("div");
    this.container.className = "venue-info-window";
    this.content = null;
    this.isOpen = false;
    this.currentMarker = null;
    this.map = null;

    // Create styles
    const style: any = document.createElement("style");
    style.textContent = `
            .venue-info-window {
                position: absolute;
                background: rgba(0, 0, 0, 0.9);
                border: 2px solid #00ff00;
                border-radius: 8px;
                padding: 1rem;
                min-width: 250px;
                color: white;
                font-family: 'Orbitron', sans-serif;
                box-shadow: 0 0 20px rgba(0, 255, 0, 0.2);
                z-index: 1000;
                display: none;
            }

            .venue-info-window.active {
                display: block;
                animation: fadeIn 0.3s ease-out;
            }

            .venue-info-header {
                border-bottom: 1px solid #00ff00;
                padding-bottom: 0.5rem;
                margin-bottom: 1rem;
            }

            .venue-info-name {
                color: #00ff00;
                font-size: 1.2rem;
                margin: 0;
            }

            .venue-info-status {
                font-size: 0.8rem;
                color: #00ff00;
                margin-top: 0.25rem;
            }

            .venue-info-content {
                font-family: Arial, sans-serif;
            }

            .venue-info-stat {
                display: flex;
                justify-content: space-between;
                margin-bottom: 0.5rem;
            }

            .venue-info-label {
                color: #888;
            }

            .venue-info-value {
                color: #fff;
            }

            .venue-info-actions {
                display: flex;
                gap: 0.5rem;
                margin-top: 1rem;
                padding-top: 1rem;
                border-top: 1px solid rgba(0, 255, 0, 0.3);
            }

            .venue-info-button {
                background: transparent;
                border: 1px solid #00ff00;
                color: #00ff00;
                padding: 0.5rem 1rem;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.3s ease;
                flex: 1;
                font-family: 'Orbitron', sans-serif;
            }

            .venue-info-button:hover {
                background: #00ff00;
                color: black;
            }

            .venue-info-close {
                position: absolute;
                top: 0.5rem;
                right: 0.5rem;
                background: none;
                border: none;
                color: #00ff00;
                cursor: pointer;
                font-size: 1.2rem;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
            }
        `;
    document.head.appendChild(style);
  }

  setMap(map) {
    this.map = map;
    this.map.getDiv().appendChild(this.container);
  }

  open(marker, venue) {
    this.currentMarker = marker;
    this.isOpen = true;

    // Update content
    this.container.innerHTML = `
            <button class="venue-info-close">&times;</button>
            <div class="venue-info-header">
                <h3 class="venue-info-name">${venue.name}</h3>
                <div class="venue-info-status">
                    ${venue.status === "active" ? "● OPEN NOW" : "○ CLOSED"}
                </div>
            </div>
            <div class="venue-info-content">
                <div class="venue-info-stat">
                    <span class="venue-info-label">Tables Available</span>
                    <span class="venue-info-value">${venue.availableTables || "N/A"}</span>
                </div>
                <div class="venue-info-stat">
                    <span class="venue-info-label">Players Present</span>
                    <span class="venue-info-value">${venue.currentPlayers || "0"}</span>
                </div>
                <div class="venue-info-stat">
                    <span class="venue-info-label">Rating</span>
                    <span class="venue-info-value">★ ${venue.rating || "N/A"}</span>
                </div>
            </div>
            <div class="venue-info-actions">
                <button class="venue-info-button" onclick="window.location.href='/venues/${venue.id}'">
                    VIEW DETAILS
                </button>
                ${
                  venue.status === "active"
                    ? `
                    <button class="venue-info-button" onclick="window.location.href='/venues/${venue.id}/book'">
                        BOOK NOW
                    </button>
                `
                    : ""
                }
            </div>
        `;

    // Position the info window
    const point: any = this.map
      .getProjection()
      .fromLatLngToPoint(marker.getPosition());
    const containerRect: any = this.container.getBoundingClientRect();
    const mapRect: any = this.map.getDiv().getBoundingClientRect();

    this.container.style.left = `${point.x - containerRect.width / 2}px`;
    this.container.style.top = `${point.y - containerRect.height - 20}px`;
    this.container.classList.add("active");

    // Add close button handler
    this.container
      .querySelector(".venue-info-close")
      .addEventListener("click", () => this.close());

    // Close when clicking outside
    this.clickListener = this.map.addListener("click", () => this.close());
  }

  close() {
    if (this.isOpen) {
      this.container.classList.remove("active");
      this.isOpen = false;
      if (this.clickListener) {
        google.maps.event.removeListener(this.clickListener);
        this.clickListener = null;
      }
    }
  }
}
