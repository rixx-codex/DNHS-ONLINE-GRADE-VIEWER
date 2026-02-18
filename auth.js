/* ==========================================
   SECURE AUTH LOGIC (auth.js) - FIXED VERSION
   ========================================== */

// 1.Toggle Password Visibility
function togglePasswordVisibility() {
    const passwordField = document.getElementById('adminPassword');
    const eyeIcon = document.getElementById('eyeIcon');
    
    if (passwordField.type === 'password') {
        passwordField.type = 'text';
        eyeIcon.classList.replace('fa-eye', 'fa-eye-slash');
        eyeIcon.style.color = "var(--primary)";
    } else {
        passwordField.type = 'password';
        eyeIcon.classList.replace('fa-eye-slash', 'fa-eye');
        eyeIcon.style.color = "var(--text-dim)";
    }
}

// 2. Handle Admin Login
async function handleAdminLogin() {
    const email = document.getElementById('adminEmail').value.trim();
    const password = document.getElementById('adminPassword').value;
    const btn = document.getElementById('loginBtn');
    const loading = document.getElementById('loadingOverlay');

    if (!email || !password) {
        showError("Please enter your credentials.");
        return;
    }

    // Start High-End Loading
    if (loading) loading.classList.remove('hidden');
    btn.disabled = true;
    btn.innerText = "VERIFYING...";

    try {
        /* FIX: Ginamit ang _supabase (may underscore) 
           dahil ito ang variable sa supabase.js mo */
        const { data, error } = await _supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) throw error;

        // Success transition
        showToast("Access Granted!");
        checkUserSession();

    } catch (err) {
        showError("Access Denied: " + err.message);
        btn.disabled = false;
        btn.innerText = "SIGN IN";
    } finally {
        if (loading) loading.classList.add('hidden');
    }
}

// Expose to global scope
window.handleAdminLogin = handleAdminLogin;

// 3. Smooth Session Check & Transition
async function checkUserSession() {
    // FIX: _supabase gamit dito
    const { data: { session } } = await _supabase.auth.getSession();
    
    const loginSection = document.getElementById('adminLoginSection');
    const encoderSection = document.getElementById('encoderSection');
    
    if (session) {
        // Transition effect
        loginSection.style.opacity = "0";
        setTimeout(() => {
            loginSection.classList.add('hidden');
            encoderSection.classList.remove('hidden');
            
            // Display Admin Info
            const adminIdDisplay = document.getElementById('adminIdDisplay');
            if(adminIdDisplay) adminIdDisplay.innerText = "Logged in as: " + session.user.email;
        }, 400); 
    } else {
        loginSection.classList.remove('hidden');
        encoderSection.classList.add('hidden');
    }
}

// 4. Logout Function
async function handleLogout() {
    console.log("Logout function triggered");
    
    // Use custom high-end confirmation modal
    const confirmed = await window.showConfirmModal();
    
    if (!confirmed) {
        console.log("User cancelled logout");
        return;
    }
    
    console.log("User confirmed logout, proceeding...");
    
    // Show loading overlay
    const loading = document.getElementById('loadingOverlay');
    console.log("Loading element:", loading);
    if (loading) loading.classList.remove('hidden');
    
    try {
        console.log("Calling supabase signOut...");
        // FIX: _supabase gamit dito
        const { data, error } = await _supabase.auth.signOut();
        
        console.log("SignOut response:", { data, error });
        
        if (error) {
            console.error("Logout error:", error);
            // Try to clear anyway and reload
        }
        
        // Wait a moment for session to clear
        await new Promise(resolve => setTimeout(resolve, 500));
        
    } catch (err) {
        console.error("Logout exception:", err);
    }
    
    // Clear any local storage/session storage
    console.log("Clearing session and reloading...");
    try {
        sessionStorage.clear();
        localStorage.clear();
    } catch(e) {
        console.log("Could not clear storage:", e);
    }
    
    // Force page reload to go back to login state
    // Add timestamp to prevent caching
    window.location.href = window.location.pathname + '?t=' + Date.now();
}

// Expose to global scope
window.handleLogout = handleLogout;

// 5. Helper: Show Error Message
function showError(msg) {
    const errorMsg = document.getElementById('loginError');
    if(errorMsg) {
        errorMsg.innerText = msg;
        errorMsg.style.display = "block";
        setTimeout(() => { errorMsg.style.display = "none"; }, 5000);
    }
}

// 6. Enter Key Listener
document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const loginSection = document.getElementById('adminLoginSection');
        if (loginSection && !loginSection.classList.contains('hidden')) {
            handleAdminLogin();
        }
    }
});

// 7. Forgot Password Functions
function openForgotPasswordModal() {
    const modal = document.getElementById('forgotPasswordModal');
    const messageDiv = document.getElementById('resetMessage');
    if (modal) {
        modal.classList.remove('hidden');
        modal.style.opacity = '1';
        modal.style.visibility = 'visible';
    }
    if (messageDiv) {
        messageDiv.innerHTML = '';
        messageDiv.className = 'reset-message';
    }
}

function closeForgotPasswordModal() {
    const modal = document.getElementById('forgotPasswordModal');
    if (modal) {
        modal.style.opacity = '0';
        modal.style.visibility = 'hidden';
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
    }
    // Clear the email input
    const resetEmail = document.getElementById('resetEmail');
    if (resetEmail) resetEmail.value = '';
}

async function handleForgotPassword() {
    const email = document.getElementById('resetEmail').value.trim();
    const messageDiv = document.getElementById('resetMessage');
    const resetBtn = document.querySelector('.btn-reset');
    
    if (!email) {
        showResetMessage('Please enter your email address.', 'error');
        return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showResetMessage('Please enter a valid email address.', 'error');
        return;
    }
    
    // Disable button during request
    if (resetBtn) {
        resetBtn.disabled = true;
        resetBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> SENDING...';
    }
    
    try {
        const { error } = await _supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/admin.html'
        });
        
        if (error) throw error;
        
        showResetMessage('Password reset link has been sent! Check your email.', 'success');
        
        // Auto close modal after 3 seconds on success
        setTimeout(() => {
            closeForgotPasswordModal();
        }, 3000);
        
    } catch (err) {
        showResetMessage(err.message || 'Failed to send reset link. Please try again.', 'error');
    } finally {
        if (resetBtn) {
            resetBtn.disabled = false;
            resetBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> SEND RESET LINK';
        }
    }
}

function showResetMessage(message, type) {
    const messageDiv = document.getElementById('resetMessage');
    if (messageDiv) {
        messageDiv.innerHTML = `<i class="fa-solid fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${message}`;
        messageDiv.className = `reset-message ${type}`;
    }
}

// Close modal when clicking outside
document.addEventListener('click', function(e) {
    const modal = document.getElementById('forgotPasswordModal');
    if (modal && e.target === modal) {
        closeForgotPasswordModal();
    }
});

// Run session check on load
document.addEventListener('DOMContentLoaded', checkUserSession);