/**
 * Profile Module (ES6)
 * 사용자 프로필 및 주문 내역 관리
 * @module profile
 */
import { pb } from './core/pb-client.js';
import { showToast } from './core/utils.js';

function init() {
    // Page check: Only run on profile page
    const saveBtn = document.getElementById('save-button');
    const orderHistory = document.getElementById('order-history-list');

    if (!saveBtn && !orderHistory) {
        return; // Not on profile page
    }

    const currentUser = pb.authStore.model;

    if (!currentUser) {
        showToast('로그인이 필요합니다.', { isError: true });
        setTimeout(() => {
            window.location.href = '/login';
        }, 1500);
        return;
    }

    loadUserProfile();
    loadOrderHistory(); // Load orders

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
        const nameInput = document.getElementById('name');
        if (nameInput) nameInput.value = currentUser.name || '';

        const nicknameInput = document.getElementById('nickname');
        if (nicknameInput) nicknameInput.value = currentUser.username || '';

        const emailInput = document.getElementById('email');
        if (emailInput) emailInput.value = currentUser.email || '';

        // Load contact info (editable)
        const phoneInput = document.getElementById('phone');
        if (phoneInput) phoneInput.value = currentUser.phone || '';

        const postcodeInput = document.getElementById('postcode');
        if (postcodeInput) postcodeInput.value = currentUser.postcode || '';

        const addressInput = document.getElementById('address');
        if (addressInput) addressInput.value = currentUser.address || '';

        const detailAddressInput = document.getElementById('detailAddress');
        if (detailAddressInput) detailAddressInput.value = currentUser.detailAddress || '';

        const extraAddressInput = document.getElementById('extraAddress');
        if (extraAddressInput) extraAddressInput.value = currentUser.extraAddress || '';

    } catch (error) {
        console.error('Failed to load user profile:', error);
        showToast('프로필을 불러오는데 실패했습니다.', { isError: true });
    }
}

async function handleSave() {
    const saveBtn = document.getElementById('save-button');
    const currentUser = pb.authStore.model;

    if (!currentUser) {
        showToast('로그인이 필요합니다.', { isError: true });
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

        showToast('프로필이 성공적으로 저장되었습니다!', { isError: false });
    } catch (error) {
        console.error('Failed to save profile:', error);
        showToast('프로필 저장에 실패했습니다: ' + error.message, { isError: true });
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = '저장하기';
    }
}

