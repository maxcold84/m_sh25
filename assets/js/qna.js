const QnA = (function () {
    const pb = window.PBClient.getInstance();
    let qnaForm = null;
    let qnaList = null;
    let authMessage = null;
    let currentProductId = null;

    function init(productId) {
        currentProductId = productId;

        qnaForm = document.getElementById('qna-form');
        qnaList = document.getElementById('qna-list');
        authMessage = document.getElementById('qna-auth-message');

        updateUI();
        loadInquiries();

        if (qnaForm) {
            qnaForm.addEventListener('submit', handleInquirySubmit);
        }

        // Listen for auth changes
        pb.authStore.onChange(() => {
            updateUI();
            loadInquiries();
        });
    }

    function updateUI() {
        const isLoggedIn = pb.authStore.isValid;
        const formContainer = document.getElementById('qna-form-container');

        if (formContainer) {
            formContainer.style.display = isLoggedIn ? 'block' : 'none';
        }
        if (authMessage) {
            authMessage.style.display = isLoggedIn ? 'none' : 'block';
        }
    }

    async function loadInquiries() {
        if (!currentProductId || !qnaList) return;

        qnaList.innerHTML = '<div class="text-center py-3"><div class="spinner-border text-primary" role="status"><span class="sr-only">Loading...</span></div></div>';

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
            qnaList.innerHTML = '<div class="alert alert-danger">문의 목록을 불러오는데 실패했습니다.</div>';
        }
    }

    function renderInquiries(items) {
        if (items.length === 0) {
            qnaList.innerHTML = '<div class="text-center text-muted py-5">등록된 문의가 없습니다.</div>';
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
                if (formEl.style.display === 'none') {
                    formEl.style.display = 'block';
                } else {
                    formEl.style.display = 'none';
                }
            });
        });

        qnaList.querySelectorAll('.btn-cancel-reply').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const itemEl = e.target.closest('.qna-item');
                itemEl.querySelector('.reply-form').style.display = 'none';
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
                <p class="mb-2 qna-content">${Utils.escapeHtml(item.content)}</p>
                ${item.reply ? `<div class="admin-reply bg-light p-3 rounded mt-3">
                    <strong class="text-primary">답변:</strong>
                    <p class="mb-0 mt-1">${Utils.escapeHtml(item.reply)}</p>
                    <small class="text-muted">${new Date(item.reply_date || item.updated).toLocaleDateString('ko-KR')}</small>
                </div>` : ''}
            `;
        } else {
            contentDisplay = `<p class="mb-2 text-muted font-italic"><i class="tf-ion-locked mr-2"></i>비밀글입니다.</p>`;
        }

        // Actions
        let actionsHTML = '';
        if (isOwner || isAdmin) {
            actionsHTML += `<button type="button" class="btn btn-sm btn-outline-danger btn-delete-qna mr-1">삭제</button>`;
        }
        if (isAdmin) {
            actionsHTML += `<button type="button" class="btn btn-sm btn-primary btn-reply-qna">💬 답변 작성/수정</button>`;
        }

        if (actionsHTML) {
            actionsHTML = `<div class="qna-actions mt-2">${actionsHTML}</div>`;
        }

        const replyFormHTML = isAdmin ? `
            <div class="reply-form mt-3 p-3 bg-white border rounded" style="display: none;">
                <div class="form-group pb-0 mb-2">
                    <label class="small text-muted">관리자 답변</label>
                    <textarea class="form-control form-control-sm admin-reply-input" rows="3">${item.reply || ''}</textarea>
                </div>
                <div class="text-right">
                    <button type="button" class="btn btn-sm btn-secondary btn-cancel-reply">취소</button>
                    <button type="button" class="btn btn-sm btn-primary btn-save-reply">저장</button>
                </div>
            </div>
        ` : '';

        return `
            <div class="qna-item border-bottom py-3" data-id="${item.id}">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="w-100">
                        <div class="mb-1">
                            <span class="font-weight-bold mr-2">${isSecret ? '<i class="tf-ion-locked text-warning" title="비밀글"></i> ' : ''}${canView ? Utils.escapeHtml(userName) : '***'}</span>
                            <small class="text-muted">${createdDate}</small>
                            <span class="badge badge-pill ${item.reply ? 'badge-success' : 'badge-secondary'} ml-2">
                                ${item.reply ? '답변완료' : '답변대기'}
                            </span>
                        </div>
                        ${contentDisplay}
                        ${item.reply ? '' : actionsHTML}
                        ${item.reply && isAdmin ? actionsHTML : ''} 
                        ${replyFormHTML}
                    </div>
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

    // escapeHtml -> Utils.escapeHtml 사용

    return {
        init: init
    };
})();
