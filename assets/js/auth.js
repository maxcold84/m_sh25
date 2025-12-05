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
            setupEmailAutocomplete(loginForm, 'login-email');

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
            setupEmailAutocomplete(signupForm, 'signup-email');
            setupNicknameCheck();
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

    function setupEmailAutocomplete(form, emailInputId) {
        const emailInput = form.querySelector('#' + emailInputId);
        const suggestionDiv = document.getElementById('email-suggestion');
        const suggestionLink = document.getElementById('email-suggestion-link');

        if (!emailInput) return;

        const domains = ['gmail.com', 'naver.com', 'daum.net', 'kakao.com', 'outlook.com', 'hanmail.net', 'nate.com'];
        let selectedIndex = -1;

        // Create dropdown container for domain suggestions
        let dropdownContainer = document.createElement('div');
        dropdownContainer.className = 'email-domain-dropdown';
        dropdownContainer.style.cssText = `
            position: absolute;
            background: white;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            max-height: 200px;
            overflow-y: auto;
            z-index: 1000;
            display: none;
            width: 100%;
        `;
        emailInput.parentElement.style.position = 'relative';
        emailInput.parentElement.appendChild(dropdownContainer);

        function updateSelection() {
            const options = dropdownContainer.querySelectorAll('.email-domain-option');
            options.forEach((opt, idx) => {
                if (idx === selectedIndex) {
                    opt.style.backgroundColor = '#e0e7ff';
                    opt.scrollIntoView({ block: 'nearest' });
                } else {
                    opt.style.backgroundColor = 'white';
                }
            });
        }

        function selectCurrentOption() {
            const options = dropdownContainer.querySelectorAll('.email-domain-option');
            if (selectedIndex >= 0 && selectedIndex < options.length) {
                emailInput.value = options[selectedIndex].textContent;
                hideDomainSuggestions();
                return true;
            }
            return false;
        }

        function createOption(email, domain, username) {
            const option = document.createElement('div');
            option.className = 'email-domain-option';
            option.style.cssText = `
                padding: 8px 12px;
                cursor: pointer;
                border-bottom: 1px solid #eee;
                transition: background-color 0.1s;
            `;
            option.textContent = username + '@' + domain;
            option.addEventListener('mouseenter', () => {
                selectedIndex = Array.from(dropdownContainer.children).indexOf(option);
                updateSelection();
            });
            option.addEventListener('mouseleave', () => {
                option.style.backgroundColor = 'white';
            });
            option.addEventListener('mousedown', (e) => {
                e.preventDefault();
                emailInput.value = username + '@' + domain;
                dropdownContainer.style.display = 'none';
            });
            return option;
        }

        function showDomainSuggestions(username, filterText = '') {
            dropdownContainer.innerHTML = '';
            selectedIndex = -1;

            const filteredDomains = filterText
                ? domains.filter(d => d.startsWith(filterText.toLowerCase()))
                : domains;

            if (filteredDomains.length === 0) {
                hideDomainSuggestions();
                return;
            }

            filteredDomains.forEach(domain => {
                const option = createOption(username + '@' + domain, domain, username);
                dropdownContainer.appendChild(option);
            });
            dropdownContainer.style.display = 'block';
        }

        function hideDomainSuggestions() {
            dropdownContainer.style.display = 'none';
            selectedIndex = -1;
        }

        function isDropdownVisible() {
            return dropdownContainer.style.display === 'block';
        }

        emailInput.addEventListener('input', function () {
            const value = emailInput.value;
            const atIndex = value.indexOf('@');

            if (atIndex !== -1) {
                const username = value.substring(0, atIndex);
                const afterAt = value.substring(atIndex + 1);

                if (username) {
                    showDomainSuggestions(username, afterAt);
                } else {
                    hideDomainSuggestions();
                }
            } else {
                hideDomainSuggestions();
            }
        });

        // Keyboard navigation
        emailInput.addEventListener('keydown', function (e) {
            if (!isDropdownVisible()) return;

            const options = dropdownContainer.querySelectorAll('.email-domain-option');
            const optionCount = options.length;

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    selectedIndex = (selectedIndex + 1) % optionCount;
                    updateSelection();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    selectedIndex = selectedIndex <= 0 ? optionCount - 1 : selectedIndex - 1;
                    updateSelection();
                    break;
                case 'ArrowRight':
                case 'Tab':
                    if (selectedIndex === -1 && optionCount > 0) {
                        selectedIndex = 0;
                    }
                    if (selectCurrentOption()) {
                        e.preventDefault();
                    }
                    break;
                case 'Enter':
                    if (selectedIndex >= 0) {
                        e.preventDefault();
                        selectCurrentOption();
                    } else if (optionCount > 0) {
                        e.preventDefault();
                        selectedIndex = 0;
                        selectCurrentOption();
                    }
                    break;
                case 'Escape':
                    e.preventDefault();
                    hideDomainSuggestions();
                    break;
            }
        });

        emailInput.addEventListener('blur', function () {
            setTimeout(hideDomainSuggestions, 150);
        });

        emailInput.addEventListener('focus', function () {
            const value = emailInput.value;
            const atIndex = value.indexOf('@');
            if (atIndex !== -1) {
                const username = value.substring(0, atIndex);
                const afterAt = value.substring(atIndex + 1);
                if (username) {
                    showDomainSuggestions(username, afterAt);
                }
            }
        });

        // Mailcheck for typo suggestion (blur event)
        if (suggestionDiv && suggestionLink && typeof Mailcheck !== 'undefined') {
            emailInput.addEventListener('blur', function () {
                const email = emailInput.value.trim();
                if (!email || !email.includes('@')) {
                    suggestionDiv.style.display = 'none';
                    return;
                }

                Mailcheck.run({
                    email: email,
                    domains: domains,
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
    }

    // Setup Nickname Check
    let nicknameChecked = false;
    let checkedNickname = '';
    let nicknameCheckTimeout = null;

    function setupNicknameCheck() {
        const nicknameInput = document.getElementById('signup-nickname');
        const checkBtn = document.getElementById('check-nickname-btn');
        const feedbackEl = document.getElementById('nickname-feedback');

        if (!nicknameInput || !feedbackEl) return;

        async function checkNickname(nickname) {
            if (!nickname) {
                feedbackEl.style.display = 'none';
                if (checkBtn) {
                    checkBtn.classList.remove('text-success', 'text-danger');
                    checkBtn.classList.add('text-muted');
                    checkBtn.textContent = '중복 확인';
                }
                return;
            }

            if (nickname.length < 2) {
                showNicknameFeedback(feedbackEl, '닉네임은 2자 이상이어야 합니다.', 'text-danger');
                if (checkBtn) {
                    checkBtn.classList.remove('text-success', 'text-muted');
                    checkBtn.classList.add('text-danger');
                    checkBtn.textContent = '확인 필요';
                }
                return;
            }

            // Show checking state
            if (checkBtn) {
                checkBtn.textContent = '확인 중...';
            }

            try {
                // Check if username exists in PocketBase
                const result = await pb.collection('users').getList(1, 1, {
                    filter: `username = "${nickname}"`
                });

                if (result.totalItems > 0) {
                    // Nickname already exists
                    nicknameChecked = false;
                    checkedNickname = '';
                    showNicknameFeedback(feedbackEl, '이미 사용 중인 닉네임입니다.', 'text-danger');
                    if (checkBtn) {
                        checkBtn.classList.remove('text-muted', 'text-success');
                        checkBtn.classList.add('text-danger');
                        checkBtn.textContent = '사용 불가';
                    }
                } else {
                    // Nickname is available
                    nicknameChecked = true;
                    checkedNickname = nickname;
                    showNicknameFeedback(feedbackEl, '사용 가능한 닉네임입니다.', 'text-success');
                    if (checkBtn) {
                        checkBtn.classList.remove('text-muted', 'text-danger');
                        checkBtn.classList.add('text-success');
                        checkBtn.textContent = '사용 가능 ✓';
                    }
                }
            } catch (error) {
                showNicknameFeedback(feedbackEl, '확인 중 오류가 발생했습니다.', 'text-danger');
                if (checkBtn) {
                    checkBtn.classList.add('text-muted');
                    checkBtn.textContent = '중복 확인';
                }
            }
        }

        // Auto-check on input with debounce
        nicknameInput.addEventListener('input', function () {
            const nickname = nicknameInput.value.trim();

            // Reset if nickname changed
            if (nickname !== checkedNickname) {
                nicknameChecked = false;
            }

            // Clear previous timeout
            if (nicknameCheckTimeout) {
                clearTimeout(nicknameCheckTimeout);
            }

            // Debounce: check after 500ms of no input
            nicknameCheckTimeout = setTimeout(() => {
                checkNickname(nickname);
            }, 500);
        });

        // Check nickname on button click (immediate)
        if (checkBtn) {
            checkBtn.addEventListener('click', function () {
                if (nicknameCheckTimeout) {
                    clearTimeout(nicknameCheckTimeout);
                }
                checkNickname(nicknameInput.value.trim());
            });
        }
    }

    function showNicknameFeedback(el, message, className) {
        el.textContent = message;
        el.className = 'form-text ' + className;
        el.style.display = 'block';
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
        const nickname = document.getElementById('signup-nickname').value.trim();
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const passwordConfirm = document.getElementById('signup-passwordConfirm').value;
        const messageEl = document.getElementById('auth-message');

        // Check if nickname was verified
        if (!nicknameChecked || nickname !== checkedNickname) {
            showMessage(messageEl, '닉네임 중복 확인을 해주세요.', 'text-danger');
            return;
        }

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
