// Venue list management
class VenueManager {
  constructor() {
    this.currentPage = 1;
    this.perPage = 20;
    this.filters = {
      status: '',
      sortBy: 'name',
    };
    this.initializeEventListeners();
    this.loadVenues();
  }

  initializeEventListeners() {
    // Search input
    const searchInput = document.getElementById('venueSearch');
    if (searchInput) {
      searchInput.addEventListener(
        'input',
        debounce(() => {
          this.currentPage = 1;
          this.loadVenues();
        }, 300)
      );
    }

    // Filters
    const statusFilter = document.getElementById('statusFilter');
    const sortByFilter = document.getElementById('sortBy');

    if (statusFilter) {
      statusFilter.addEventListener('change', () => {
        this.filters.status = statusFilter.value;
        this.currentPage = 1;
        this.loadVenues();
      });
    }

    if (sortByFilter) {
      sortByFilter.addEventListener('change', () => {
        this.filters.sortBy = sortByFilter.value;
        this.currentPage = 1;
        this.loadVenues();
      });
    }

    // Create venue form
    const createForm = document.getElementById('createVenueForm');
    if (createForm) {
      createForm.addEventListener('submit', (e) => this.handleCreateVenue(e));
    }
  }

  async loadVenues() {
    try {
      const searchQuery = document.getElementById('venueSearch')?.value || '';
      const queryParams = new URLSearchParams({
        page: this.currentPage,
        per_page: this.perPage,
        q: searchQuery,
        ...this.filters,
      });

      const response = await fetch(`/api/venues?${queryParams}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load venues');
      }

      this.renderVenues(data.items);
      this.renderPagination(data);
    } catch (error) {
      console.error('Error loading venues:', error);
      showNotification('error', 'Failed to load venues');
    }
  }

  renderVenues(venues) {
    const grid = document.getElementById('venuesGrid');
    if (!grid) return;

    grid.innerHTML = venues
      .map(
        (venue) => `
            <div class="venue-card">
                <div class="venue-image">
                    <img src="${venue.images?.[0] || '/static/img/default-venue.jpg'}" alt="${venue.name}">
                </div>
                <div class="venue-info">
                    <h3>${venue.name}</h3>
                    <p class="venue-address">${venue.address}</p>
                    <div class="venue-rating">
                        ${this.renderStars(venue.average_rating)}
                        <span>(${venue.ratings_count} reviews)</span>
                    </div>
                    <div class="venue-details">
                        <span><i class="fas fa-table"></i> ${venue.tables_count} tables</span>
                        <span><i class="fas fa-dollar-sign"></i> $${venue.hourly_rate}/hour</span>
                    </div>
                    <div class="venue-actions">
                        <a href="/venues/${venue.id}" class="btn btn-primary">View Details</a>
                        ${
                          venue.is_owner
                            ? `
                            <button class="btn btn-secondary" onclick="venueManager.editVenue(${venue.id})">
                                Edit
                            </button>
                        `
                            : ''
                        }
                    </div>
                </div>
            </div>
        `
      )
      .join('');
  }

  renderStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return `
            ${'<i class="fas fa-star"></i>'.repeat(fullStars)}
            ${hasHalfStar ? '<i class="fas fa-star-half-alt"></i>' : ''}
            ${'<i class="far fa-star"></i>'.repeat(emptyStars)}
        `;
  }

  renderPagination(data) {
    const pagination = document.getElementById('venuesPagination');
    if (!pagination) return;

    const totalPages = Math.ceil(data.total / this.perPage);
    let paginationHtml = '';

    if (totalPages > 1) {
      paginationHtml = `
                <button class="btn btn-secondary" 
                    ${this.currentPage === 1 ? 'disabled' : ''}
                    onclick="venueManager.changePage(${this.currentPage - 1})">
                    Previous
                </button>
                <span class="page-info">Page ${this.currentPage} of ${totalPages}</span>
                <button class="btn btn-secondary" 
                    ${this.currentPage === totalPages ? 'disabled' : ''}
                    onclick="venueManager.changePage(${this.currentPage + 1})">
                    Next
                </button>
            `;
    }

    pagination.innerHTML = paginationHtml;
  }

  async handleCreateVenue(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);

    try {
      const response = await fetch('/api/venues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(Object.fromEntries(formData)),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create venue');
      }

      showNotification('success', 'Venue created successfully');
      $('#createVenueModal').modal('hide');
      form.reset();
      this.loadVenues();
    } catch (error) {
      console.error('Error creating venue:', error);
      showNotification('error', error.message);
    }
  }

  changePage(page) {
    this.currentPage = page;
    this.loadVenues();
  }

  editVenue(venueId) {
    // Implement edit venue functionality
  }
}

// Venue details management
class VenueDetailsManager {
  constructor(venueId) {
    this.venueId = venueId;
    this.initializeEventListeners();
    this.initializeCalendar();
  }

  initializeEventListeners() {
    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
      bookingForm.addEventListener('submit', (e) => this.handleBooking(e));
    }

    // Image gallery
    const thumbnails = document.querySelectorAll('.image-thumbnails img');
    thumbnails.forEach((thumb) => {
      thumb.addEventListener('click', () => {
        const mainImage = document.querySelector('.main-image img');
        mainImage.src = thumb.src;
      });
    });
  }

  initializeCalendar() {
    // Initialize availability calendar
    const calendar = document.querySelector('.availability-calendar');
    if (calendar) {
      // Implement calendar initialization
    }
  }

  async handleBooking(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);

    try {
      const response = await fetch(`/api/venues/${this.venueId}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(Object.fromEntries(formData)),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create booking');
      }

      showNotification('success', 'Booking created successfully');
      form.reset();
    } catch (error) {
      console.error('Error creating booking:', error);
      showNotification('error', error.message);
    }
  }
}

// Utility functions
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function showNotification(type, message) {
  // Implement notification display
  console.log(`${type}: ${message}`);
}

// Initialize managers based on current page
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('venuesGrid')) {
    window.venueManager = new VenueManager();
  }

  const venueDetailsContainer = document.querySelector(
    '.venue-details-container'
  );
  if (venueDetailsContainer) {
    const venueId = venueDetailsContainer.dataset.venueId;
    window.venueDetailsManager = new VenueDetailsManager(venueId);
  }
});