async function loadOrderHistory() {
    const container = document.getElementById('order-history-list');
    const currentUser = pb.authStore.model;

    if (!currentUser || !container) return;

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
            let statusText = '';
            switch (order.status) {
                case 'paid':
                    statusBadge = '<span class="px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-xs font-semibold">결제완료</span>';
                    statusText = '결제완료';
                    break;
                case 'pending':
                    statusBadge = '<span class="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-xs font-semibold">대기중</span>';
                    statusText = '대기중';
                    break;
                case 'preparing':
                    statusBadge = '<span class="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold">상품준비중</span>';
                    statusText = '상품준비중';
                    break;
                case 'shipping':
                    statusBadge = '<span class="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-xs font-semibold">배송중</span>';
                    statusText = '배송중';
                    break;
                case 'delivered':
                    statusBadge = '<span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">배송완료</span>';
                    statusText = '배송완료';
                    break;
                case 'cancelled':
                    statusBadge = '<span class="px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-xs font-semibold">주문취소</span>';
                    statusText = '주문취소';
                    break;
                default:
                    statusBadge = '<span class="px-2 py-0.5 rounded-full bg-gray-100 text-gray-800 text-xs font-semibold">' + order.status + '</span>';
                    statusText = order.status;
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

            // 취소 가능 여부 (pending 또는 paid 상태만 취소 가능)
            const canCancel = order.status === 'pending' || order.status === 'paid';
            const cancelBtnHtml = canCancel ? `
                <button onclick="Profile.cancelOrder('${order.id}')" class="mt-2 w-full py-2 px-4 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors">
                    주문 취소
                </button>
            ` : '';

            // 배송조회 버튼 (shipping 또는 delivered 상태일 때만 표시)
            const canTrack = order.status === 'shipping' || order.status === 'delivered';
            const trackingNumber = order.tracking_number || '';
            const carrier = order.carrier || '';

            let trackingBtnHtml = '';
            if (canTrack && trackingNumber) {
                trackingBtnHtml = `
                    <button onclick="Profile.openTrackingModal('${carrier}', '${trackingNumber}')" class="mt-2 w-full py-2 px-4 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
                        </svg>
                        배송조회
                    </button>
                `;
            } else if (order.status === 'preparing') {
                trackingBtnHtml = `
                    <div class="mt-2 w-full py-2 px-4 bg-gray-100 text-gray-500 text-sm font-medium rounded-lg text-center">
                        상품 준비중입니다
                    </div>
                `;
            } else if (order.status === 'paid') {
                trackingBtnHtml = `
                    <div class="mt-2 w-full py-2 px-4 bg-gray-100 text-gray-500 text-sm font-medium rounded-lg text-center">
                        배송 준비 대기중
                    </div>
                `;
            }

            html += `
            <div class="border rounded-lg p-4 bg-gray-50" id="order-${order.id}">
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
                ${trackingBtnHtml}
                ${cancelBtnHtml}
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
        showToast('로그인이 필요합니다.', { isError: true });
        return;
    }

    const oldPassword = document.getElementById('oldPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const newPasswordConfirm = document.getElementById('newPasswordConfirm').value;

    if (!oldPassword || !newPassword || !newPasswordConfirm) {
        showToast('모든 필드를 입력해주세요.', { isError: true });
        return;
    }

    if (newPassword !== newPasswordConfirm) {
        showToast('새 비밀번호가 일치하지 않습니다.', { isError: true });
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

        showToast('비밀번호가 성공적으로 변경되었습니다.', { isError: false });

        // Clear inputs
        document.getElementById('oldPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('newPasswordConfirm').value = '';

    } catch (error) {
        console.error('Failed to change password:', error);
        showToast('비밀번호 변경 실패: ' + error.message, { isError: true });
    } finally {
        changeBtn.disabled = false;
        changeBtn.textContent = '비밀번호 변경';
    }
}

async function cancelOrder(orderId) {
    if (!confirm('정말로 이 주문을 취소하시겠습니까?\n취소 후에는 되돌릴 수 없습니다.')) {
        return;
    }

    try {
        // 주문 상태를 cancelled로 변경
        await pb.collection('orders').update(orderId, {
            status: 'cancelled'
        });

        showToast('주문이 성공적으로 취소되었습니다.', { isError: false });

        // 주문 내역 새로고침
        loadOrderHistory();
    } catch (error) {
        console.error('Failed to cancel order:', error);
        showToast('주문 취소에 실패했습니다: ' + error.message, { isError: true });
    }
}

// 택배사 정보
const carriers = {
    'cj': { name: 'CJ대한통운', url: 'https://www.cjlogistics.com/ko/tool/parcel/tracking?gnbInvcNo=' },
    'lotte': { name: '롯데택배', url: 'https://www.lotteglogis.com/home/reservation/tracking/index?InvNo=' },
    'hanjin': { name: '한진택배', url: 'https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do?mession=open&wblnum=' },
    'post': { name: '우체국택배', url: 'https://service.epost.go.kr/trace.RetrieveDomRi498.postal?sid1=' },
    'logen': { name: '로젠택배', url: 'https://www.ilogen.com/web/personal/trace/' },
    'cu': { name: 'CU편의점택배', url: 'https://www.cupost.co.kr/postbox/delivery/localResult.cupost?invoice_no=' },
    'gs': { name: 'GS Postbox 택배', url: 'https://www.cvsnet.co.kr/invoice/tracking.do?invoice_no=' },
    'kdexp': { name: '경동택배', url: 'https://kdexp.com/basicNew498.kd?barcode=' }
};

function openTrackingModal(carrier, trackingNumber) {
    const modal = document.getElementById('tracking-modal');
    const carrierSelect = document.getElementById('tracking-carrier');
    const numberInput = document.getElementById('tracking-number');

    if (carrier && carriers[carrier]) {
        carrierSelect.value = carrier;
    }
    if (trackingNumber) {
        numberInput.value = trackingNumber;
    }

    if (modal) modal.classList.remove('hidden');
}

function closeTrackingModal() {
    const modal = document.getElementById('tracking-modal');
    if (modal) modal.classList.add('hidden');
}

function trackDelivery() {
    const carrier = document.getElementById('tracking-carrier').value;
    const trackingNumber = document.getElementById('tracking-number').value.trim();

    if (!carrier) {
        showToast('택배사를 선택해주세요.', { isError: true });
        return;
    }
    if (!trackingNumber) {
        showToast('운송장 번호를 입력해주세요.', { isError: true });
        return;
    }

    const carrierInfo = carriers[carrier];
    if (carrierInfo) {
        window.open(carrierInfo.url + trackingNumber, '_blank');
    } else {
        showToast('지원하지 않는 택배사입니다.', { isError: true });
    }
}

// ============================================
// Export
// ============================================
export const Profile = {
    init,
    cancelOrder,
    openTrackingModal,
    closeTrackingModal,
    trackDelivery
};

// 하위 호환성: 전역 노출
if (typeof window !== 'undefined') {
    window.Profile = Profile;
}

// Auto-run if enabled (but safely checks for page elements)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default Profile;
