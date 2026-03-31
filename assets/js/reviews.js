/**
 * Reviews Module (ES6)
 * 상품 리뷰 관리 모듈
 * @module reviews
 */
import { pb } from './core/pb-client.js';
import { escapeHtml } from './core/utils.js';

// Module State
let reviewForm = null;
let reviewList = null;
let authMessage = null;
let imageInput = null;
let imagePreview = null;
let imageCount = null;
let selectedFiles = [];
let currentProductId = null;
let activeOverlay = null;

const MAX_REVIEW_IMAGES = 5;
const MAX_REVIEW_IMAGE_SIZE = 10 * 1024 * 1024;
const ALLOWED_REVIEW_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

/**
 * 리뷰 모듈 초기화
 * @param {string} productId - 제품 ID
 */
function init(productId) {
    currentProductId = productId;

    // Get DOM elements after init is called
    reviewForm = document.getElementById('review-form');
    reviewList = document.getElementById('review-list');
    authMessage = document.getElementById('review-auth-message');
    imageInput = document.getElementById('review-images');
    imagePreview = document.getElementById('review-image-preview');
    imageCount = document.getElementById('review-image-count');

    updateUI();
    loadReviews();

    if (reviewForm) {
        reviewForm.addEventListener('submit', handleReviewSubmit);
    }

    // Image upload handling
    if (imageInput) {
        imageInput.addEventListener('change', handleImageSelect);
    }

    // Listen for auth changes to update UI
    pb.authStore.onChange(() => {
        updateUI();
        loadReviews(); // Reload to show/hide edit buttons
    });
}

function updateUI() {
    const isLoggedIn = pb.authStore.isValid;
    if (reviewForm) {
        reviewForm.classList.toggle('hidden', !isLoggedIn);
    }
    if (authMessage) {
        authMessage.classList.toggle('hidden', isLoggedIn);
    }
}

function handleImageSelect(e) {
    const files = Array.from(e.target.files);

    // Validation
    const validFiles = [];
    for (const file of files) {
        if (!ALLOWED_REVIEW_IMAGE_TYPES.includes(file.type)) {
            alert(`지원되지 않는 파일 형식입니다: ${file.name}\n(jpg, png, gif, webp만 가능)`);
            continue;
        }
        if (file.size > MAX_REVIEW_IMAGE_SIZE) {
            alert(`파일 크기가 너무 큽니다: ${file.name}\n(최대 10MB)`);
            continue;
        }
        validFiles.push(file);
    }

    // Limit to 5 images total
    if (selectedFiles.length + validFiles.length > MAX_REVIEW_IMAGES) {
        alert('최대 5장까지 업로드할 수 있습니다.');
        return;
    }

    selectedFiles = [...selectedFiles, ...validFiles].slice(0, MAX_REVIEW_IMAGES);
    updateImagePreview();

    // Reset input so same file can be selected again if needed
    e.target.value = '';
}

function updateImagePreview() {
    if (!imagePreview) return;

    imagePreview.innerHTML = '';

    selectedFiles.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'group relative h-20 w-20 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm';
            wrapper.innerHTML = `
                <img src="${e.target.result}" alt="Preview ${index + 1}" class="h-full w-full object-cover">
                <button type="button" class="remove-image-btn absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900/80 text-xs font-bold text-white opacity-100 transition group-hover:bg-rose-600" data-index="${index}" aria-label="Remove selected image">×</button>
            `;
            imagePreview.appendChild(wrapper);

            // Add remove handler
            wrapper.querySelector('.remove-image-btn').addEventListener('click', () => {
                selectedFiles.splice(index, 1);
                updateImagePreview();
            });
        };
        reader.readAsDataURL(file);
    });

    if (imageCount) {
        imageCount.textContent = selectedFiles.length > 0 ? `${selectedFiles.length}개 선택` : '선택된 사진 없음';
    }
}

async function loadReviews() {
    if (!currentProductId || !reviewList) return;

    reviewList.innerHTML = `
        <div class="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500 shadow-sm">
            리뷰를 불러오는 중...
        </div>
    `;

    try {
        const resultList = await pb.collection('reviews').getList(1, 50, {
            filter: `product_id = "${currentProductId}"`,
            sort: '-created',
            expand: 'user',
        });

        renderReviews(resultList.items);
    } catch (error) {
        console.error('Error loading reviews:', error);
        reviewList.innerHTML = `
            <div class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-6 text-center text-sm text-rose-700 shadow-sm">
                리뷰를 불러오는데 실패했습니다.
            </div>
        `;
    }
}

