/**
 * QnA Module (ES6)
 * 상품 문의 관리 모듈
 * @module qna
 */
import { pb } from './core/pb-client.js';
import { escapeHtml } from './core/utils.js';

// Module State
let qnaForm = null;
let qnaList = null;
let authMessage = null;
let currentProductId = null;
let qnaComposePanel = null;
let qnaFormContainer = null;
let composePanelOpen = false;

/**
 * QnA 모듈 초기화
 * @param {string} productId - 제품 ID
 */
function init(productId) {
    currentProductId = productId;

    qnaForm = document.getElementById('qna-form');
    qnaList = document.getElementById('qna-list');
    authMessage = document.getElementById('qna-auth-message');
    qnaComposePanel = document.getElementById('qna-compose-panel');
    qnaFormContainer = document.getElementById('qna-form-container');

    updateUI();
    loadInquiries();

    if (qnaForm) {
        qnaForm.addEventListener('submit', handleInquirySubmit);
    }

    bindStaticActions();

    // Listen for auth changes
    pb.authStore.onChange(() => {
        updateUI();
        loadInquiries();
    });
}

function bindStaticActions() {
    const toggleButtons = document.querySelectorAll('[data-qna-action="toggle-compose"]');
    toggleButtons.forEach((button) => {
        if (button.dataset.qnaBound === 'true') {
            return;
        }

        button.dataset.qnaBound = 'true';
        button.addEventListener('click', () => {
            setComposePanelOpen(!composePanelOpen, { focusInput: true, scrollIntoView: true });
        });
    });
}

function updateUI() {
    const isLoggedIn = pb.authStore.isValid;
    if (qnaComposePanel) {
        qnaComposePanel.classList.toggle('hidden', !composePanelOpen);
    }

    if (qnaFormContainer) {
        qnaFormContainer.classList.toggle('hidden', !composePanelOpen || !isLoggedIn);
    }

    if (authMessage) {
        authMessage.classList.toggle('hidden', !composePanelOpen || isLoggedIn);
    }

    document.querySelectorAll('[data-qna-action="toggle-compose"]').forEach((button) => {
        button.setAttribute('aria-expanded', composePanelOpen ? 'true' : 'false');

        const label = button.querySelector('[data-qna-toggle-label]');
        if (label) {
            label.textContent = composePanelOpen ? '문의 작성 접기' : '문의하기';
        }
    });
}

function setComposePanelOpen(nextOpen, options = {}) {
    composePanelOpen = nextOpen;
    updateUI();

    if (!composePanelOpen) {
        return;
    }

    const { focusInput = false, scrollIntoView = false } = options;
    const target = pb.authStore.isValid ? qnaFormContainer : authMessage;

    if (scrollIntoView && target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    if (focusInput && pb.authStore.isValid) {
        const textarea = document.getElementById('qna-content');
        if (textarea) {
            setTimeout(() => textarea.focus(), 120);
        }
    }
}

async function loadInquiries() {
    if (!currentProductId || !qnaList) return;

    qnaList.innerHTML = `
        <div class="flex min-h-[160px] items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-8">
            <div class="flex items-center gap-3 text-sm font-medium text-slate-500">
                <svg class="h-5 w-5 animate-spin text-slate-500" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"></path>
                </svg>
                <span>문의 목록을 불러오는 중입니다.</span>
            </div>
        </div>`;

    try {
        // Fetch inquiries
        const resultList = await pb.collection('product_inquiries').getList(1, 50, {
            filter: `product_id = "${currentProductId}"`,
            sort: '-created',
            expand: 'user',
        });

        renderInquiries(resultList.items);
    } catch (error) {
        // 404 implies collection might not exist yet or no items
        if (error.status === 404) {
            renderInquiries([]);
            return;
        }
        console.error('Error loading inquiries:', error);
        qnaList.innerHTML = `
            <div class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">
                문의 목록을 불러오는데 실패했습니다.
            </div>`;
    }
}

function renderInquiries(items) {
    if (items.length === 0) {
        qnaList.innerHTML = `
            <div class="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                등록된 문의가 없습니다.
            </div>`;
        return;
    }

    qnaList.innerHTML = items.map(item => createInquiryHTML(item)).join('');

    // Attach delete handlers
    qnaList.querySelectorAll('.btn-delete-qna').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.closest('.qna-item').dataset.id;
            deleteInquiry(id);
        });
    });

    // Attach Reply handlers (Admin)
    qnaList.querySelectorAll('.btn-reply-qna').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const itemEl = e.target.closest('.qna-item');
            const formEl = itemEl.querySelector('.reply-form');
            formEl.classList.toggle('hidden');
        });
    });

    qnaList.querySelectorAll('.btn-cancel-reply').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const itemEl = e.target.closest('.qna-item');
            itemEl.querySelector('.reply-form').classList.add('hidden');
        });
    });

    qnaList.querySelectorAll('.btn-save-reply').forEach(btn => {
        btn.addEventListener('click', (e) => handleReplySave(e));
    });
}

