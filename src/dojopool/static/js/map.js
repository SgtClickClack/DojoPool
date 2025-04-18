/**
 * DojoMap class for handling Google Maps integration and venue markers
 */
export default class DojoMap {
  /**
   * Initialize a new DojoMap instance
   * @param {string} containerId - ID of the map container element
   * @param {Object} config - Map configuration object
   */
  constructor(containerId, config = {}) {
    this.containerId = containerId;
    this.mapInstance = null;
    this.markers = new Map();
    this.infoWindow = null;
    this.config = config;
    this.bounds = null;
  }

  /**
   * Initialize the map and attempt to get user location
   * @returns {Promise<void>}
   */
  async init() {
    try {
      const container = document.getElementById(this.containerId);
      if (!container) {
        throw new Error("Map container not found");
      }

      // Create map instance with configuration
      this.mapInstance = new google.maps.Map(container, {
        ...this.config,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        gestureHandling: "cooperative",
      });

      // Initialize bounds
      this.bounds = new google.maps.LatLngBounds();

      // Create info window for markers
      this.infoWindow = new google.maps.InfoWindow({
        maxWidth: 300,
      });

      // Try to get user location
      if (navigator.geolocation) {
        try {
          const position = await this.getUserLocation();
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          this.mapInstance.setCenter(pos);
          this.addUserMarker(pos);
        } catch (error) {
          console.warn("Geolocation error:", error);
          this.handleError("Could not get your location");
        }
      }
    } catch (error) {
      console.error("Map initialization error:", error);
      this.handleError("Failed to initialize map");
      throw error;
    }
  }

  /**
   * Get user's current location
   * @returns {Promise<GeolocationPosition>}
   */
  getUserLocation() {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      });
    });
  }

  /**
   * Add a marker for the user's location
   * @param {Object} position - {lat, lng} object
   */
  addUserMarker(position) {
    new google.maps.Marker({
      position: position,
      map: this.mapInstance,
      title: "Your Location",
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: "#2196F3",
        fillOpacity: 0.8,
        strokeWeight: 2,
        strokeColor: "#ffffff",
      },
    });
  }

  /**
   * Add venue markers to the map
   * @param {Array} venues - Array of venue objects
   */
  addVenues(venues) {
    try {
      venues.forEach((venue) => {
        const position = {
          lat: parseFloat(venue.latitude),
          lng: parseFloat(venue.longitude),
        };

        if (isNaN(position.lat) || isNaN(position.lng)) {
          console.warn(`Invalid coordinates for venue ${venue.id}`);
          return;
        }

        const marker = new google.maps.Marker({
          position: position,
          map: this.mapInstance,
          title: venue.name,
          animation: google.maps.Animation.DROP,
          icon: this.getMarkerIcon(venue),
        });

        // Add click listener
        marker.addListener("click", () => {
          this.showVenueInfo(marker, venue);
        });

        // Add hover effects
        marker.addListener("mouseover", () => {
          marker.setAnimation(google.maps.Animation.BOUNCE);
          setTimeout(() => marker.setAnimation(null), 750);
        });

        // Store marker reference
        this.markers.set(venue.id, marker);
        this.bounds.extend(position);
      });

      // Fit map to show all markers
      if (!this.bounds.isEmpty()) {
        this.mapInstance.fitBounds(this.bounds);
      }
    } catch (error) {
      console.error("Error adding venues:", error);
      this.handleError("Failed to add venue markers");
    }
  }

  /**
   * Get marker icon based on venue status
   * @param {Object} venue - Venue object
   * @returns {Object} Marker icon configuration
   */
  getMarkerIcon(venue) {
    const baseIcon = {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 12,
      strokeWeight: 2,
      strokeColor: "#ffffff",
    };

    switch (venue.status) {
      case "open":
        return {
          ...baseIcon,
          fillColor: "#4CAF50",
          fillOpacity: 0.8,
        };
      case "busy":
        return {
          ...baseIcon,
          fillColor: "#FFC107",
          fillOpacity: 0.8,
        };
      case "closed":
        return {
          ...baseIcon,
          fillColor: "#F44336",
          fillOpacity: 0.8,
        };
      default:
        return {
          ...baseIcon,
          fillColor: "#9E9E9E",
          fillOpacity: 0.8,
        };
    }
  }

  /**
   * Show venue information in an info window
   * @param {google.maps.Marker} marker - The marker to attach the info window to
   * @param {Object} venue - Venue object
   */
  showVenueInfo(marker, venue) {
    const content = `
            <div class="venue-info">
                <h3>${venue.name}</h3>
                <p class="status ${venue.status}">${venue.status.toUpperCase()}</p>
                <p><strong>Tables Available:</strong> ${venue.available_tables}</p>
                <p><strong>Current Players:</strong> ${venue.current_players}</p>
                <div class="venue-rating">
                    <strong>Rating:</strong> ${venue.rating} ⭐
                </div>
                <div class="venue-actions">
                    <button onclick="window.location.href='/venues/${venue.id}'">
                        View Details
                    </button>
                    <button onclick="window.location.href='/venues/${venue.id}/book'">
                        Book Now
                    </button>
                </div>
            </div>
        `;

    // Close any open info window
    if (this.infoWindow) {
      this.infoWindow.close();
    }

    // Set content and open
    this.infoWindow.setContent(content);
    this.infoWindow.open(this.mapInstance, marker);
  }

  /**
   * Handle errors by dispatching a custom event
   * @param {string} message - Error message
   */
  handleError(message) {
    const event = new CustomEvent("map-error", {
      detail: { message },
    });
    document.dispatchEvent(event);
  }
}
