const Profile = (function () {
    const pb = new PocketBase('http://127.0.0.1:8090');

    function init() {
        const currentUser = pb.authStore.model;

        if (!currentUser) {
            showToast('로그인이 필요합니다.', true);
            setTimeout(() => {
                window.location.href = '/login';
            }, 1500);
            return;
        }

        loadUserProfile();

        const saveBtn = document.getElementById('save-button');
        if (saveBtn) {
            saveBtn.addEventListener('click', handleSave);
        }

        const changePasswordBtn = document.getElementById('change-password-btn');
        if (changePasswordBtn) {
            changePasswordBtn.addEventListener('click', handlePasswordChange);
        }
    }

    async function loadUserProfile() {
        try {
            const currentUser = pb.authStore.model;

            // Load basic info (readonly)
            document.getElementById('name').value = currentUser.name || '';
            document.getElementById('nickname').value = currentUser.username || '';
            document.getElementById('email').value = currentUser.email || '';

            // Load contact info (editable)
            document.getElementById('phone').value = currentUser.phone || '';
            document.getElementById('postcode').value = currentUser.postcode || '';
            document.getElementById('address').value = currentUser.address || '';
            document.getElementById('detailAddress').value = currentUser.detailAddress || '';
            document.getElementById('extraAddress').value = currentUser.extraAddress || '';
        } catch (error) {
            console.error('Failed to load user profile:', error);
            showToast('프로필을 불러오는데 실패했습니다.', true);
        }
    }

    async function handleSave() {
        const saveBtn = document.getElementById('save-button');
        const currentUser = pb.authStore.model;

        if (!currentUser) {
            showToast('로그인이 필요합니다.', true);
            return;
        }

        // Get form data
        const nickname = document.getElementById('nickname').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const postcode = document.getElementById('postcode').value.trim();
        const address = document.getElementById('address').value.trim();
        const detailAddress = document.getElementById('detailAddress').value.trim();
        const extraAddress = document.getElementById('extraAddress').value.trim();

        // Disable button during save
        saveBtn.disabled = true;
        saveBtn.textContent = '저장중...';

        try {
            const data = {
                phone: phone,
                postcode: postcode,
                address: address,
                detailAddress: detailAddress,
                extraAddress: extraAddress,
                username: nickname
            };

            // Update user record
            await pb.collection('users').update(currentUser.id, data);

            // Refresh auth store to get updated user data
            await pb.collection('users').authRefresh();

            showToast('프로필이 성공적으로 저장되었습니다!', false);
        } catch (error) {
            console.error('Failed to save profile:', error);
            showToast('프로필 저장에 실패했습니다: ' + error.message, true);
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = '저장하기';
        }
    }

    async function handlePasswordChange() {
        const changeBtn = document.getElementById('change-password-btn');
        const currentUser = pb.authStore.model;

        if (!currentUser) {
            showToast('로그인이 필요합니다.', true);
            return;
        }

        const oldPassword = document.getElementById('oldPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const newPasswordConfirm = document.getElementById('newPasswordConfirm').value;

        if (!oldPassword || !newPassword || !newPasswordConfirm) {
            showToast('모든 필드를 입력해주세요.', true);
            return;
        }

        if (newPassword !== newPasswordConfirm) {
            showToast('새 비밀번호가 일치하지 않습니다.', true);
            return;
        }

        // Disable button
        changeBtn.disabled = true;
        changeBtn.textContent = '변경중...';

        try {
            await pb.collection('users').update(currentUser.id, {
                oldPassword: oldPassword,
                password: newPassword,
                passwordConfirm: newPasswordConfirm
            });

            showToast('비밀번호가 성공적으로 변경되었습니다.', false);

            // Clear inputs
            document.getElementById('oldPassword').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('newPasswordConfirm').value = '';

        } catch (error) {
            console.error('Failed to change password:', error);
            showToast('비밀번호 변경 실패: ' + error.message, true);
        } finally {
            changeBtn.disabled = false;
            changeBtn.textContent = '비밀번호 변경';
        }
    }

    function showToast(message, isError = false) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `fixed top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg shadow-lg text-sm transition-opacity duration-300 pointer-events-none z-50 ${isError ? 'bg-red-600 text-white' : 'bg-gray-800 text-white'}`;
        toast.style.opacity = '1';
        setTimeout(() => toast.style.opacity = '0', 3000);
    }

    return {
        init: init
    };
})();

document.addEventListener('DOMContentLoaded', Profile.init);
