const Reviews = (function () {
    const pb = new PocketBase('http://127.0.0.1:8090');
    const reviewsContainer = document.getElementById('reviews-container');
    const reviewForm = document.getElementById('review-form');
    const reviewList = document.getElementById('review-list');
    const authMessage = document.getElementById('review-auth-message');

    let currentProductId = null;

    function init(productId) {
        currentProductId = productId;
        updateUI();
        loadReviews();

        if (reviewForm) {
            reviewForm.addEventListener('submit', handleReviewSubmit);
        }

        // Listen for auth changes to update UI
        pb.authStore.onChange(() => {
            updateUI();
        });
    }

    function updateUI() {
        const isLoggedIn = pb.authStore.isValid;
        if (reviewForm) {
            reviewForm.style.display = isLoggedIn ? 'block' : 'none';
        }
        if (authMessage) {
            authMessage.style.display = isLoggedIn ? 'none' : 'block';
        }
    }

    async function loadReviews() {
        if (!currentProductId || !reviewList) return;

        reviewList.innerHTML = '<p class="text-center">Loading reviews...</p>';

        try {
            const resultList = await pb.collection('reviews').getList(1, 50, {
                filter: `product_id = "${currentProductId}"`,
                sort: '-created',
                expand: 'user',
            });

            renderReviews(resultList.items);
        } catch (error) {
            console.error('Error loading reviews:', error);
            reviewList.innerHTML = '<p class="text-center text-danger">Failed to load reviews.</p>';
        }
    }

    function renderReviews(reviews) {
        if (reviews.length === 0) {
            reviewList.innerHTML = '<p class="text-center text-muted">No reviews yet. Be the first to review!</p>';
            return;
        }

        reviewList.innerHTML = reviews.map(review => {
            const user = review.expand?.user;
            const userName = user?.name || user?.username || 'Anonymous';
            const userAvatar = user?.avatar
                ? pb.files.getUrl(user, user.avatar)
                : 'https://via.placeholder.com/40';

            const createdDate = new Date(review.created).toLocaleDateString();
            const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);

            return `
                <div class="media mb-4 p-3 border rounded">
                    <img src="${userAvatar}" class="mr-3 rounded-circle" alt="${userName}" style="width: 40px; height: 40px; object-fit: cover;">
                    <div class="media-body">
                        <h6 class="mt-0 mb-1">${userName} <small class="text-muted ml-2">${createdDate}</small></h6>
                        <div class="text-warning mb-2">${stars}</div>
                        <p>${escapeHtml(review.content)}</p>
                    </div>
                </div>
            `;
        }).join('');
    }

    async function handleReviewSubmit(e) {
        e.preventDefault();

        if (!pb.authStore.isValid) {
            alert('Please log in to submit a review.');
            return;
        }

        const rating = document.querySelector('input[name="rating"]:checked')?.value;
        const content = document.getElementById('review-content').value;
        const submitBtn = reviewForm.querySelector('button[type="submit"]');

        if (!rating) {
            alert('Please select a rating.');
            return;
        }

        try {
            submitBtn.disabled = true;
            submitBtn.innerText = 'Submitting...';

            const data = {
                "user": pb.authStore.model.id,
                "product_id": currentProductId,
                "rating": parseInt(rating),
                "content": content
            };

            await pb.collection('reviews').create(data);

            // Reset form
            reviewForm.reset();

            // Reload reviews
            await loadReviews();

            alert('Review submitted successfully!');

        } catch (error) {
            console.error('Error submitting review:', error);
            alert('Failed to submit review: ' + error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerText = 'Submit Review';
        }
    }

    function escapeHtml(text) {
        if (!text) return '';
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    return {
        init: init
    };
})();
