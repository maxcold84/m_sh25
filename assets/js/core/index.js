/**
 * Core Module Entry Point
 * 모든 core 유틸리티를 re-export
 * @module core
 */

// PocketBase Client
export {
    getInstance,
    pb,
    isAdmin,
    getUser,
    isAuthenticated
} from './pb-client.js';

// Utilities
export {
    escapeHtml,
    formatCurrency,
    showToast,
    showMessage,
    formatDate,
    isKorean,
    debounce,
    throttle
} from './utils.js';

// Default exports for convenience
import PBClient from './pb-client.js';
import Utils from './utils.js';

export { PBClient, Utils };
