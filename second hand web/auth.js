// auth.js - login function
class AuthSystem {
    constructor() {
        this.users = JSON.parse(localStorage.getItem('users')) || [];
        this.init();
    }

    init() {
        this.bindLoginEvent();
        this.checkExistingUser();
        this.bindPasswordToggle();  // 绑定密码可见切换
    }

    bindLoginEvent() {
        const loginForm = document.querySelector('.login-container');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }
    }

    // Check if there is existing user data; if not, create a default user
    checkExistingUser() {
        if (this.users.length === 0) {
            const defaultUser = {
                username: '1234567',
                password: 'password123',
                email: 'test@example.com'
            };
            this.users.push(defaultUser);
            localStorage.setItem('users', JSON.stringify(this.users));
            console.log('Default user created - Username: 1234567, Password: password123');
        }
    }

    // Bind password toggle functionality
    bindPasswordToggle() {
        const toggle = document.getElementById('togglePassword');
        const passwordInput = document.getElementById('password');
        if (toggle && passwordInput) {
            toggle.addEventListener('click', () => {
                const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordInput.setAttribute('type', type);
                toggle.classList.toggle('fa-eye');
                toggle.classList.toggle('fa-eye-slash');
            });
        }
    }

    // Handle login
    handleLogin() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (!this.validateInput(username, password)) {
            return;
        }

        const user = this.users.find(u => u.username === username && u.password === password);
        
        if (user) {
            this.loginSuccess(user);
        } else {
            this.loginFailed();
        }
    }

    // Validate input
    validateInput(username, password) {
        if (!username || !password) {
            this.showMessage('Please fill in all fields', 'error');
            return false;
        }

        if (username.length !== 7) {
            this.showMessage('Account must be 7 characters', 'error');
            return false;
        }

        if (password.length < 6) {
            this.showMessage('Password must be at least 6 characters', 'error');
            return false;
        }

        return true;
    }

    // Login success
    loginSuccess(user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        localStorage.setItem('isLoggedIn', 'true');
        
        this.showMessage('Login success...', 'success');
        
        setTimeout(() => {
            window.location.href = 'supermarket.html';
        }, 2000);
    }

    // Login failed
    loginFailed() {
        this.showMessage('Account or password error', 'error');
        
        const form = document.querySelector('.login-container');
        form.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
            form.style.animation = '';
        }, 500);
    }

    // Show message
    showMessage(message, type) {
        const existingMessage = document.querySelector('.login-message');
        if (existingMessage) existingMessage.remove();

        const messageDiv = document.createElement('div');
        messageDiv.className = `login-message ${type}`;
        messageDiv.textContent = message;
        
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 15px 30px;
            border-radius: 25px;
            font-weight: 600;
            z-index: 10000;
            animation: slideDown 0.3s ease-out;
            max-width: 90%;
            text-align: center;
        `;

        if (type === 'success') {
            messageDiv.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
            messageDiv.style.color = 'white';
        } else {
            messageDiv.style.background = 'linear-gradient(135deg, #f44336, #d32f2f)';
            messageDiv.style.color = 'white';
        }

        document.body.appendChild(messageDiv);

        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.style.animation = 'slideUp 0.3s ease-in';
                setTimeout(() => {
                    if (messageDiv.parentNode) messageDiv.parentNode.removeChild(messageDiv);
                }, 300);
            }
        }, 3000);
    }

    // Static methods for supermarket page
    static checkLogin() {
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        if (!isLoggedIn || isLoggedIn !== 'true') {
            window.location.href = 'index.html';
        }
    }

    static logout() {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('isLoggedIn');
        window.location.href = 'index.html';
    }

    static getCurrentUser() {
        return JSON.parse(localStorage.getItem('currentUser') || '{}');
    }
}

// Add CSS animations
const authStyles = document.createElement('style');
authStyles.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-10px); }
        75% { transform: translateX(10px); }
    }
    @keyframes slideDown {
        from { transform: translate(-50%, -100%); opacity: 0; }
        to { transform: translate(-50%, 0); opacity: 1; }
    }
    @keyframes slideUp {
        from { transform: translate(-50%, 0); opacity: 1; }
        to { transform: translate(-50%, -100%); opacity: 0; }
    }
    .login-container {
        transition: all 0.3s ease;
    }
`;
document.head.appendChild(authStyles);

// Initialize login system
document.addEventListener('DOMContentLoaded', () => {
    new AuthSystem();
});