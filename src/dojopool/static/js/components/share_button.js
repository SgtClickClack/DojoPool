class ShareButton {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            type: options.type || 'achievement',
            id: options.id,
            onShare: options.onShare || (() => {}),
            buttonClass: options.buttonClass || 'btn-primary',
            buttonText: options.buttonText || 'Share',
            iconClass: options.iconClass || 'bi-share'
        };
        
        this.init();
    }
    
    init() {
        this.createButton();
        this.createShareModal();
        this.bindEvents();
    }
    
    createButton() {
        this.button = document.createElement('button');
        this.button.className = `btn ${this.options.buttonClass}`;
        this.button.innerHTML = `
            <i class="bi ${this.options.iconClass} me-2"></i>
            ${this.options.buttonText}
        `;
        this.container.appendChild(this.button);
    }
    
    createShareModal() {
        this.modal = document.createElement('div');
        this.modal.className = 'modal fade';
        this.modal.id = `shareModal_${this.options.type}_${this.options.id}`;
        this.modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Share</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="share-buttons d-flex justify-content-center gap-3">
                            <button class="btn btn-outline-primary share-btn" data-platform="twitter">
                                <i class="bi bi-twitter"></i>
                            </button>
                            <button class="btn btn-outline-primary share-btn" data-platform="facebook">
                                <i class="bi bi-facebook"></i>
                            </button>
                            <button class="btn btn-outline-primary share-btn" data-platform="linkedin">
                                <i class="bi bi-linkedin"></i>
                            </button>
                            <button class="btn btn-outline-primary share-btn" data-platform="whatsapp">
                                <i class="bi bi-whatsapp"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(this.modal);
        this.bsModal = new bootstrap.Modal(this.modal);
    }
    
    bindEvents() {
        this.button.addEventListener('click', () => this.handleShare());
        
        this.modal.querySelectorAll('.share-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const platform = e.currentTarget.dataset.platform;
                this.shareOnPlatform(platform);
            });
        });
    }
    
    async handleShare() {
        try {
            const response = await fetch(`/api/v1/social/share/${this.options.type}/${this.options.id}`);
            if (!response.ok) throw new Error('Failed to get share links');
            
            const data = await response.json();
            this.shareLinks = data.share_links;
            this.bsModal.show();
            
            // Call onShare callback
            this.options.onShare();
            
        } catch (error) {
            console.error('Share error:', error);
            // Show error toast
            if (window.showToast) {
                window.showToast('error', 'Failed to generate share links. Please try again.');
            }
        }
    }
    
    shareOnPlatform(platform) {
        if (!this.shareLinks || !this.shareLinks[platform]) return;
        
        // Open share URL in new window
        window.open(this.shareLinks[platform], '_blank', 'width=600,height=400');
        
        // Close modal
        this.bsModal.hide();
    }
    
    destroy() {
        // Clean up event listeners and DOM elements
        this.button.remove();
        this.modal.remove();
    }
} 