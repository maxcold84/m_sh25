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
        loadOrderHistory(); // Load orders

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

    async function loadOrderHistory() {
        const container = document.getElementById('order-history-list');
        const currentUser = pb.authStore.model;

        if (!currentUser) return;

        try {
            const orders = await pb.collection('orders').getFullList({
                filter: `user="${currentUser.id}"`,
                sort: '-created',
                expand: 'user' // Expand if needed, though we have currentUser
            });

            if (orders.length === 0) {
                container.innerHTML = '<div class="text-center py-6 text-gray-400 text-sm">주문 내역이 없습니다.</div>';
                return;
            }

            let html = '';
            for (const order of orders) {
                // Format Date
                const date = new Date(order.created).toLocaleDateString('ko-KR', {
                    year: 'numeric', month: 'long', day: 'numeric'
                });

                // Status Logic
                let statusBadge = '';
                if (order.status === 'paid') {
                    statusBadge = '<span class="px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-xs font-semibold">결제완료</span>';
                } else if (order.status === 'pending') {
                    statusBadge = '<span class="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-xs font-semibold">대기중</span>';
                } else {
                    statusBadge = '<span class="px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-xs font-semibold">' + order.status + '</span>';
                }

                // Items Logic
                let itemsHtml = '';
                if (order.items && order.items.length > 0) {
                    for (const item of order.items) {
                        let productTitle = '상품정보 없음';
                        let imgUrl = 'https://via.placeholder.com/60';

                        try {
                            const product = await pb.collection('products').getOne(item.product_id);
                            productTitle = product.title;
                            if (product.images && product.images.length > 0) {
                                imgUrl = pb.files.getUrl(product, product.images[0], { thumb: '100x100' });
                            }
                        } catch (e) {
                            productTitle = '삭제된 상품';
                        }

                        itemsHtml += `
                            <div class="flex items-center gap-3 mt-2">
                                <img src="${imgUrl}" class="w-12 h-12 object-cover rounded bg-gray-100 flex-shrink-0">
                                <div class="flex-1 min-w-0">
                                    <p class="text-sm font-medium text-gray-900 truncate">${productTitle}</p>
                                    <p class="text-xs text-gray-500">${item.qty}개 / ${(item.price || 0).toLocaleString()}원</p>
                                </div>
                            </div>
                        `;
                    }
                }

                html += `
                <div class="border rounded-lg p-4 bg-gray-50">
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <p class="text-xs text-gray-500 mb-1">${date}</p>
                            <p class="text-sm font-bold text-gray-900">주문번호: ${order.payment_id || order.id.substring(0, 8)}</p>
                        </div>
                        ${statusBadge}
                    </div>
                    <div class="divide-y divide-gray-200">
                        ${itemsHtml}
                    </div>
                    <div class="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center">
                        <span class="text-sm font-medium text-gray-600">총 결제금액</span>
                        <span class="text-base font-bold text-blue-600">${(order.total_amount || 0).toLocaleString()}원</span>
                    </div>
                </div>
                `;
            }

            container.innerHTML = html;

        } catch (error) {
            console.error('Failed to load order history:', error);
            container.innerHTML = '<div class="text-center py-6 text-red-500 text-sm">주문 내역을 불러오는데 실패했습니다.</div>';
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
