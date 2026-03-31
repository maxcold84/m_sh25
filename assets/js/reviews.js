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

function showToast(message, tone = 'success') {
    if (!message) return;

    const existingToast = document.querySelector('[data-review-toast]');
    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = `review-toast review-toast--${tone}`;
    toast.dataset.reviewToast = tone;
    toast.setAttribute('role', tone === 'error' ? 'alert' : 'status');
    toast.setAttribute('aria-live', tone === 'error' ? 'assertive' : 'polite');
    toast.textContent = message;
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';

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

function showSuccessMessage(message) {
    showToast(message, 'success');
}

function showErrorMessage(message) {
    showToast(message, 'error');
}

function showConfirmationDialog({ title, message, confirmText = '삭제', cancelText = '취소' }) {
    return new Promise((resolve) => {
        closeActiveOverlay();

        const modal = document.createElement('div');
        modal.className = 'review-modal';
        modal.dataset.reviewOverlay = 'confirm';
        modal.innerHTML = `
            <div class="review-modal__panel">
                <div class="review-modal__header">
                    <div>
                        <p class="review-modal__eyebrow">Confirm action</p>
                        <h4 class="review-modal__title">${escapeHtml(title)}</h4>
                    </div>
                    <button type="button" class="review-btn review-btn--ghost review-btn--icon review-modal__close" data-confirm-cancel aria-label="닫기">×</button>
                </div>
                <p class="review-modal__body">${escapeHtml(message)}</p>
                <div class="review-modal__actions">
                    <button type="button" class="review-btn review-btn--ghost" data-confirm-cancel>${escapeHtml(cancelText)}</button>
                    <button type="button" class="review-btn review-btn--danger" data-confirm-accept>${escapeHtml(confirmText)}</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        activeOverlay = modal;
        document.body.classList.add('overflow-hidden');

        const finish = (result) => {
            document.removeEventListener('keydown', handleKeydown);
            if (activeOverlay === modal) {
                activeOverlay = null;
            }
            modal.remove();
            document.body.classList.remove('overflow-hidden');
            resolve(result);
        };

        const handleKeydown = (event) => {
            if (event.key === 'Escape') {
                finish(false);
            }
        };

        modal.querySelectorAll('[data-confirm-cancel]').forEach((button) => {
            button.addEventListener('click', () => finish(false));
        });

        modal.querySelector('[data-confirm-accept]').addEventListener('click', () => finish(true));
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                finish(false);
            }
        });

        document.addEventListener('keydown', handleKeydown);
        modal.querySelector('[data-confirm-accept]').focus();
    });
}

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
    const validationMessages = [];
    for (const file of files) {
        if (!ALLOWED_REVIEW_IMAGE_TYPES.includes(file.type)) {
            validationMessages.push(`지원되지 않는 파일 형식입니다: ${file.name}\n(jpg, png, gif, webp만 가능)`);
            continue;
        }
        if (file.size > MAX_REVIEW_IMAGE_SIZE) {
            validationMessages.push(`파일 크기가 너무 큽니다: ${file.name}\n(최대 10MB)`);
            continue;
        }
        validFiles.push(file);
    }

    // Limit to 5 images total
    if (selectedFiles.length + validFiles.length > MAX_REVIEW_IMAGES) {
        validationMessages.push('최대 5장까지 업로드할 수 있습니다.');
    }

    if (validationMessages.length > 0) {
        showErrorMessage(validationMessages.join('\n'));
    }

    if (selectedFiles.length + validFiles.length > MAX_REVIEW_IMAGES) {
        e.target.value = '';
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
            wrapper.className = 'review-image-preview__item';
            wrapper.innerHTML = `
                <img src="${e.target.result}" alt="Preview ${index + 1}" class="h-full w-full object-cover">
                <button type="button" class="review-image-remove" data-index="${index}" aria-label="Remove selected image">×</button>
            `;
            imagePreview.appendChild(wrapper);

            // Add remove handler
            wrapper.querySelector('.review-image-remove').addEventListener('click', () => {
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
            <div class="review-empty">
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
            <div class="review-empty review-empty--error">
                리뷰를 불러오는데 실패했습니다.
            </div>
        `;
    }
}

function renderReviews(reviews) {
    if (reviews.length === 0) {
        reviewList.innerHTML = `
            <div data-empty-state="reviews" class="review-empty">
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

    reviewList.querySelectorAll('.review-avatar--img').forEach((img) => {
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
    reviewList.querySelectorAll('[data-review-action="edit"]').forEach((button) => {
        button.addEventListener('click', (event) => {
            const reviewId = event.currentTarget.closest('.review-item').dataset.reviewId;
            openEditModal(reviewId);
        });
    });

    // Delete buttons
    reviewList.querySelectorAll('[data-review-action="delete"]').forEach((button) => {
        button.addEventListener('click', (event) => {
            const reviewId = event.currentTarget.closest('.review-item').dataset.reviewId;
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
        <div class="review-actions">
            <button type="button" data-review-action="edit" class="review-btn review-btn--ghost">수정</button>
            <button type="button" data-review-action="delete" class="review-btn review-btn--danger">삭제</button>
        </div>
    ` : '';

    let imagesHTML = '';
    if (review.images && review.images.length > 0) {
        const imageItems = review.images.map(img => {
            const thumbUrl = pb.files.getUrl(review, img, { thumb: '200x200' });
            const imgUrl = pb.files.getUrl(review, img);
            return `<img src="${thumbUrl}" data-full="${imgUrl}" alt="리뷰 이미지" class="review-image">`;
        }).join('');
        imagesHTML = `<div class="review-image-grid">${imageItems}</div>`;
    }

    const avatarHTML = userAvatar
        ? `<img src="${userAvatar}" class="review-avatar review-avatar--img" alt="${escapeHtml(userName)}" data-avatar-fallback="${escapeHtml('<div class="review-avatar review-avatar--fallback"><i class="tf-ion-android-person review-avatar__icon"></i></div>')}">`
        : `<div class="review-avatar review-avatar--fallback"><i class="tf-ion-android-person review-avatar__icon"></i></div>`;

    return `
        <article class="review-card review-item" data-review-id="${review.id}" data-rating="${ratingValue}" data-content="${escapeHtml(review.content)}">
            <div class="flex gap-4">
            ${avatarHTML}
            <div class="min-w-0 flex-1">
                <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div class="review-card__meta">
                        <h6 class="review-card__name">${escapeHtml(userName)}</h6>
                        <p class="review-card__date">${createdDate}</p>
                    </div>
                    <div class="review-card__stars">${stars}</div>
                </div>
                <p class="review-card__content">${escapeHtml(review.content)}</p>
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
    modal.className = 'review-modal';
    modal.dataset.reviewOverlay = 'edit';
    modal.innerHTML = `
        <div class="review-modal__panel review-modal__panel--large">
            <div class="review-modal__header">
                <div>
                    <p class="review-modal__eyebrow">Edit review</p>
                    <h4 class="review-modal__title">리뷰 수정</h4>
                </div>
                <button type="button" class="review-btn review-btn--ghost review-btn--icon review-modal__close" data-edit-close aria-label="닫기">×</button>
            </div>
            <form id="edit-review-form" class="mt-5 space-y-5">
                <div>
                    <label for="edit-rating" class="review-field-label">평점</label>
                    <select id="edit-rating" required class="review-field-control">
                        <option value="5" ${Number(currentRating) === 5 ? 'selected' : ''}>⭐⭐⭐⭐⭐ (5점)</option>
                        <option value="4" ${Number(currentRating) === 4 ? 'selected' : ''}>⭐⭐⭐⭐ (4점)</option>
                        <option value="3" ${Number(currentRating) === 3 ? 'selected' : ''}>⭐⭐⭐ (3점)</option>
                        <option value="2" ${Number(currentRating) === 2 ? 'selected' : ''}>⭐⭐ (2점)</option>
                        <option value="1" ${Number(currentRating) === 1 ? 'selected' : ''}>⭐ (1점)</option>
                    </select>
                </div>
                <div>
                    <label for="edit-content" class="review-field-label">내용</label>
                    <textarea id="edit-content" rows="4" required class="review-field-control review-field-control--textarea">${escapeHtml(currentContent)}</textarea>
                </div>
                <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button type="button" class="review-btn review-btn--ghost" id="cancel-edit">취소</button>
                    <button type="submit" class="review-btn review-btn--primary" id="save-edit">저장</button>
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

        if (!newContent) { showErrorMessage('리뷰 내용을 입력해주세요.'); return; }

        try {
            saveBtn.disabled = true;
            saveBtn.textContent = '저장 중...';
            await pb.collection('reviews').update(reviewId, { rating: newRating, content: newContent });
            closeModal();
            showSuccessMessage('리뷰가 수정되었습니다.');
            loadReviews();
        } catch (error) {
            console.error('Error updating review:', error);
            showErrorMessage('리뷰 수정에 실패했습니다: ' + error.message);
            saveBtn.disabled = false;
            saveBtn.textContent = '저장';
        }
    });
}

async function confirmDeleteReview(reviewId) {
    const confirmed = await showConfirmationDialog({
        title: '리뷰 삭제',
        message: '정말로 이 리뷰를 삭제하시겠습니까?\n삭제된 리뷰는 되돌릴 수 없습니다.',
        confirmText: '삭제',
        cancelText: '취소',
    });

    if (!confirmed) return;

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
        showErrorMessage('리뷰 삭제에 실패했습니다: ' + error.message);
    }
}

