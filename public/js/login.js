// axios es una libreria externa que cargamos a login.pug via cdn
// esta función envia un request a nuetra api para login
/* eslint-disable */
import axios from 'axios'; // async http client
import { showAlert } from './alerts';

export const login = async (email, password) => {
    try {
        // respuesta
        const res = await axios({
            method: 'POST',
            url: '/api/users/login',
            data: { email, password },
        });

        if (res.data.status === 'success') {
            // confirmar login
            showAlert('success', 'Logged in!');

            // The window object is supported by all browsers. It represents the browser's window.
            window.setTimeout(() => {
                location.assign('/'); // window.location.assign() loads a new document
            }, 1500);
        }
    } catch (error) {
        showAlert('error', error.response.data.message); // https://axios-http.com/docs/res_schema
    }
};

export const logout = async () => {
    try {
        // Mandamos la solicitud get con axios
        const res = await axios({
            method: 'Get',
            url: '/api/users/logout',
        });
        // refrescamos la página y mostramos alerta
        if (res.data.status === 'success') {
            showAlert('success', 'Logged out successfully');
            // Si estamos en '/me' redirecionamos a '/'
            if (location.pathname === '/me')
                return window.setTimeout(location.assign('/'), 3000);
            window.setTimeout(location.reload(), 3000);
        }
    } catch (error) {
        showAlert('error', 'Error logging out!'); // https://
    }
};
