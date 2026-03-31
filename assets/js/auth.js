/**
 * Auth Module (ES6)
 * 사용자 인증 관리 (로그인, 회원가입, OAuth)
 * @module auth
 */
import { pb } from './core/pb-client.js';

const Auth = (function () {
    // Track nickname check status
    let nicknameChecked = false;
    let checkedNickname = '';
    let nicknameCheckTimeout = null;
    let nicknameCheckRequestId = 0;
    const AUTH_REDIRECT_KEY = 'auth_redirect';
    const AUTH_TABS = ['login', 'signup'];

    function init() {
        updateAuthUI();

        // Redirect if already logged in and on login/signup page
        const isAuthPage = window.location.pathname.includes('/login/') ||
            window.location.pathname.includes('/signup/') ||
            window.location.pathname.endsWith('/login') ||
            window.location.pathname.endsWith('/signup');

        if (pb.authStore.isValid && isAuthPage) {
            console.log('[Auth] Already logged in, redirecting to home...');
            window.location.href = getHomeUrl();
            return;
        }

        // Listen for auth state changes
        pb.authStore.onChange(() => {
            updateAuthUI();
        });

        // Tab switching
        setupAuthTabs();

        // LOGOUT Handler
        const logoutButton = document.getElementById('auth-logout-link');
        if (logoutButton) {
            logoutButton.addEventListener('click', (e) => {
                e.preventDefault();
                logout();
            });
        }

        // Login Form Submission
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', handleLogin);
        }

        // Signup Form Submission
        const signupForm = document.getElementById('signup-form');
        if (signupForm) {
            signupForm.addEventListener('submit', handleSignup);
        }

        // Email Autocomplete & Mailcheck
        const emailInputs = document.querySelectorAll('input[type="email"]');
        emailInputs.forEach(input => {
            input.addEventListener('blur', handleMailcheck); // Use blur for typo check
            input.addEventListener('input', handleEmailAutocomplete);
        });

        // Remember Email Initialization
        const rememberEmailCheckbox = document.getElementById('remember-email');
        const loginEmailInput = document.getElementById('login-email');
        if (rememberEmailCheckbox && loginEmailInput) {
            const savedEmail = localStorage.getItem('remembered_email');
            if (savedEmail) {
                loginEmailInput.value = savedEmail;
                rememberEmailCheckbox.checked = true;
            }
        }

        // OAuth buttons
        const oauthButtons = document.querySelectorAll('.oauth-login-btn');
        oauthButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const button = e.currentTarget;
                if (button) {
                    const provider = button.dataset.provider;
                    handleOAuth2Login(provider);
                }
            });
        });

        // Nickname check setup
        setupNicknameCheck();
    }

    function setupAuthTabs() {
        const tabButtons = Array.from(document.querySelectorAll('[data-auth-tab]'));
        const tabPanels = new Map(
            Array.from(document.querySelectorAll('[data-auth-panel]')).map(panel => [panel.dataset.authPanel, panel])
        );

        if (!tabButtons.length || !tabPanels.size) {
            return;
        }

        const getDefaultTab = () => {
            const activeButton = tabButtons.find(button => button.getAttribute('aria-selected') === 'true');
            const fallbackTab = activeButton?.dataset.authTab || tabButtons[0]?.dataset.authTab || 'login';
            return AUTH_TABS.includes(fallbackTab) ? fallbackTab : 'login';
        };

        const setActiveTab = (tabName, options = {}) => {
            if (!AUTH_TABS.includes(tabName) || !tabPanels.has(tabName)) {
                return;
            }

            const { updateUrl = true } = options;

            tabButtons.forEach(button => {
                const isActive = button.dataset.authTab === tabName;
                button.classList.toggle('bg-white', isActive);
                button.classList.toggle('text-slate-900', isActive);
                button.classList.toggle('shadow-sm', isActive);
                button.classList.toggle('ring-1', isActive);
                button.classList.toggle('ring-slate-200', isActive);
                button.classList.toggle('text-slate-500', !isActive);
                button.setAttribute('aria-selected', String(isActive));
                button.tabIndex = isActive ? 0 : -1;
            });

            tabPanels.forEach((panel, panelName) => {
                panel.hidden = panelName !== tabName;
            });

            if (updateUrl) {
                const nextUrl = new URL(window.location.href);
                nextUrl.hash = tabName;
                window.history.replaceState(null, '', nextUrl.toString());
            }
        };

        const requestedTab = window.location.hash.replace('#', '');
        setActiveTab(AUTH_TABS.includes(requestedTab) ? requestedTab : getDefaultTab(), { updateUrl: false });

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                setActiveTab(button.dataset.authTab || 'login');
            });
        });

        window.addEventListener('hashchange', () => {
            const hashTab = window.location.hash.replace('#', '');
            if (AUTH_TABS.includes(hashTab)) {
                setActiveTab(hashTab, { updateUrl: false });
            }
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

        // User display
        const userDisplay = document.getElementById('auth-user-name');
        const avatarEl = document.getElementById('nav-avatar-img');
        const avatarIcon = document.getElementById('nav-avatar-icon');

        if (userDisplay && isLoggedIn && user) {
            userDisplay.textContent = user.name || user.username || user.email || 'User';
        }

        if (isLoggedIn && user) {
            if (avatarEl && user.avatar) {
                const avatarUrl = pb.files.getUrl(user, user.avatar, { thumb: '50x50' });
                avatarEl.src = avatarUrl;
                avatarEl.style.display = 'block';
                if (avatarIcon) avatarIcon.style.display = 'none';
            } else if (avatarIcon) {
                avatarIcon.style.display = 'block';
                if (avatarEl) avatarEl.style.display = 'none';
            }
        } else {
            if (avatarEl) avatarEl.style.display = 'none';
            if (avatarIcon) avatarIcon.style.display = 'none';
        }
    }

    async function handleLogin(event) {
        event.preventDefault();
        const form = event.target;
        const email = form.email.value;
        const password = form.password.value;
        const messageEl = document.getElementById('login-message');

        try {
            showMessage(messageEl, '로그인 중...', 'info');
            await pb.collection('users').authWithPassword(email, password);
            showMessage(messageEl, '로그인 성공!', 'success');
            showToast('로그인 성공!');

            // Remember Email logic
            const rememberEmailCheckbox = document.getElementById('remember-email');
            if (rememberEmailCheckbox && rememberEmailCheckbox.checked) {
                localStorage.setItem('remembered_email', email);
            } else {
                localStorage.removeItem('remembered_email');
            }

            setTimeout(() => {
                window.location.href = consumeAuthRedirect();
            }, 500);
        } catch (error) {
            console.error('Login failed:', error);
            showMessage(messageEl, '이메일 또는 비밀번호가 일치하지 않습니다.', 'danger');
        }
    }

    async function handleSignup(event) {
        event.preventDefault();
        const form = event.target;
        const email = form.email.value;
        const password = form.password.value;
        const passwordConfirm = form.passwordConfirm.value;
        const name = form.name?.value || '';
        const nickname = form.nickname?.value || '';
        const messageEl = document.getElementById('signup-message');

        if (password !== passwordConfirm) {
            showMessage(messageEl, '비밀번호가 일치하지 않습니다.', 'danger');
            return;
        }

        if (nickname && (!nicknameChecked || nickname !== checkedNickname)) {
            showMessage(messageEl, '닉네임 중복 확인이 필요합니다.', 'warning');
            return;
        }

        try {
            showMessage(messageEl, '회원가입 처리 중...', 'info');

            const data = {
                email: email,
                password: password,
                passwordConfirm: passwordConfirm,
                name: name,
                username: nickname || email.split('@')[0]
            };

            await pb.collection('users').create(data);
            await pb.collection('users').authWithPassword(email, password);

            showMessage(messageEl, '회원가입 성공! 로그인 중...', 'success');
            showToast('회원가입을 축하합니다!');

            setTimeout(() => {
                window.location.href = getHomeUrl();
            }, 1000);
        } catch (error) {
            console.error('Signup failed:', error);
            let errorMsg = '회원가입에 실패했습니다.';
            if (error.data?.data?.email) {
                errorMsg = '이미 가입된 이메일입니다.';
            } else if (error.data?.data?.username) {
                errorMsg = '이미 사용 중인 닉네임입니다.';
            }
            showMessage(messageEl, errorMsg, 'danger');
        }
    }

    async function handleOAuth2Login(provider) {
        try {
            // Store current URL for redirect after login
            const currentUrl = window.location.pathname + window.location.search + window.location.hash;
            storeAuthRedirect(currentUrl);

            const authData = await pb.collection('users').authWithOAuth2({ provider });

            if (authData && authData.record) {
                showToast(`${provider} 로그인 성공!`);
                window.location.href = consumeAuthRedirect();
            }
        } catch (error) {
            console.error(`${provider} OAuth login failed:`, error);
            showToast(`${provider} 로그인에 실패했습니다.`);
        }
    }

    function logout() {
        pb.authStore.clear();
        showToast('로그아웃 되었습니다.');
        window.location.href = getHomeUrl();
    }

    function showMessage(el, message, className) {
        if (el) {
            el.innerText = message;
            el.className = 'rounded-xl border px-4 py-3 text-center text-sm ' + getMessageToneClasses(className);
            el.hidden = false;
        } else {
            alert(message);
        }
    }

    function getMessageToneClasses(tone) {
        switch (tone) {
            case 'success':
                return 'border-emerald-200 bg-emerald-50 text-emerald-700';
            case 'warning':
                return 'border-amber-200 bg-amber-50 text-amber-700';
            case 'danger':
                return 'border-rose-200 bg-rose-50 text-rose-700';
            case 'info':
            default:
                return 'border-sky-200 bg-sky-50 text-sky-700';
        }
    }

    function getNicknameToneClass(tone) {
        switch (tone) {
            case 'success':
                return 'text-emerald-600';
            case 'warning':
                return 'text-amber-600';
            case 'danger':
                return 'text-rose-600';
            default:
                return 'text-slate-500';
        }
    }

    function getHomeUrl() {
        const isKo = document.documentElement.lang === 'ko' || window.location.pathname.includes('/ko/');
        return isKo ? '/ko/' : '/';
    }

    function isSafeRedirectPath(value) {
        if (typeof value !== 'string' || value.length === 0) {
            return false;
        }

        if (!value.startsWith('/') || value.startsWith('//')) {
            return false;
        }

        try {
            const url = new URL(value, window.location.origin);
            return url.origin === window.location.origin;
        } catch (error) {
            return false;
        }
    }

    function storeAuthRedirect(value) {
        if (isSafeRedirectPath(value)) {
            sessionStorage.setItem(AUTH_REDIRECT_KEY, value);
            return;
        }

        sessionStorage.removeItem(AUTH_REDIRECT_KEY);
    }

    function consumeAuthRedirect() {
        const storedRedirect = sessionStorage.getItem(AUTH_REDIRECT_KEY);
        sessionStorage.removeItem(AUTH_REDIRECT_KEY);

        return isSafeRedirectPath(storedRedirect) ? storedRedirect : getHomeUrl();
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

    function handleEmailAutocomplete(event) {
        const input = event.target;
        const value = input.value;
        const atIndex = value.indexOf('@');

        if (atIndex === -1 || value.endsWith('@')) {
            return;
        }

        const domains = ['gmail.com', 'naver.com', 'daum.net', 'hanmail.net', 'kakao.com'];
        const currentDomain = value.slice(atIndex + 1);
        const matchedDomain = domains.find(d => d.startsWith(currentDomain) && d !== currentDomain);

        let datalist = document.getElementById('emailDomains');
        if (!datalist) {
            datalist = document.createElement('datalist');
            datalist.id = 'emailDomains';
            document.body.appendChild(datalist);
            input.setAttribute('list', 'emailDomains');
        }

        datalist.innerHTML = '';
        if (matchedDomain) {
            const localPart = value.slice(0, atIndex);
            domains.forEach(domain => {
                if (domain.startsWith(currentDomain)) {
                    const option = document.createElement('option');
                    option.value = localPart + '@' + domain;
                    datalist.appendChild(option);
                }
            });
        }
    }

    function handleMailcheck(event) {
        const input = event.target;
        if (typeof Mailcheck === 'undefined') return;

        Mailcheck.run({
            email: input.value,
            suggested: function (suggestion) {
                const suggestionLink = document.getElementById('email-suggestion-link');
                const suggestionContainer = document.getElementById('email-suggestion');
                if (suggestionLink && suggestionContainer) {
                    suggestionLink.textContent = suggestion.full;
                    suggestionContainer.hidden = false;
                    suggestionLink.onclick = (e) => {
                        e.preventDefault();
                        input.value = suggestion.full;
                        suggestionContainer.hidden = true;
                    };
                }
            },
            empty: function () {
                const suggestionContainer = document.getElementById('email-suggestion');
                if (suggestionContainer) suggestionContainer.hidden = true;
            }
        });
    }

    async function checkNickname(nickname) {
        if (!nickname || nickname.length < 2) {
            updateNicknameStatus('', '');
            nicknameChecked = false;
            checkedNickname = '';
            return;
        }

        const requestId = ++nicknameCheckRequestId;

        try {
            const result = await pb.collection('users').getList(1, 1, {
                filter: `username = "${nickname}"`
            });

            if (requestId !== nicknameCheckRequestId) {
                return;
            }

            if (result.totalItems > 0) {
                updateNicknameStatus('이미 사용 중인 닉네임입니다.', 'danger');
                nicknameChecked = false;
                checkedNickname = '';
            } else {
                updateNicknameStatus('사용 가능한 닉네임입니다.', 'success');
                nicknameChecked = true;
                checkedNickname = nickname;
            }
        } catch (error) {
            if (requestId !== nicknameCheckRequestId) {
                return;
            }

            console.error('Nickname check failed:', error);
            updateNicknameStatus('닉네임 확인 중 오류가 발생했습니다.', 'warning');
            nicknameChecked = false;
            checkedNickname = '';
        }
    }

    function updateNicknameStatus(message, className) {
        const statusEl = document.getElementById('nickname-status');
        if (statusEl) {
            statusEl.textContent = message;
            statusEl.className = 'text-sm font-medium ' + getNicknameToneClass(className);
            statusEl.hidden = !message;
        }
    }

    function setupNicknameCheck() {
        const nicknameInput = document.getElementById('signup-nickname');
        if (!nicknameInput) return;

        nicknameInput.addEventListener('input', function () {
            const nickname = nicknameInput.value.trim();
            if (nickname !== checkedNickname) {
                nicknameChecked = false;
                checkedNickname = '';
            }
            if (nicknameCheckTimeout) clearTimeout(nicknameCheckTimeout);
            nicknameCheckTimeout = setTimeout(() => { checkNickname(nickname); }, 500);
        });
    }

    return {
        init: init,
        logout: logout,
        handleOAuth2Login: handleOAuth2Login
    };
})();

// ============================================
// 하위 호환성: 전역 노출
// ============================================
if (typeof window !== 'undefined') {
    window.Auth = Auth;
}

// Auto-init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Auth.init());
} else {
    Auth.init();
}

export { Auth };
export default Auth;
