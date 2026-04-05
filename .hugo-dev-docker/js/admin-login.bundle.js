(() => {
  // ns-hugo-imp:C:\hugo\ex\shop\assets\js\core\runtime-config.js
  var configCache = /* @__PURE__ */ new Map();
  function normalizeConfigValue(value, id) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return value;
    }
    if (typeof value === "string") {
      try {
        const nestedValue = JSON.parse(value);
        if (nestedValue && typeof nestedValue === "object" && !Array.isArray(nestedValue)) {
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
      const rawValue = JSON.parse(scriptEl.textContent || "{}");
      const value = normalizeConfigValue(rawValue, id);
      configCache.set(id, value);
      return value;
    } catch (error) {
      console.warn(`Failed to parse runtime config: ${id}`, error);
      configCache.set(id, {});
      return {};
    }
  }
  function getSiteConfig() {
    return readJsonScript("site-config");
  }
  function getPocketBaseUrl() {
    return getSiteConfig().pocketbaseUrl || "http://127.0.0.1:8090";
  }

  // ns-hugo-imp:C:\hugo\ex\shop\assets\js\core\pb-client.js
  var _instance = null;
  var getUrl = () => getPocketBaseUrl();
  function getInstance() {
    if (!_instance) {
      _instance = new PocketBase(getUrl());
      console.log("[PBClient] PocketBase instance created:", getUrl());
    }
    return _instance;
  }
  var pb = getInstance();

  // ns-hugo-imp:C:\hugo\ex\shop\assets\js\admin-auth.js
  var pbInstance = null;
  function getAdminPb() {
    if (!pbInstance) {
      pbInstance = getInstance();
    }
    return pbInstance;
  }

  // <stdin>
  function initAdminLoginPage() {
    const pb2 = getAdminPb();
    const form = document.getElementById("admin-login-form");
    const btn = document.getElementById("login-btn");
    const errorMessage = document.getElementById("error-message");
    if (!form || !btn || !errorMessage) {
      return;
    }
    if (pb2.authStore.isValid && pb2.authStore.isAdmin) {
      location.href = "/ko/admin/orders";
      return;
    }
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      errorMessage.classList.remove("show");
      const email = document.getElementById("email-address").value;
      const password = document.getElementById("password").value;
      btn.disabled = true;
      btn.textContent = "\uB85C\uADF8\uC778 \uC911...";
      try {
        await pb2.admins.authWithPassword(email, password);
        location.href = "/ko/admin/orders";
      } catch (error) {
        console.error(error);
        errorMessage.textContent = "\uB85C\uADF8\uC778 \uC2E4\uD328: \uC774\uBA54\uC77C \uB610\uB294 \uBE44\uBC00\uBC88\uD638\uB97C \uD655\uC778\uD574\uC8FC\uC138\uC694.";
        errorMessage.classList.add("show");
        btn.disabled = false;
        btn.textContent = "\uB85C\uADF8\uC778";
      }
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAdminLoginPage);
  } else {
    initAdminLoginPage();
  }
  var stdin_default = initAdminLoginPage;
})();