function createInquiryHTML(item) {
    const user = item.expand?.user;
    const userName = user?.username || user?.name || '익명';
    const createdDate = new Date(item.created).toLocaleDateString('ko-KR');
    const isSecret = item.is_secret;

    // Auth check
    const currentUserId = pb.authStore.model?.id;
    const isOwner = pb.authStore.isValid && currentUserId === item.user;
    const isAdmin = pb.authStore.isAdmin;
    const canView = !isSecret || isOwner || isAdmin;

    // Content display logic
    let contentDisplay = '';
    if (canView) {
        contentDisplay = `
            <div class="space-y-4">
                <p class="qna-content whitespace-pre-wrap break-words rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-700">${escapeHtml(item.content)}</p>
                ${item.reply ? `<div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div class="flex items-center gap-2 text-sm font-semibold text-slate-900">
                        <span class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-bold text-emerald-700">A</span>
                        <span>답변</span>
                    </div>
                    <p class="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">${escapeHtml(item.reply)}</p>
                    <small class="mt-2 block text-xs text-slate-500">${new Date(item.reply_date || item.updated).toLocaleDateString('ko-KR')}</small>
                </div>` : ''}
            </div>
        `;
    } else {
        contentDisplay = `
            <div class="rounded-2xl border border-dashed border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-slate-600">
                <span class="inline-flex items-center gap-2 font-medium text-amber-700">
                    <i class="tf-ion-locked"></i>
                    비밀글입니다.
                </span>
            </div>`;
    }

    // Actions
    let actionsHTML = '';
    if (isOwner || isAdmin) {
        actionsHTML += `<button type="button" class="btn-delete-qna inline-flex items-center justify-center rounded-full border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-50">삭제</button>`;
    }
    if (isAdmin) {
        actionsHTML += `<button type="button" class="btn-reply-qna inline-flex items-center justify-center rounded-full border border-slate-900 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700">답변 작성/수정</button>`;
    }

    if (actionsHTML) {
        actionsHTML = `<div class="qna-actions mt-4 flex flex-wrap gap-2">${actionsHTML}</div>`;
    }

    const replyFormHTML = isAdmin ? `
        <div class="reply-form mt-4 hidden rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div class="mb-3">
                <label class="mb-2 block text-sm font-medium text-slate-700">관리자 답변</label>
                <textarea class="admin-reply-input w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-200" rows="4">${escapeHtml(item.reply || '')}</textarea>
            </div>
            <div class="flex justify-end gap-2">
                <button type="button" class="btn-cancel-reply inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100">취소</button>
                <button type="button" class="btn-save-reply inline-flex items-center justify-center rounded-full border border-slate-900 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700">저장</button>
            </div>
        </div>
    ` : '';

    return `
        <article class="qna-item rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5" data-id="${item.id}">
            <div class="flex flex-col gap-4">
                <div class="flex flex-wrap items-center gap-x-2 gap-y-2">
                    <span class="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-900">${isSecret ? '<i class="tf-ion-locked text-amber-500" title="비밀글"></i> ' : ''}${canView ? escapeHtml(userName) : '***'}</span>
                    <span class="text-xs text-slate-500">${createdDate}</span>
                    <span class="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${item.reply ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}">
                        ${item.reply ? '답변완료' : '답변대기'}
                    </span>
                </div>
                ${contentDisplay}
                ${item.reply ? '' : actionsHTML}
                ${item.reply && isAdmin ? actionsHTML : ''}
                ${replyFormHTML}
            </div>
        </div>
    `;
}

async function handleInquirySubmit(e) {
    e.preventDefault();

    if (!pb.authStore.isValid) {
        alert('로그인이 필요합니다.');
        return;
    }

    const content = document.getElementById('qna-content').value.trim();
    const isSecret = document.getElementById('qna-secret').checked;
    const submitBtn = qnaForm.querySelector('button[type="submit"]');

    if (!content) {
        alert('내용을 입력해주세요.');
        return;
    }

    try {
        submitBtn.disabled = true;

        const data = {
            product_id: currentProductId,
            user: pb.authStore.model.id,
            content: content,
            is_secret: isSecret,
            // reply is empty initially
        };

        await pb.collection('product_inquiries').create(data);

        qnaForm.reset();
        loadInquiries();
        setComposePanelOpen(false);
        alert('문의가 등록되었습니다.');

    } catch (error) {
        console.error('Error creating inquiry:', error);
        let checkMsg = '';
        if (error.data && error.data.data) {
            // Formatting validation errors
            checkMsg = '\n' + Object.entries(error.data.data)
                .map(([key, val]) => `${key}: ${val.message}`)
                .join('\n');
        }
        alert('문의 등록 실패: ' + error.message + checkMsg);
    } finally {
        submitBtn.disabled = false;
    }
}

async function handleReplySave(e) {
    const itemEl = e.target.closest('.qna-item');
    const id = itemEl.dataset.id;
    const replyText = itemEl.querySelector('.admin-reply-input').value.trim();
    const btn = e.target;

    try {
        btn.disabled = true;
        btn.textContent = '저장 중...';

        await pb.collection('product_inquiries').update(id, {
            reply: replyText,
            reply_date: new Date()
        });

        loadInquiries();

    } catch (error) {
        console.error('Reply failed', error);
        alert('답변 저장 실패: ' + error.message + getValidationMsg(error));
        btn.disabled = false;
        btn.textContent = '저장';
    }
}

async function deleteInquiry(id) {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
        await pb.collection('product_inquiries').delete(id);
        loadInquiries();
    } catch (error) {
        console.error('delete failed', error);
        alert('삭제 실패');
    }
}

function getValidationMsg(error) {
    if (error.data && error.data.data) {
        return '\n' + Object.entries(error.data.data)
            .map(([key, val]) => `${key}: ${val.message}`)
            .join('\n');
    }
    return '';
}

// ============================================
// Export
// ============================================
export const QnA = {
    init
};

export default QnA;
