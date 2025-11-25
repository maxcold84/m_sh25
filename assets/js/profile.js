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
    }

    async function loadUserProfile() {
        try {
            const currentUser = pb.authStore.model;

            // Load basic info (readonly)
            document.getElementById('name').value = currentUser.name || '';
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
                extraAddress: extraAddress
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
