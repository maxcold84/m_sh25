/**
 * Admin Posts Manager
 * Handles blog post CRUD operations for the admin interface
 */
import { getAdminPb, checkAdmin } from './admin-auth.js';
import { toast, confirmDialog, promptDialog } from './admin-feedback.js';

function showAdminPostsToast(message, type = 'info', duration) {
    toast(message, { type, duration });
}

function confirmAdminPostsAction(options) {
    return confirmDialog(options);
}

function promptAdminPostsAction(options) {
    return promptDialog(options);
}

const AdminPosts = {
    pb: null,
    currentPost: null,
    imageToUpload: null,
    existingImage: null,
    easyMDE: null,
    modal: null,
    _currentTrigger: null,
    _previousBodyOverflow: '',
    _escapeHandlerBound: false,

    init: async function () {
        this.pb = getAdminPb();

        // Check auth
        if (!checkAdmin()) {
            return;
        }

        // Initialize HTMX Auth
        document.body.addEventListener('htmx:configRequest', (event) => {
            if (this.pb && this.pb.authStore.isValid) {
                event.detail.headers.Authorization = this.pb.authStore.token;
            }
        });

        this.bindEvents();
        this.bindModalEvents();
        this.loadPosts();

        // Slug generation listener
        const titleInput = document.getElementById('post-title');
        if (titleInput) {
            titleInput.addEventListener('input', this._slugGenerator);
        }

        // Initialize EasyMDE
        this.easyMDE = new EasyMDE({
            element: document.getElementById('post-content'),
            autosave: {
                enabled: false,
            },
            spellChecker: false,
            status: false,
            toolbar: [
                'bold', 'italic', 'heading', '|',
                'quote', 'unordered-list', 'ordered-list', '|',
                'link', 'image',
                {
                    name: 'video',
                    action: (editor) => { AdminPosts.drawVideoButton(editor); },
                    className: 'fa fa-video-camera', // FontAwesome icon class
                    title: 'Insert Video',
                },
                '|',
                'preview', 'side-by-side', 'fullscreen', '|', 'guide'
            ]
        });
    },

    bindEvents: function () {
        const addPostBtn = document.getElementById('add-post-btn');
        if (addPostBtn && !addPostBtn.dataset.bound) {
            addPostBtn.dataset.bound = 'true';
            addPostBtn.addEventListener('click', (event) => this.openAddModal(event.currentTarget));
        }

        const postForm = document.getElementById('post-form');
        if (postForm && !postForm.dataset.bound) {
            postForm.dataset.bound = 'true';
            postForm.addEventListener('submit', (event) => {
                event.preventDefault();
                this.savePost();
            });
        }

        const postImage = document.getElementById('post-image');
        if (postImage && !postImage.dataset.bound) {
            postImage.dataset.bound = 'true';
            postImage.addEventListener('change', (event) => this.handleImageSelect(event.target));
        }

        const clearImageBtn = document.getElementById('clear-post-image-btn');
        if (clearImageBtn && !clearImageBtn.dataset.bound) {
            clearImageBtn.dataset.bound = 'true';
            clearImageBtn.addEventListener('click', () => this.clearImage());
        }

        const tableBody = document.getElementById('post-table-body');
        if (tableBody && !tableBody.dataset.bound) {
            tableBody.dataset.bound = 'true';
            tableBody.addEventListener('click', (event) => {
                const button = event.target.closest('[data-action]');
                if (!button) return;

                const { action, postId } = button.dataset;
                if (action === 'edit-post') {
                    this.openEditModal(postId, button);
                } else if (action === 'delete-post') {
                    this.deletePost(postId);
                }
            });
        }
    },

    bindModalEvents: function () {
        const modal = this.modal || document.getElementById('postModal');
        if (!modal || modal.dataset.bound) return;

        this.modal = modal;
        modal.dataset.bound = 'true';

        modal.addEventListener('click', (event) => {
            if (event.target === modal || event.target.closest('[data-post-modal-close]')) {
                this.closeModal();
            }
        });

        if (!this._escapeHandlerBound) {
            document.addEventListener('keydown', (event) => {
                if (event.key === 'Escape' && this.isModalOpen()) {
                    this.closeModal();
                }
            });
            this._escapeHandlerBound = true;
        }
    },

    isModalOpen: function () {
        return !!(this.modal && !this.modal.hidden);
    },

    openModal: function () {
        const modal = this.modal || document.getElementById('postModal');
        if (!modal) return;

        this.modal = modal;
        this._previousBodyOverflow = document.body.style.overflow;
        modal.hidden = false;
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';

        setTimeout(() => {
            if (this.easyMDE) {
                this.easyMDE.codemirror.refresh();
            }

            const focusTarget = document.getElementById('post-title') || modal.querySelector('input, textarea, select, button');
            if (focusTarget && typeof focusTarget.focus === 'function') {
                focusTarget.focus();
            }
        }, 0);
    },

    closeModal: function () {
        const modal = this.modal || document.getElementById('postModal');
        if (!modal) return;

        modal.hidden = true;
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = this._previousBodyOverflow || '';

        if (this._currentTrigger && typeof this._currentTrigger.focus === 'function') {
            this._currentTrigger.focus();
        }
        this._currentTrigger = null;
    },

    loadPosts: async function () {
        const tableBody = document.getElementById('post-table-body');
        const spinner = document.getElementById('loading-spinner');

        spinner.style.display = 'flex';
        tableBody.innerHTML = '';

        try {
            const records = await this.pb.collection('posts').getFullList({
                sort: '-created',
            });

            spinner.style.display = 'none';

            if (records.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="5" class="admin-empty-state">등록된 글이 없습니다</td></tr>';
                return;
            }

            records.forEach(post => {
                const tr = document.createElement('tr');

                // 이미지가 있을 때만 표시, 없으면 빈 상태
                let imageHtml = '';
                if (post.image) {
                    const imageUrl = this.pb.files.getUrl(post, post.image, { thumb: '100x100' });
                    imageHtml = `<img src="${imageUrl}" alt="${post.title}" style="width: 100%; height: 100%; object-fit: cover;">`;
                }

                const statusBadge = post.published
                    ? '<span class="admin-pill admin-pill--success">공개</span>'
                    : '<span class="admin-pill admin-pill--muted">비공개</span>';

                const createdDate = new Date(post.created).toLocaleDateString('ko-KR');

                const imageCellHtml = imageHtml
                    ? `<div class="admin-post-thumb">${imageHtml}</div>`
                    : '<div class="admin-post-thumb admin-post-thumb--empty">-</div>';

                tr.innerHTML = `
                    <td>
                        ${imageCellHtml}
                    </td>
                    <td>
                        <div class="admin-post-title">
                            <div class="admin-post-title__main">${post.title}</div>
                            <div class="admin-post-title__slug">/${post.slug}</div>
                        </div>
                    </td>
                    <td>${statusBadge}</td>
                    <td>${createdDate}</td>
                    <td>
                        <div class="admin-post-actions">
                            <button class="admin-post-action-btn admin-post-action-btn--edit" type="button" data-action="edit-post" data-post-id="${post.id}">수정</button>
                            <button class="admin-post-action-btn admin-post-action-btn--delete" type="button" data-action="delete-post" data-post-id="${post.id}">삭제</button>
                            <a href="/ko/blog/${post.slug}/" target="_blank" rel="noreferrer" class="admin-post-action-btn admin-post-action-btn--preview">미리보기</a>
                        </div>
                    </td>
                `;
                tableBody.appendChild(tr);
            });
        } catch (error) {
            console.error('Error loading posts:', error);
            spinner.style.display = 'none';
            if (error.status === 404) {
                tableBody.innerHTML = '<tr><td colspan="5" class="admin-empty-state" style="color: #b91c1c;">PocketBase에 "posts" 컬렉션이 없습니다.</td></tr>';
            } else {
                showAdminPostsToast('글 목록을 불러오는 중 오류가 발생했습니다', 'error');
            }
        }
    },

    openAddModal: function (trigger) {
        this.currentPost = null;
        this.imageToUpload = null;
        this.existingImage = null;
        this._currentTrigger = trigger || document.getElementById('add-post-btn') || document.activeElement;

        document.getElementById('post-form').reset();
        if (this.easyMDE) this.easyMDE.value('');
        document.getElementById('post-id').value = '';
        document.getElementById('postModalLabel').innerText = '글 쓰기';
        document.getElementById('post-image-preview').style.display = 'none';

        // Default published to true
        document.getElementById('post-published').checked = true;

        this.openModal();
    },

    openEditModal: async function (id, trigger) {
        try {
            const post = await this.pb.collection('posts').getOne(id);
            this.currentPost = post;
            this.imageToUpload = null;
            this.existingImage = post.image;
            this._currentTrigger = trigger || document.activeElement;

            document.getElementById('post-id').value = post.id;
            document.getElementById('post-title').value = post.title;
            document.getElementById('post-slug').value = post.slug;
            // document.getElementById('post-content').value = post.content || '';
            if (this.easyMDE) this.easyMDE.value(post.content || '');
            document.getElementById('post-published').checked = post.published;

            // Handle Tags and Categories (assuming stored as JSON or simple string inside PB)
            // Ideally PB schema has 'tags' and 'categories' as json or relation
            // Here assuming simple text or JSON array
            let tags = post.tags;
            if (Array.isArray(tags)) tags = tags.join(', ');

            let categories = post.categories;
            if (Array.isArray(categories)) categories = categories.join(', ');
            else if (typeof categories === 'object' && categories !== null) {
                // in case it's a relation (expand needed) or simple json
                categories = ''; // simplified for now unless expanded
            }

            document.getElementById('post-tags').value = tags || '';
            document.getElementById('post-categories').value = categories || '';

            // Image Preview
            if (post.image) {
                const imgUrl = this.pb.files.getUrl(post, post.image);
                const preview = document.getElementById('post-image-preview');
                preview.querySelector('img').src = imgUrl;
                preview.style.display = 'block';
            } else {
                document.getElementById('post-image-preview').style.display = 'none';
            }

            document.getElementById('postModalLabel').innerText = '글 수정';
            this.openModal();

        } catch (error) {
            console.error('Error fetching post details:', error);
            showAdminPostsToast('글 정보를 불러오는 중 오류가 발생했습니다', 'error');
        }
    },

    savePost: async function () {
        const id = document.getElementById('post-id').value;
        const title = document.getElementById('post-title').value;
        const slug = document.getElementById('post-slug').value;
        const content = this.easyMDE ? this.easyMDE.value() : document.getElementById('post-content').value;
        const published = document.getElementById('post-published').checked;
        const tagsStr = document.getElementById('post-tags').value;
        const categoriesStr = document.getElementById('post-categories').value;

        // Process Tags and Categories into JSON/Arrays
        const tags = tagsStr ? tagsStr.split(',').map(s => s.trim()).filter(s => s) : [];
        const categories = categoriesStr ? categoriesStr.split(',').map(s => s.trim()).filter(s => s) : [];

        if (!title.trim()) {
            showAdminPostsToast('제목을 입력해주세요.', 'error');
            return;
        }
        if (!slug.trim()) {
            showAdminPostsToast('슬러그(URL)를 입력해주세요.', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('title', title);
        formData.append('slug', slug);
        formData.append('content', content);
        formData.append('published', published);

        // Depending on PB schema type for tags/categories
        // Assuming 'json' type for flexibility
        formData.append('tags', JSON.stringify(tags));
        formData.append('categories', JSON.stringify(categories));

        if (this.imageToUpload) {
            formData.append('image', this.imageToUpload);
        } else if (id && this.existingImage === null) {
            // Explicitly removed image
            formData.append('image', '');
        }

        try {
            if (id) {
                await this.pb.collection('posts').update(id, formData);
            } else {
                await this.pb.collection('posts').create(formData);
            }

            this.closeModal();
            this.loadPosts();
        } catch (error) {
            console.error('Error saving post:', error);
            let errorMsg = '글 저장 실패:\n';
            if (error.response && error.response.data) {
                const details = [];
                for (const field in error.response.data) {
                    details.push(`- ${field}: ${error.response.data[field].message}`);
                }
                if (details.length > 0) {
                    errorMsg += details.join('\n');
                } else {
                    errorMsg += error.message;
                }
            } else {
                errorMsg += error.message;
            }
            showAdminPostsToast(errorMsg, 'error', 5200);
        }
    },

    deletePost: async function (id) {
        const confirmed = await confirmAdminPostsAction({
            title: '글 삭제',
            message: '정말 이 글을 삭제하시겠습니까?',
            confirmLabel: '삭제',
            danger: true
        });
        if (!confirmed) return;

        try {
            await this.pb.collection('posts').delete(id);
            this.loadPosts();
            showAdminPostsToast('글이 삭제되었습니다. 블로그에 반영하려면 터미널에서 pnpm sync를 실행하세요.', 'success', 4200);
        } catch (error) {
            console.error('Error deleting post:', error);
            showAdminPostsToast('글 삭제 실패', 'error');
        }
    },

    handleImageSelect: function (input) {
        if (input.files && input.files[0]) {
            const file = input.files[0];
            this.imageToUpload = file;

            const reader = new FileReader();
            reader.onload = function (e) {
                const preview = document.getElementById('post-image-preview');
                preview.querySelector('img').src = e.target.result;
                preview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    },

    clearImage: function () {
        const input = document.getElementById('post-image');
        if (input) input.value = '';
        const preview = document.getElementById('post-image-preview');
        if (preview) {
            const image = preview.querySelector('img');
            if (image) image.src = '';
            preview.style.display = 'none';
        }
        this.imageToUpload = null;
        this.existingImage = null; // Mark for deletion if it was existing
    },

    _slugGenerator: function () {
        const titleInput = document.getElementById('post-title');
        const slugInput = document.getElementById('post-slug');

        const title = titleInput.value;
        let slug = title
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-가-힣]/g, '') // Allow Korean
            .replace(/^-|-$/g, '');

        if (!slug) {
            slug = 'post-' + Date.now();
        }
        slugInput.value = slug;
    },

    // --- Helper Functions for Video Button ---

    _extractVideoInfo: function (input) {
        if (!input) return null;

        // 1. YouTube
        // Patterns: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID
        // iframe embed code also contains these URLs
        const ytMatch = input.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
        if (ytMatch && ytMatch[1]) {
            return { type: 'youtube', id: ytMatch[1] };
        }

        // 2. Vimeo
        // Patterns: vimeo.com/ID, player.vimeo.com/video/ID
        const vimeoMatch = input.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)([0-9]+)/);
        if (vimeoMatch && vimeoMatch[1]) {
            return { type: 'vimeo', id: vimeoMatch[1] };
        }

        // 3. Generic Video File (.mp4, .webm, .ogg)
        if (input.match(/\.(mp4|webm|ogg)$/i)) {
            return { type: 'video', src: input };
        }

        return null; // Unknown format
    },

    drawVideoButton: async function (editor) {
        const cm = editor.codemirror;
        const input = await promptAdminPostsAction({
            title: '동영상 삽입',
            message: '동영상 URL 또는 Embed 코드를 입력하세요.\n지원: YouTube, Vimeo, .mp4',
            placeholder: 'https://www.youtube.com/watch?v=...',
            confirmLabel: '삽입',
            validate(value) {
                return value ? '' : '동영상 링크를 입력해주세요.';
            }
        });

        if (!input) return;

        const info = AdminPosts._extractVideoInfo(input);

        if (!info) {
            showAdminPostsToast('유효한 동영상 링크나 코드가 아닙니다.\n지원: YouTube, Vimeo, .mp4 파일 링크', 'error', 4200);
            return;
        }

        let shortcode = '';
        if (info.type === 'youtube') {
            shortcode = `{{< youtube ${info.id} >}}`;
        } else if (info.type === 'vimeo') {
            shortcode = `{{< vimeo ${info.id} >}}`;
        } else if (info.type === 'video') {
            shortcode = `{{< video src="${info.src}" >}}`;
        }

        // Insert at cursor position
        cm.replaceSelection(shortcode);
    }
};

document.addEventListener('DOMContentLoaded', function () {
    AdminPosts.init();
});
