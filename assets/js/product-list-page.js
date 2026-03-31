import { productsApi } from './products-api.js';

const SECTION_SELECTOR = '[data-product-list-page]';
const CONTAINER_SELECTOR = '#product-list-container';
function getLanguage(section) {
    const explicitLang = section?.dataset.productListLang;
    if (explicitLang) {
        return explicitLang.startsWith('ko') ? 'ko' : 'en';
    }

    return document.documentElement.lang === 'ko' || location.pathname.startsWith('/ko/')
        ? 'ko'
        : 'en';
}

function getCurrency(section) {
    return section?.dataset.productListCurrency || '₩';
}

function createPlaceholderImage(label) {
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

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[char]));
}

function getProductUrl(lang, slug) {
    return slug ? `/${lang}/products/${encodeURIComponent(slug)}/` : '#products';
}

function getProductCardImage(product, fallbackLabel) {
    if (product.images?.length) {
        return productsApi.getImageUrl(product, product.images[0], '300x300');
    }

    return createPlaceholderImage(fallbackLabel);
}

function renderEmptyState(container, lang) {
    container.innerHTML = `
        <div class="col-span-full py-12 text-center text-slate-600">
            <p>${lang === 'ko' ? '등록된 상품이 없습니다.' : 'No products found.'}</p>
        </div>
    `;
}

function renderErrorState(container, message) {
    container.innerHTML = `
        <div class="col-span-full py-12 text-center text-rose-600">
            <p>${message}</p>
        </div>
    `;
}

function renderProductCard(product, lang, currency) {
    const detailUrl = getProductUrl(lang, product.slug);
    const title = product.title || '';
    const fallbackLabel = lang === 'ko' ? '이미지 없음' : 'No Image';
    const imageUrl = getProductCardImage(product, fallbackLabel);
    const finalPrice = Number(product.discount_price || product.price || 0);
    const originalPrice = Number(product.price || 0);
    const titleHtml = escapeHtml(title);
    const imageHtml = escapeHtml(imageUrl);
    const detailUrlHtml = escapeHtml(detailUrl);
    const cartOptions = JSON.stringify({ __productSlug: product.slug || '', __productUrl: detailUrl });
    const priceMarkup = product.discount_price
        ? `${currency}${Number(product.discount_price).toLocaleString()} <s class="text-sm font-medium text-slate-400">${currency}${originalPrice.toLocaleString()}</s>`
        : `${currency}${originalPrice.toLocaleString()}`;

    const card = document.createElement('div');
    card.className = 'h-full';

    card.innerHTML = `
        <article class="group flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 transition duration-300 hover:-translate-y-1 hover:shadow-xl">
            <div class="relative aspect-square overflow-hidden bg-slate-100">
                <img class="h-full w-full object-cover transition duration-500 group-hover:scale-105" src="${imageHtml}" alt="${titleHtml}" loading="lazy">
                <div class="absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-slate-950/35 via-transparent to-transparent p-4 opacity-100 transition lg:opacity-0 lg:group-hover:opacity-100">
                    <a href="${detailUrlHtml}" class="inline-flex h-11 w-11 items-center justify-center self-end rounded-full bg-white/90 text-slate-700 shadow-lg backdrop-blur transition hover:bg-white hover:text-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2" aria-label="${lang === 'ko' ? '상품 상세보기' : 'View product details'}">
                        <i class="tf-ion-plus-round text-xl"></i>
                    </a>
                    <button
                        type="button"
                        class="inline-flex w-full items-center justify-center gap-2 rounded-full bg-amber-400 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-200 transition hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
                        data-cart-action="add-item"
                        data-cart-id="${product.id || ''}"
                        data-cart-name="${titleHtml}"
                        data-cart-price="${finalPrice}"
                        data-cart-image="${imageHtml}"
                        data-cart-options='${cartOptions}'>
                        <span aria-hidden="true">🛒</span>
                        <span>${lang === 'ko' ? '장바구니 추가' : 'Add to cart'}</span>
                    </button>
                </div>
            </div>
            <div class="flex flex-1 flex-col p-4 text-center sm:p-5">
                <h4 class="text-base font-semibold leading-6 text-slate-900 sm:text-lg">
                    <a href="${detailUrlHtml}" class="transition hover:text-amber-500">${titleHtml}</a>
                </h4>
                <p class="mt-2 text-lg font-semibold text-slate-700">${priceMarkup}</p>
            </div>
        </article>
    `;

    return card;
}

async function initProductListPage() {
    const section = document.querySelector(SECTION_SELECTOR);
    const container = section?.querySelector(CONTAINER_SELECTOR);

    if (!section || !container) {
        return;
    }

    const lang = getLanguage(section);
    const currency = getCurrency(section);

    try {
        const result = await productsApi.getList({ perPage: 100, sort: '-order,-created' });
        const items = Array.isArray(result?.items) ? result.items : [];

        container.replaceChildren();

        if (items.length === 0) {
            renderEmptyState(container, lang);
            return;
        }

        items.forEach((product) => {
            container.appendChild(renderProductCard(product, lang, currency));
        });
    } catch (error) {
        console.error('Failed to load products:', error);
        renderErrorState(
            container,
            lang === 'ko'
                ? `상품을 불러오는 중 오류가 발생했습니다: ${error?.message || ''}`.trim()
                : `Failed to load products: ${error?.message || ''}`.trim()
        );
    }
}

export { initProductListPage };
export default initProductListPage;
