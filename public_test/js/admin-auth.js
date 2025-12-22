const AdminAuth = (function () {
    const pb = new PocketBase('http://127.0.0.1:8090');

    function checkAdmin() {
        if (!pb.authStore.isValid || !pb.authStore.isAdmin) {
            // Store current URL to redirect back after login (optional)
            sessionStorage.setItem('adminRedirectUrl', window.location.href);
            window.location.href = '/ko/admin/login';
            return false;
        }
        return true;
    }

    function logout() {
        pb.authStore.clear();
        window.location.href = '/ko/admin/login';
    }

    // Run check immediately on load if configured to auto-run
    // but usually it's better to let the page call it or run it here.
    // Given the request is "all admin pages... make admin permission", strict enforcement here is good.

    // However, we need to export it for manual calls or logout buttons.

    return {
        checkAdmin,
        logout,
        pb // Expose PB instance if needed by other scripts to avoid double init, though lightweight
    };
})();
