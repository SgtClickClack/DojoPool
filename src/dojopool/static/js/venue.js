// Import security utilities
import {
  safeSetInnerHTML,
  createSafeTemplate,
} from '../utils/securityUtils.js';

// Venue Management JavaScript

// Toast notification system
const toastContainer = document.querySelector('.toast-container');

function showToast(message, type = 'error') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const toastTemplate = `
        <div class="toast-header">
            <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'check-circle'} ${type}"></i>
            <strong class="me-auto">${type === 'error' ? 'Error' : 'Success'}</strong>
            <button type="button" class="btn-close" onclick="this.parentElement.parentElement.remove()"></button>
        </div>
        <div class="toast-body">${message}</div>
    `;

  // Use safe template creation
  const safeToastHTML = createSafeTemplate(toastTemplate, {
    type: type === 'error' ? 'exclamation-circle' : 'check-circle',
    errorType: type === 'error' ? 'Error' : 'Success',
    message: message,
  });

  safeSetInnerHTML(toast, safeToastHTML);
  toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 5000);
}

// Loading indicator management
const loadingIndicator = document.getElementById('loading-indicator');

function showLoading() {
  if (loadingIndicator) loadingIndicator.style.display = 'block';
}

function hideLoading() {
  if (loadingIndicator) loadingIndicator.style.display = 'none';
}

// Venue check-in/check-out functionality
document.querySelectorAll('.checkin-btn').forEach((btn) => {
  btn.addEventListener('click', async function () {
    const venueId = this.dataset.venueId;
    showLoading();

    try {
      const response = await fetch(`/api/v1/venues/${venueId}/checkin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        showToast('Successfully checked in to venue', 'success');
        // Update UI to reflect check-in status
        this.classList.remove('success', 'checkin-btn');
        this.classList.add('danger', 'checkout-btn');
        this.textContent = 'Check Out';
        // Refresh venue stats if they exist
        if (typeof updateVenueStats === 'function') {
          updateVenueStats();
        }
      } else {
        showToast(data.message || 'Failed to check in');
      }
    } catch (error) {
      showToast('An error occurred while checking in');
      console.error('Check-in error:', error);
    } finally {
      hideLoading();
    }
  });
});

document.querySelectorAll('.checkout-btn').forEach((btn) => {
  btn.addEventListener('click', async function () {
    const venueId = this.dataset.venueId;
    showLoading();

    try {
      const response = await fetch(`/api/v1/venues/${venueId}/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        showToast('Successfully checked out from venue', 'success');
        // Update UI to reflect check-out status
        this.classList.remove('danger', 'checkout-btn');
        this.classList.add('success', 'checkin-btn');
        this.textContent = 'Check In';
        // Refresh venue stats if they exist
        if (typeof updateVenueStats === 'function') {
          updateVenueStats();
        }
      } else {
        showToast(data.message || 'Failed to check out');
      }
    } catch (error) {
      showToast('An error occurred while checking out');
      console.error('Check-out error:', error);
    } finally {
      hideLoading();
    }
  });
});

// Venue search and filtering
const venueSearch = document.getElementById('venue-search');
const venueFilter = document.getElementById('venue-filter');
const venueGrid = document.getElementById('venue-grid');
const noVenues = document.getElementById('no-venues');

if (venueSearch && venueFilter) {
  let searchTimeout;

  function debounceSearch(func, wait) {
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(searchTimeout);
        func(...args);
      };
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(later, wait);
    };
  }

  const performSearch = debounceSearch(async () => {
    const searchQuery = venueSearch.value;
    const filterValue = venueFilter.value;
    showLoading();

    try {
      const response = await fetch(
        `/api/v1/venues/search?q=${searchQuery}&filter=${filterValue}`
      );
      const data = await response.json();

      if (response.ok) {
        updateVenueGrid(data.venues);
      } else {
        showToast(data.message || 'Failed to search venues');
      }
    } catch (error) {
      showToast('An error occurred while searching');
      console.error('Search error:', error);
    } finally {
      hideLoading();
    }
  }, 300);

  venueSearch.addEventListener('input', performSearch);
  venueFilter.addEventListener('change', performSearch);
}

function updateVenueGrid(venues) {
  if (!venueGrid) return;

  if (venues.length === 0) {
    venueGrid.style.display = 'none';
    if (noVenues) noVenues.style.display = 'block';
    return;
  }

  venueGrid.style.display = 'grid';
  if (noVenues) noVenues.style.display = 'none';

  // Use safe template creation for venue grid
  const venuesHTML = venues
    .map((venue) => {
      const venueTemplate = `
          <div class="venue-card gaming-card">
              <div class="venue-card-header">
                  <h3>${venue.name}</h3>
                  <span class="venue-status ${venue.is_open ? 'open' : 'closed'}">
                      ${venue.is_open ? 'Open' : 'Closed'}
                  </span>
              </div>
              <div class="venue-card-body">
                  <p><i class="fas fa-map-marker-alt"></i> ${venue.address}</p>
                  <p><i class="fas fa-users"></i> ${venue.active_players} players now</p>
                  <p><i class="fas fa-table"></i> ${venue.tables} tables</p>
                  ${
                    venue.current_tournament
                      ? `
                      <p class="tournament-badge">
                          <i class="fas fa-trophy"></i> Tournament in progress
                      </p>
                  `
                      : ''
                  }
              </div>
              <div class="venue-card-footer">
                  <a href="/venues/${venue.id}" class="gaming-button">View Details</a>
                  ${
                    venue.user_checked_in
                      ? `
                      <button class="gaming-button danger checkout-btn" data-venue-id="${venue.id}">
                          Check Out
                      </button>
                  `
                      : `
                      <button class="gaming-button success checkin-btn" data-venue-id="${venue.id}">
                          Check In
                      </button>
                  `
                  }
              </div>
          </div>
      `;

      return createSafeTemplate(venueTemplate, {
        name: venue.name,
        is_open: venue.is_open,
        address: venue.address,
        active_players: venue.active_players,
        tables: venue.tables,
        current_tournament: venue.current_tournament,
        user_checked_in: venue.user_checked_in,
        id: venue.id,
      });
    })
    .join('');

  safeSetInnerHTML(venueGrid, venuesHTML);

  // Reattach event listeners
  attachVenueEventListeners();
}

