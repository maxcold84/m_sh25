const configCache = new Map();

function normalizeConfigValue(value, id) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
        return value;
    }

    if (typeof value === 'string') {
        try {
            const nestedValue = JSON.parse(value);
            if (nestedValue && typeof nestedValue === 'object' && !Array.isArray(nestedValue)) {
                return nestedValue;
            }
        } catch (error) {
            console.warn(`Failed to parse nested runtime config: ${id}`, error);
        }
    }

    return {};
}

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
        const rawValue = JSON.parse(scriptEl.textContent || '{}');
        const value = normalizeConfigValue(rawValue, id);
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
