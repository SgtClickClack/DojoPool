import { safeSetInnerHTML } from '../../utils/securityUtils.js';

class ReviewComponent {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      ratingId: "",
      readOnly: false,
      showVoting: true,
      showResponses: true,
      onUpdate: () => {},
      ...options,
    };
    this.init();
  }

  init() {
    this.createElements();
    this.bindEvents();
    if (this.options.ratingId) {
      this.loadReview();
    }
  }

  createElements() {
    const containerHTML = `
            <div class="review-component">
                ${
                  !this.options.readOnly
                    ? `
                    <div class="review-form">
                        <textarea class="form-control mb-2" placeholder="Write your review"></textarea>
                        <button class="btn btn-primary btn-sm submit-review">Submit Review</button>
                    </div>
                `
                    : ""
                }
                <div class="review-content mt-3" style="display: none;">
                    <div class="review-text"></div>
                    <div class="review-meta mt-2">
                        <small class="text-muted review-date"></small>
                        ${
                          this.options.showVoting
                            ? `
                            <div class="review-voting">
                                <button class="btn btn-sm btn-outline-success vote-helpful">
                                    <i class="bi bi-hand-thumbs-up"></i> Helpful
                                    <span class="helpful-count">0</span>
                                </button>
                                <button class="btn btn-sm btn-outline-danger vote-unhelpful">
                                    <i class="bi bi-hand-thumbs-down"></i> Not Helpful
                                    <span class="unhelpful-count">0</span>
                                </button>
                            </div>
                        `
                            : ""
                        }
                        <div class="review-actions">
                            <button class="btn btn-sm btn-link report-review">Report</button>
                            ${
                              !this.options.readOnly
                                ? `
                                <button class="btn btn-sm btn-link edit-review">Edit</button>
                                <button class="btn btn-sm btn-link delete-review">Delete</button>
                            `
                                : ""
                            }
                        </div>
                    </div>
                    ${
                      this.options.showResponses
                        ? `
                        <div class="review-responses mt-3">
                            <h6>Responses</h6>
                            <div class="responses-list"></div>
                            <div class="response-form mt-2">
                                <textarea class="form-control mb-2" placeholder="Write a response"></textarea>
                                <button class="btn btn-sm btn-primary submit-response">Submit Response</button>
                            </div>
                        </div>
                    `
                        : ""
                    }
                </div>
            </div>
        `;
    safeSetInnerHTML(this.container, containerHTML);

    // Store references to elements
    this.reviewForm = this.container.querySelector(".review-form");
    this.reviewInput = this.container.querySelector(".review-form textarea");
    this.submitButton = this.container.querySelector(".submit-review");
    this.reviewContent = this.container.querySelector(".review-content");
    this.reviewText = this.container.querySelector(".review-text");
    this.reviewDate = this.container.querySelector(".review-date");
    this.helpfulButton = this.container.querySelector(".vote-helpful");
    this.unhelpfulButton = this.container.querySelector(".vote-unhelpful");
    this.helpfulCount = this.container.querySelector(".helpful-count");
    this.unhelpfulCount = this.container.querySelector(".unhelpful-count");
    this.reportButton = this.container.querySelector(".report-review");
    this.editButton = this.container.querySelector(".edit-review");
    this.deleteButton = this.container.querySelector(".delete-review");
    this.responsesList = this.container.querySelector(".responses-list");
    this.responseForm = this.container.querySelector(".response-form");
    this.responseInput = this.container.querySelector(
      ".response-form textarea",
    );
    this.submitResponseButton =
      this.container.querySelector(".submit-response");
  }

  bindEvents() {
    if (!this.options.readOnly) {
      this.submitButton?.addEventListener("click", () => this.submitReview());
      this.editButton?.addEventListener("click", () => this.editReview());
      this.deleteButton?.addEventListener("click", () => this.deleteReview());
    }

    if (this.options.showVoting) {
      this.helpfulButton?.addEventListener("click", () =>
        this.voteReview(true),
      );
      this.unhelpfulButton?.addEventListener("click", () =>
        this.voteReview(false),
      );
    }

    this.reportButton?.addEventListener("click", () => this.reportReview());

    if (this.options.showResponses) {
      this.submitResponseButton?.addEventListener("click", () =>
        this.submitResponse(),
      );
    }
  }

  async loadReview() {
    try {
      const response = await fetch(`/api/v1/reviews/${this.options.ratingId}`);
      if (!response.ok) throw new Error("Failed to load review");

      const data = await response.json();
      this.displayReview(data);
    } catch (error) {
      console.error("Load review error:", error);
      if (window.showToast) {
        window.showToast("error", "Failed to load review");
      }
    }
  }

  async submitReview() {
    try {
      const content = this.reviewInput.value.trim();
      if (!content) {
        throw new Error("Review content is required");
      }

      const response = await fetch("/api/v1/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rating_id: this.options.ratingId,
          content: content,
        }),
      });

      if (!response.ok) throw new Error("Failed to submit review");

      const data = await response.json();
      this.options.onUpdate(data);
      this.loadReview();

      if (window.showToast) {
        window.showToast("success", "Review submitted successfully");
      }
    } catch (error) {
      console.error("Submit review error:", error);
      if (window.showToast) {
        window.showToast("error", error.message);
      }
    }
  }

  async voteReview(isHelpful) {
    try {
      const response = await fetch(
        `/api/v1/reviews/${this.options.ratingId}/vote`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            is_helpful: isHelpful,
          }),
        },
      );

      if (!response.ok) throw new Error("Failed to vote");

      this.loadReview();
    } catch (error) {
      console.error("Vote error:", error);
      if (window.showToast) {
        window.showToast("error", "Failed to vote on review");
      }
    }
  }

  async reportReview() {
    const reason = prompt("Please provide a reason for reporting this review:");
    if (!reason) return;

    try {
      const response = await fetch(
        `/api/v1/reviews/${this.options.ratingId}/report`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reason: reason,
          }),
        },
      );

      if (!response.ok) throw new Error("Failed to report review");

      if (window.showToast) {
        window.showToast("success", "Review reported successfully");
      }
    } catch (error) {
      console.error("Report error:", error);
      if (window.showToast) {
        window.showToast("error", "Failed to report review");
      }
    }
  }

  async submitResponse() {
    try {
      const content = this.responseInput.value.trim();
      if (!content) {
        throw new Error("Response content is required");
      }

      const response = await fetch(
        `/api/v1/reviews/${this.options.ratingId}/responses`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: content,
          }),
        },
      );

      if (!response.ok) throw new Error("Failed to submit response");

      this.responseInput.value = "";
      this.loadReview();

      if (window.showToast) {
        window.showToast("success", "Response submitted successfully");
      }
    } catch (error) {
      console.error("Submit response error:", error);
      if (window.showToast) {
        window.showToast("error", error.message);
      }
    }
  }

  displayReview(data) {
    if (!data) return;

    this.reviewContent.style.display = "block";
    this.reviewText.textContent = data.content;
    this.reviewDate.textContent = new Date(
      data.created_at,
    ).toLocaleDateString();

    if (this.options.showVoting) {
      this.helpfulCount.textContent = data.helpful_votes;
      this.unhelpfulCount.textContent = data.unhelpful_votes;
    }

    if (this.options.showResponses && data.responses) {
      this.displayResponses(data.responses);
    }
  }

  displayResponses(responses) {
    if (!this.responsesList) return;

    if (responses.length === 0) {
      safeSetInnerHTML(this.responsesList, '<p class="text-muted">No responses yet</p>');
      return;
    }

    const responsesHTML = responses
      .map(
        (response) => `
          <div class="response-item">
            <div class="response-text">${response.content}</div>
            <div class="response-meta">
              <small class="text-muted">${response.user_name} - ${new Date(response.created_at).toLocaleDateString()}</small>
            </div>
          </div>
        `,
      )
      .join("");
    safeSetInnerHTML(this.responsesList, responsesHTML);
  }
}

// Export for use in other files
if (typeof module !== "undefined" && module.exports) {
  module.exports = ReviewComponent;
}
