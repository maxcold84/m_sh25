import { productsApi } from './products-api.js';

const SECTION_SELECTOR = '[data-home-products]';
const WRAPPER_SELECTOR = '[data-home-products-wrapper]';
const CONTAINER_SELECTOR = '[data-home-products-container]';
const LOADING_SELECTOR = '[data-home-products-loading]';
const CARD_WIDTH = 'clamp(15rem, 72vw, 16rem)';
const CURRENCY = window.ShopConfig?.currency || '₩';

function isKoreanPage() {
    return document.documentElement.lang === 'ko' || window.location.pathname.startsWith('/ko/');
}

function getLanguageCode() {
    return isKoreanPage() ? 'ko' : 'en';
}

function createPlaceholderDataUri(label) {
    const safeLabel = String(label || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" role="img" aria-label="${safeLabel}">
            <defs>
                <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#e2e8f0" />
                    <stop offset="100%" stop-color="#cbd5e1" />
                </linearGradient>
            </defs>
            <rect width="600" height="600" rx="56" fill="url(#bg)" />
            <circle cx="300" cy="240" r="76" fill="#f8fafc" fill-opacity="0.75" />
            <path d="M178 378c36-54 78-81 122-81s86 27 122 81" fill="none" stroke="#94a3b8" stroke-width="24" stroke-linecap="round" />
            <text x="300" y="510" text-anchor="middle" fill="#475569" font-size="38" font-family="Arial, sans-serif" font-weight="700">${safeLabel}</text>
        </svg>
    `.trim();

    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function getPlaceholderImage() {
    return createPlaceholderDataUri(isKoreanPage() ? '이미지 없음' : 'No Image');
}

function getErrorPlaceholderImage() {
    return createPlaceholderDataUri(isKoreanPage() ? '이미지 오류' : 'Image Error');
}

function getProductUrl(slug) {
    if (!slug) {
        return '#products';
    }

    return `/${getLanguageCode()}/products/${encodeURIComponent(slug)}/`;
}

function canAutoAnimate() {
    const coarsePointer = window.matchMedia?.('(pointer: coarse)')?.matches
        || window.matchMedia?.('(hover: none)')?.matches
        || false;
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches || false;
    return !coarsePointer && !reducedMotion;
}

function createCard(product) {
    const imageFallback = getErrorPlaceholderImage();
    const imageUrl = (product.images && product.images.length > 0)
        ? productsApi.getImageUrl(product, product.images[0], '300x300')
        : getPlaceholderImage();
    const finalPrice = Number(product.discount_price || product.price || 0);
    const originalPrice = Number(product.price || 0);
    const productUrl = getProductUrl(product.slug);

    const block = document.createElement('div');
    block.className = 'home-product-card h-full';
    block.style.flex = '0 0 auto';
    block.style.width = CARD_WIDTH;
    block.setAttribute('role', 'listitem');

    const article = document.createElement('article');
    article.className = 'group flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 transition duration-300 hover:-translate-y-1 hover:shadow-xl';

    const media = document.createElement('div');
    media.className = 'relative aspect-square overflow-hidden bg-slate-100';

    const image = document.createElement('img');
    image.className = 'h-full w-full select-none object-cover transition duration-500 group-hover:scale-105';
    image.src = imageUrl;
    image.alt = product.title || '';
    image.loading = 'lazy';
    image.draggable = false;
    image.dataset.fallbackSrc = imageFallback;
    image.addEventListener('error', () => {
        if (image.src !== imageFallback) {
            image.src = imageFallback;
        }
    }, { once: true });

    const overlay = document.createElement('div');
    overlay.className = 'absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-slate-950/40 via-transparent to-transparent p-4';

    const detailLink = document.createElement('a');
    detailLink.href = productUrl;
    detailLink.className = 'inline-flex h-11 w-11 items-center justify-center self-end rounded-full bg-white/90 text-slate-700 shadow-lg backdrop-blur transition hover:bg-white hover:text-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2';
    detailLink.setAttribute('aria-label', isKoreanPage() ? '상품 상세보기' : 'View product details');
    detailLink.innerHTML = '<i class="tf-ion-plus-round text-xl"></i>';

    const cartButton = document.createElement('button');
    cartButton.type = 'button';
    cartButton.className = 'inline-flex w-full items-center justify-center gap-2 rounded-full bg-amber-400 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-200 transition hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2';
    cartButton.dataset.cartAction = 'add-item';
    cartButton.dataset.cartId = product.id || '';
    cartButton.dataset.cartName = product.title || '';
    cartButton.dataset.cartPrice = String(finalPrice);
    cartButton.dataset.cartImage = imageUrl;
    cartButton.dataset.cartOptions = JSON.stringify({
        __productSlug: product.slug || '',
        __productUrl: productUrl
    });
    cartButton.innerHTML = '<span aria-hidden="true">🛒</span><span>' + (isKoreanPage() ? '장바구니 추가' : 'Add to cart') + '</span>';

    const body = document.createElement('div');
    body.className = 'flex flex-1 flex-col p-4 text-center sm:p-5';

    const title = document.createElement('h4');
    title.className = 'text-base font-semibold leading-6 text-slate-900';
    title.textContent = product.title || '';

    const price = document.createElement('p');
    price.className = 'mt-2 text-lg font-semibold text-slate-700';

    if (product.discount_price && Number(product.discount_price) > 0) {
        const sale = document.createElement('span');
        sale.textContent = `${CURRENCY}${Number(product.discount_price).toLocaleString()}`;

        const original = document.createElement('s');
        original.className = 'ml-2 text-sm font-medium text-slate-400';
        original.textContent = `${CURRENCY}${originalPrice.toLocaleString()}`;

        price.appendChild(sale);
        price.appendChild(original);
    } else {
        price.textContent = `${CURRENCY}${originalPrice.toLocaleString()}`;
    }

    overlay.appendChild(detailLink);
    overlay.appendChild(cartButton);
    media.appendChild(image);
    media.appendChild(overlay);
    body.appendChild(title);
    body.appendChild(price);
    article.appendChild(media);
    article.appendChild(body);
    block.appendChild(article);

    return block;
}

function createEmptyState(message) {
    const empty = document.createElement('p');
    empty.className = 'flex w-full items-center justify-center py-16 text-center text-slate-500';
    empty.textContent = message;
    return empty;
}

function createErrorState(message) {
    const error = document.createElement('p');
    error.className = 'flex w-full items-center justify-center py-16 text-center text-rose-600';
    error.textContent = message;
    return error;
}

function syncCarouselMode(wrapper, container, autoAnimate) {
    if (!wrapper || !container) {
        return;
    }

    if (autoAnimate) {
        wrapper.style.overflowX = 'hidden';
        wrapper.style.overflowY = 'hidden';
        wrapper.style.touchAction = 'pan-y';
        container.style.display = 'flex';
        container.style.gap = '1rem';
        container.style.width = 'max-content';
        container.style.minWidth = '100%';
        container.style.transform = 'translateX(0px)';
        container.style.willChange = 'transform';
        return;
    }

    wrapper.style.overflowX = 'auto';
    wrapper.style.overflowY = 'hidden';
    wrapper.style.touchAction = 'pan-x';
    wrapper.style.scrollBehavior = 'smooth';
    container.style.display = 'flex';
    container.style.gap = '1rem';
    container.style.width = 'max-content';
    container.style.minWidth = '100%';
    container.style.transform = 'none';
    container.style.willChange = 'auto';
}

function initCarousel(container, wrapper, autoAnimate) {
    const state = {
        animationFrame: null,
        currentPosition: 0,
        totalWidth: 0,
        isHovering: false,
        isDragging: false,
        startX: 0,
        startPosition: 0,
        lastX: 0,
        lastTime: 0,
        dragVelocity: 0,
        productCount: 0
    };

    state.productCount = container.querySelectorAll('.home-product-card').length;

    function getPointerX(event) {
        if (event.touches && event.touches.length > 0) {
            return event.touches[0].pageX;
        }

        if (event.changedTouches && event.changedTouches.length > 0) {
            return event.changedTouches[0].pageX;
        }

        return event.pageX;
    }

    function measureSlider() {
        const firstItem = container.querySelector('.home-product-card');
        if (!firstItem || state.productCount === 0) {
            state.totalWidth = 0;
            return;
        }

        const gapValue = parseFloat(getComputedStyle(container).gap || '0') || 0;
        state.totalWidth = (firstItem.offsetWidth + gapValue) * state.productCount;
    }

    function animate() {
        if (!autoAnimate || !state.totalWidth) {
            state.animationFrame = requestAnimationFrame(animate);
            return;
        }

        if (!state.isHovering && !state.isDragging) {
            state.currentPosition -= 0.5;
            if (Math.abs(state.currentPosition) >= state.totalWidth) {
                state.currentPosition = 0;
            }

            container.style.transform = `translateX(${state.currentPosition}px)`;
        }

        state.animationFrame = requestAnimationFrame(animate);
    }

    function beginDrag(event) {
        if (!autoAnimate) {
            return;
        }

        if (event.target.closest('button') || event.target.closest('a')) {
            return;
        }

        state.isDragging = true;
        state.startX = getPointerX(event);
        state.startPosition = state.currentPosition;
        state.lastX = state.startX;
        state.lastTime = Date.now();
        state.dragVelocity = 0;
        wrapper.style.cursor = 'grabbing';
        wrapper.style.userSelect = 'none';
    }

    function moveDrag(event) {
        if (!autoAnimate || !state.isDragging) {
            return;
        }

        if (event.cancelable) {
            event.preventDefault();
        }

        const currentX = getPointerX(event);
        const diff = currentX - state.startX;
        state.currentPosition = state.startPosition + diff;

        const currentTime = Date.now();
        const timeDiff = currentTime - state.lastTime;
        if (timeDiff > 0) {
            state.dragVelocity = (currentX - state.lastX) / timeDiff;
        }
        state.lastX = currentX;
        state.lastTime = currentTime;

        if (state.totalWidth > 0) {
            if (state.currentPosition > 0) {
                state.currentPosition -= state.totalWidth;
                state.startPosition -= state.totalWidth;
                state.startX = getPointerX(event) - (state.currentPosition - state.startPosition);
            } else if (Math.abs(state.currentPosition) >= state.totalWidth * 2) {
                state.currentPosition += state.totalWidth;
                state.startPosition += state.totalWidth;
                state.startX = getPointerX(event) - (state.currentPosition - state.startPosition);
            }
        }

        container.style.transform = `translateX(${state.currentPosition}px)`;
    }

    function endDrag() {
        if (!autoAnimate || !state.isDragging) {
            return;
        }

        state.isDragging = false;
        wrapper.style.cursor = 'grab';
        wrapper.style.userSelect = '';

        if (Math.abs(state.dragVelocity) <= 0.1 || !state.totalWidth) {
            return;
        }

        const inertia = () => {
            if (Math.abs(state.dragVelocity) <= 0.01) {
                return;
            }

            state.currentPosition += state.dragVelocity * 16;
            state.dragVelocity *= 0.95;

            if (state.totalWidth > 0) {
                if (state.currentPosition > 0) {
                    state.currentPosition -= state.totalWidth;
                } else if (Math.abs(state.currentPosition) >= state.totalWidth * 2) {
                    state.currentPosition += state.totalWidth;
                }
            }

            container.style.transform = `translateX(${state.currentPosition}px)`;
            requestAnimationFrame(inertia);
        };

        requestAnimationFrame(inertia);
    }

    function onWheel(event) {
        if (!autoAnimate || !state.isHovering) {
            return;
        }

        event.preventDefault();
        state.currentPosition -= event.deltaY * 2;

        if (state.totalWidth > 0) {
            if (state.currentPosition > 0) {
                state.currentPosition -= state.totalWidth;
            } else if (Math.abs(state.currentPosition) >= state.totalWidth * 2) {
                state.currentPosition += state.totalWidth;
            }
        }

        container.style.transform = `translateX(${state.currentPosition}px)`;
    }

    if (autoAnimate) {
        wrapper.addEventListener('mouseenter', () => {
            state.isHovering = true;
        });

        wrapper.addEventListener('mouseleave', () => {
            state.isHovering = false;
        });

        wrapper.addEventListener('mousedown', beginDrag);
        wrapper.addEventListener('touchstart', beginDrag, { passive: true });
        document.addEventListener('mousemove', moveDrag);
        document.addEventListener('touchmove', moveDrag, { passive: false });
        document.addEventListener('mouseup', endDrag);
        document.addEventListener('touchend', endDrag);
        document.addEventListener('touchcancel', endDrag);
        wrapper.addEventListener('wheel', onWheel, { passive: false });
        wrapper.style.cursor = 'grab';
    }

    window.addEventListener('resize', () => {
        if (!container.querySelector('.home-product-card')) {
            return;
        }

        measureSlider();
        if (autoAnimate) {
            container.style.transform = `translateX(${state.currentPosition}px)`;
        }
    });

    measureSlider();
    if (autoAnimate) {
        animate();
    }

    return state;
}

async function loadProducts(container, wrapper, loading) {
    try {
        const result = await productsApi.getList({ perPage: 20, sort: '-order,-created' });
        const items = Array.isArray(result?.items) ? result.items : [];

        loading?.remove();
        container.replaceChildren();

        if (items.length === 0) {
            container.appendChild(createEmptyState(isKoreanPage() ? '등록된 상품이 없습니다.' : 'No products found.'));
            return;
        }

        const autoAnimate = canAutoAnimate();
        syncCarouselMode(wrapper, container, autoAnimate);

        const repeatCount = autoAnimate ? Math.max(3, Math.ceil(20 / items.length)) : 1;
        for (let repeat = 0; repeat < repeatCount; repeat += 1) {
            items.forEach((product) => {
                container.appendChild(createCard(product));
            });
        }

        if (autoAnimate) {
            requestAnimationFrame(() => {
                initCarousel(container, wrapper, autoAnimate);
            });
        }
    } catch (error) {
        loading?.remove();
        container.replaceChildren(createErrorState(
            isKoreanPage()
                ? `상품을 불러오는 중 오류가 발생했습니다: ${error?.message || ''}`.trim()
                : `Failed to load products: ${error?.message || ''}`.trim()
        ));
    }
}

export function initHomeProducts() {
    const section = document.querySelector(SECTION_SELECTOR);
    const container = section?.querySelector(CONTAINER_SELECTOR);
    const wrapper = section?.querySelector(WRAPPER_SELECTOR);
    const loading = section?.querySelector(LOADING_SELECTOR);

    if (!section || !container || !wrapper) {
        return;
    }

    loadProducts(container, wrapper, loading);
}

export default initHomeProducts;
