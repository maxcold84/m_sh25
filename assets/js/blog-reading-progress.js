const PROGRESS_SELECTOR = '#reading-progress';

function getScrollState() {
    const docElement = document.documentElement;
    const docBody = document.body;
    const scrollTop = docElement.scrollTop || docBody.scrollTop || 0;
    const scrollHeight = Math.max(docElement.scrollHeight, docBody.scrollHeight);
    const viewportHeight = innerHeight || docElement.clientHeight || 0;
    const maxScroll = Math.max(scrollHeight - viewportHeight, 1);

    return Math.min(100, Math.max(0, (scrollTop / maxScroll) * 100));
}

function updateProgress(progressEl) {
    if (!progressEl) {
        return;
    }

    progressEl.style.width = `${getScrollState()}%`;
}

function initReadingProgress() {
    const progressEl = document.querySelector(PROGRESS_SELECTOR);
    if (!progressEl) {
        return;
    }

    let ticking = false;

    const onScroll = () => {
        if (ticking) {
            return;
        }

        ticking = true;
        requestAnimationFrame(() => {
            updateProgress(progressEl);
            ticking = false;
        });
    };

    updateProgress(progressEl);
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll, { passive: true });
}

export { initReadingProgress };
