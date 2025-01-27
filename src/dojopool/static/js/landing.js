// Landing Page JavaScript

// Initialize map when the page loads
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    initParallaxEffect();
});

// Initialize the venue map
async function initMap() {
    const mapContainer = document.getElementById('venue-map');
    if (!mapContainer) return;

    try {
        // Get user's location
        const position = await getCurrentPosition();
        const { latitude, longitude } = position.coords;

        // Initialize the map (using a mapping library of your choice)
        // This is a placeholder - implement with your chosen map library
        console.log('Map would be centered at:', latitude, longitude);
    } catch (error) {
        console.error('Error initializing map:', error);
    }
}

// Get user's current position
function getCurrentPosition() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported'));
            return;
        }

        navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        });
    });
}

// Initialize parallax effect for background
function initParallaxEffect() {
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const parallaxElements = document.querySelectorAll('.hero-section, .features-section, .venue-section');

        parallaxElements.forEach(element => {
            const speed = 0.5;
            const yPos = -(scrolled * speed);
            element.style.transform = `translateY(${yPos}px)`;
        });
    });
}

// Add smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
}); 