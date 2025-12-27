const Auth = (function () {
    const pb = new PocketBase(window.SiteConfig.pocketbaseUrl);

    // Track nickname check status
    let nicknameChecked = false;
    let checkedNickname = '';
    let nicknameCheckTimeout = null;

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
        $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
            const target = $(e.target).attr("href");
            if (history.pushState) {
                history.pushState(null, null, target);
            } else {
                location.hash = target;
            }
        });

        const loginForm = document.getElementById('login-form');
        const signupForm = document.getElementById('signup-form');
        const logoutBtn = document.getElementById('logout-btn'); // Handles navbar logout if present
        const authLogoutLink = document.getElementById('auth-logout-link'); // Handles auth page logout

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

        if (signupForm) {
            signupForm.addEventListener('submit', handleSignup);
            setupEmailAutocomplete(signupForm, 'signup-email');
            setupNicknameCheck();
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
        }

        if (authLogoutLink) {
            authLogoutLink.addEventListener('click', (e) => {
                e.preventDefault();
                handleLogout();
            });
        }

        // Profile Update Form
        const profileForm = document.getElementById('profile-form');
        if (profileForm) {
            loadProfile();
            profileForm.addEventListener('submit', handleProfileUpdate);
        }

        // OAuth2 Login Handlers
        const oauthButtons = document.querySelectorAll('.oauth-btn');
        oauthButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Find the closest button element if click target was an icon/text inside
                const button = e.target.closest('.oauth-btn');
                if (button) {
                    const provider = button.dataset.provider;
                    handleOAuth2Login(provider);
                }
            });
        });
    }

    function updateAuthUI() {
        const isLoggedIn = pb.authStore.isValid;
        const user = pb.authStore.model;

        // Toggles
        document.querySelectorAll('.auth-hidden').forEach(el => el.style.display = isLoggedIn ? 'none' : 'block');
        document.querySelectorAll('.auth-visible').forEach(el => el.style.display = isLoggedIn ? 'block' : 'none');

        // specific links
        const loginLink = document.getElementById('auth-login-link');
        const signupLink = document.getElementById('auth-signup-link');
        const logoutLink = document.getElementById('auth-logout-link');
        const profileLink = document.getElementById('auth-profile-link');

        if (isLoggedIn) {
            if (loginLink) loginLink.style.display = 'none';
            if (signupLink) signupLink.style.display = 'none';
            if (logoutLink) logoutLink.style.display = 'block';
            if (profileLink) profileLink.style.display = 'block';
        } else {
            if (loginLink) loginLink.style.display = 'block';
            if (signupLink) signupLink.style.display = 'block';
            if (logoutLink) logoutLink.style.display = 'none';
            if (profileLink) profileLink.style.display = 'none';
        }

        // Update User Info Display
        const userNameEls = document.querySelectorAll('.auth-user-name');
        if (userNameEls.length > 0) {
            const name = user?.name || user?.username || 'User';
            userNameEls.forEach(el => el.textContent = name);
        }

        // Avatar
        const avatarEls = document.querySelectorAll('.auth-user-avatar');
        const avatarImg = document.getElementById('nav-avatar-img');
        const avatarIcon = document.getElementById('nav-avatar-icon');

        if (user?.avatar) {
            const avatarUrl = pb.files.getUrl(user, user.avatar, { thumb: '100x100' });
            avatarEls.forEach(el => el.src = avatarUrl);

            if (avatarImg) {
                avatarImg.src = avatarUrl;
                avatarImg.style.display = 'block';
            }
            if (avatarIcon) avatarIcon.style.display = 'none';
        } else {
            if (avatarImg) avatarImg.style.display = 'none';
            if (avatarIcon) avatarIcon.style.display = 'block';
        }

        // Welcome toast
        if (isLoggedIn && !sessionStorage.getItem('welcomeShown')) {
            const userName = user.name || user.email;
            showToast(`환영합니다, ${userName}님!`);
            sessionStorage.setItem('welcomeShown', 'true');
        } else if (!isLoggedIn) {
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
            console.error('Login failed:', error);
            showMessage(messageEl, '로그인 실패: 이메일 또는 비밀번호를 확인해주세요.', 'text-danger');
        }
    }

    async function handleSignup(e) {
        e.preventDefault();
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const passwordConfirm = document.getElementById('signup-passwordConfirm').value || document.getElementById('signup-password-confirm').value; // Handle both IDs just in case
        const name = document.getElementById('signup-name').value;
        const nickname = document.getElementById('signup-nickname').value.trim();
        const messageEl = document.getElementById('auth-message');

        // Check if nickname was verified
        if (!nicknameChecked || nickname !== checkedNickname) {
            showMessage(messageEl, '닉네임 중복 확인을 해주세요.', 'text-danger');
            return;
        }

        if (password !== passwordConfirm) {
            showMessage(messageEl, '비밀번호가 일치하지 않습니다.', 'text-danger');
            return;
        }

        try {
            const data = {
                "username": nickname, // Use nickname as username
                "email": email,
                "emailVisibility": true,
                "password": password,
                "passwordConfirm": passwordConfirm,
                "name": name
            };

            await pb.collection('users').create(data);
            await pb.collection('users').authWithPassword(email, password);

            alert('회원가입 성공!');
            window.location.href = '/';

        } catch (error) {
            console.error('Signup failed:', error);
            let msg = '회원가입 실패';
            if (error.data && error.data.data) {
                msg += ': ' + Object.keys(error.data.data).join(', ') + ' 오류';
            } else if (error.message) {
                msg += ': ' + error.message;
            }
            showMessage(messageEl, msg, 'text-danger');
        }
    }

    async function handleOAuth2Login(provider) {
        try {
            const authData = await pb.collection('users').authWithOAuth2({ provider: provider });
            window.location.href = '/';
        } catch (error) {
            const messageEl = document.getElementById('auth-message');
            showMessage(messageEl, `Login with ${provider} failed: ` + error.message, 'text-danger');
        }
    }

    function handleLogout() {
        pb.authStore.clear();
        localStorage.removeItem('cart_id');
        window.location.href = '/';
    }

    async function loadProfile() {
        if (!pb.authStore.isValid) return;
        const user = pb.authStore.model;

        const nameInput = document.getElementById('profile-name');
        const emailInput = document.getElementById('profile-email');

        if (nameInput) nameInput.value = user.name || '';
        if (emailInput) emailInput.value = user.email || '';
    }

    async function handleProfileUpdate(e) {
        e.preventDefault();
        const name = document.getElementById('profile-name').value;

        try {
            await pb.collection('users').update(pb.authStore.model.id, {
                name: name
            });
            alert('프로필이 업데이트되었습니다.');
            updateAuthUI();
        } catch (error) {
            console.error('Profile update failed:', error);
            alert('업데이트 실패: ' + error.message);
        }
    }

    // --- Helper Functions ---

    function showMessage(el, message, className) {
        if (el) {
            el.innerText = message;
            el.className = 'mt-3 text-center ' + className;
            el.style.display = 'block';
        } else {
            alert(message);
        }
    }

    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg text-sm z-50 transition-opacity duration-300';
        toast.style.opacity = '0';
        toast.innerText = message;
        document.body.appendChild(toast);

        requestAnimationFrame(() => {
            toast.style.opacity = '1';
        });

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }

    function setupEmailAutocomplete(form, emailInputId) {
        const emailInput = form.querySelector('#' + emailInputId);
        if (!emailInput) return;

        const domains = ['gmail.com', 'naver.com', 'daum.net', 'kakao.com', 'outlook.com', 'hanmail.net', 'nate.com'];
        let selectedIndex = -1;

        let dropdownContainer = document.createElement('div');
        dropdownContainer.className = 'email-domain-dropdown';
        dropdownContainer.style.cssText = `
            position: absolute; background: white; border: 1px solid #ddd; border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15); max-height: 200px; overflow-y: auto; z-index: 1000;
            display: none; width: 100%;
        `;
        emailInput.parentElement.style.position = 'relative';
        emailInput.parentElement.appendChild(dropdownContainer);

        function updateSelection() {
            const options = dropdownContainer.querySelectorAll('.email-domain-option');
            options.forEach((opt, idx) => {
                opt.style.backgroundColor = (idx === selectedIndex) ? '#e0e7ff' : 'white';
                if (idx === selectedIndex) opt.scrollIntoView({ block: 'nearest' });
            });
        }

        function showDomainSuggestions(username, filterText = '') {
            dropdownContainer.innerHTML = '';
            selectedIndex = -1;
            const filteredDomains = filterText ? domains.filter(d => d.startsWith(filterText.toLowerCase())) : domains;

            if (filteredDomains.length === 0) {
                dropdownContainer.style.display = 'none';
                return;
            }

            filteredDomains.forEach(domain => {
                const option = document.createElement('div');
                option.className = 'email-domain-option';
                option.style.cssText = 'padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #eee; transition: background-color 0.1s;';
                option.textContent = username + '@' + domain;
                option.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    emailInput.value = username + '@' + domain;
                    dropdownContainer.style.display = 'none';
                });
                option.addEventListener('mouseenter', () => {
                    selectedIndex = Array.from(dropdownContainer.children).indexOf(option);
                    updateSelection();
                });
                dropdownContainer.appendChild(option);
            });
            dropdownContainer.style.display = 'block';
        }

        emailInput.addEventListener('input', function () {
            const value = emailInput.value;
            const atIndex = value.indexOf('@');
            if (atIndex !== -1) {
                const username = value.substring(0, atIndex);
                const afterAt = value.substring(atIndex + 1);
                if (username) showDomainSuggestions(username, afterAt);
                else dropdownContainer.style.display = 'none';
            } else {
                dropdownContainer.style.display = 'none';
            }
        });

        emailInput.addEventListener('blur', function () {
            setTimeout(() => { dropdownContainer.style.display = 'none'; }, 150);
        });

        // Keyboard nav (simplified)
        emailInput.addEventListener('keydown', function (e) {
            if (dropdownContainer.style.display === 'block') {
                const options = dropdownContainer.querySelectorAll('.email-domain-option');
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    selectedIndex = (selectedIndex + 1) % options.length;
                    updateSelection();
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    selectedIndex = (selectedIndex - 1 + options.length) % options.length;
                    updateSelection();
                } else if (e.key === 'Enter') {
                    if (selectedIndex >= 0) {
                        e.preventDefault();
                        emailInput.value = options[selectedIndex].textContent;
                        dropdownContainer.style.display = 'none';
                    }
                }
            }
        });
    }

    function setupNicknameCheck() {
        const nicknameInput = document.getElementById('signup-nickname');
        const feedbackEl = document.getElementById('nickname-feedback');
        if (!nicknameInput || !feedbackEl) return;

        async function checkNickname(nickname) {
            if (!nickname || nickname.length < 2) {
                feedbackEl.style.display = 'none';
                nicknameChecked = false;
                return;
            }
            try {
                const result = await pb.collection('users').getList(1, 1, { filter: `username = "${nickname}"` });
                if (result.totalItems > 0) {
                    nicknameChecked = false;
                    feedbackEl.textContent = '이미 사용 중인 닉네임입니다.';
                    feedbackEl.className = 'form-text text-danger';
                } else {
                    nicknameChecked = true;
                    checkedNickname = nickname;
                    feedbackEl.textContent = '사용 가능한 닉네임입니다.';
                    feedbackEl.className = 'form-text text-success';
                }
                feedbackEl.style.display = 'block';
            } catch (error) {
                console.error(error);
            }
        }

        nicknameInput.addEventListener('input', function () {
            const nickname = nicknameInput.value.trim();
            if (nickname !== checkedNickname) nicknameChecked = false;
            if (nicknameCheckTimeout) clearTimeout(nicknameCheckTimeout);
            nicknameCheckTimeout = setTimeout(() => { checkNickname(nickname); }, 500);
        });
    }

    return {
        init: init
    };
})();

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Auth.init());
} else {
    Auth.init();
}
