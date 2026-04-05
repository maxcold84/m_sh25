function getDaumPostcodeConstructor() {
    return globalThis?.daum?.Postcode || null;
}

export function hasDaumPostcode() {
    return typeof getDaumPostcodeConstructor() === 'function';
}

export function embedDaumPostcode(container, options = {}) {
    const Postcode = getDaumPostcodeConstructor();
    if (!container || !Postcode) {
        return false;
    }

    const {
        onComplete,
        onOpen,
        onClose,
        width = '100%',
        height = '100%',
        maxSuggestItems = 5
    } = options;

    new Postcode({
        oncomplete(data) {
            onComplete?.(data);
            onClose?.();
        },
        width,
        height,
        maxSuggestItems
    }).embed(container);

    onOpen?.();
    return true;
}

export default {
    hasDaumPostcode,
    embedDaumPostcode
};
