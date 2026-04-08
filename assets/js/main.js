/**
 * Main Entry Point (ES6)
 * 완전 모듈화 및 Dynamic Import 구조로 개편 (코드 스플리팅 적용)
 * @module main
 */

// Features will be dynamically imported for code splitting

// ============================================
// Auto Initialization
// ============================================
const moduleRegistry = [
    { name: 'auth', selector: '[data-ui-module~="auth"]', init: initAuthModule },
    { name: 'cart', selector: '[data-ui-module~="cart"]', init: initCartDrawer },
    { name: 'navigation', selector: '[data-ui-module~="navigation"]', init: initHeaderNavigation },
    { name: 'home-products', selector: '[data-ui-module~="home-products"]', init: initHomeProductsSection },
    { name: 'product-list', selector: '[data-ui-module~="product-list"]', init: initProductListPageModule },
    { name: 'product-detail', selector: '[data-ui-module~="product-detail"]', init: initProductDetailModules },
    { name: 'profile', selector: '[data-ui-module~="profile"]', init: initProfilePage },
    { name: 'reading-progress', selector: '[data-ui-module~="reading-progress"]', init: initReadingProgressModule }
];

function initializeApp() {
    console.log('[Main] Initializing application...');

    // Tailwind utility classes change frequently during UI work,
    // so module activation keys off stable data hooks instead.
    moduleRegistry.forEach(queueModuleInitialization);

    console.log('[Main] Application initialized');
}

let cartInitialized = false;

function queueModuleInitialization(moduleConfig) {
    if (!document.querySelector(moduleConfig.selector)) {
        return;
    }

    Promise.resolve(moduleConfig.init()).catch((error) => {
        console.error(`[Main] Failed to initialize ${moduleConfig.name}:`, error);
    });
}

async function initAuthModule() {
    // Auth module self-initializes on import and also drives header auth state.
    await import('./auth.js');
}

async function initCartDrawer() {
    const cartRoot = document.querySelector('[data-ui-module~="cart"]');
    if (cartInitialized) {
        return;
    }

    if (!cartRoot) {
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

function initHeaderNavigation() {
    const navRoot = document.querySelector('[data-ui-module~="navigation"]');
    const navPanel = navRoot?.querySelector('[data-nav-panel]');
    const toggleButton = navRoot?.querySelector('[data-nav-toggle]');

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

async function initProductDetailModules() {
    const productDetailRoot = document.querySelector('[data-ui-module~="product-detail"]');
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

async function initProfilePage() {
    if (document.querySelector('[data-ui-module~="profile"]')) {
        const { Profile } = await import('./profile.js');
        Profile.init();
    }
}

async function initHomeProductsSection() {
    const homeProducts = document.querySelector('[data-ui-module~="home-products"]');
    if (homeProducts) {
        const { initHomeProducts } = await import('./home-products.js');
        initHomeProducts();
    }
}

async function initProductListPageModule() {
    if (document.querySelector('[data-ui-module~="product-list"]')) {
        const { initProductListPage } = await import('./product-list-page.js');
        initProductListPage();
    }
}

async function initReadingProgressModule() {
    if (document.querySelector('[data-ui-module~="reading-progress"]')) {
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
