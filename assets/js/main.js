/**
 * Main Entry Point (ES6)
 * 완전 모듈화 및 Dynamic Import 구조로 개편 (코드 스플리팅 적용)
 * @module main
 */

// Features will be dynamically imported for code splitting

// ============================================
// Auto Initialization
// ============================================
function initializeApp() {
    console.log('[Main] Initializing application...');

    bootstrapAuth();
    bootstrapCartDrawer();
    setupHeaderNavigation();
    bootstrapHomeProducts();
    bootstrapProductListPage();
    bootstrapProductDetail();
    bootstrapProfilePage();
    bootstrapReadingProgress();

    console.log('[Main] Application initialized');
}

let cartInitialized = false;

async function bootstrapAuth() {
    // Auth module self-initializes on import and also drives header auth state.
    await import('./auth.js');
}

async function bootstrapCartDrawer() {
    if (cartInitialized) {
        return;
    }

    if (!document.getElementById('cart-drawer')) {
        return;
    }

    const { getShopConfig } = await import('./core/runtime-config.js');
    const shopConfig = getShopConfig();
    if (!shopConfig?.storeId) {
        return;
    }

    cartInitialized = true;
    const { Cart } = await import('./cart.js');
    Cart.init(shopConfig);
}

function setupHeaderNavigation() {
    const navRoot = document.querySelector('[data-site-navigation]');
    const navPanel = document.querySelector('[data-nav-panel]');
    const toggleButton = document.querySelector('[data-nav-toggle]');

    if (!navRoot || !navPanel || !toggleButton) {
        return;
    }

    const desktopQuery = typeof matchMedia === 'function'
        ? matchMedia('(min-width: 768px)')
        : { matches: true };
    let menuOpen = false;

    const syncMenuState = () => {
        if (desktopQuery.matches) {
            navPanel.classList.remove('hidden');
            toggleButton.setAttribute('aria-expanded', 'false');
            menuOpen = false;
            return;
        }

        navPanel.classList.toggle('hidden', !menuOpen);
        toggleButton.setAttribute('aria-expanded', String(menuOpen));
    };

    const closeMenu = () => {
        menuOpen = false;
        syncMenuState();
    };

    const toggleMenu = () => {
        if (desktopQuery.matches) {
            return;
        }

        menuOpen = !menuOpen;
        syncMenuState();
    };

    toggleButton.addEventListener('click', function (event) {
        event.preventDefault();
        toggleMenu();
    });

    navPanel.addEventListener('click', function (event) {
        if (event.target.closest('a')) {
            closeMenu();
        }
    });

    document.addEventListener('click', function (event) {
        if (desktopQuery.matches || !menuOpen) {
            return;
        }

        if (!navRoot.contains(event.target)) {
            closeMenu();
        }
    });

    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && !desktopQuery.matches) {
            closeMenu();
        }
    });

    addEventListener('resize', syncMenuState);
    syncMenuState();
}

async function bootstrapProductDetail() {
    const productDetailRoot = document.getElementById('product-detail-container');
    const reviewRoot = document.getElementById('review-list');
    const qnaRoot = document.getElementById('qna-list');
    const productId = productDetailRoot?.dataset.productId || reviewRoot?.dataset.productId || qnaRoot?.dataset.productId;

    if (productDetailRoot) {
        const { initProductDetailPage } = await import('./product-detail-page.js');
        initProductDetailPage();
    }

    if (!productId) {
        return;
    }

    if (reviewRoot) {
        const { Reviews } = await import('./reviews.js');
        Reviews.init(productId);
    }

    if (qnaRoot) {
        const { QnA } = await import('./qna.js');
        QnA.init(productId);
    }
}

async function bootstrapProfilePage() {
    if (document.getElementById('profile-form') || document.getElementById('save-button') || document.getElementById('order-history-list') || document.getElementById('tracking-modal')) {
        const { Profile } = await import('./profile.js');
        Profile.init();
    }
}

async function bootstrapHomeProducts() {
    const homeProducts = document.querySelector('[data-home-products]');
    if (homeProducts) {
        const { initHomeProducts } = await import('./home-products.js');
        initHomeProducts();
    }
}

async function bootstrapProductListPage() {
    if (document.querySelector('[data-product-list-page]') || document.getElementById('product-list-container')) {
        const { initProductListPage } = await import('./product-list-page.js');
        initProductListPage();
    }
}

async function bootstrapReadingProgress() {
    if (document.querySelector('article') || document.getElementById('reading-progress')) {
        const { initReadingProgress } = await import('./blog-reading-progress.js');
        initReadingProgress();
    }
}

// DOMContentLoaded에서 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// No static exports - enables code splitting and tree-shaking
