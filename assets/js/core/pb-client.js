/**
 * PocketBase Client Singleton (ES6 Module)
 * 모든 모듈에서 공유하는 단일 PocketBase 인스턴스 제공
 * @module core/pb-client
 */

// PocketBase 싱글톤 인스턴스
let _instance = null;

/**
 * PocketBase URL 가져오기
 * @returns {string}
 */
const getUrl = () => window.SiteConfig?.pocketbaseUrl || 'http://127.0.0.1:8090';

/**
 * PocketBase 인스턴스 반환 (싱글톤)
 * @returns {PocketBase} PocketBase 인스턴스
 */
export function getInstance() {
    if (!_instance) {
        _instance = new PocketBase(getUrl());
        console.log('[PBClient] PocketBase instance created:', getUrl());
    }
    return _instance;
}

/**
 * PocketBase 인스턴스 직접 export (편의용)
 * @type {PocketBase}
 */
export const pb = getInstance();

/**
 * 현재 사용자가 관리자인지 확인
 * @returns {boolean}
 */
export function isAdmin() {
    return pb.authStore.isValid && pb.authStore.isAdmin;
}

/**
 * 현재 로그인된 사용자 반환
 * @returns {Object|null}
 */
export function getUser() {
    return pb.authStore.isValid ? pb.authStore.model : null;
}

/**
 * 인증 상태 확인
 * @returns {boolean}
 */
export function isAuthenticated() {
    return pb.authStore.isValid;
}

// ============================================
// 하위 호환성: 전역 노출 (기존 코드 지원)
// ============================================
const PBClient = {
    getInstance,
    isAdmin,
    getUser,
    isAuthenticated
};

// window 객체에 노출
if (typeof window !== 'undefined') {
    window.PBClient = PBClient;
}

// default export
export default PBClient;
