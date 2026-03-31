const STYLE_ID = 'admin-feedback-style';
const TOAST_ROOT_ID = 'admin-feedback-root';
const DIALOG_ID = 'admin-feedback-dialog';

let dialogState = null;

function ensureStyles() {
    if (document.getElementById(STYLE_ID)) {
        return;
    }

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
        #${TOAST_ROOT_ID} {
            position: fixed;
            top: 1rem;
            right: 1rem;
            z-index: 1200;
            display: grid;
            gap: 0.75rem;
            width: min(24rem, calc(100vw - 2rem));
            pointer-events: none;
        }

        .admin-feedback-toast {
            pointer-events: auto;
            border-radius: 18px;
            border: 1px solid #dbe3ef;
            background: rgba(255, 255, 255, 0.96);
            color: #0f172a;
            box-shadow: 0 20px 45px rgba(15, 23, 42, 0.18);
            padding: 0.95rem 1rem;
            line-height: 1.5;
            white-space: pre-line;
            opacity: 0;
            transform: translateY(-8px);
            transition: opacity 0.18s ease, transform 0.18s ease;
        }

        .admin-feedback-toast.is-visible {
            opacity: 1;
            transform: translateY(0);
        }

        .admin-feedback-toast--error {
            border-color: #fecaca;
            background: #fff7f7;
            color: #991b1b;
        }

        .admin-feedback-toast--success {
            border-color: #bbf7d0;
            background: #f0fdf4;
            color: #166534;
        }

        .admin-feedback-toast--info {
            border-color: #dbeafe;
            background: #eff6ff;
            color: #1d4ed8;
        }

        #${DIALOG_ID}[hidden] {
            display: none !important;
        }

        #${DIALOG_ID} {
            position: fixed;
            inset: 0;
            z-index: 1250;
            display: grid;
            place-items: center;
            padding: 1rem;
        }

        .admin-feedback-dialog__backdrop {
            position: absolute;
            inset: 0;
            background: rgba(15, 23, 42, 0.62);
            backdrop-filter: blur(3px);
        }

        .admin-feedback-dialog__panel {
            position: relative;
            z-index: 1;
            width: min(32rem, 100%);
            overflow: hidden;
            border-radius: 24px;
            border: 1px solid rgba(148, 163, 184, 0.22);
            background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
            box-shadow: 0 30px 80px rgba(15, 23, 42, 0.28);
        }

        .admin-feedback-dialog__header {
            padding: 1.25rem 1.25rem 1rem;
            border-bottom: 1px solid #e2e8f0;
        }

        .admin-feedback-dialog__title {
            margin: 0;
            color: #0f172a;
            font-size: 1.12rem;
            font-weight: 750;
        }

        .admin-feedback-dialog__body {
            display: grid;
            gap: 0.9rem;
            padding: 1.25rem;
        }

        .admin-feedback-dialog__message {
            margin: 0;
            color: #475569;
            line-height: 1.6;
            white-space: pre-line;
        }

        .admin-feedback-dialog__input {
            width: 100%;
            padding: 0.8rem 0.95rem;
            border: 1px solid #cbd5e1;
            border-radius: 14px;
            background: #fff;
            color: #0f172a;
        }

        .admin-feedback-dialog__input:focus {
            outline: none;
            border-color: #2563eb;
            box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
        }

        .admin-feedback-dialog__error {
            min-height: 1.25rem;
            color: #b91c1c;
            font-size: 0.875rem;
        }

        .admin-feedback-dialog__footer {
            display: flex;
            justify-content: flex-end;
            gap: 0.75rem;
            padding: 1rem 1.25rem 1.25rem;
            border-top: 1px solid #e2e8f0;
            background: rgba(248, 250, 252, 0.92);
        }

        .admin-feedback-dialog__button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: 2.8rem;
            padding: 0.82rem 1rem;
            border: 1px solid transparent;
            border-radius: 14px;
            font-weight: 700;
            line-height: 1;
            cursor: pointer;
        }

        .admin-feedback-dialog__button--cancel {
            background: #e2e8f0;
            color: #0f172a;
        }

        .admin-feedback-dialog__button--confirm {
            background: #0f172a;
            color: #fff;
            box-shadow: 0 12px 30px rgba(15, 23, 42, 0.16);
        }

        .admin-feedback-dialog__button--danger {
            background: #ef4444;
        }

        @media (max-width: 640px) {
            #${TOAST_ROOT_ID} {
                right: 0.75rem;
                left: 0.75rem;
                width: auto;
            }

            #${DIALOG_ID} {
                padding: 0.75rem;
            }

            .admin-feedback-dialog__header,
            .admin-feedback-dialog__body,
            .admin-feedback-dialog__footer {
                padding-left: 1rem;
                padding-right: 1rem;
            }

            .admin-feedback-dialog__footer {
                flex-direction: column-reverse;
            }

            .admin-feedback-dialog__button {
                width: 100%;
            }
        }
    `;

    document.head.appendChild(style);
}

function ensureToastRoot() {
    let root = document.getElementById(TOAST_ROOT_ID);
    if (!root) {
        root = document.createElement('div');
        root.id = TOAST_ROOT_ID;
        root.setAttribute('aria-live', 'polite');
        root.setAttribute('aria-atomic', 'true');
        document.body.appendChild(root);
    }

    return root;
}

function ensureDialog() {
    let dialog = document.getElementById(DIALOG_ID);
    if (dialog) {
        return dialog;
    }

    dialog = document.createElement('div');
    dialog.id = DIALOG_ID;
    dialog.hidden = true;
    dialog.innerHTML = `
        <div class="admin-feedback-dialog__backdrop" data-admin-feedback-backdrop></div>
        <section class="admin-feedback-dialog__panel" role="dialog" aria-modal="true" aria-labelledby="admin-feedback-dialog-title">
            <header class="admin-feedback-dialog__header">
                <h3 class="admin-feedback-dialog__title" id="admin-feedback-dialog-title"></h3>
            </header>
            <div class="admin-feedback-dialog__body">
                <p class="admin-feedback-dialog__message" id="admin-feedback-dialog-message"></p>
                <input class="admin-feedback-dialog__input" id="admin-feedback-dialog-input" type="text" hidden>
                <div class="admin-feedback-dialog__error" id="admin-feedback-dialog-error" aria-live="polite"></div>
            </div>
            <footer class="admin-feedback-dialog__footer">
                <button type="button" class="admin-feedback-dialog__button admin-feedback-dialog__button--cancel" data-admin-feedback-cancel></button>
                <button type="button" class="admin-feedback-dialog__button admin-feedback-dialog__button--confirm" data-admin-feedback-confirm></button>
            </footer>
        </section>
    `;

    document.body.appendChild(dialog);

    dialog.querySelector('[data-admin-feedback-backdrop]').addEventListener('click', function () {
        resolveDialog(dialogState?.kind === 'prompt' ? null : false);
    });

    dialog.querySelector('[data-admin-feedback-cancel]').addEventListener('click', function () {
        resolveDialog(dialogState?.kind === 'prompt' ? null : false);
    });

    dialog.querySelector('[data-admin-feedback-confirm]').addEventListener('click', function () {
        if (!dialogState) {
            return;
        }

        if (dialogState.kind === 'prompt') {
            const input = dialog.querySelector('#admin-feedback-dialog-input');
            const errorEl = dialog.querySelector('#admin-feedback-dialog-error');
            const value = input.value.trim();
            const validationMessage = typeof dialogState.validate === 'function'
                ? dialogState.validate(value)
                : '';

            if (validationMessage) {
                errorEl.textContent = validationMessage;
                input.focus();
                return;
            }

            resolveDialog(value);
            return;
        }

        resolveDialog(true);
    });

    document.addEventListener('keydown', function (event) {
        if (event.key !== 'Escape' || !dialogState) {
            return;
        }

        resolveDialog(dialogState.kind === 'prompt' ? null : false);
    });

    return dialog;
}

function resolveDialog(result) {
    if (!dialogState) {
        return;
    }

    const { resolve, dialog, previousOverflow, previousActiveElement } = dialogState;
    dialog.hidden = true;
    dialogState = null;
    document.body.style.overflow = previousOverflow || '';

    if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
        previousActiveElement.focus();
    }

    resolve(result);
}

function openDialog(kind, options = {}) {
    ensureStyles();
    const dialog = ensureDialog();
    const titleEl = dialog.querySelector('#admin-feedback-dialog-title');
    const messageEl = dialog.querySelector('#admin-feedback-dialog-message');
    const inputEl = dialog.querySelector('#admin-feedback-dialog-input');
    const errorEl = dialog.querySelector('#admin-feedback-dialog-error');
    const cancelButton = dialog.querySelector('[data-admin-feedback-cancel]');
    const confirmButton = dialog.querySelector('[data-admin-feedback-confirm]');

    titleEl.textContent = options.title || '';
    messageEl.textContent = options.message || '';
    errorEl.textContent = '';
    cancelButton.textContent = options.cancelLabel || '취소';
    confirmButton.textContent = options.confirmLabel || '확인';
    confirmButton.classList.toggle('admin-feedback-dialog__button--danger', Boolean(options.danger));

    if (kind === 'prompt') {
        inputEl.hidden = false;
        inputEl.placeholder = options.placeholder || '';
        inputEl.value = options.initialValue || '';
    } else {
        inputEl.hidden = true;
        inputEl.placeholder = '';
        inputEl.value = '';
    }

    const previousOverflow = document.body.style.overflow;
    const previousActiveElement = document.activeElement;
    dialog.hidden = false;
    document.body.style.overflow = 'hidden';

    return new Promise((resolve) => {
        dialogState = {
            kind,
            resolve,
            dialog,
            previousOverflow,
            previousActiveElement,
            validate: options.validate
        };

        setTimeout(function () {
            if (kind === 'prompt') {
                inputEl.focus();
                inputEl.select();
            } else {
                confirmButton.focus();
            }
        }, 0);
    });
}

export function toast(message, options = {}) {
    ensureStyles();
    const root = ensureToastRoot();
    const toastEl = document.createElement('div');
    const type = options.type || 'info';
    const duration = options.duration || (type === 'error' ? 4200 : 2800);

    toastEl.className = `admin-feedback-toast admin-feedback-toast--${type}`;
    toastEl.textContent = message;
    root.appendChild(toastEl);

    requestAnimationFrame(function () {
        toastEl.classList.add('is-visible');
    });

    setTimeout(function () {
        toastEl.classList.remove('is-visible');
        setTimeout(function () {
            toastEl.remove();
        }, 180);
    }, duration);
}

export function confirmDialog(options = {}) {
    return openDialog('confirm', options);
}

export function promptDialog(options = {}) {
    return openDialog('prompt', options);
}

export default {
    toast,
    confirmDialog,
    promptDialog
};
