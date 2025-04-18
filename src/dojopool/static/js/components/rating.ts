// Generated type definitions

class Rating {
  // Properties and methods
}

// Type imports

class Rating {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      targetType: options.targetType,
      targetId: options.targetId,
      readOnly: options.readOnly || false,
      showAverage: options.showAverage || false,
      showReviews: options.showReviews || false,
      verifiedOnly: options.verifiedOnly || false,
      onChange: options.onChange || (() => {}),
      onDelete: options.onDelete || (() => {}),
    };

    this.currentRating = 0;
    this.init();
  }

  init() {
    this.createElements();
    if (this.options.showAverage || this.options.showReviews) {
      this.loadRatings();
    }
    if (!this.options.readOnly) {
      this.bindEvents();
    }
  }

  createElements() {
    this.container.innerHTML = `
            <div class="rating-component">
                <div class="rating-stars">
                    ${this.createStars()}
                </div>
                ${
                  this.options.showAverage
                    ? `
                    <div class="rating-average mt-2">
                        <span class="average-value"></span>
                        <span class="rating-count"></span>
                    </div>
                `
                    : ""
                }
                ${
                  !this.options.readOnly
                    ? `
                    <div class="rating-form mt-3" style="display: none;">
                        <textarea class="form-control mb-2" placeholder="Write your review (optional)"></textarea>
                        <button class="btn btn-primary btn-sm submit-rating">Submit Rating</button>
                    </div>
                `
                    : ""
                }
                ${
                  this.options.showReviews
                    ? `
                    <div class="rating-reviews mt-4">
                        <h5>Reviews</h5>
                        <div class="reviews-list"></div>
                    </div>
                `
                    : ""
                }
            </div>
        `;

    // Store references to elements
    this.starsContainer = this.container.querySelector(".rating-stars");
    this.stars = this.starsContainer.querySelectorAll(".star");
    this.averageElement = this.container.querySelector(".average-value");
    this.countElement = this.container.querySelector(".rating-count");
    this.reviewsContainer = this.container.querySelector(".reviews-list");
    this.ratingForm = this.container.querySelector(".rating-form");
    this.reviewInput = this.container.querySelector("textarea");
    this.submitButton = this.container.querySelector(".submit-rating");
  }

  createStars() {
    return Array(5)
      .fill()
      .map(
        (_, i) => `
            <span class="star${this.options.readOnly ? " readonly" : ""}" data-value="${i + 1}">
                <i class="bi bi-star${this.currentRating > i ? "-fill" : ""}"></i>
            </span>
        `,
      )
      .join("");
  }

  bindEvents() {
    this.stars.forEach((star) => {
      star.addEventListener("mouseover", () =>
        this.highlightStars(star.dataset.value),
      );
      star.addEventListener("mouseout", () =>
        this.highlightStars(this.currentRating),
      );
      star.addEventListener("click", () =>
        this.selectRating(parseInt(star.dataset.value)),
      );
    });

    if (this.submitButton) {
      this.submitButton.addEventListener("click", () => this.submitRating());
    }
  }

  highlightStars(rating) {
    this.stars.forEach((star, index) => {
      const icon: any = star.querySelector("i");
      if (index < rating) {
        icon.classList.remove("bi-star");
        icon.classList.add("bi-star-fill");
      } else {
        icon.classList.remove("bi-star-fill");
        icon.classList.add("bi-star");
      }
    });
  }

  selectRating(rating) {
    this.currentRating = rating;
    this.highlightStars(rating);
    if (this.ratingForm) {
      this.ratingForm.style.display = "block";
    }
  }

  async submitRating() {
    try {
      const response: any = await fetch(
        `/api/v1/ratings/${this.options.targetType}/${this.options.targetId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            rating: this.currentRating,
            review: this.reviewInput?.value,
          }),
        },
      );

      if (!response.ok) throw new Error("Failed to submit rating");

      const data: any = await response.json();
      this.options.onChange(data);

      // Reset form
      if (this.reviewInput) {
        this.reviewInput.value = "";
      }
      this.ratingForm.style.display = "none";

      // Reload ratings if showing reviews
      if (this.options.showReviews) {
        this.loadRatings();
      }

      // Show success message
      if (window.showToast) {
        window.showToast("success", "Rating submitted successfully");
      }
    } catch (error) {
      console.error("Rating error:", error);
      if (window.showToast) {
        window.showToast("error", "Failed to submit rating. Please try again.");
      }
    }
  }

  async loadRatings() {
    try {
      const response: any = await fetch(
        `/api/v1/ratings/${this.options.targetType}/${this.options.targetId}?verified_only=${this.options.verifiedOnly}`,
      );

      if (!response.ok) throw new Error("Failed to load ratings");

      const data: any = await response.json();

      if (this.options.showAverage) {
        this.updateAverageDisplay(data.average);
      }

      if (this.options.showReviews) {
        this.updateReviewsList(data.ratings);
      }
    } catch (error) {
      console.error("Load ratings error:", error);
      if (window.showToast) {
        window.showToast("error", "Failed to load ratings");
      }
    }
  }

  updateAverageDisplay(average) {
    if (this.averageElement) {
      this.averageElement.textContent = `${average.average.toFixed(1)} ★`;
    }
    if (this.countElement) {
      this.countElement.textContent = `(${average.count} ${average.count === 1 ? "rating" : "ratings"})`;
    }
  }

  updateReviewsList(ratings) {
    if (!this.reviewsContainer) return;

    if (ratings.length === 0) {
      this.reviewsContainer.innerHTML =
        '<p class="text-muted">No reviews yet</p>';
      return;
    }

    this.reviewsContainer.innerHTML = ratings
      .map(
        (rating) => `
            <div class="review-item mb-3">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <strong>${rating.user_name}</strong>
                        <span class="text-warning ms-2">${"★".repeat(rating.rating)}</span>
                        ${rating.is_verified ? '<span class="badge bg-success ms-2">Verified</span>' : ""}
                    </div>
                    ${
                      rating.user_id === window.currentUserId
                        ? `
                        <button class="btn btn-sm btn-outline-danger delete-review" data-rating-id="${rating.id}">
                            <i class="bi bi-trash"></i>
                        </button>
                    `
                        : ""
                    }
                </div>
                ${rating.review ? `<p class="mt-1 mb-0">${rating.review}</p>` : ""}
                <small class="text-muted">${new Date(rating.created_at).toLocaleDateString()}</small>
            </div>
        `,
      )
      .join("");

    // Bind delete buttons
    this.reviewsContainer.querySelectorAll(".delete-review").forEach((btn) => {
      btn.addEventListener("click", () =>
        this.deleteRating(btn.dataset.ratingId),
      );
    });
  }

  async deleteRating(ratingId) {
    try {
      const response: any = await fetch(`/api/v1/ratings/${ratingId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete rating");

      this.options.onDelete(ratingId);
      this.loadRatings();

      if (window.showToast) {
        window.showToast("success", "Rating deleted successfully");
      }
    } catch (error) {
      console.error("Delete rating error:", error);
      if (window.showToast) {
        window.showToast("error", "Failed to delete rating");
      }
    }
  }

  destroy() {
    // Clean up event listeners
    this.container.innerHTML = "";
  }
}
