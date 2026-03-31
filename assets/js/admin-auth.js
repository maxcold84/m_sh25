import { getInstance } from './core/pb-client.js';

let pbInstance = null;

export function getAdminPb() {
    if (!pbInstance) {
        pbInstance = getInstance();
    }

    return pbInstance;
}

export function checkAdmin() {
    const pb = getAdminPb();
    if (!pb || !pb.authStore.isValid || !pb.authStore.isAdmin) {
        sessionStorage.setItem('adminRedirectUrl', location.href);
        location.href = '/ko/admin/login';
        return false;
    }

    return true;
}

export function logout() {
    const pb = getAdminPb();
    if (pb) {
        pb.authStore.clear();
    }

    location.href = '/ko/admin/login';
}

const AdminAuth = {
    checkAdmin,
    logout,
    get pb() {
        return getAdminPb();
    }
};

export default AdminAuth;
