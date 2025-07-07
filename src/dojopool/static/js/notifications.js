/**
 * Notification handler for real-time notifications
 */

// Import security utilities
import { safeSetInnerHTML, createSafeTemplate } from '../utils/securityUtils.js';

class NotificationManager {
  constructor() {
    this.socket = io();
    this.unreadCount = 0;
    this.notifications = [];
    this.currentPage = 1;
    this.hasMorePages = true;
    this.isLoading = false;
    this.filters = {
      type: "all",
      status: "all",
      time: "all",
    };

    this.setupSocketListeners();
    this.setupEventListeners();
    this.fetchInitialNotifications();
  }

  setupSocketListeners() {
    this.socket.on("connect", () => {
      console.log("Connected to notification service");
    });

    this.socket.on("new_notification", (notification) => {
      this.handleNewNotification(notification);
    });

    this.socket.on("tournament_update", (update) => {
      this.handleTournamentUpdate(update);
    });
  }

  setupEventListeners() {
    // Update notification badge when document becomes visible
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        this.updateUnreadCount();
      }
    });

    // Initialize filter values
    const typeFilter = document.getElementById("notification-type-filter");
    const statusFilter = document.getElementById("notification-status-filter");
    const timeFilter = document.getElementById("notification-time-filter");

    if (typeFilter) this.filters.type = typeFilter.value;
    if (statusFilter) this.filters.status = statusFilter.value;
    if (timeFilter) this.filters.time = timeFilter.value;
  }

  async fetchInitialNotifications() {
    this.showLoading();
    try {
      const response = await this.fetchNotifications();
      this.notifications = response.notifications;
      this.hasMorePages = response.has_more;
      this.renderNotifications();
      this.updateUnreadCount();
    } catch (error) {
      console.error("Error fetching notifications:", error);
      this.showError("Failed to load notifications");
    } finally {
      this.hideLoading();
    }
  }

  async fetchNotifications() {
    const params = new URLSearchParams({
      page: this.currentPage,
      type: this.filters.type,
      status: this.filters.status,
      time: this.filters.time,
    });

    const response = await fetch(`/api/notifications/?${params.toString()}`);
    if (!response.ok) {
      throw new Error("Failed to fetch notifications");
    }
    return await response.json();
  }

  async loadMore() {
    if (this.isLoading || !this.hasMorePages) return;

    this.showLoadingMore();
    try {
      this.currentPage++;
      const response = await this.fetchNotifications();
      this.notifications = [...this.notifications, ...response.notifications];
      this.hasMorePages = response.has_more;
      this.renderNotifications();
    } catch (error) {
      console.error("Error loading more notifications:", error);
      this.showError("Failed to load more notifications");
      this.currentPage--;
    } finally {
      this.hideLoadingMore();
    }
  }

  async applyFilters() {
    const typeFilter = document.getElementById("notification-type-filter");
    const statusFilter = document.getElementById("notification-status-filter");
    const timeFilter = document.getElementById("notification-time-filter");

    this.filters = {
      type: typeFilter.value,
      status: statusFilter.value,
      time: timeFilter.value,
    };

    this.currentPage = 1;
    this.hasMorePages = true;
    await this.fetchInitialNotifications();
  }

  async updateUnreadCount() {
    try {
      const response = await fetch("/api/notifications/unread-count");
      const data = await response.json();
      this.unreadCount = data.count;
      this.updateNotificationBadge();
    } catch (error) {
      console.error("Error updating unread count:", error);
    }
  }

  handleNewNotification(notification) {
    // Only add to list if it matches current filters
    if (this.matchesFilters(notification)) {
      this.notifications.unshift(notification);
      this.renderNotifications();
    }

    this.unreadCount++;
    this.updateNotificationBadge();
    this.showNotificationToast(notification);
  }

  matchesFilters(notification) {
    // Type filter
    if (
      this.filters.type !== "all" &&
      notification.type !== this.filters.type
    ) {
      return false;
    }

    // Status filter
    if (this.filters.status === "read" && !notification.is_read) {
      return false;
    }
    if (this.filters.status === "unread" && notification.is_read) {
      return false;
    }

    // Time filter
    const notificationDate = new Date(notification.created_at);
    const now = new Date();

    switch (this.filters.time) {
      case "today":
        return notificationDate.toDateString() === now.toDateString();
      case "week":
        const weekAgo = new Date(now.setDate(now.getDate() - 7));
        return notificationDate >= weekAgo;
      case "month":
        const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
        return notificationDate >= monthAgo;
      default:
        return true;
    }
  }

  handleTournamentUpdate(update) {
    switch (update.type) {
      case "match_ready":
        this.showMatchReadyNotification(update.data);
        break;
      case "tournament_started":
        this.showTournamentStartedNotification(update.data);
        break;
      case "tournament_ended":
        this.showTournamentEndedNotification(update.data);
        break;
    }
  }

  async markAsRead(notificationId) {
    try {
      const response = await fetch(
        `/api/notifications/${notificationId}/read`,
        {
          method: "POST",
        },
      );
      if (!response.ok) throw new Error("Failed to mark notification as read");

      const notification = this.notifications.find(
        (n) => n.id === notificationId,
      );
      if (notification) {
        notification.is_read = true;
        this.renderNotifications();
      }
      this.updateUnreadCount();
    } catch (error) {
      console.error("Error marking notification as read:", error);
      this.showError("Failed to mark notification as read");
    }
  }

  async markAllAsRead() {
    try {
      const response = await fetch("/api/notifications/mark-all-read", {
        method: "POST",
      });
      if (!response.ok)
        throw new Error("Failed to mark all notifications as read");

      this.notifications.forEach((n) => (n.is_read = true));
      this.unreadCount = 0;
      this.updateNotificationBadge();
      this.renderNotifications();
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      this.showError("Failed to mark all notifications as read");
    }
  }

  async deleteNotification(notificationId) {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete notification");

      this.notifications = this.notifications.filter(
        (n) => n.id !== notificationId,
      );
      this.renderNotifications();
      this.updateUnreadCount();
    } catch (error) {
      console.error("Error deleting notification:", error);
      this.showError("Failed to delete notification");
    }
  }

  updateNotificationBadge() {
    const badge = document.getElementById("notification-badge");
    if (badge) {
      badge.textContent = this.unreadCount;
      badge.style.display = this.unreadCount > 0 ? "block" : "none";
    }
  }

  renderNotifications() {
    const container = document.getElementById("notification-list");
    const emptyState = document.getElementById("notification-empty");
    const loadMoreContainer = document.getElementById("load-more-container");

    if (!container) return;

    if (this.notifications.length === 0) {
      emptyState.style.display = "block";
      loadMoreContainer.style.display = "none";
      return;
    }

    emptyState.style.display = "none";
    
    // Use safe template creation for notifications
    const notificationsHTML = this.notifications
      .map(
        (notification) => {
          const notificationTemplate = `
            <div class="notification-item ${notification.is_read ? "read" : "unread"}" data-id="${notification.id}">
                <div class="notification-content">
                    <h4>${notification.title}</h4>
                    <p>${notification.message}</p>
                    <small>${new Date(notification.created_at).toLocaleString()}</small>
                </div>
                <div class="notification-actions">
                    ${
                      !notification.is_read
                        ? `
                        <button class="btn btn-sm btn-primary" onclick="notificationManager.markAsRead(${notification.id})">
                            Mark as Read
                        </button>
                    `
                        : ""
                    }
                    <button class="btn btn-sm btn-danger" onclick="notificationManager.deleteNotification(${notification.id})">
                        Delete
                    </button>
                </div>
            </div>
        `;
          
          return createSafeTemplate(notificationTemplate, {
            id: notification.id,
            is_read: notification.is_read ? "read" : "unread",
            title: notification.title,
            message: notification.message,
            created_at: notification.created_at
          });
        }
      )
      .join("");
    
    safeSetInnerHTML(container, notificationsHTML);

    loadMoreContainer.style.display = this.hasMorePages ? "block" : "none";
  }

  showNotificationToast(notification) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.setAttribute("role", "alert");
    toast.setAttribute("aria-live", "assertive");
    toast.setAttribute("aria-atomic", "true");

    const toastTemplate = `
            <div class="toast-header">
                <strong class="me-auto">${notification.title}</strong>
                <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
                ${notification.message}
            </div>
        `;

    // Use safe template creation
    const safeToastHTML = createSafeTemplate(toastTemplate, {
      title: notification.title,
      message: notification.message
    });
    
    safeSetInnerHTML(toast, safeToastHTML);

    const container = document.getElementById("toast-container");
    container.appendChild(toast);

    const bsToast = new bootstrap.Toast(toast, {
      autohide: true,
      delay: 5000,
    });
    bsToast.show();

    toast.addEventListener("hidden.bs.toast", () => {
      toast.remove();
    });
  }

  showMatchReadyNotification(data) {
    this.showNotificationToast({
      title: "Match Ready",
      message: `Your match in tournament ${data.tournament_name} is ready to begin!`,
    });
  }

  showTournamentStartedNotification(data) {
    this.showNotificationToast({
      title: "Tournament Started",
      message: `The tournament ${data.tournament_name} has begun!`,
    });
  }

  showTournamentEndedNotification(data) {
    this.showNotificationToast({
      title: "Tournament Ended",
      message: `The tournament ${data.tournament_name} has ended. Congratulations to the winner!`,
    });
  }

  showLoading() {
    this.isLoading = true;
    const loading = document.getElementById("notification-loading");
    if (loading) loading.style.display = "block";
  }

  hideLoading() {
    this.isLoading = false;
    const loading = document.getElementById("notification-loading");
    if (loading) loading.style.display = "none";
  }

  showLoadingMore() {
    this.isLoading = true;
    const button = document.querySelector("#load-more-container button");
    if (button) {
      button.disabled = true;
      
      const loadingTemplate = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...';
      safeSetInnerHTML(button, loadingTemplate);
    }
  }

  hideLoadingMore() {
    this.isLoading = false;
    const button = document.querySelector("#load-more-container button");
    if (button) {
      button.disabled = false;
      safeSetInnerHTML(button, "Load More");
    }
  }

  showError(message) {
    if (typeof showErrorToast === "function") {
      showErrorToast(message);
    } else {
      const toast = document.createElement("div");
      toast.className =
        "toast align-items-center text-white bg-danger border-0";
      toast.setAttribute("role", "alert");
      toast.setAttribute("aria-live", "assertive");
      toast.setAttribute("aria-atomic", "true");

      const errorTemplate = `
                <div class="d-flex">
                    <div class="toast-body">
                        <i class="fas fa-exclamation-circle me-2"></i>
                        ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
            `;

      // Use safe template creation
      const safeErrorHTML = createSafeTemplate(errorTemplate, { message });
      safeSetInnerHTML(toast, safeErrorHTML);

      const container = document.getElementById("toast-container");
      container.appendChild(toast);

      const bsToast = new bootstrap.Toast(toast, {
        autohide: true,
        delay: 5000,
      });
      bsToast.show();

      toast.addEventListener("hidden.bs.toast", () => {
        toast.remove();
      });
    }
  }
}

// Initialize notification manager when the page loads
document.addEventListener("DOMContentLoaded", () => {
  window.notificationManager = new NotificationManager();
});