function renderReviews(reviews) {
    if (reviews.length === 0) {
        reviewList.innerHTML = `
            <div data-empty-state="reviews" class="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                아직 리뷰가 없습니다. 첫 번째 리뷰를 작성해보세요!
            </div>
        `;
        return;
    }

    reviewList.innerHTML = reviews.map(review => createReviewHTML(review)).join('');

    // Add event listeners
    attachReviewEventListeners();
}

function attachReviewEventListeners() {
    if (!reviewList) {
        return;
    }

    // Lightbox for images
    reviewList.querySelectorAll('.review-image').forEach(img => {
        img.addEventListener('click', () => openLightbox(img.dataset.full || img.src));
    });

    reviewList.querySelectorAll('.review-avatar-img').forEach((img) => {
        if (img.dataset.avatarBound === 'true') {
            return;
        }

        img.dataset.avatarBound = 'true';
        img.addEventListener('error', function handleAvatarError() {
            const fallback = img.dataset.avatarFallback || '';
            if (fallback) {
                img.outerHTML = fallback;
            }
        });
    });

    // Edit buttons
    reviewList.querySelectorAll('.btn-edit-review').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const reviewId = e.target.closest('.review-item').dataset.reviewId;
            openEditModal(reviewId);
        });
    });

    // Delete buttons
    reviewList.querySelectorAll('.btn-delete-review').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const reviewId = e.target.closest('.review-item').dataset.reviewId;
            confirmDeleteReview(reviewId);
        });
    });
}

function createReviewHTML(review) {
    const user = review.expand?.user;
    const userName = user?.username || user?.name || '익명';
    const userAvatar = user?.avatar
        ? pb.files.getUrl(user, user.avatar)
        : null;

    const createdDate = new Date(review.created).toLocaleDateString('ko-KR');
    const ratingValue = Number(review.rating) || 0;
    const stars = '★'.repeat(ratingValue) + '☆'.repeat(Math.max(0, 5 - ratingValue));

    const isOwner = pb.authStore.isValid && pb.authStore.model?.id === review.user;

    const actionsHTML = isOwner ? `
        <div class="review-actions mt-4 flex flex-wrap gap-2">
            <button type="button" class="btn-edit-review inline-flex items-center justify-center rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900">수정</button>
            <button type="button" class="btn-delete-review inline-flex items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100">삭제</button>
        </div>
    ` : '';

    let imagesHTML = '';
    if (review.images && review.images.length > 0) {
        const imageItems = review.images.map(img => {
            const thumbUrl = pb.files.getUrl(review, img, { thumb: '200x200' });
            const imgUrl = pb.files.getUrl(review, img);
            return `<img src="${thumbUrl}" data-full="${imgUrl}" alt="리뷰 이미지" class="review-image h-20 w-20 cursor-zoom-in rounded-2xl object-cover ring-1 ring-slate-200 transition hover:scale-[1.02]">`;
        }).join('');
        imagesHTML = `<div class="review-images mt-4 flex flex-wrap gap-2">${imageItems}</div>`;
    }

    const avatarHTML = userAvatar
        ? `<img src="${userAvatar}" class="review-avatar-img mr-3 h-11 w-11 shrink-0 rounded-full object-cover ring-1 ring-slate-200" alt="${escapeHtml(userName)}" data-avatar-fallback="${escapeHtml('<div class="mr-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 ring-1 ring-slate-200"><i class="tf-ion-android-person text-xl"></i></div>')}">`
        : `<div class="mr-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 ring-1 ring-slate-200"><i class="tf-ion-android-person text-xl"></i></div>`;

    return `
        <article class="review-item rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60 transition hover:-translate-y-0.5 hover:shadow-md sm:p-5" data-review-id="${review.id}" data-rating="${ratingValue}" data-content="${escapeHtml(review.content)}">
            <div class="flex gap-4">
            ${avatarHTML}
            <div class="min-w-0 flex-1">
                <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h6 class="text-sm font-semibold text-slate-900">${escapeHtml(userName)}</h6>
                        <p class="mt-1 text-xs text-slate-500">${createdDate}</p>
                    </div>
                    <div class="text-sm font-semibold tracking-[0.2em] text-amber-500">${stars}</div>
                </div>
                <p class="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">${escapeHtml(review.content)}</p>
                ${imagesHTML}
                ${actionsHTML}
            </div>
            </div>
        </article>
    `;
}

