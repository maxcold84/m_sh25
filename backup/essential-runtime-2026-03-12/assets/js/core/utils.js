/**
 * Utility Functions Module (ES6)
 * 여러 모듈에서 공유하는 공통 헬퍼 함수들
 * @module core/utils
 */

/**
 * HTML 특수문자 이스케이프
 * @param {string} text - 이스케이프할 텍스트
 * @returns {string} 이스케이프된 텍스트
 */
export function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * 통화 형식으로 포맷팅
 * @param {number} amount - 금액
 * @param {string} [forceCurrency] - 강제 통화 설정 ('KRW', 'USD')
 * @returns {string} 포맷된 통화 문자열
 */
export function formatCurrency(amount, forceCurrency = null) {
    let currency, locale;

    if (forceCurrency) {
        currency = forceCurrency;
        locale = forceCurrency === 'KRW' ? 'ko-KR' : 'en-US';
    } else {
        const korean = isKorean();
        currency = korean ? 'KRW' : 'USD';
        locale = korean ? 'ko-KR' : 'en-US';
    }

    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
}

/**
 * Toast 알림 표시
 * @param {string} message - 표시할 메시지
 * @param {Object} [options] - 옵션
 * @param {boolean} [options.isError=false] - 에러 스타일 여부
 * @param {number} [options.duration=3000] - 표시 시간(ms)
 */
export function showToast(message, options = {}) {
    const { isError = false, duration = 3000 } = options;

    let toast = document.getElementById('toast');

    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        document.body.appendChild(toast);
    }

    const bgColor = isError ? 'bg-red-600' : 'bg-gray-800';
    toast.className = `fixed top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg shadow-lg text-sm transition-opacity duration-300 pointer-events-none z-50 ${bgColor} text-white`;
    toast.textContent = message;
    toast.style.opacity = '1';

    setTimeout(() => {
        toast.style.opacity = '0';
    }, duration);
}

/**
 * 요소에 메시지 표시
 * @param {HTMLElement} el - 대상 요소
 * @param {string} message - 메시지
 * @param {string} [className=''] - 추가 클래스명
 */
export function showMessage(el, message, className = '') {
    if (el) {
        el.innerText = message;
        el.className = 'mt-3 text-center ' + className;
        el.style.display = 'block';
    } else {
        alert(message);
    }
}

/**
 * 날짜 포맷팅
 * @param {Date|string} date - 날짜 객체 또는 문자열
 * @param {Object} [options] - Intl.DateTimeFormat 옵션
 * @returns {string} 포맷된 날짜 문자열
 */
export function formatDate(date, options = {}) {
    const defaultOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    const finalOptions = { ...defaultOptions, ...options };
    const locale = isKorean() ? 'ko-KR' : 'en-US';

    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString(locale, finalOptions);
}

/**
 * 현재 언어가 한국어인지 확인
 * @returns {boolean}
 */
export function isKorean() {
    return document.documentElement.lang === 'ko' || window.location.pathname.includes('/korean/');
}

/**
 * 디바운스 함수
 * @param {Function} func - 실행할 함수
 * @param {number} [wait=300] - 대기 시간(ms)
 * @returns {Function} 디바운스된 함수
 */
export function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * 스로틀 함수
 * @param {Function} func - 실행할 함수
 * @param {number} [limit=300] - 제한 시간(ms)
 * @returns {Function} 스로틀된 함수
 */
export function throttle(func, limit = 300) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ============================================
// 하위 호환성: 전역 노출 (기존 코드 지원)
// ============================================
const Utils = {
    escapeHtml,
    formatCurrency,
    showToast,
    showMessage,
    formatDate,
    isKorean,
    debounce,
    throttle
};

if (typeof window !== 'undefined') {
    window.Utils = Utils;
}

export default Utils;
