let map;
let playerMarker;
let coins = [];
let markers = [];
let currentInfoWindow = null;

const COLLECTION_RADIUS = 50; // meters
const mapThemes = {
    dark: [
        { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
        {
            featureType: "administrative.locality",
            elementType: "labels.text.fill",
            stylers: [{ color: "#d59563" }],
        },
        {
            featureType: "poi",
            elementType: "labels.text.fill",
            stylers: [{ color: "#d59563" }],
        },
        {
            featureType: "poi.park",
            elementType: "geometry",
            stylers: [{ color: "#263c3f" }],
        },
        {
            featureType: "poi.park",
            elementType: "labels.text.fill",
            stylers: [{ color: "#6b9a76" }],
        },
        {
            featureType: "road",
            elementType: "geometry",
            stylers: [{ color: "#38414e" }],
        },
        {
            featureType: "road",
            elementType: "geometry.stroke",
            stylers: [{ color: "#212a37" }],
        },
        {
            featureType: "road",
            elementType: "labels.text.fill",
            stylers: [{ color: "#9ca5b3" }],
        },
        {
            featureType: "road.highway",
            elementType: "geometry",
            stylers: [{ color: "#746855" }],
        },
        {
            featureType: "road.highway",
            elementType: "geometry.stroke",
            stylers: [{ color: "#1f2835" }],
        },
        {
            featureType: "road.highway",
            elementType: "labels.text.fill",
            stylers: [{ color: "#f3d19c" }],
        },
        {
            featureType: "transit",
            elementType: "geometry",
            stylers: [{ color: "#2f3948" }],
        },
        {
            featureType: "transit.station",
            elementType: "labels.text.fill",
            stylers: [{ color: "#d59563" }],
        },
        {
            featureType: "water",
            elementType: "geometry",
            stylers: [{ color: "#17263c" }],
        },
        {
            featureType: "water",
            elementType: "labels.text.fill",
            stylers: [{ color: "#515c6d" }],
        },
        {
            featureType: "water",
            elementType: "labels.text.stroke",
            stylers: [{ color: "#17263c" }],
        },
    ],
    retro: [
        { elementType: "geometry", stylers: [{ color: "#ebe3cd" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#523735" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#f5f1e6" }] },
    ],
    night: [
        { elementType: "geometry", stylers: [{ color: "#1d2c4d" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#8ec3b9" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#1a3646" }] },
    ]
};

// Initialize the map
function initMap() {
    console.log('Initializing map...');
    try {
        // Default center (can be updated with user's location)
        const defaultCenter = { lat: 51.5074, lng: -0.1278 }; // London coordinates
        console.log('Default center:', defaultCenter);
        
        const mapDiv = document.getElementById('map');
        console.log('Map div:', mapDiv);
        
        if (!mapDiv) {
            throw new Error('Map container not found');
        }
        
        map = new google.maps.Map(mapDiv, {
            center: defaultCenter,
            zoom: 13,
            styles: mapThemes.dark,
            mapTypeControl: true,
            streetViewControl: true,
            fullscreenControl: true
        });
        console.log('Map initialized successfully');

        // Create theme selector control
        const themeControl = document.createElement("div");
        themeControl.className = "theme-control";
        const themeSelect = document.createElement("select");
        themeSelect.className = "form-select form-select-sm";

        const themes = [
            { value: "dark", text: "Dark Theme" },
            { value: "retro", text: "Retro Theme" },
            { value: "night", text: "Night Theme" },
        ];

        themes.forEach((theme) => {
            const option = document.createElement("option");
            option.value = theme.value;
            option.text = theme.text;
            themeSelect.appendChild(option);
        });

        themeSelect.addEventListener("change", (e) => {
            const selectedTheme = e.target.value;
            map.setOptions({ styles: mapThemes[selectedTheme] });
        });

        themeControl.appendChild(themeSelect);
        map.controls[google.maps.ControlPosition.TOP_LEFT].push(themeControl);
        console.log('Theme control added');

        // Try to get user's location
        if (navigator.geolocation) {
            console.log('Getting user location...');
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    console.log('User location obtained:', position);
                    const pos = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    map.setCenter(pos);
                    // Add marker for user's location
                    new google.maps.Marker({
                        position: pos,
                        map: map,
                        icon: {
                            path: google.maps.SymbolPath.CIRCLE,
                            scale: 10,
                            fillColor: "#4285F4",
                            fillOpacity: 1,
                            strokeWeight: 2,
                            strokeColor: "#FFFFFF"
                        },
                        title: "Your Location"
                    });
                    // Load venues
                    loadVenues();
                },
                (error) => {
                    console.error('Geolocation error:', error);
                    handleLocationError(true, map.getCenter());
                }
            );
        } else {
            console.log('Geolocation not supported');
            handleLocationError(false, map.getCenter());
        }
    } catch (error) {
        console.error('Error initializing map:', error);
        showError('Failed to initialize map: ' + error.message);
    }
}

// Create player marker
function createPlayerMarker(position) {
    playerMarker = new google.maps.Marker({
        position: position,
        map: map,
        icon: {
            url: "/static/images/player-marker.png",
            scaledSize: new google.maps.Size(40, 40),
        },
        title: "You",
    });
}

// Spawn coins around the player
function spawnCoins(position) {
    fetch('/api/spawn-coins', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            center_lat: position.lat,
            center_lng: position.lng
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            data.coins.forEach(coin => {
                const marker = new google.maps.Marker({
                    position: { lat: coin.lat, lng: coin.lng },
                    map: map,
                    icon: {
                        url: `/static/images/coin-${coin.value}.png`,
                        scaledSize: new google.maps.Size(30, 30)
                    }
                });
                coins.push({ id: coin.id, marker: marker, value: coin.value });
            });
        }
    })
    .catch(error => {
        console.error('Error spawning coins:', error);
    });
}

// Handle location errors
function handleLocationError(browserHasGeolocation, pos) {
    console.log(browserHasGeolocation ?
        "Error: The Geolocation service failed." :
        "Error: Your browser doesn't support geolocation.");
}

// Show error messages
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-danger alert-dismissible fade show position-fixed bottom-0 start-50 translate-middle-x mb-3';
    errorDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 3000);
}

async function loadVenues() {
    try {
        const response = await fetch('/api/venues');
        const venues = await response.json();
        
        // Clear existing markers
        markers.forEach(marker => marker.setMap(null));
        markers = [];

        // Add markers for each venue
        venues.forEach(venue => {
            const marker = new google.maps.Marker({
                position: { lat: venue.latitude, lng: venue.longitude },
                map: map,
                icon: {
                    url: '/static/images/dojo-marker.svg',
                    scaledSize: new google.maps.Size(32, 32),
                    origin: new google.maps.Point(0, 0),
                    anchor: new google.maps.Point(16, 16)
                },
                title: venue.name
            });

            const content = `
                <div class="venue-card">
                    <h5>${venue.name}</h5>
                    <div class="venue-info">
                        <p><span class="venue-rating">★</span>${venue.rating}/5.0</p>
                        <p><span class="current-players">${venue.current_players}</span> players online</p>
                        <p>${venue.tables_count} tables available</p>
                        <p>${venue.address}</p>
                    </div>
                </div>
            `;

            const infoWindow = new google.maps.InfoWindow({
                content: content
            });

            marker.addListener('click', () => {
                if (currentInfoWindow) {
                    currentInfoWindow.close();
                }
                infoWindow.open(map, marker);
                currentInfoWindow = infoWindow;
            });

            markers.push(marker);
        });
    } catch (error) {
        console.error('Error loading venues:', error);
    }
}

// Load Google Maps API with error handling
function loadGoogleMaps() {
    console.log('Loading Google Maps API...');
    
    // First verify API key is available
    fetch('/api/v1/maps/verify-key')
        .then(response => response.json())
        .then(data => {
            if (!data.valid) {
                throw new Error(data.error || 'Invalid API key');
            }
            
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${data.key}&callback=initMap`;
            script.async = true;
            script.defer = true;
            script.onerror = (error) => {
                console.error('Failed to load Google Maps API:', error);
                showError('Failed to load Google Maps API. Please try again later.');
            };
            document.head.appendChild(script);
        })
        .catch(error => {
            console.error('API key verification failed:', error);
            showError('Failed to verify Google Maps API key. Please contact support.');
        });
}

// Error display function
function showError(message) {
    const errorDiv = document.getElementById('map-error') || createErrorDiv();
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    
    // Hide the error after 5 seconds
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

// Create error display div if it doesn't exist
function createErrorDiv() {
    const errorDiv = document.createElement('div');
    errorDiv.id = 'map-error';
    errorDiv.className = 'alert alert-danger';
    errorDiv.style.position = 'fixed';
    errorDiv.style.top = '20px';
    errorDiv.style.left = '50%';
    errorDiv.style.transform = 'translateX(-50%)';
    errorDiv.style.zIndex = '1000';
    errorDiv.style.display = 'none';
    document.body.appendChild(errorDiv);
    return errorDiv;
}

// Handle Google Maps authentication failure
function gm_authFailure() {
    console.error('Google Maps authentication failed');
    showError('Google Maps authentication failed. Please try again later.');
}

// Start loading the map
document.addEventListener('DOMContentLoaded', loadGoogleMaps);
