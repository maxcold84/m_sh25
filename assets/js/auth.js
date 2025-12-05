const Auth = (function () {
    const pb = new PocketBase('http://127.0.0.1:8090');

    function init() {
        updateAuthUI();

        // Listen for auth state changes
        pb.authStore.onChange(() => {
            updateAuthUI();
        });

        // Handle Tab Switching
        const hash = window.location.hash;
        if (hash === '#signup') {
            $('#authTab a[href="#signup"]').tab('show');
        } else {
            $('#authTab a[href="#login"]').tab('show');
        }

        // Update hash on tab click
        $('#authTab a').on('click', function (e) {
            e.preventDefault();
            $(this).tab('show');
            window.location.hash = this.hash;
        });

        // Handle Login Form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', handleLogin);

            // Load saved email
            const savedEmail = localStorage.getItem('savedEmail');
            if (savedEmail) {
                const emailInput = document.getElementById('login-email');
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

        // OAuth2 Login Handlers (Global)
        const oauthButtons = document.querySelectorAll('.oauth-btn');
        oauthButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const provider = e.target.dataset.provider;
                handleOAuth2Login(provider);
            });
        });
    }

    async function handleOAuth2Login(provider) {
        try {
            const authData = await pb.collection('users').authWithOAuth2({ provider: provider });

            // Optional: update user data if needed, or just redirect
            // const meta = authData.meta;
            // if (meta) { ... }

            window.location.href = '/';
        } catch (error) {
            const messageEl = document.getElementById('auth-message');
            showMessage(messageEl, `Login with ${provider} failed: ` + error.message, 'text-danger');
        }
    }

    function setupEmailAutocomplete(form) {
        const emailInput = form.querySelector('#signup-email');
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

        // Avatar elements
        const avatarImg = document.getElementById('nav-avatar-img');
        const avatarIcon = document.getElementById('nav-avatar-icon');

        if (isLoggedIn) {
            if (loginLink) loginLink.style.display = 'none';
            if (signupLink) signupLink.style.display = 'none';
            if (logoutLink) logoutLink.style.display = 'block';
            if (profileLink) {
                profileLink.style.display = 'block';

                const user = pb.authStore.model;
                if (user.avatar) {
                    const avatarUrl = pb.files.getUrl(user, user.avatar);
                    if (avatarImg) {
                        avatarImg.src = avatarUrl;
                        avatarImg.style.display = 'block';
                    }
                    if (avatarIcon) avatarIcon.style.display = 'none';
                } else {
                    if (avatarImg) avatarImg.style.display = 'none';
                    if (avatarIcon) avatarIcon.style.display = 'block';
                }

                // Show welcome toast only if it hasn't been shown in this session
                if (!sessionStorage.getItem('welcomeShown')) {
                    const userName = user.name || user.email;
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
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
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
        const name = document.getElementById('signup-name').value;
        const nickname = document.getElementById('signup-nickname').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const passwordConfirm = document.getElementById('signup-passwordConfirm').value;
        const messageEl = document.getElementById('auth-message');

        if (password !== passwordConfirm) {
            showMessage(messageEl, 'Passwords do not match', 'text-danger');
            return;
        }

        try {
            const data = {
                "username": nickname,
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
        localStorage.removeItem('cart_id'); // Clear cart reference
        window.location.href = (typeof loginUrl !== 'undefined') ? loginUrl : '/login';
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