function openEditModal(reviewId) {
    const reviewElement = document.querySelector(`[data-review-id="${reviewId}"]`);
    if (!reviewElement) return;

    const currentRating = reviewElement.dataset.rating;
    const currentContent = reviewElement.dataset.content;

    closeActiveOverlay();

    const modal = document.createElement('div');
    modal.id = 'edit-review-modal';
    modal.className = 'fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm';
    modal.dataset.reviewOverlay = 'edit';
    modal.innerHTML = `
        <div class="w-full max-w-lg rounded-3xl bg-white p-5 shadow-2xl shadow-slate-900/20 sm:p-6">
            <div class="flex items-start justify-between gap-4">
                <div>
                    <p class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Edit review</p>
                    <h4 class="mt-1 text-xl font-bold text-slate-900">리뷰 수정</h4>
                </div>
                <button type="button" class="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" data-edit-close aria-label="닫기">×</button>
            </div>
            <form id="edit-review-form" class="mt-5 space-y-5">
                <div>
                    <label for="edit-rating" class="text-sm font-semibold text-slate-700">평점</label>
                    <select id="edit-rating" required class="mt-2 block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10">
                        <option value="5" ${Number(currentRating) === 5 ? 'selected' : ''}>⭐⭐⭐⭐⭐ (5점)</option>
                        <option value="4" ${Number(currentRating) === 4 ? 'selected' : ''}>⭐⭐⭐⭐ (4점)</option>
                        <option value="3" ${Number(currentRating) === 3 ? 'selected' : ''}>⭐⭐⭐ (3점)</option>
                        <option value="2" ${Number(currentRating) === 2 ? 'selected' : ''}>⭐⭐ (2점)</option>
                        <option value="1" ${Number(currentRating) === 1 ? 'selected' : ''}>⭐ (1점)</option>
                    </select>
                </div>
                <div>
                    <label for="edit-content" class="text-sm font-semibold text-slate-700">내용</label>
                    <textarea id="edit-content" rows="4" required class="mt-2 block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-900 shadow-sm outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10">${escapeHtml(currentContent)}</textarea>
                </div>
                <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button type="button" class="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900" id="cancel-edit">취소</button>
                    <button type="submit" class="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700" id="save-edit">저장</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    activeOverlay = modal;
    document.body.classList.add('overflow-hidden');

    const closeModal = () => {
        document.removeEventListener('keydown', handleKeydown);
        if (activeOverlay === modal) {
            activeOverlay = null;
        }
        modal.remove();
        document.body.classList.remove('overflow-hidden');
    };

    const handleKeydown = (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
    };

    modal.querySelectorAll('[data-edit-close], #cancel-edit').forEach((button) => {
        button.addEventListener('click', closeModal);
    });
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', handleKeydown);

    modal.querySelector('#edit-review-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const newRating = parseInt(modal.querySelector('#edit-rating').value);
        const newContent = modal.querySelector('#edit-content').value.trim();
        const saveBtn = modal.querySelector('#save-edit');

        if (!newContent) { alert('리뷰 내용을 입력해주세요.'); return; }

        try {
            saveBtn.disabled = true;
            saveBtn.textContent = '저장 중...';
            await pb.collection('reviews').update(reviewId, { rating: newRating, content: newContent });
            closeModal();
            showSuccessMessage('리뷰가 수정되었습니다.');
            loadReviews();
        } catch (error) {
            console.error('Error updating review:', error);
            alert('리뷰 수정에 실패했습니다: ' + error.message);
            saveBtn.disabled = false;
            saveBtn.textContent = '저장';
        }
    });
}

async function confirmDeleteReview(reviewId) {
    if (!confirm('정말로 이 리뷰를 삭제하시겠습니까?')) return;
    try {
        await pb.collection('reviews').delete(reviewId);
        const reviewElement = document.querySelector(`[data-review-id="${reviewId}"]`);
        if (reviewElement) {
            reviewElement.style.transition = 'all 0.3s ease-out';
            reviewElement.style.opacity = '0';
            reviewElement.style.transform = 'translateX(-20px)';
            setTimeout(() => {
                reviewElement.remove();
                if (reviewList && reviewList.children.length === 0) {
                    reviewList.innerHTML = `
                        <div data-empty-state="reviews" class="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                            아직 리뷰가 없습니다. 첫 번째 리뷰를 작성해보세요!
                        </div>
                    `;
                }
            }, 300);
        }
        showSuccessMessage('리뷰가 삭제되었습니다.');
    } catch (error) {
        console.error('Error deleting review:', error);
        alert('리뷰 삭제에 실패했습니다: ' + error.message);
    }
}

function showSuccessMessage(message) {
    const toast = document.createElement('div');
    toast.className = 'pointer-events-none fixed right-4 top-4 z-[9999] max-w-sm translate-y-0 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900 shadow-lg shadow-emerald-950/10 transition-all duration-300 ease-out';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.textContent = message;
    document.body.appendChild(toast);
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    });
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function openLightbox(src) {
    closeActiveOverlay();

    const lightbox = document.createElement('div');
    lightbox.id = 'review-lightbox';
    lightbox.className = 'fixed inset-0 z-[10000] flex cursor-zoom-out items-center justify-center bg-slate-950/90 px-4 py-6 backdrop-blur-sm';
    lightbox.dataset.reviewOverlay = 'lightbox';
    lightbox.innerHTML = `
        <div class="relative max-h-[90vh] max-w-5xl">
            <img src="${src}" alt="리뷰 이미지 확대보기" class="max-h-[90vh] w-full max-w-full rounded-3xl object-contain shadow-2xl shadow-black/30">
            <button type="button" data-lightbox-close class="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-2xl leading-none text-slate-900 shadow-lg shadow-black/20 transition hover:bg-white" aria-label="닫기">×</button>
        </div>
    `;
    document.body.appendChild(lightbox);

    activeOverlay = lightbox;
    document.body.classList.add('overflow-hidden');

    const closeLightbox = () => {
        document.removeEventListener('keydown', handleKeydown);
        if (activeOverlay === lightbox) {
            activeOverlay = null;
        }
        lightbox.remove();
        document.body.classList.remove('overflow-hidden');
    };

    const handleKeydown = (event) => {
        if (event.key === 'Escape') {
            closeLightbox();
        }
    };

    lightbox.addEventListener('click', (event) => {
        if (event.target === lightbox || event.target.closest('[data-lightbox-close]')) {
            closeLightbox();
        }
    });
    document.addEventListener('keydown', handleKeydown);
    lightbox.focus?.();
}

async function handleReviewSubmit(e) {
    e.preventDefault();
    if (!pb.authStore.isValid) { alert('리뷰를 작성하려면 로그인이 필요합니다.'); return; }

    const ratingSelect = document.getElementById('review-rating');
    const ratingRadio = document.querySelector('input[name="rating"]:checked');
    const rating = ratingSelect?.value || ratingRadio?.value;
    const contentInput = document.getElementById('review-content');
    const content = contentInput?.value?.trim();
    const submitBtn = reviewForm.querySelector('button[type="submit"]');

    if (!rating) { alert('평점을 선택해주세요.'); return; }
    if (!content) { alert('리뷰 내용을 입력해주세요.'); return; }

    try {
        submitBtn.disabled = true; submitBtn.innerText = '제출 중...';
        const formData = new FormData();
        formData.append('user', pb.authStore.model.id);
        formData.append('product_id', currentProductId);
        formData.append('rating', parseInt(rating));
        formData.append('content', content);
        selectedFiles.forEach(file => formData.append('images', file));

        const newReview = await pb.collection('reviews').create(formData, { expand: 'user' });

        reviewForm.reset();
        selectedFiles = [];
        updateImagePreview();
        addNewReviewToList(newReview);
        showSuccessMessage('리뷰가 성공적으로 등록되었습니다!');
    } catch (error) {
        console.error('Error submitting review:', error);
        let errorMsg = '리뷰 제출에 실패했습니다.';
        if (error.data && error.data.data) {
            const fieldErrors = Object.entries(error.data.data).map(([field, err]) => `- ${field}: ${err.message}`).join('\n');
            if (fieldErrors) errorMsg += '\n' + fieldErrors;
        } else if (error.message) {
            errorMsg += '\n(' + error.message + ')';
        }
        alert(errorMsg);
    } finally {
        submitBtn.disabled = false; submitBtn.innerText = '리뷰 제출';
    }
}

function addNewReviewToList(newReview) {
    if (!reviewList) return;
    const noReviewsMsg = reviewList.querySelector('[data-empty-state="reviews"]');
    if (noReviewsMsg) {
        reviewList.innerHTML = '';
    }
    const newReviewHTML = createReviewHTML({ ...newReview, expand: { user: pb.authStore.model } });
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = newReviewHTML;
    const newElement = tempDiv.firstElementChild;
    newElement.style.opacity = '0';
    newElement.style.transform = 'translateY(-20px)';
    newElement.style.transition = 'all 0.3s ease-out';
    reviewList.insertBefore(newElement, reviewList.firstChild);
    attachReviewEventListeners();
    requestAnimationFrame(() => { newElement.style.opacity = '1'; newElement.style.transform = 'translateY(0)'; });
}

function closeActiveOverlay() {
    if (activeOverlay) {
        activeOverlay.remove();
        activeOverlay = null;
        document.body.classList.remove('overflow-hidden');
    }
}

// ============================================
// Export
// ============================================
export const Reviews = {
    init
};

// 하위 호환성: 전역 노출
if (typeof window !== 'undefined') {
    window.Reviews = Reviews;
}

export default Reviews;
