// Main JavaScript for DojoPool

document.addEventListener('DOMContentLoaded', function() {
    // Initialize tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Initialize popovers
    var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });
    
    // Auto-hide alerts after 5 seconds
    var alerts = document.querySelectorAll('.alert:not(.alert-permanent)');
    alerts.forEach(function(alert) {
        setTimeout(function() {
            var bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        }, 5000);
    });
    
    // Add fade-in animation to elements
    var fadeElements = document.querySelectorAll('.fade-in');
    fadeElements.forEach(function(element) {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        
        setTimeout(function() {
            element.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, 100);
    });
    
    // Handle form validation
    var forms = document.querySelectorAll('.needs-validation');
    forms.forEach(function(form) {
        form.addEventListener('submit', function(event) {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            form.classList.add('was-validated');
        });
    });
    
    // Handle password strength indicator
    var passwordInputs = document.querySelectorAll('input[type="password"]');
    passwordInputs.forEach(function(input) {
        input.addEventListener('input', function() {
            var strength = calculatePasswordStrength(this.value);
            updatePasswordStrengthIndicator(this, strength);
        });
    });
    
    // Handle mobile menu
    var navbarToggler = document.querySelector('.navbar-toggler');
    if (navbarToggler) {
        navbarToggler.addEventListener('click', function() {
            document.body.classList.toggle('mobile-menu-open');
        });
    }
});

// Calculate password strength
function calculatePasswordStrength(password) {
    var strength = 0;
    
    // Length
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;
    
    // Contains number
    if (/\d/.test(password)) strength += 1;
    
    // Contains lowercase
    if (/[a-z]/.test(password)) strength += 1;
    
    // Contains uppercase
    if (/[A-Z]/.test(password)) strength += 1;
    
    // Contains special character
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    return Math.min(strength, 5);
}

// Update password strength indicator
function updatePasswordStrengthIndicator(input, strength) {
    var indicator = input.parentElement.querySelector('.password-strength');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.className = 'password-strength progress mt-2';
        indicator.innerHTML = '<div class="progress-bar" role="progressbar"></div>';
        input.parentElement.appendChild(indicator);
    }
    
    var progressBar = indicator.querySelector('.progress-bar');
    var width = (strength / 5) * 100;
    var bgClass = '';
    
    if (strength <= 1) bgClass = 'bg-danger';
    else if (strength <= 3) bgClass = 'bg-warning';
    else bgClass = 'bg-success';
    
    progressBar.style.width = width + '%';
    progressBar.className = 'progress-bar ' + bgClass;
}

// Handle AJAX form submissions
function submitForm(form, successCallback) {
    var formData = new FormData(form);
    var url = form.action;
    var method = form.method;
    
    fetch(url, {
        method: method,
        body: formData,
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            if (successCallback) successCallback(data);
        } else {
            showAlert('error', data.message || 'An error occurred');
        }
    })
    .catch(error => {
        showAlert('error', 'An error occurred while processing your request');
        console.error('Error:', error);
    });
}

// Show alert message
function showAlert(type, message) {
    var alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    var alertContainer = document.querySelector('.alert-container');
    if (!alertContainer) {
        alertContainer = document.createElement('div');
        alertContainer.className = 'alert-container';
        document.body.insertBefore(alertContainer, document.body.firstChild);
    }
    
    alertContainer.appendChild(alertDiv);
    
    setTimeout(function() {
        var bsAlert = new bootstrap.Alert(alertDiv);
        bsAlert.close();
    }, 5000);
} 