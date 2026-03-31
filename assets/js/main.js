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

// ============================================
// 하위 호환성: 전역 노출
// window 객체에 노출하여 인라인 스크립트 및 기존 코드 지원
// ============================================
if (typeof window !== 'undefined') {
    // Core
    window.PBClient = {
        getInstance,
        isAdmin,
        getUser,
        isAuthenticated
    };
    window.Utils = Utils;
    window.pb = pb; // 직접 접근용

    // Features
    window.Cart = Cart;
    window.Auth = Auth;
    window.ProductsApi = ProductsApi;
    window.productsApi = productsApi;
    window.Reviews = Reviews;
    window.QnA = QnA;
    window.Profile = Profile;
}

// ============================================
// Auto Initialization
// ============================================
function initializeApp() {
    console.log('[Main] Initializing application...');

    bootstrapCartDrawer();
    setupHeaderNavigation();
    bootstrapHomeProducts();
    bootstrapProductListPage();
    bootstrapRelatedProducts();
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

    if (!document.getElementById('cart-drawer') || !window.ShopConfig) {
        return;
    }

    cartInitialized = true;
    Cart.init(window.ShopConfig);
}

function setupHeaderNavigation() {
    const navRoot = document.querySelector('[data-site-navigation]');
    const navPanel = document.querySelector('[data-nav-panel]');
    const toggleButton = document.querySelector('[data-nav-toggle]');

    if (!navRoot || !navPanel || !toggleButton) {
        return;
    }

    const desktopQuery = typeof window.matchMedia === 'function'
        ? window.matchMedia('(min-width: 768px)')
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

    window.addEventListener('resize', syncMenuState);
    syncMenuState();
}

function bootstrapProductDetail() {
    const productDetailRoot = document.getElementById('product-detail-container');
    const reviewRoot = document.getElementById('review-list');
    const qnaRoot = document.getElementById('qna-list');
    const productId = productDetailRoot?.dataset.productId || reviewRoot?.dataset.productId || qnaRoot?.dataset.productId;

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

function bootstrapRelatedProducts() {
    const sliderElement = document.getElementById('related-products-slider');
    const jQueryRef = window.jQuery || window.$;

    if (!sliderElement || !jQueryRef?.fn?.slick) {
        return;
    }

    const $slider = jQueryRef(sliderElement);
    if ($slider.hasClass('slick-initialized')) {
        return;
    }

    $slider.slick({
        infinite: true,
        speed: 500,
        slidesToShow: 4,
        slidesToScroll: 1,
        arrows: false,
        dots: false,
        autoplay: true,
        autoplaySpeed: 3000,
        pauseOnHover: true,
        swipe: true,
        touchMove: true,
        swipeToSlide: true,
        responsive: [
            {
                breakpoint: 1200,
                settings: {
                    slidesToShow: 3
                }
            },
            {
                breakpoint: 992,
                settings: {
                    slidesToShow: 2
                }
            },
            {
                breakpoint: 576,
                settings: {
                    slidesToShow: 1,
                    arrows: false,
                    dots: false,
                    swipe: true,
                    touchMove: true
                }
            }
        ]
    });
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
