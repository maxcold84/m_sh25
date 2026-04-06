function getPortOneClient() {
    return globalThis?.PortOne || null;
}

export function hasPortOne() {
    return typeof getPortOneClient()?.requestPayment === 'function';
}

export async function requestPortOnePayment(requestData) {
    const client = getPortOneClient();
    if (!client || typeof client.requestPayment !== 'function') {
        throw new Error('결제 SDK를 불러오지 못했습니다.');
    }

    return client.requestPayment(requestData);
}

export default {
    hasPortOne,
    requestPortOnePayment
};
