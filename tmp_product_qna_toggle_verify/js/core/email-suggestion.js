function levenshtein(a, b) {
    const source = a.toLowerCase();
    const target = b.toLowerCase();
    const rows = source.length + 1;
    const cols = target.length + 1;
    const matrix = Array.from({ length: rows }, () => Array(cols).fill(0));

    for (let row = 0; row < rows; row += 1) {
        matrix[row][0] = row;
    }

    for (let col = 0; col < cols; col += 1) {
        matrix[0][col] = col;
    }

    for (let row = 1; row < rows; row += 1) {
        for (let col = 1; col < cols; col += 1) {
            const cost = source[row - 1] === target[col - 1] ? 0 : 1;
            matrix[row][col] = Math.min(
                matrix[row - 1][col] + 1,
                matrix[row][col - 1] + 1,
                matrix[row - 1][col - 1] + cost
            );
        }
    }

    return matrix[rows - 1][cols - 1];
}

export function getSuggestedEmail(email, domains = []) {
    if (typeof email !== 'string') {
        return null;
    }

    const trimmed = email.trim();
    const atIndex = trimmed.indexOf('@');
    if (atIndex <= 0 || atIndex === trimmed.length - 1) {
        return null;
    }

    const localPart = trimmed.slice(0, atIndex);
    const currentDomain = trimmed.slice(atIndex + 1).toLowerCase();
    const normalizedDomains = domains.filter(Boolean).map(domain => domain.toLowerCase());

    if (!currentDomain || normalizedDomains.includes(currentDomain)) {
        return null;
    }

    const prefixMatch = normalizedDomains.find(domain => domain.startsWith(currentDomain));
    if (prefixMatch) {
        return `${localPart}@${prefixMatch}`;
    }

    let bestDomain = null;
    let bestDistance = Number.POSITIVE_INFINITY;

    normalizedDomains.forEach(domain => {
        const distance = levenshtein(currentDomain, domain);
        if (distance < bestDistance) {
            bestDistance = distance;
            bestDomain = domain;
        }
    });

    if (!bestDomain || bestDistance > 2) {
        return null;
    }

    return `${localPart}@${bestDomain}`;
}

export default {
    getSuggestedEmail
};
