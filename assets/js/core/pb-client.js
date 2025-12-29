/**
 * PocketBase Client Singleton
 * 모든 모듈에서 공유하는 단일 PocketBase 인스턴스 제공
 */
const PBClient = (function () {
    let instance = null;

    /**
     * PocketBase 인스턴스 반환 (싱글톤)
     * @returns {PocketBase} PocketBase 인스턴스
     */
    function getInstance() {
        if (!instance) {
            const url = window.SiteConfig?.pocketbaseUrl || 'http://127.0.0.1:8090';
            instance = new PocketBase(url);
            console.log('[PBClient] PocketBase instance created:', url);
        }
        return instance;
    }

    /**
     * 현재 사용자가 관리자인지 확인
     * @returns {boolean}
     */
    function isAdmin() {
        const pb = getInstance();
        return pb.authStore.isValid && pb.authStore.isAdmin;
    }

    /**
     * 현재 로그인된 사용자 반환
     * @returns {Object|null}
     */
    function getUser() {
        const pb = getInstance();
        return pb.authStore.isValid ? pb.authStore.model : null;
    }

    return {
        getInstance,
        isAdmin,
        getUser
    };
})();

// 전역 노출 (하위 호환성)
window.PBClient = PBClient;
