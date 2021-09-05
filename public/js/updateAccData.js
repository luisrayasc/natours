// esta función envia un request a nuetra api para update user
/* eslint-disable */
import axios from 'axios'; // async http client
import { showAlert } from './alerts';

// Type es 'password' o 'data'
export const updateAccData = async (data, type) => {
    try {
        const urlPath = type === 'password' ? 'updatePassword' : 'updateMe';
        const res = await axios({
            method: 'PATCH',
            url: `http://127.0.0.1:3000/api/users/${urlPath}`,
            data: data,
        });

        if (res.data.status === 'success') {
            showAlert(
                'success',
                `'User ${type.toUpperCase()} updated successfully'`
            );
        }
    } catch (error) {
        showAlert('error', error.response.data.message); // https://axios-http.com/docs/res_schema
    }
};