function attachVenueEventListeners() {
  // Reattach check-in/check-out button listeners
  document.querySelectorAll('.checkin-btn, .checkout-btn').forEach((btn) => {
    btn.removeEventListener('click', handleCheckInOut);
    btn.addEventListener('click', handleCheckInOut);
  });
}

async function handleCheckInOut(event) {
  const btn = event.currentTarget;
  const venueId = btn.dataset.venueId;
  const isCheckIn = btn.classList.contains('checkin-btn');
  const endpoint = isCheckIn ? 'checkin' : 'checkout';

  showLoading();

  try {
    const response = await fetch(`/api/v1/venues/${venueId}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (response.ok) {
      showToast(
        `Successfully ${isCheckIn ? 'checked in to' : 'checked out from'} venue`,
        'success'
      );
      // Toggle button state
      btn.classList.toggle('success');
      btn.classList.toggle('danger');
      btn.classList.toggle('checkin-btn');
      btn.classList.toggle('checkout-btn');
      btn.textContent = isCheckIn ? 'Check Out' : 'Check In';
    } else {
      showToast(
        data.message || `Failed to ${isCheckIn ? 'check in' : 'check out'}`
      );
    }
  } catch (error) {
    showToast(
      `An error occurred while ${isCheckIn ? 'checking in' : 'checking out'}`
    );
    console.error(`${isCheckIn ? 'Check-in' : 'Check-out'} error:`, error);
  } finally {
    hideLoading();
  }
}

// Load more functionality
const loadMoreBtn = document.getElementById('load-more');
let currentPage = 1;

if (loadMoreBtn) {
  loadMoreBtn.addEventListener('click', async () => {
    showLoading();
    currentPage++;

    try {
      const searchQuery = venueSearch ? venueSearch.value : '';
      const filterValue = venueFilter ? venueFilter.value : 'all';

      const response = await fetch(
        `/api/v1/venues?page=${currentPage}&q=${searchQuery}&filter=${filterValue}`
      );
      const data = await response.json();

      if (response.ok) {
        // Append new venues to the grid
        const newVenues = data.venues
          .map((venue) => createVenueCard(venue))
          .join('');
        venueGrid.insertAdjacentHTML('beforeend', newVenues);
        attachVenueEventListeners();

        // Hide load more button if no more venues
        if (!data.has_more) {
          loadMoreBtn.style.display = 'none';
        }
      } else {
        showToast(data.message || 'Failed to load more venues');
      }
    } catch (error) {
      showToast('An error occurred while loading more venues');
      console.error('Load more error:', error);
    } finally {
      hideLoading();
    }
  });
}

function createVenueCard(venue) {
  const venueTemplate = `
        <div class="venue-card gaming-card">
            <div class="venue-card-header">
                <h3>${venue.name}</h3>
                <span class="venue-status ${venue.is_open ? 'open' : 'closed'}">
                    ${venue.is_open ? 'Open' : 'Closed'}
                </span>
            </div>
            <div class="venue-card-body">
                <p><i class="fas fa-map-marker-alt"></i> ${venue.address}</p>
                <p><i class="fas fa-users"></i> ${venue.active_players} players now</p>
                <p><i class="fas fa-table"></i> ${venue.tables} tables</p>
                ${
                  venue.current_tournament
                    ? `
                    <p class="tournament-badge">
                        <i class="fas fa-trophy"></i> Tournament in progress
                    </p>
                `
                    : ''
                }
            </div>
            <div class="venue-card-footer">
                <a href="/venues/${venue.id}" class="gaming-button">View Details</a>
                ${
                  venue.user_checked_in
                    ? `
                    <button class="gaming-button danger checkout-btn" data-venue-id="${venue.id}">
                        Check Out
                    </button>
                `
                    : `
                    <button class="gaming-button success checkin-btn" data-venue-id="${venue.id}">
                        Check In
                    </button>
                `
                }
            </div>
        </div>
    `;

  return createSafeTemplate(venueTemplate, {
    name: venue.name,
    is_open: venue.is_open,
    address: venue.address,
    active_players: venue.active_players,
    tables: venue.tables,
    current_tournament: venue.current_tournament,
    user_checked_in: venue.user_checked_in,
    id: venue.id,
  });
}
