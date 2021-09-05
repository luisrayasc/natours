/* eslint-disable */

// borrar alerts
export const hideAlert = () => {
    const el = document.querySelector('.alert');
    if (el) el.parentElement.removeChild(el);
};

// type is 'success' or 'error'
export const showAlert = (type, message) => {
    hideAlert();
    const html = `<div class="alert alert--${type}">${message}</div>`;
    document.querySelector('body').insertAdjacentHTML('afterbegin', html);
    window.setTimeout(hideAlert, 5000);
};
