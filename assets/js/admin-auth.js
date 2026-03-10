const AdminAuth = (function () {
    let pbInstance = null;

    // Helper to lazy-load pb instance
    function getPb() {
        if (!pbInstance && window.PBClient) {
            pbInstance = window.PBClient.getInstance();
        }
        return pbInstance;
    }

    function checkAdmin() {
        const pb = getPb();
        if (!pb || !pb.authStore.isValid || !pb.authStore.isAdmin) {
            // Store current URL to redirect back after login (optional)
            sessionStorage.setItem('adminRedirectUrl', window.location.href);
            window.location.href = '/ko/admin/login';
            return false;
        }
        return true;
    }

    function logout() {
        const pb = getPb();
        if (pb) {
            pb.authStore.clear();
        }
        window.location.href = '/ko/admin/login';
    }

    return {
        checkAdmin,
        logout,
        get pb() { return getPb(); } // Expose PB instance dynamically
    };
})();


window.AdminAuth = AdminAuth;

