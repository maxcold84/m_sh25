const Auth = (function () {
    const pb = new PocketBase('http://127.0.0.1:8090');

    function init() {
        updateAuthUI();

        // Listen for auth state changes
        pb.authStore.onChange(() => {
            updateAuthUI();
        });

        // Handle Login Form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', handleLogin);

            // Load saved email
            const savedEmail = localStorage.getItem('savedEmail');
            if (savedEmail) {
                const emailInput = document.getElementById('email');
                const rememberCheckbox = document.getElementById('remember-email');
                if (emailInput) emailInput.value = savedEmail;
                if (rememberCheckbox) rememberCheckbox.checked = true;
            }
        }

        // Handle Signup Form
        const signupForm = document.getElementById('signup-form');
        if (signupForm) {
            signupForm.addEventListener('submit', handleSignup);
            setupEmailAutocomplete(signupForm);
        }
    }

    function setupEmailAutocomplete(form) {
        const emailInput = form.querySelector('#email');
        const suggestionDiv = document.getElementById('email-suggestion');
        const suggestionLink = document.getElementById('email-suggestion-link');

        if (!emailInput || !suggestionDiv || !suggestionLink) return;

        // Check for Mailcheck library
        if (typeof Mailcheck === 'undefined') {
            console.warn('Mailcheck.js not loaded, email autocomplete disabled');
            return;
        }

        emailInput.addEventListener('blur', function () {
            const email = emailInput.value.trim();
            if (!email) {
                suggestionDiv.style.display = 'none';
                return;
            }

            Mailcheck.run({
                email: email,
                domains: ['gmail.com', 'naver.com', 'daum.net', 'kakao.com', 'outlook.com', 'hanmail.net', 'nate.com'],
                topLevelDomains: ['com', 'net', 'org', 'kr'],
                suggested: function (suggestion) {
                    suggestionLink.textContent = suggestion.full;
                    suggestionDiv.style.display = 'block';

                    suggestionLink.onclick = function (e) {
                        e.preventDefault();
                        emailInput.value = suggestion.full;
                        suggestionDiv.style.display = 'none';
                    };
                },
                empty: function () {
                    suggestionDiv.style.display = 'none';
                }
            });
        });
    }

    function updateAuthUI() {
        const isLoggedIn = pb.authStore.isValid;
        const loginLink = document.getElementById('auth-login-link');
        const signupLink = document.getElementById('auth-signup-link');
        const logoutLink = document.getElementById('auth-logout-link');
        const profileLink = document.getElementById('auth-profile-link');

        if (isLoggedIn) {
            if (loginLink) loginLink.style.display = 'none';
            if (signupLink) signupLink.style.display = 'none';
            if (logoutLink) logoutLink.style.display = 'block';
            if (profileLink) {
                profileLink.style.display = 'block';
                const userName = pb.authStore.model.name || pb.authStore.model.email;
                profileLink.querySelector('a').innerText = userName;

                // Show welcome toast only if it hasn't been shown in this session
                if (!sessionStorage.getItem('welcomeShown')) {
                    showToast(`환영합니다, ${userName}님!`);
                    sessionStorage.setItem('welcomeShown', 'true');
                }
            }
        } else {
            if (loginLink) loginLink.style.display = 'block';
            if (signupLink) signupLink.style.display = 'block';
            if (logoutLink) logoutLink.style.display = 'none';
            if (profileLink) profileLink.style.display = 'none';
            sessionStorage.removeItem('welcomeShown');
        }
    }

    async function handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const rememberCheckbox = document.getElementById('remember-email');
        const messageEl = document.getElementById('auth-message');

        if (rememberCheckbox && rememberCheckbox.checked) {
            localStorage.setItem('savedEmail', email);
        } else {
            localStorage.removeItem('savedEmail');
        }

        try {
            await pb.collection('users').authWithPassword(email, password);
            window.location.href = '/';
        } catch (error) {
            showMessage(messageEl, 'Login failed: ' + error.message, 'text-danger');
        }
    }

    async function handleSignup(e) {
        e.preventDefault();
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const passwordConfirm = document.getElementById('passwordConfirm').value;
        const messageEl = document.getElementById('auth-message');

        if (password !== passwordConfirm) {
            showMessage(messageEl, 'Passwords do not match', 'text-danger');
            return;
        }

        try {
            const data = {
                "username": email.split('@')[0] + Math.floor(Math.random() * 1000), // Generate a random username
                "email": email,
                "emailVisibility": true,
                "password": password,
                "passwordConfirm": passwordConfirm,
                "name": name
            };

            await pb.collection('users').create(data);
            await pb.collection('users').authWithPassword(email, password);
            window.location.href = '/';
        } catch (error) {
            showMessage(messageEl, 'Signup failed: ' + error.message, 'text-danger');
        }
    }

    function logout() {
        pb.authStore.clear();
        window.location.href = '/login';
    }

    function showMessage(el, message, className) {
        if (el) {
            el.innerText = message;
            el.className = 'mt-3 text-center ' + className;
            el.style.display = 'block';
        }
    }

    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg text-sm z-50 transition-opacity duration-300';
        toast.style.opacity = '0';
        toast.innerText = message;
        document.body.appendChild(toast);

        // Fade in
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
        });

        // Fade out and remove
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }

    return {
        init: init,
        logout: logout,
        showToast: showToast
    };
})();

document.addEventListener('DOMContentLoaded', Auth.init);
