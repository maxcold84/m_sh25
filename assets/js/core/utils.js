/**
 * Utility Functions Module
 * 여러 모듈에서 공유하는 공통 헬퍼 함수들
 */
const Utils = (function () {

    /**
     * HTML 특수문자 이스케이프
     * @param {string} text - 이스케이프할 텍스트
     * @returns {string} 이스케이프된 텍스트
     */
    function escapeHtml(text) {
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
     * @param {string} forceCurrency - 강제 통화 설정 (옵션: 'KRW', 'USD')
     * @returns {string} 포맷된 통화 문자열
     */
    function formatCurrency(amount, forceCurrency = null) {
        let currency, locale;

        if (forceCurrency) {
            currency = forceCurrency;
            locale = forceCurrency === 'KRW' ? 'ko-KR' : 'en-US';
        } else {
            const isKorean = document.documentElement.lang === 'ko' || window.location.pathname.includes('/korean/');
            currency = isKorean ? 'KRW' : 'USD';
            locale = isKorean ? 'ko-KR' : 'en-US';
        }

        return new Intl.NumberFormat(locale, { style: 'currency', currency: currency }).format(amount);
    }

    /**
     * Toast 알림 표시
     * @param {string} message - 표시할 메시지
     * @param {Object} options - 옵션
     * @param {boolean} options.isError - 에러 스타일 여부
     * @param {number} options.duration - 표시 시간(ms)
     */
    function showToast(message, options = {}) {
        const { isError = false, duration = 3000 } = options;

        // 기존 toast 요소가 있으면 사용, 없으면 생성
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
     * @param {string} className - 추가 클래스명 (예: 'text-danger', 'text-success')
     */
    function showMessage(el, message, className = '') {
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
     * @param {Object} options - Intl.DateTimeFormat 옵션
     * @returns {string} 포맷된 날짜 문자열
     */
    function formatDate(date, options = {}) {
        const defaultOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        const finalOptions = { ...defaultOptions, ...options };
        const locale = document.documentElement.lang === 'ko' ? 'ko-KR' : 'en-US';

        const d = typeof date === 'string' ? new Date(date) : date;
        return d.toLocaleDateString(locale, finalOptions);
    }

    /**
     * 현재 언어가 한국어인지 확인
     * @returns {boolean}
     */
    function isKorean() {
        return document.documentElement.lang === 'ko' || window.location.pathname.includes('/korean/');
    }

    /**
     * 디바운스 함수
     * @param {Function} func - 실행할 함수
     * @param {number} wait - 대기 시간(ms)
     * @returns {Function} 디바운스된 함수
     */
    function debounce(func, wait = 300) {
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

    return {
        escapeHtml,
        formatCurrency,
        showToast,
        showMessage,
        formatDate,
        isKorean,
        debounce
    };
})();

// 전역 노출
window.Utils = Utils;
