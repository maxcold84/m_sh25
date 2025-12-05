window.AdminOrders = (function () {
    let pb;
    let allOrders = [];
    const ITEMS_PER_PAGE = 20;
    let currentPage = 1;
    let currentOrderId = null;

    // 택배사 목록
    const CARRIERS = {
        cj: { name: 'CJ대한통운', trackUrl: 'https://www.cjlogistics.com/ko/tool/parcel/tracking?gnbInvcNo=' },
        hanjin: { name: '한진택배', trackUrl: 'https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do?mession=open&wblnum=' },
        lotte: { name: '롯데택배', trackUrl: 'https://www.lotteglogis.com/open/tracking?invno=' },
        logen: { name: '로젠택배', trackUrl: 'https://www.ilogen.com/web/personal/trace/' },
        post: { name: '우체국택배', trackUrl: 'https://service.epost.go.kr/trace.RetrieveDomRi498.postal?sid1=' },
        epost: { name: '우체국EMS', trackUrl: 'https://service.epost.go.kr/trace.RetrieveEmsRi498.postal?POST_CODE=' },
        kdexp: { name: '경동택배', trackUrl: 'https://kdexp.com/basicNew498.kd?barcode=' }
    };

    function init() {
        console.log('AdminOrders initialized');
        pb = new PocketBase('http://127.0.0.1:8090');

        // Strict Admin Check
        if (!pb.authStore.isValid || !pb.authStore.isAdmin) {
            window.location.href = '/ko/admin/login';
            return;
        }

        setupEventListeners();
        loadOrders();
    }



    function setupEventListeners() {
        // Logout
        document.getElementById('admin-logout-btn').addEventListener('click', () => {
            pb.authStore.clear();
            window.location.href = '/ko/admin/login';
        });

        // Filter
        document.getElementById('status-filter').addEventListener('change', () => {
            currentPage = 1;
            renderOrders();
        });

        // Refresh
        document.getElementById('refresh-btn').addEventListener('click', loadOrders);
    }

    async function loadOrders() {
        const tableBody = document.getElementById('orders-table-body');
        const countSpan = document.getElementById('total-orders-count');

        tableBody.innerHTML = '<tr><td colspan="7" class="px-6 py-10 text-center text-gray-500">불러오는 중...</td></tr>';

        try {
            // Fetch all orders sorted by latest
            // Note: For large scale, we should use getList with pagination from DB. 
            // For now, getting full list to handle client-side filtering easily as per requirement scope.
            const records = await pb.collection('orders').getFullList({
                sort: '-created',
                expand: 'user'
            });

            allOrders = records;
            countSpan.textContent = allOrders.length;
            renderOrders();

        } catch (err) {
            console.error('Failed to load orders:', err);
            // If error is 403, it means not admin logic or rule issue
            if (err.status === 403) {
                alert('권한이 없습니다. 다시 로그인해주세요.');
                window.location.href = '/ko/admin/login';
            } else {
                tableBody.innerHTML = `<tr><td colspan="7" class="px-6 py-10 text-center text-red-500">오류가 발생했습니다: ${err.message}</td></tr>`;
            }
        }
    }

    function renderOrders() {
        const tableBody = document.getElementById('orders-table-body');
        const statusFilter = document.getElementById('status-filter').value;

        // Filter
        let filtered = allOrders;
        if (statusFilter) {
            filtered = allOrders.filter(o => o.status === statusFilter);
        }

        // Pagination Logic
        const totalItems = filtered.length;
        const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        const pageItems = filtered.slice(start, end);

        if (pageItems.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" class="px-6 py-10 text-center text-gray-500">주문 내역이 없습니다.</td></tr>';
            renderPagination(0, 0);
            return;
        }

        let html = '';
        pageItems.forEach(order => {
            const user = order.expand?.user;
            const buyerName = order.buyer_details?.customer?.fullName || user?.name || 'Unknown';
            const buyerEmail = order.buyer_details?.customer?.email || user?.email || '-';

            // Format Date
            const date = new Date(order.created).toLocaleDateString('ko-KR', {
                year: 'numeric', month: 'long', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });

            // Status Badge
            let statusClass = 'bg-gray-100 text-gray-800';
            let statusText = order.status || '-';
            if (order.status === 'paid') statusClass = 'bg-green-100 text-green-800';
            else if (order.status === 'shipping') { statusClass = 'bg-blue-100 text-blue-800'; statusText = '배송중'; }
            else if (order.status === 'pending') statusClass = 'bg-yellow-100 text-yellow-800';
            else if (order.status === 'cancelled') statusClass = 'bg-red-100 text-red-800';

            // Items Summary
            const itemCount = order.items ? order.items.length : 0;
            const firstItemName = order.items && order.items.length > 0 ?
                (order.items[0].expand?.product_id?.name || order.items[0].name || '상품') : '상품 없음'; // Fallback logic

            let itemsSummary = firstItemName;
            if (itemCount > 1) {
                itemsSummary += ` 외 ${itemCount - 1}건`;
            }

            // Tracking Info
            const carrierCode = order.tracking_carrier || '';
            const trackingNumber = order.tracking_number || '';
            const carrierName = carrierCode && CARRIERS[carrierCode] ? CARRIERS[carrierCode].name : '';
            let trackingHtml = '<span class="text-gray-400 text-xs">미등록</span>';
            if (carrierName && trackingNumber) {
                trackingHtml = `<div class="text-xs text-gray-900">${carrierName}</div><div class="text-xs text-blue-600">${trackingNumber}</div>`;
            }

            html += `
                <tr class="hover:bg-gray-50 cursor-pointer" onclick="AdminOrders.openModal('${order.id}')">
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm font-medium text-gray-900">${order.payment_id || order.id.substring(0, 8)}</div>
                        <div class="text-sm text-gray-500">${date}</div>
                    </td>
                    <td class="px-6 py-4">
                        <div class="text-sm text-gray-900">${buyerName}</div>
                        <div class="text-sm text-gray-500">${buyerEmail}</div>
                    </td>
                    <td class="px-6 py-4">
                        <div class="text-sm text-gray-900">${itemsSummary}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm font-bold text-gray-900">${(order.total_amount || 0).toLocaleString()}원</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        ${trackingHtml}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-center">
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">
                            ${statusText}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <button class="text-indigo-600 hover:text-indigo-900" onclick="event.stopPropagation(); AdminOrders.openModal('${order.id}')">상세보기</button>
                    </td>
                </tr>
            `;
        });

        tableBody.innerHTML = html;
        renderPagination(totalPages, currentPage);
    }

    function renderPagination(totalPages, current) {
        const container = document.getElementById('pagination-controls');
        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        let html = '';
        // Prev
        html += `<button onclick="AdminOrders.setPage(${current - 1})" class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${current === 1 ? 'disabled:opacity-50 cursor-not-allowed' : ''}" ${current === 1 ? 'disabled' : ''}>
            <span class="sr-only">Previous</span>
            &larr;
        </button>`;

        // Pages (Simplified: just 1 to total)
        for (let i = 1; i <= totalPages; i++) {
            html += `<button onclick="AdminOrders.setPage(${i})" class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${i === current ? 'text-blue-600 bg-blue-50 border-blue-500 z-10' : 'text-gray-700 hover:bg-gray-50'}">
                ${i}
            </button>`;
        }

        // Next
        html += `<button onclick="AdminOrders.setPage(${current + 1})" class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${current === totalPages ? 'disabled:opacity-50 cursor-not-allowed' : ''}" ${current === totalPages ? 'disabled' : ''}>
            <span class="sr-only">Next</span>
            &rarr;
        </button>`;

        container.innerHTML = html;
    }

    function setPage(page) {
        currentPage = page;
        renderOrders();
    }

    async function openModal(orderId) {
        console.log('openModal called with ID:', orderId);
        const order = allOrders.find(o => o.id === orderId);
        if (!order) {
            console.error('Order not found in memory:', orderId);
            return;
        }

        console.log('Full Order Object:', JSON.stringify(order, null, 2));

        const modal = document.getElementById('order-detail-modal');
        const statusBadge = document.getElementById('modal-order-status');

        // Status Class
        statusBadge.textContent = order.status || '-';
        statusBadge.className = 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full ';
        if (order.status === 'paid') statusBadge.classList.add('bg-green-100', 'text-green-800');
        else if (order.status === 'pending') statusBadge.classList.add('bg-yellow-100', 'text-yellow-800');
        else statusBadge.classList.add('bg-red-100', 'text-red-800');

        // Parse buyer_details (could be string or object)
        let buyerDetails = order.buyer_details;
        if (typeof buyerDetails === 'string') {
            try { buyerDetails = JSON.parse(buyerDetails); } catch (e) { buyerDetails = {}; }
        }
        buyerDetails = buyerDetails || {};

        // Parse items (could be string or array)
        let orderItems = order.items;
        if (typeof orderItems === 'string') {
            try { orderItems = JSON.parse(orderItems); } catch (e) { orderItems = []; }
        }
        orderItems = orderItems || [];

        // Buyer Info - Try multiple paths based on actual data structure
        // New orders: buyerDetails.customer, buyerDetails.shipping_info
        // Old orders: Data might be in items array or user expand
        const user = order.expand?.user;
        const customer = buyerDetails.customer || {};
        const shipping = buyerDetails.shipping_info || {};

        // Get buyer name from available sources
        let buyerName = customer.fullName || shipping.receiver || user?.name || '-';
        let buyerPhone = customer.phoneNumber || shipping.phone || user?.phone || '-';
        let buyerEmail = customer.email || user?.email || '-';
        let address = '-';

        if (shipping.address) {
            address = `(${shipping.postcode || ''}) ${shipping.address} ${shipping.detailAddress || ''} ${shipping.extraAddress || ''}`.trim();
        }

        document.getElementById('modal-payment-id').textContent = order.payment_id || order.id;
        document.getElementById('modal-buyer-name').textContent = buyerName;
        document.getElementById('modal-buyer-phone').textContent = buyerPhone;
        document.getElementById('modal-buyer-email').textContent = buyerEmail;
        document.getElementById('modal-buyer-address').textContent = address;
        document.getElementById('modal-total-amount').textContent = (order.total_amount || 0).toLocaleString() + '원';

        // Items - The actual data shows items contain full cart item info!
        // { name, price, quantity, image, product_id, options, etc. }
        const itemsContainer = document.getElementById('modal-order-items');
        let itemsHtml = '';

        if (orderItems && orderItems.length > 0) {
            for (const item of orderItems) {
                // Item already has name, price, quantity, and image from cart
                const name = item.name || '상품명 없음';
                const price = item.price || 0;
                const qty = item.quantity || item.qty || 1;

                // Image - use stored image or try to fetch from product
                let imgUrl = item.image ? item.image.trim() : '';

                // If image is missing, relative, or broken, try fetching from product
                if (!imgUrl || !imgUrl.startsWith('http') || imgUrl.includes('localhost:1313')) {
                    if (item.product_id) {
                        try {
                            // product_id is the slug, not the PocketBase record id
                            const product = await pb.collection('products').getFirstListItem(`slug="${item.product_id}"`);
                            if (product && product.images) {
                                const imageFile = Array.isArray(product.images) ? product.images[0] : product.images;
                                if (imageFile) {
                                    imgUrl = pb.files.getUrl(product, imageFile, { thumb: '100x100' });
                                }
                            }
                        } catch (e) {
                            console.warn('Could not fetch product for image:', item.product_id, e.message);
                        }
                    }
                    if (!imgUrl || !imgUrl.startsWith('http')) {
                        imgUrl = 'https://via.placeholder.com/50';
                    }
                }

                itemsHtml += `
                    <div class="flex items-center p-3 gap-3">
                        <img src="${imgUrl}" class="w-12 h-12 object-cover rounded bg-gray-100" onerror="this.src='https://via.placeholder.com/50'">
                        <div class="flex-1">
                            <p class="text-sm font-medium text-gray-900">${name}</p>
                            <p class="text-xs text-gray-500">${price.toLocaleString()}원 x ${qty}개</p>
                        </div>
                        <div class="text-sm font-bold text-gray-900">
                            ${(price * qty).toLocaleString()}원
                        </div>
                    </div>
                `;
            }
        } else {
            itemsHtml = '<div class="p-4 text-center text-gray-500 text-sm">상품 정보가 없습니다.</div>';
        }

        itemsContainer.innerHTML = itemsHtml;

        // Load tracking info into form
        currentOrderId = orderId;
        const carrierSelect = document.getElementById('tracking-carrier');
        const numberInput = document.getElementById('tracking-number');
        const trackBtn = document.getElementById('track-delivery-btn');
        const statusMsg = document.getElementById('tracking-status-msg');

        carrierSelect.value = order.tracking_carrier || '';
        numberInput.value = order.tracking_number || '';

        // Show/hide track button based on existing tracking info
        if (order.tracking_carrier && order.tracking_number) {
            trackBtn.classList.remove('hidden');
            statusMsg.textContent = '운송장이 등록되어 있습니다.';
            statusMsg.className = 'text-xs text-green-600 mt-2';
        } else {
            trackBtn.classList.add('hidden');
            statusMsg.textContent = '';
        }

        modal.classList.remove('hidden');
    }

    function closeModal() {
        document.getElementById('order-detail-modal').classList.add('hidden');
        currentOrderId = null;
    }

    async function saveTrackingInfo() {
        if (!currentOrderId) {
            alert('주문 정보가 없습니다.');
            return;
        }

        const carrier = document.getElementById('tracking-carrier').value;
        const number = document.getElementById('tracking-number').value.trim();
        const statusMsg = document.getElementById('tracking-status-msg');
        const trackBtn = document.getElementById('track-delivery-btn');

        if (!carrier || !number) {
            statusMsg.textContent = '택배사와 운송장번호를 모두 입력해주세요.';
            statusMsg.className = 'text-xs text-red-600 mt-2';
            return;
        }

        try {
            statusMsg.textContent = '저장 중...';
            statusMsg.className = 'text-xs text-gray-500 mt-2';

            // Update order with tracking info and set status to shipping
            const order = allOrders.find(o => o.id === currentOrderId);
            const newStatus = order.status === 'paid' ? 'shipping' : order.status;

            await pb.collection('orders').update(currentOrderId, {
                tracking_carrier: carrier,
                tracking_number: number,
                status: newStatus
            });

            // Update local cache
            const orderIndex = allOrders.findIndex(o => o.id === currentOrderId);
            if (orderIndex !== -1) {
                allOrders[orderIndex].tracking_carrier = carrier;
                allOrders[orderIndex].tracking_number = number;
                allOrders[orderIndex].status = newStatus;
            }

            statusMsg.textContent = '운송장이 저장되었습니다!';
            statusMsg.className = 'text-xs text-green-600 mt-2';
            trackBtn.classList.remove('hidden');

            // Update modal status badge
            const statusBadge = document.getElementById('modal-order-status');
            if (newStatus === 'shipping') {
                statusBadge.textContent = '배송중';
                statusBadge.className = 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800';
            }

            // Refresh table
            renderOrders();

        } catch (err) {
            console.error('Failed to save tracking info:', err);
            statusMsg.textContent = '저장 실패: ' + err.message;
            statusMsg.className = 'text-xs text-red-600 mt-2';
        }
    }

    function openTrackingUrl() {
        const carrier = document.getElementById('tracking-carrier').value;
        const number = document.getElementById('tracking-number').value.trim();

        if (!carrier || !number || !CARRIERS[carrier]) {
            alert('택배사 또는 운송장번호가 없습니다.');
            return;
        }

        const url = CARRIERS[carrier].trackUrl + number;
        window.open(url, '_blank');
    }

    return {
        init,
        openModal,
        closeModal,
        setPage,
        saveTrackingInfo,
        openTrackingUrl
    };
})();

document.addEventListener('DOMContentLoaded', () => {
    if (window.AdminOrders) {
        window.AdminOrders.init();
    } else {
        console.error('AdminOrders not loaded');
    }
});
