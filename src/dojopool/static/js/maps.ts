// Generated type definitions

class DojoMap {
  // Properties and methods
}

// Type imports
// TODO: Import types from ./components/VenueInfoWindow.js

/**
 * Maps module for handling Google Maps functionality
 */
import VenueInfoWindow from "./components/VenueInfoWindow.js";

class DojoMap {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.mapInstance = null;
    this.markers = new Map();
    this.infoWindow = new VenueInfoWindow();
    this.options = {
      center: options.center || { lat: 51.5074, lng: -0.1278 }, // Default to London
      zoom: options.zoom || 13,
      styles: options.styles || [],
      mapTypeControl: options.mapTypeControl || false,
      streetViewControl: options.streetViewControl || false,
      fullscreenControl: options.fullscreenControl || true,
      zoomControl: options.zoomControl || true,
    };
  }

  /**
   * Initialize the map
   * @returns {Promise} Resolves when map is initialized
   */
  async init() {
    try {
      const container: any = document.getElementById(this.containerId);
      if (!container) {
        throw new Error(`Map container '${this.containerId}' not found`);
      }

      // Create map instance
      this.mapInstance = new google.maps.Map(container, this.options);

      // Initialize info window
      this.infoWindow.setMap(this.mapInstance);

      // Try to get user's location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const pos: any = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            this.mapInstance.setCenter(pos);
            this.addMarker("userLocation", {
              position: pos,
              title: "Your Location",
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: "#00ff00",
                fillOpacity: 0.8,
                strokeWeight: 2,
                strokeColor: "#ffffff",
              },
            });
          },
          (error) => {
            console.warn("Geolocation failed:", error);
            this.showError("Could not get your location");
          },
        );
      }

      return this.mapInstance;
    } catch (error) {
      console.error("Map initialization error:", error);
      this.showError("Failed to initialize map");
      throw error;
    }
  }

  /**
   * Add a marker to the map
   * @param {string} id - Unique identifier for the marker
   * @param {Object} options - Marker options
   * @returns {google.maps.Marker} The created marker
   */
  addMarker(id, options) {
    try {
      const marker: any = new google.maps.Marker({
        map: this.mapInstance,
        animation: google.maps.Animation.DROP,
        ...options,
      });
      this.markers.set(id, marker);
      return marker;
    } catch (error) {
      console.error("Error adding marker:", error);
      throw error;
    }
  }

  /**
   * Remove a marker from the map
   * @param {string} id - Marker identifier
   */
  removeMarker(id) {
    const marker: any = this.markers.get(id);
    if (marker) {
      marker.setMap(null);
      this.markers.delete(id);
    }
  }

  /**
   * Clear all markers from the map
   */
  clearMarkers() {
    this.markers.forEach((marker) => marker.setMap(null));
    this.markers.clear();
  }

  /**
   * Show error message
   * @param {string} message - Error message to display
   */
  showError(message) {
    const errorContainer: any = document.getElementById("error-container");
    if (errorContainer) {
      errorContainer.textContent = message;
      errorContainer.style.display = "block";
      setTimeout(() => {
        errorContainer.style.display = "none";
      }, 5000);
    }
  }

  /**
   * Update map center and zoom
   * @param {Object} center - New center coordinates
   * @param {number} zoom - New zoom level
   */
  updateView(center, zoom) {
    if (this.mapInstance) {
      this.mapInstance.setCenter(center);
      this.mapInstance.setZoom(zoom);
    }
  }

  /**
   * Add venue markers to the map
   * @param {Array} venues - Array of venue objects
   */
  addVenues(venues) {
    venues.forEach((venue) => {
      const marker: any = this.addMarker(`venue-${venue.id}`, {
        position: { lat: venue.latitude, lng: venue.longitude },
        title: venue.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: venue.status === "active" ? "#00ff00" : "#ff0000",
          fillOpacity: 0.6,
          strokeWeight: 2,
          strokeColor: "#ffffff",
        },
      });

      // Add click listener for venue info
      marker.addListener("click", () => {
        this.infoWindow.close(); // Close any open info window
        this.infoWindow.open(marker, venue);
      });
    });
  }
}

// Export the module
export default DojoMap;
