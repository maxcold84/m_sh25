import { getAdminPb, checkAdmin, logout } from './admin-auth.js';
import { toast, confirmDialog } from './admin-feedback.js';

const AdminOrders = (function () {
    let pb;
    let allOrders = [];
    const ITEMS_PER_PAGE = 20;
    let currentPage = 1;
    let currentOrderId = null;
    const selectedOrders = new Set();
    let deleteTargetId = null;

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
    const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/50?text=No+Img';
    const IMAGE_ERROR_FALLBACK = 'https://via.placeholder.com/50?text=Error';
    const INTERACTIVE_SELECTOR = 'button, a, input, select, textarea, label';
    const STATUS_BADGE_BASE = 'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset';
    const MODAL_IDS = ['order-detail-modal', 'delete-confirm-modal'];

    function showToast(message, type = 'info', duration) {
        toast(message, { type, duration });
    }

    function confirmAction(options) {
        return confirmDialog(options);
    }

    function getStatusMeta(status) {
        switch (status) {
            case 'paid':
                return { label: '결제완료', classes: `${STATUS_BADGE_BASE} bg-emerald-100 text-emerald-700 ring-emerald-200` };
            case 'shipping':
                return { label: '배송중', classes: `${STATUS_BADGE_BASE} bg-sky-100 text-sky-700 ring-sky-200` };
            case 'delivered':
                return { label: '배송완료', classes: `${STATUS_BADGE_BASE} bg-indigo-100 text-indigo-700 ring-indigo-200` };
            case 'pending':
                return { label: '결제대기', classes: `${STATUS_BADGE_BASE} bg-amber-100 text-amber-700 ring-amber-200` };
            case 'cancelled':
                return { label: '취소됨', classes: `${STATUS_BADGE_BASE} bg-rose-100 text-rose-700 ring-rose-200` };
            case 'archived':
                return { label: '보관됨', classes: `${STATUS_BADGE_BASE} bg-slate-200 text-slate-700 ring-slate-300` };
            default:
                return { label: status || '-', classes: `${STATUS_BADGE_BASE} bg-slate-100 text-slate-700 ring-slate-200` };
        }
    }

    function syncModalScrollLock() {
        const anyModalOpen = MODAL_IDS.some(modalId => {
            const modal = document.getElementById(modalId);
            return modal && !modal.classList.contains('hidden');
        });

        document.body.style.overflow = anyModalOpen ? 'hidden' : '';
    }

    function showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) {
            return;
        }

        modal.classList.remove('hidden');
        modal.setAttribute('aria-hidden', 'false');
        syncModalScrollLock();
    }

    function hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) {
            return;
        }

        modal.classList.add('hidden');
        modal.setAttribute('aria-hidden', 'true');
        syncModalScrollLock();
    }

    function getTopMostOpenModalId() {
        for (let i = MODAL_IDS.length - 1; i >= 0; i -= 1) {
            const modal = document.getElementById(MODAL_IDS[i]);
            if (modal && !modal.classList.contains('hidden')) {
                return MODAL_IDS[i];
            }
        }

        return null;
    }

    function init() {
        console.log('AdminOrders initializing...');

        pb = getAdminPb();

        // Strict Admin Check
        if (!checkAdmin()) {
            console.warn('Backend verification check failed.');
            return;
        }

        setupEventListeners();
        loadOrders();
    }

    function setupEventListeners() {
        // Logout
        const logoutBtn = document.getElementById('admin-logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => logout());
        }

        // Filter
        const filterSelect = document.getElementById('status-filter');
        if (filterSelect) {
            filterSelect.addEventListener('change', () => {
                currentPage = 1;
                renderOrders();
            });
        }

        // Refresh
        const refreshBtn = document.getElementById('refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', loadOrders);
        }

        // Bulk actions
        const bulkArchiveBtn = document.getElementById('bulk-archive-btn');
        if (bulkArchiveBtn) {
            bulkArchiveBtn.addEventListener('click', bulkArchive);
        }

        const bulkDeleteBtn = document.getElementById('bulk-delete-btn');
        if (bulkDeleteBtn) {
            bulkDeleteBtn.addEventListener('click', bulkDelete);
        }

        // Table interactions
        const tableBody = document.getElementById('orders-table-body');
        if (tableBody) {
            tableBody.addEventListener('click', handleTableBodyClick);
            tableBody.addEventListener('change', handleTableBodyChange);
            tableBody.addEventListener('keydown', handleTableBodyKeydown);
        }

        const pagination = document.getElementById('pagination-controls');
        if (pagination) {
            pagination.addEventListener('click', handlePaginationClick);
        }

        const selectAllCheckbox = document.getElementById('select-all-orders');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', toggleSelectAll);
        }

        const saveTrackingBtn = document.getElementById('save-tracking-btn');
        if (saveTrackingBtn) {
            saveTrackingBtn.addEventListener('click', saveTrackingInfo);
        }

        const archiveOrderBtn = document.getElementById('archive-order-btn');
        if (archiveOrderBtn) {
            archiveOrderBtn.addEventListener('click', () => archiveOrder());
        }

        const deleteOrderBtn = document.getElementById('delete-order-btn');
        if (deleteOrderBtn) {
            deleteOrderBtn.addEventListener('click', () => confirmDelete());
        }

        const trackDeliveryBtn = document.getElementById('track-delivery-btn');
        if (trackDeliveryBtn) {
            trackDeliveryBtn.addEventListener('click', openTrackingUrl);
        }

        const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', () => deleteOrder());
        }

        document.querySelectorAll('[data-modal-close]').forEach(button => {
            button.addEventListener('click', () => hideModal(button.dataset.modalClose));
        });

        document.querySelectorAll('[data-modal-backdrop]').forEach(backdrop => {
            backdrop.addEventListener('click', () => hideModal(backdrop.dataset.modalBackdrop));
        });

        document.addEventListener('keydown', handleGlobalKeydown);
    }

    function handleGlobalKeydown(event) {
        if (event.key !== 'Escape') {
            return;
        }

        const openModalId = getTopMostOpenModalId();
        if (!openModalId) {
            return;
        }

        if (openModalId === 'order-detail-modal') {
            closeModal();
        } else {
            hideModal(openModalId);
        }
    }

    function handleTableBodyClick(event) {
        const openButton = event.target.closest('[data-action="open-order"]');
        if (openButton) {
            const orderId = openButton.dataset.orderId;
            if (orderId) {
                openModal(orderId);
            }
            return;
        }

        if (event.target.closest('.order-checkbox')) {
            return;
        }

        const row = event.target.closest('tr[data-order-id]');
        if (!row) {
            return;
        }

        if (event.target.closest(INTERACTIVE_SELECTOR)) {
            return;
        }

        openModal(row.dataset.orderId);
    }

    function handleTableBodyChange(event) {
        const checkbox = event.target.closest('.order-checkbox');
        if (!checkbox) {
            return;
        }

        toggleSelectOrder(checkbox.dataset.orderId, checkbox.checked);
    }

    function handleTableBodyKeydown(event) {
        const row = event.target.closest('tr[data-order-id]');
        if (!row || event.target.closest(INTERACTIVE_SELECTOR)) {
            return;
        }

        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openModal(row.dataset.orderId);
        }
    }

    function handlePaginationClick(event) {
        const pageButton = event.target.closest('[data-page]');
        if (!pageButton || pageButton.disabled) {
            return;
        }

        const nextPage = Number(pageButton.dataset.page);
        if (!Number.isNaN(nextPage)) {
            setPage(nextPage);
        }
    }

    function wireImageFallbacks(container) {
        if (!container) {
            return;
        }

        container.querySelectorAll('img[data-fallback-src]').forEach(img => {
            img.addEventListener('error', () => {
                const fallbackSrc = img.dataset.fallbackSrc;
                if (fallbackSrc && img.src !== fallbackSrc) {
                    img.src = fallbackSrc;
                }
            }, { once: true });
        });
    }

    async function loadOrders() {
        const tableBody = document.getElementById('orders-table-body');
        const countSpan = document.getElementById('total-orders-count');

        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="8" class="px-4 py-10 text-center text-slate-500">불러오는 중...</td></tr>';
        }

        try {
            // Fetch all orders sorted by latest
            // Note: For large scale, we should use getList with pagination from DB.
            // For now, getting full list to handle client-side filtering easily as per requirement scope.
            const records = await pb.collection('orders').getFullList({
                sort: '-created',
                expand: 'user'
            });

            allOrders = records;
            if (countSpan) {
                countSpan.textContent = allOrders.length;
            }
            renderOrders();

        } catch (err) {
            console.error('Failed to load orders:', err);
            // If error is 403, it means not admin logic or rule issue
            if (err.status === 403) {
                showToast('권한이 없습니다. 다시 로그인해주세요.', 'error', 1600);
                setTimeout(() => {
                    location.href = '/ko/admin/login';
                }, 700);
            } else {
                if (tableBody) {
                    tableBody.innerHTML = `<tr><td colspan="8" class="px-4 py-10 text-center text-rose-600">오류가 발생했습니다: ${err.message}</td></tr>`;
                }
            }
        }
    }

    function renderOrders() {
        const tableBody = document.getElementById('orders-table-body');
        const statusFilterEl = document.getElementById('status-filter');
        const statusFilter = statusFilterEl ? statusFilterEl.value : '';

        if (!tableBody) {
            return;
        }

        // Filter
        let filtered = allOrders;
        if (statusFilter) {
            filtered = allOrders.filter(o => o.status === statusFilter);
        }

        // Pagination Logic
        const totalItems = filtered.length;
        const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
        if (currentPage > totalPages) {
            currentPage = totalPages;
        }
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        const pageItems = filtered.slice(start, end);

        if (pageItems.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="8" class="px-4 py-10 text-center text-slate-500">주문 내역이 없습니다.</td></tr>';
            renderPagination(0, 0);
            updateBulkActionsUI();
            updateSelectAllCheckbox();
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

            const statusMeta = getStatusMeta(order.status);
            const statusClass = statusMeta.classes;
            const statusText = statusMeta.label;

            // Items Summary
            const itemCount = order.items ? order.items.length : 0;
            const firstItemName = order.items && order.items.length > 0 ?
                (order.items[0].expand?.product_id?.name || order.items[0].name || '상품') : '상품 없음';

            let itemsSummary = firstItemName;
            if (itemCount > 1) {
                itemsSummary += ` 외 ${itemCount - 1}건`;
            }

            // Tracking Info
            const carrierCode = order.tracking_carrier || '';
            const trackingNumber = order.tracking_number || '';
            const carrierName = carrierCode && CARRIERS[carrierCode] ? CARRIERS[carrierCode].name : '';
            let trackingHtml = '<span class="text-xs text-slate-500">미등록</span>';
            if (carrierName && trackingNumber) {
                trackingHtml = `<div class="text-xs font-medium text-slate-700">${carrierName}</div><div class="text-xs text-slate-500 break-all">${trackingNumber}</div>`;
            }

            const isSelected = selectedOrders.has(order.id);
            html += `
                <tr class="cursor-pointer transition hover:bg-slate-50 ${isSelected ? 'bg-slate-50 ring-1 ring-inset ring-slate-200' : ''}" data-order-id="${order.id}" tabindex="0" role="button" aria-label="주문 상세 보기">
                    <td>
                        <input type="checkbox" class="order-checkbox h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400" data-order-id="${order.id}" 
                               ${isSelected ? 'checked' : ''} 
                               aria-label="주문 선택">
                    </td>
                    <td>
                        <div class="font-semibold text-slate-900">${order.payment_id || order.id.substring(0, 8)}</div>
                        <div class="text-xs text-slate-500">${date}</div>
                    </td>
                    <td>
                        <div class="text-slate-900">${buyerName}</div>
                        <div class="text-xs text-slate-500">${buyerEmail}</div>
                    </td>
                    <td>
                        <div class="text-slate-900">${itemsSummary}</div>
                    </td>
                    <td>
                        <div class="font-semibold text-slate-900">${(order.total_amount || 0).toLocaleString()}원</div>
                    </td>
                    <td>
                        ${trackingHtml}
                    </td>
                    <td class="text-center">
                        <span class="${statusClass}">
                            ${statusText}
                        </span>
                    </td>
                    <td class="text-center">
                        <button type="button" class="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200" data-action="open-order" data-order-id="${order.id}">상세보기</button>
                    </td>
                </tr>
            `;
        });

        tableBody.innerHTML = html;
        renderPagination(totalPages, currentPage);
        updateBulkActionsUI();
        updateSelectAllCheckbox();
    }

    function renderPagination(totalPages, current) {
        const container = document.getElementById('pagination-controls');
        if (!container) {
            return;
        }

        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        let html = '';
        const buttonBase = 'inline-flex h-9 min-w-9 items-center justify-center rounded-full border px-3 text-sm font-semibold transition focus:outline-none focus:ring-4 focus:ring-slate-200';
        const enabledBase = 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50';
        const activeBase = 'border-slate-900 bg-slate-900 text-white';
        const disabledBase = 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400';

        // Prev
        html += `<li>
            <button type="button" class="${buttonBase} ${current === 1 ? disabledBase : enabledBase}" data-page="${current - 1}" aria-label="Previous" ${current === 1 ? 'disabled' : ''}>
                <span aria-hidden="true">&laquo;</span>
            </button>
        </li>`;

        // Pages
        for (let i = 1; i <= totalPages; i++) {
            html += `<li>
                <button type="button" class="${buttonBase} ${i === current ? activeBase : enabledBase}" data-page="${i}" ${i === current ? 'aria-current="page"' : ''}>${i}</button>
            </li>`;
        }

        // Next
        html += `<li>
            <button type="button" class="${buttonBase} ${current === totalPages ? disabledBase : enabledBase}" data-page="${current + 1}" aria-label="Next" ${current === totalPages ? 'disabled' : ''}>
                <span aria-hidden="true">&raquo;</span>
            </button>
        </li>`;

        container.innerHTML = html;
    }

    function setPage(page) {
        currentPage = Math.max(1, page);
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

        const statusBadge = document.getElementById('modal-order-status');

        // Status Class
        const statusMeta = getStatusMeta(order.status);
        statusBadge.textContent = statusMeta.label;
        statusBadge.className = `ml-2 ${statusMeta.classes}`;

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
        const buyerName = customer.fullName || shipping.receiver || user?.name || '-';
        const buyerPhone = customer.phoneNumber || shipping.phone || user?.phone || '-';
        const buyerEmail = customer.email || user?.email || '-';
        let address = '-';

        if (shipping.address) {
            address = `(${shipping.postcode || ''}) ${shipping.address} ${shipping.detailAddress || ''} ${shipping.extraAddress || ''}`.trim();
        }

        document.getElementById('modal-payment-id').textContent = order.payment_id || order.id;
        document.getElementById('modal-buyer-name').textContent = buyerName;
        document.getElementById('modal-buyer-phone').textContent = buyerPhone;
        document.getElementById('modal-buyer-email').textContent = buyerEmail;
        document.getElementById('modal-buyer-address').textContent = address;
        document.getElementById('modal-buyer-delivery-note').textContent = shipping.deliveryNote || '-';
        document.getElementById('modal-total-amount').textContent = (order.total_amount || 0).toLocaleString() + '원';

        // Order Date
        const orderDate = new Date(order.created).toLocaleDateString('ko-KR', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
        document.getElementById('modal-order-date').textContent = orderDate;

        // Items
        const itemsContainer = document.getElementById('modal-order-items');
        let itemsHtml = '';

        if (orderItems && orderItems.length > 0) {
            for (const item of orderItems) {
                console.log('Processing Order Item:', item); // DEBUG

                // Item structure check
                let name = item.name || item.title || item.productName || item.product_name;
                const price = item.price || item.discount_price || 0;
                const qty = item.quantity || item.qty || 1;

                // Try to find Product ID from various possible fields
                let productId = item.product_id || item.productId || item.product || item.id;
                if (typeof productId === 'object' && productId !== null) {
                    productId = productId.id;
                }

                console.log('Resolved Product ID:', productId); // DEBUG

                // Image processing
                let imgUrl = item.image ? item.image.trim() : '';

                // If name is missing or image is invalid, try to fetch from product
                if (!name || (!imgUrl || (!imgUrl.startsWith('http') && !imgUrl.startsWith('data:')))) {
                    if (productId) {
                        try {
                            let product = null;

                            // 1. Try getOne (Record ID)
                            try {
                                product = await pb.collection('products').getOne(productId);
                                console.log('Fetched product by ID:', product);
                            } catch (e) {
                                // console.warn('Fetch by ID failed', e);
                            }

                            // 2. If not found, try slug
                            if (!product) {
                                try {
                                    product = await pb.collection('products').getFirstListItem(`slug="${productId}"`);
                                    console.log('Fetched product by Slug:', product);
                                } catch (e) { /* Ignore */ }
                            }

                            if (product) {
                                if (!name) name = product.name;

                                if (!imgUrl || (!imgUrl.startsWith('http') && !imgUrl.startsWith('data:'))) {
                                    if (product.images && product.images.length > 0) {
                                        const imageFile = product.images[0];
                                        imgUrl = pb.files.getUrl(product, imageFile, { thumb: '100x100' });
                                    }
                                }
                            }
                        } catch (e) {
                            console.warn('Failed to fetch product info for:', productId, e);
                        }
                    }
                }

                if (!name) name = `상품명 없음 (${productId || 'ID 없음'})`;

                // Fallback Image
                if (!imgUrl || (!imgUrl.startsWith('http') && !imgUrl.startsWith('data:'))) {
                    imgUrl = PLACEHOLDER_IMAGE;
                }

                itemsHtml += `
                    <div class="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 last:border-b-0 sm:flex-row sm:items-center">
                        <div class="h-14 w-14 flex-shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                             <img src="${imgUrl}" 
                                  class="h-full w-full object-cover" 
                                  alt="${name}"
                                  loading="lazy"
                                  data-fallback-src="${IMAGE_ERROR_FALLBACK}">
                        </div>
                        <div class="min-w-0 flex-1">
                            <h6 class="mb-1 break-words text-sm font-semibold text-slate-900">${name}</h6>
                            <div class="break-words text-xs text-slate-500">ID: ${productId || '-'}</div>
                            <div class="mt-1 text-sm text-slate-600">${price.toLocaleString()}원 × ${qty}개</div>
                        </div>
                        <div class="whitespace-nowrap text-sm font-semibold text-slate-900">
                            ${(price * qty).toLocaleString()}원
                        </div>
                    </div>
                `;
            }
        } else {
            itemsHtml = '<div class="px-4 py-8 text-center text-sm text-slate-500">상품 정보가 없습니다.</div>';
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
            statusMsg.className = 'mt-2 text-sm text-emerald-600';
        } else {
            trackBtn.classList.add('hidden');
            statusMsg.textContent = '';
            statusMsg.className = 'mt-2 text-sm text-slate-500';
        }

        wireImageFallbacks(itemsContainer);
        showModal('order-detail-modal');
    }

    function closeModal() {
        hideModal('order-detail-modal');
        currentOrderId = null;
    }

    async function saveTrackingInfo() {
        if (!currentOrderId) {
            showToast('주문 정보가 없습니다.', 'error');
            return;
        }

        const carrier = document.getElementById('tracking-carrier').value;
        const number = document.getElementById('tracking-number').value.trim();
        const statusMsg = document.getElementById('tracking-status-msg');
        const trackBtn = document.getElementById('track-delivery-btn');

        if (!carrier || !number) {
            statusMsg.textContent = '택배사와 운송장번호를 모두 입력해주세요.';
            statusMsg.className = 'mt-2 text-sm text-rose-600';
            return;
        }

        try {
            statusMsg.textContent = '저장 중...';
            statusMsg.className = 'mt-2 text-sm text-slate-500';

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
            statusMsg.className = 'mt-2 text-sm text-emerald-600';
            trackBtn.classList.remove('hidden');

            // Update modal status badge
            const statusBadge = document.getElementById('modal-order-status');
            const statusMeta = getStatusMeta(newStatus);
            statusBadge.textContent = statusMeta.label;
            statusBadge.className = `ml-2 ${statusMeta.classes}`;

            // Refresh table
            renderOrders();

        } catch (err) {
            console.error('Failed to save tracking info:', err);
            statusMsg.textContent = '저장 실패: ' + err.message;
            statusMsg.className = 'mt-2 text-sm text-rose-600';
        }
    }

    function openTrackingUrl() {
        const carrier = document.getElementById('tracking-carrier').value;
        const number = document.getElementById('tracking-number').value.trim();

        if (!carrier || !number || !CARRIERS[carrier]) {
            showToast('택배사 또는 운송장번호가 없습니다.', 'error');
            return;
        }

        const url = CARRIERS[carrier].trackUrl + number;
        open(url, '_blank');
    }

    // ============ Selection Functions ============
    function toggleSelectOrder(orderId, checked = null) {
        if (checked === null) {
            if (selectedOrders.has(orderId)) {
                selectedOrders.delete(orderId);
            } else {
                selectedOrders.add(orderId);
            }
        } else {
            if (checked) {
                selectedOrders.add(orderId);
            } else {
                selectedOrders.delete(orderId);
            }
        }
        updateBulkActionsUI();
        updateSelectAllCheckbox();
    }

    function toggleSelectAll() {
        const selectAllCheckbox = document.getElementById('select-all-orders');
        const statusFilterEl = document.getElementById('status-filter');
        const statusFilter = statusFilterEl ? statusFilterEl.value : '';

        if (!selectAllCheckbox) {
            return;
        }

        let filtered = allOrders;
        if (statusFilter) {
            filtered = allOrders.filter(o => o.status === statusFilter);
        }

        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        const pageItems = filtered.slice(start, end);

        if (selectAllCheckbox.checked) {
            pageItems.forEach(order => selectedOrders.add(order.id));
        } else {
            pageItems.forEach(order => selectedOrders.delete(order.id));
        }

        renderOrders();
    }

    function updateSelectAllCheckbox() {
        const selectAllCheckbox = document.getElementById('select-all-orders');
        if (!selectAllCheckbox) return;

        const checkboxes = document.querySelectorAll('.order-checkbox');
        const allChecked = checkboxes.length > 0 && Array.from(checkboxes).every(cb => cb.checked);
        const someChecked = checkboxes.length > 0 && Array.from(checkboxes).some(cb => cb.checked);
        selectAllCheckbox.checked = allChecked;
        selectAllCheckbox.indeterminate = someChecked && !allChecked;
    }

    function updateBulkActionsUI() {
        const bulkActions = document.getElementById('bulk-actions');
        const selectedCount = document.getElementById('selected-count');

        if (!bulkActions || !selectedCount) return;

        if (selectedOrders.size > 0) {
            bulkActions.classList.remove('hidden');
            selectedCount.textContent = selectedOrders.size;
        } else {
            bulkActions.classList.add('hidden');
        }
    }

    // ============ Archive Functions ============
    async function archiveOrder(orderId = null) {
        const targetId = orderId || currentOrderId;
        if (!targetId) {
            showToast('주문 정보가 없습니다.', 'error');
            return;
        }

        try {
            await pb.collection('orders').update(targetId, { status: 'archived' });

            // Update local cache
            const orderIndex = allOrders.findIndex(o => o.id === targetId);
            if (orderIndex !== -1) {
                allOrders[orderIndex].status = 'archived';
            }

            showToast('주문이 보관되었습니다.', 'success');
            closeModal();
            renderOrders();
        } catch (err) {
            console.error('Failed to archive order:', err);
            showToast('보관 실패: ' + err.message, 'error');
        }
    }

    async function bulkArchive() {
        if (selectedOrders.size === 0) {
            showToast('선택된 주문이 없습니다.', 'error');
            return;
        }

        const confirmed = await confirmAction({
            title: '주문 일괄 보관',
            message: `${selectedOrders.size}개의 주문을 보관하시겠습니까?`,
            confirmLabel: '보관'
        });

        if (!confirmed) {
            return;
        }

        try {
            const promises = Array.from(selectedOrders).map(orderId =>
                pb.collection('orders').update(orderId, { status: 'archived' })
            );
            await Promise.all(promises);

            // Update local cache
            selectedOrders.forEach(orderId => {
                const orderIndex = allOrders.findIndex(o => o.id === orderId);
                if (orderIndex !== -1) {
                    allOrders[orderIndex].status = 'archived';
                }
            });

            showToast(`${selectedOrders.size}개의 주문이 보관되었습니다.`, 'success');
            selectedOrders.clear();
            renderOrders();
        } catch (err) {
            console.error('Failed to bulk archive:', err);
            showToast('일괄 보관 실패: ' + err.message, 'error');
        }
    }

    // ============ Delete Functions ============
    function confirmDelete(orderId = null) {
        deleteTargetId = orderId || currentOrderId;
        if (!deleteTargetId) {
            showToast('주문 정보가 없습니다.', 'error');
            return;
        }

        const order = allOrders.find(o => o.id === deleteTargetId);
        if (order) {
            const infoEl = document.getElementById('delete-order-info');
            infoEl.textContent = `주문번호: ${order.payment_id || order.id.substring(0, 8)}`;
        }

        showModal('delete-confirm-modal');
    }

    async function deleteOrder() {
        if (!deleteTargetId) {
            showToast('삭제할 주문이 없습니다.', 'error');
            return;
        }

        try {
            await pb.collection('orders').delete(deleteTargetId);

            // Remove from local cache
            allOrders = allOrders.filter(o => o.id !== deleteTargetId);
            selectedOrders.delete(deleteTargetId);

            hideModal('delete-confirm-modal');
            closeModal();

            showToast('주문이 삭제되었습니다.', 'success');
            document.getElementById('total-orders-count').textContent = allOrders.length;
            renderOrders();
        } catch (err) {
            console.error('Failed to delete order:', err);
            showToast('삭제 실패: ' + err.message, 'error');
        } finally {
            deleteTargetId = null;
        }
    }

    async function bulkDelete() {
        if (selectedOrders.size === 0) {
            showToast('선택된 주문이 없습니다.', 'error');
            return;
        }

        const infoEl = document.getElementById('delete-order-info');
        infoEl.textContent = `선택된 ${selectedOrders.size}개의 주문을 삭제합니다.`;

        // Use a special marker for bulk delete
        deleteTargetId = 'BULK_DELETE';
        showModal('delete-confirm-modal');
    }

    // Override deleteOrder to handle bulk delete
    deleteOrder = async function () {
        if (deleteTargetId === 'BULK_DELETE') {
            try {
                const promises = Array.from(selectedOrders).map(orderId =>
                    pb.collection('orders').delete(orderId)
                );
                await Promise.all(promises);

                // Remove from local cache
                allOrders = allOrders.filter(o => !selectedOrders.has(o.id));
                const deletedCount = selectedOrders.size;
                selectedOrders.clear();

                hideModal('delete-confirm-modal');

                showToast(`${deletedCount}개의 주문이 삭제되었습니다.`, 'success');
                document.getElementById('total-orders-count').textContent = allOrders.length;
                renderOrders();
            } catch (err) {
                console.error('Failed to bulk delete:', err);
                showToast('일괄 삭제 실패: ' + err.message, 'error');
            } finally {
                deleteTargetId = null;
            }
        } else {
            // Single delete
            if (!deleteTargetId) {
                showToast('삭제할 주문이 없습니다.', 'error');
                return;
            }

            try {
                await pb.collection('orders').delete(deleteTargetId);

                allOrders = allOrders.filter(o => o.id !== deleteTargetId);
                selectedOrders.delete(deleteTargetId);

                hideModal('delete-confirm-modal');
                closeModal();

                showToast('주문이 삭제되었습니다.', 'success');
                document.getElementById('total-orders-count').textContent = allOrders.length;
                renderOrders();
            } catch (err) {
                console.error('Failed to delete order:', err);
                showToast('삭제 실패: ' + err.message, 'error');
            } finally {
                deleteTargetId = null;
            }
        }
    };

    return {
        init,
        openModal,
        closeModal,
        setPage,
        saveTrackingInfo,
        openTrackingUrl,
        toggleSelectOrder,
        toggleSelectAll,
        archiveOrder,
        bulkArchive,
        confirmDelete,
        deleteOrder,
        bulkDelete
    };
})();

document.addEventListener('DOMContentLoaded', () => {
    AdminOrders.init();
});

