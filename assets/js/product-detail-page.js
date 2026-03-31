import { Cart } from './cart.js';

function initSlider() {
    const slider = document.querySelector('.product-image-slider');
    if (!slider) {
        return;
    }

    slider.classList.add('is-native-slider');
}

function clampQuantity(value) {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed) || parsed < 1) {
        return 1;
    }

    return parsed;
}

function getSelectedOption(root, groupName) {
    const group = root.querySelector(`[data-option-group-container="${groupName}"]`);
    if (!group) {
        return '';
    }

    const activeOption = group.querySelector('.product-chip.is-active');
    return activeOption ? activeOption.dataset.optionValue : '';
}

function updateSelectedOptionLabel(root, groupName) {
    const group = root.querySelector(`[data-option-group-container="${groupName}"]`);
    const label = root.querySelector(`[data-selected-option="${groupName}"]`);
    if (!group || !label) {
        return '';
    }

    const selectedValue = getSelectedOption(root, groupName);
    label.textContent = selectedValue;
    return selectedValue;
}

export function initProductDetailPage() {
    const productDetailRoot = document.getElementById('product-detail-container');
    if (!productDetailRoot) {
        return;
    }

    initSlider();

    const quantityInput = productDetailRoot.querySelector('[data-product-quantity]');
    const totalPriceElement = productDetailRoot.querySelector('[data-product-total-price]');
    const addToCartButton = productDetailRoot.querySelector('[data-add-to-cart]');
    const currency = productDetailRoot.dataset.productCurrency || '';
    const unitPrice = Number(productDetailRoot.dataset.productPrice || 0);

    const formatCurrency = (value) => {
        const locale = document.documentElement.lang === 'ko' ? 'ko-KR' : 'en-US';
        return currency + new Intl.NumberFormat(locale).format(value);
    };

    const updateTotalPrice = () => {
        if (!totalPriceElement) {
            return;
        }

        const quantity = clampQuantity(quantityInput ? quantityInput.value : 1);
        if (quantityInput) {
            quantityInput.value = quantity;
        }
        totalPriceElement.textContent = formatCurrency(unitPrice * quantity);
    };

    productDetailRoot.querySelectorAll('[data-option-group-container]').forEach((group) => {
        const groupName = group.dataset.optionGroupContainer;
        group.querySelectorAll('.product-chip').forEach((button) => {
            button.addEventListener('click', function () {
                group.querySelectorAll('.product-chip').forEach((chip) => {
                    chip.classList.remove('is-active');
                    chip.setAttribute('aria-pressed', 'false');
                });

                button.classList.add('is-active');
                button.setAttribute('aria-pressed', 'true');
                updateSelectedOptionLabel(productDetailRoot, groupName);
            });
        });

        updateSelectedOptionLabel(productDetailRoot, groupName);
    });

    if (quantityInput) {
        quantityInput.addEventListener('input', updateTotalPrice);
    }

    productDetailRoot.querySelectorAll('[data-quantity-action]').forEach((button) => {
        button.addEventListener('click', function () {
            if (!quantityInput) {
                return;
            }

            const currentValue = clampQuantity(quantityInput.value);
            const nextValue = button.dataset.quantityAction === 'decrease'
                ? Math.max(1, currentValue - 1)
                : currentValue + 1;
            quantityInput.value = nextValue;
            updateTotalPrice();
        });
    });

    updateTotalPrice();

    if (addToCartButton) {
        addToCartButton.addEventListener('click', async function () {
            const quantity = clampQuantity(quantityInput ? quantityInput.value : 1);
            const payload = {
                id: productDetailRoot.dataset.productId,
                name: productDetailRoot.dataset.productName,
                slug: productDetailRoot.dataset.productSlug || '',
                url: productDetailRoot.dataset.productUrl || '',
                price: unitPrice,
                image: productDetailRoot.dataset.productImage || '',
                quantity,
                options: {
                    __productSlug: productDetailRoot.dataset.productSlug || '',
                    __productUrl: productDetailRoot.dataset.productUrl || ''
                }
            };

            const selectedColor = getSelectedOption(productDetailRoot, 'color');
            const selectedSize = getSelectedOption(productDetailRoot, 'size');

            if (selectedColor) {
                payload.options.color = selectedColor;
            }
            if (selectedSize) {
                payload.options.size = selectedSize;
            }

            const defaultLabel = productDetailRoot.dataset.addLabel || addToCartButton.textContent;
            const addingLabel = productDetailRoot.dataset.addingLabel || defaultLabel;

            addToCartButton.disabled = true;
            addToCartButton.textContent = `🛒 ${addingLabel}`;

            try {
                await Cart.addItem(payload);
            } catch (error) {
                console.error('Failed to add product to cart:', error);
                if (typeof Cart.notify === 'function') {
                    Cart.notify('장바구니에 상품을 추가하지 못했습니다.', true);
                }
            } finally {
                addToCartButton.disabled = false;
                addToCartButton.textContent = `🛒 ${defaultLabel}`;
            }
        });
    }
}

export default initProductDetailPage;
