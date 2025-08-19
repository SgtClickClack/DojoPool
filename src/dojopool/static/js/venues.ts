// Types and interfaces
interface VenueFilters {
  status: string;
  sortBy: string;
}

interface Venue {
  id: number;
  name: string;
  address: string;
  images?: string[];
  average_rating: number;
  ratings_count: number;
  tables_count: number;
  hourly_rate: number;
  is_owner: boolean;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
}

// Utility functions
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>): void {
    const later = () => {
      timeout = null;
      func(...args);
    };
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

function showNotification(type: 'success' | 'error', message: string): void {
  // Implementation will be provided by external notification system
  console.log(`${type}: ${message}`);
}

// Venue list management
class VenueManager {
  private currentPage: number;
  private perPage: number;
  private filters: VenueFilters;

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

  private initializeEventListeners(): void {
    // Search input
    const searchInput = document.getElementById(
      'venueSearch'
    ) as HTMLInputElement;
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
    const statusFilter = document.getElementById(
      'statusFilter'
    ) as HTMLSelectElement;
    const sortByFilter = document.getElementById('sortBy') as HTMLSelectElement;

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
    const createForm = document.getElementById(
      'createVenueForm'
    ) as HTMLFormElement;
    if (createForm) {
      createForm.addEventListener('submit', (e) => this.handleCreateVenue(e));
    }
  }

  private async loadVenues(): Promise<void> {
    try {
      const searchInput = document.getElementById(
        'venueSearch'
      ) as HTMLInputElement;
      const searchQuery = searchInput?.value || '';
      const queryParams = new URLSearchParams({
        page: this.currentPage.toString(),
        per_page: this.perPage.toString(),
        q: searchQuery,
        ...this.filters,
      });

      const response = await fetch(`/api/venues?${queryParams}`);
      const data = (await response.json()) as PaginatedResponse<Venue>;

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

  private renderVenues(venues: Venue[]): void {
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

  private renderStars(rating: number): string {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return `
      ${'<i class="fas fa-star"></i>'.repeat(fullStars)}
      ${hasHalfStar ? '<i class="fas fa-star-half-alt"></i>' : ''}
      ${'<i class="far fa-star"></i>'.repeat(emptyStars)}
    `;
  }

  private renderPagination(data: PaginatedResponse<Venue>): void {
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

  private async handleCreateVenue(e: Event): Promise<void> {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
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
      (window as any).$('#createVenueModal').modal('hide');
      form.reset();
      this.loadVenues();
    } catch (error) {
      console.error('Error creating venue:', error);
      if (error instanceof Error) {
        showNotification('error', error.message);
      }
    }
  }

  public changePage(page: number): void {
    this.currentPage = page;
    this.loadVenues();
  }

  public editVenue(venueId: number): void {
    // Implementation will be added later
    console.log('Edit venue:', venueId);
  }
}

// Venue details management
class VenueDetailsManager {
  private venueId: number;

  constructor(venueId: number) {
    this.venueId = venueId;
    this.initializeEventListeners();
    this.initializeCalendar();
  }

  private initializeEventListeners(): void {
    const bookingForm = document.getElementById(
      'bookingForm'
    ) as HTMLFormElement;
    if (bookingForm) {
      bookingForm.addEventListener('submit', (e) => this.handleBooking(e));
    }

    // Image gallery
    const thumbnails = document.querySelectorAll('.image-thumbnails img');
    thumbnails.forEach((thumb) => {
      thumb.addEventListener('click', () => {
        const mainImage = document.querySelector(
          '.main-image img'
        ) as HTMLImageElement;
        if (mainImage && thumb instanceof HTMLImageElement) {
          mainImage.src = thumb.src;
        }
      });
    });
  }

  private initializeCalendar(): void {
    // Implementation will be added later
    console.log('Initializing calendar for venue:', this.venueId);
  }

  private async handleBooking(e: Event): Promise<void> {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
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
      if (error instanceof Error) {
        showNotification('error', error.message);
      }
    }
  }
}

// Make classes available globally
declare global {
  interface Window {
    venueManager: VenueManager;
    venueDetailsManager: VenueDetailsManager;
  }
}

// Initialize managers when document loads
document.addEventListener('DOMContentLoaded', () => {
  // Initialize venue manager if on venue list page
  const venuesGrid = document.getElementById('venuesGrid');
  if (venuesGrid) {
    window.venueManager = new VenueManager();
  }

  // Initialize venue details manager if on venue details page
  const venueDetails = document.getElementById('venueDetails');
  if (venueDetails) {
    const venueId = parseInt(venueDetails.dataset.venueId || '0', 10);
    if (venueId) {
      window.venueDetailsManager = new VenueDetailsManager(venueId);
    }
  }
});
