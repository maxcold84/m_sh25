const configCache = new Map();

function readJsonScript(id) {
    if (configCache.has(id)) {
        return configCache.get(id);
    }

    const scriptEl = document.getElementById(id);
    if (!scriptEl) {
        configCache.set(id, {});
        return {};
    }

    try {
        const value = JSON.parse(scriptEl.textContent || '{}');
        configCache.set(id, value);
        return value;
    } catch (error) {
        console.warn(`Failed to parse runtime config: ${id}`, error);
        configCache.set(id, {});
        return {};
    }
}

export function getSiteConfig() {
    return readJsonScript('site-config');
}

export function getShopConfig() {
    return readJsonScript('shop-config');
}

export function getPocketBaseUrl() {
    return getSiteConfig().pocketbaseUrl || 'http://127.0.0.1:8090';
}

export default {
    getSiteConfig,
    getShopConfig,
    getPocketBaseUrl
};
