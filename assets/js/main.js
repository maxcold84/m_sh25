/**
 * Main Entry Point (ES6)
 * 모든 코어 및 주요 모듈을 import하고 초기화
 * Hugo js.Build에서 번들링 진입점으로 사용
 * @module main
 */

// ============================================
// Core Modules
// ============================================
import { pb, getInstance, isAdmin, getUser, isAuthenticated } from './core/pb-client.js';
import * as Utils from './core/utils.js';

// ============================================
// Feature Modules
// ============================================
import { Cart } from './cart.js';
import { Auth } from './auth.js';
import { ProductsApi, productsApi } from './products-api.js';
import { Reviews } from './reviews.js';
import { QnA } from './qna.js';
import { Profile } from './profile.js';
import { initHomeProducts } from './home-products.js';
import { initProductListPage } from './product-list-page.js';
import { initReadingProgress } from './blog-reading-progress.js';
import { initProductDetailPage } from './product-detail-page.js';
import { getShopConfig } from './core/runtime-config.js';

// ============================================
// Auto Initialization
// ============================================
function initializeApp() {
    console.log('[Main] Initializing application...');

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

function bootstrapCartDrawer() {
    if (cartInitialized) {
        return;
    }

    if (!document.getElementById('cart-drawer')) {
        return;
    }

    const shopConfig = getShopConfig();
    if (!shopConfig?.storeId) {
        return;
    }

    cartInitialized = true;
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

function bootstrapProductDetail() {
    const productDetailRoot = document.getElementById('product-detail-container');
    const reviewRoot = document.getElementById('review-list');
    const qnaRoot = document.getElementById('qna-list');
    const productId = productDetailRoot?.dataset.productId || reviewRoot?.dataset.productId || qnaRoot?.dataset.productId;

    if (productDetailRoot) {
        initProductDetailPage();
    }

    if (!productId) {
        return;
    }

    if (reviewRoot) {
        Reviews.init(productId);
    }

    if (qnaRoot) {
        QnA.init(productId);
    }
}

function bootstrapProfilePage() {
    if (document.getElementById('profile-form') || document.getElementById('save-button')) {
        Profile.init();
    }
}

function bootstrapHomeProducts() {
    initHomeProducts();
}

function bootstrapProductListPage() {
    initProductListPage();
}

function bootstrapReadingProgress() {
    initReadingProgress();
}

// DOMContentLoaded에서 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// ============================================
// Exports for ES6 Module Usage
// ============================================
export {
    // Core
    pb,
    getInstance,
    isAdmin,
    getUser,
    isAuthenticated,
    Utils,

    // Features
    Cart,
    Auth,
    ProductsApi,
    productsApi,
    Reviews,
    QnA,
    Profile
};
