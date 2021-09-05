/* eslint-disable */
import '@babel/polyfill';
import { login, logout } from './login';
import { displayMap } from './mapbox';
import { updateAccData } from './updateAccData';
import { bookTour } from './stripe';

// DOM Elements
const loginForm = document.querySelector('.login-form'); // ormulario de login
const mapBox = document.getElementById('map');
const logoutBtn = document.querySelector('.nav__el--logout'); // boton de logout
const userDataForm = document.querySelector('.form-user-data'); // datos de usario en '/me'
const userSettingsForm = document.querySelector('.form-user-settings'); // configuración de usuario en '/me'
const bookBtn = document.getElementById('book-tour');

// Delegation
if (loginForm) {
    loginForm.addEventListener('submit', function (event) {
        console.log('submited form');
        event.preventDefault(); // paramos el boton submit de recargar la pagina
        const email = document.getElementById('email').value; // obtenemos email
        const password = document.getElementById('password').value; // obtenemos password
        login(email, password); // invocamos la función login
    });
}

if (mapBox) {
    console.log('he have a map');
    const locations = JSON.parse(mapBox.dataset.locations);
    displayMap(locations);
}

if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
}

if (userDataForm) {
    userDataForm.addEventListener('submit', function (event) {
        event.preventDefault();
        // The FormData interface provides a way to easily construct a set of key/value pairs representing form fields and their values, which can then be easily sent using AJAX method.
        const form = new FormData();
        form.append('name', document.getElementById('name').value);
        form.append('email', document.getElementById('email').value);
        form.append('photo', document.getElementById('photo').files[0]);
        console.log(form);

        updateAccData(form, 'data');
    });
}

if (userSettingsForm) {
    userSettingsForm.addEventListener('submit', async function (event) {
        event.preventDefault(); // detenemos submit
        // Cambiamos el texto del boton save pass
        document.querySelector('.btn--save--password').textContent = 'Updating';
        // seleccionamos los campos
        const currentPassword = document.getElementById('password-current').value; //prettier-ignore
        const newPassword = document.getElementById('password').value; //prettier-ignore
        const confirmNewPassword = document.getElementById('password-confirm').value; //prettier-ignore
        // enviamos la solicitud y esperamos la respuesta
        await updateAccData(
            { currentPassword, newPassword, confirmNewPassword },
            'password'
        );
        // Cabiamos el texto de save password
        document.querySelector('.btn--save--password').textContent =
            'Save Password';
        // Ponemos los campos en blanco
        document.getElementById('password-current').value = ""; //prettier-ignore
        document.getElementById('password').value = ""; //prettier-ignore
        document.getElementById('password-confirm').value = ""; //prettier-ignore
    });
}

if (bookBtn) {
    bookBtn.addEventListener('click', (event) => {
        event.target.textContent = 'Processing...';
        const { tourId } = event.target.dataset;
        bookTour(tourId);
    });
}