function openLightbox(src) {
    closeActiveOverlay();

    const lightbox = document.createElement('div');
    lightbox.id = 'review-lightbox';
    lightbox.className = 'review-lightbox';
    lightbox.dataset.reviewOverlay = 'lightbox';
    lightbox.innerHTML = `
        <div class="review-lightbox__panel">
            <img src="${src}" alt="리뷰 이미지 확대보기" class="review-lightbox__image">
            <button type="button" data-lightbox-close class="review-btn review-btn--ghost review-btn--icon review-lightbox__close" aria-label="닫기">×</button>
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
    if (!pb.authStore.isValid) { showErrorMessage('리뷰를 작성하려면 로그인이 필요합니다.'); return; }

    const ratingSelect = document.getElementById('review-rating');
    const ratingRadio = document.querySelector('input[name="rating"]:checked');
    const rating = ratingSelect?.value || ratingRadio?.value;
    const contentInput = document.getElementById('review-content');
    const content = contentInput?.value?.trim();
    const submitBtn = reviewForm.querySelector('button[type="submit"]');

    if (!rating) { showErrorMessage('평점을 선택해주세요.'); return; }
    if (!content) { showErrorMessage('리뷰 내용을 입력해주세요.'); return; }

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
        showErrorMessage(errorMsg);
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
