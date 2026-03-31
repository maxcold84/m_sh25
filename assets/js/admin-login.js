import { getAdminPb } from './admin-auth.js';

function initAdminLoginPage() {
    const pb = getAdminPb();
    const form = document.getElementById('admin-login-form');
    const btn = document.getElementById('login-btn');
    const errorMessage = document.getElementById('error-message');

    if (!form || !btn || !errorMessage) {
        return;
    }

    if (pb.authStore.isValid && pb.authStore.isAdmin) {
        location.href = '/ko/admin/orders';
        return;
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        errorMessage.classList.remove('show');

        const email = document.getElementById('email-address').value;
        const password = document.getElementById('password').value;

        btn.disabled = true;
        btn.textContent = '로그인 중...';

        try {
            await pb.admins.authWithPassword(email, password);
            location.href = '/ko/admin/orders';
        } catch (error) {
            console.error(error);
            errorMessage.textContent = '로그인 실패: 이메일 또는 비밀번호를 확인해주세요.';
            errorMessage.classList.add('show');
            btn.disabled = false;
            btn.textContent = '로그인';
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdminLoginPage);
} else {
    initAdminLoginPage();
}

export default initAdminLoginPage;
