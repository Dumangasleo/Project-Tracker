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

// 1. Request Interceptor: Automatic Encryption
api.interceptors.request.use((config) => {
    const secret = import.meta.env.VITE_SECRET_KEY;

    // Log the actual method (GET, POST, etc.)
    console.log(`%c[Frontend] ${config.method.toUpperCase()} Request to: ${config.url}`, 'color: #3498db');

    if (config.data && secret && !(config.data instanceof FormData)) {
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

    // Decrypt if the response has data and we have the necessary headers
    if (response.data && response.data.data && timestamp && secret) {
        try {
            response.data = secureExchange.decrypt(response.data.data, timestamp, secret);
        } catch (e) {
            console.error("Fintech Handshake Error: Decryption Failed", e);
        }
    }

    console.log('%c[Frontend] Decrypted Response:', 'color: #00ff00', response.data);
    return response;
}, (error) => {
    // Optional: Add global error handling for 401/403/400 errors
    if (error.response?.status === 400) {
        console.error("Security Handshake Refused by Server.");
    }
    return Promise.reject(error);
});

export default api;