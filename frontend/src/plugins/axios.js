import axios from 'axios';
import { secureExchange } from '@/utils/Crypto';

const api = axios.create({
    // Match this with your NestJS backend port
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// 1. Request Interceptor: Attach JWT + Automatic Encryption
api.interceptors.request.use((config) => {
    // Attach the bearer token so protected endpoints accept the request.
    const token = localStorage.getItem('vortex_token');
    if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
    }

    const secret = import.meta.env.VITE_SECRET_KEY;
    // The "fintech handshake" is OFF by default: the backend's decryption
    // interceptor is commented out, so encrypting here would send { data: ... }
    // that the server can't read (it rejects every DTO). To turn the whole
    // handshake back on: set VITE_ENABLE_ENCRYPTION=true AND uncomment the
    // Encryption/Decryption interceptors in backend app.module.ts.
    const encryptionEnabled = import.meta.env.VITE_ENABLE_ENCRYPTION === 'true';

    // Log the actual method (GET, POST, etc.)
    console.log(`%c[Frontend] ${config.method.toUpperCase()} Request to: ${config.url}`, 'color: #3498db');

    if (encryptionEnabled && config.data && secret && !(config.data instanceof FormData)) {
        console.log('%c[Frontend] Original Data:', 'color: #00ff00', config.data);

        const encryptedResponse = secureExchange.encrypt(config.data, secret);

        // Siguraduhin na may bumalik na data
        if (encryptedResponse && encryptedResponse.data) {
            config.data = { data: encryptedResponse.data };
            config.headers['X-Server-Timestamp'] = encryptedResponse.timestamp;
            console.log('%c[Frontend] Encrypted Payload:', 'color: #ff0000', config.data);
        }
    }

    return config;
}, (error) => Promise.reject(error));


// 2. Response Interceptor: Automatic Decryption
api.interceptors.response.use((response) => {
    console.log('%c[Frontend] Raw Response from Server:', 'color: #ff0000', response.data); // Scrambled
    const secret = import.meta.env.VITE_SECRET_KEY;
    const timestamp = response.headers['x-server-timestamp'];
    const encryptionEnabled = import.meta.env.VITE_ENABLE_ENCRYPTION === 'true';

    // Decrypt if the response has data and we have the necessary headers
    if (encryptionEnabled && response.data && response.data.data && timestamp && secret) {
        try {
            response.data = secureExchange.decrypt(response.data.data, timestamp, secret);
        } catch (e) {
            console.error("Fintech Handshake Error: Decryption Failed", e);
        }
    }

    console.log('%c[Frontend] Decrypted Response:', 'color: #00ff00', response.data);
    return response;
}, (error) => {
    // Token missing/expired/invalid: clear the session and bounce to login.
    if (error.response?.status === 401) {
        localStorage.removeItem('vortex_token');
        localStorage.removeItem('vortex_user');
        if (window.location.pathname !== '/login') {
            window.location.href = '/login';
        }
    }
    // Optional: Add global error handling for 403/400 errors
    if (error.response?.status === 400) {
        console.error("Security Handshake Refused by Server.");
    }
    return Promise.reject(error);
});

export default api;