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

    // Auth는 자체적으로 init 호출
    // Cart는 config가 필요하므로 여기서 호출하지 않음
    // Profile, Reviews, QnA는 페이지별 로직이 있거나 호출 시점이 다르므로 여기서 호출하지 않음

    console.log('[Main] Application initialized');
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
