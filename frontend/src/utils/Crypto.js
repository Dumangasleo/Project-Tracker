import CryptoJS from 'crypto-js';

// Base32 Alphabet for TOTP
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

// Helper: Decode Base32 Secret (Fintech standard for TOTP secrets)
function decodeBase32(input) {
    let length = input.length;
    const leftover = (length * 5) % 8;
    const offset = leftover === 0 ? 0 : 8 - leftover;
    let bits = 0, value = 0, index = 0;
    let output = new Uint8Array(Math.ceil((length * 5) / 8));

    for (let i = 0; i < length; i++) {
        value = (value << 5) | alphabet.indexOf(input[i]);
        bits += 5;
        if (bits >= 8) {
            output[index++] = (value >>> (bits + offset - 8)) & 255;
            bits -= 8;
        }
    }
    return CryptoJS.lib.WordArray.create(output.slice(leftover !== 0 ? 1 : 0));
}

// Generate the 6-digit OTP used as the AES Key
const generateOTP = (timestamp, secret) => {
    const time = Math.floor(timestamp / 1000);
    const interval = Math.floor(time / 30).toString(16).padStart(16, "0");

    const hmac = CryptoJS.HmacSHA1(
        CryptoJS.enc.Hex.parse(interval),
        decodeBase32(secret)
    );

    // Truncate logic from your script
    const words = hmac.words;
    const sigBytes = hmac.sigBytes;
    const digest = new Uint8Array(sigBytes);
    for (let i = 0; i < sigBytes; i++) {
        digest[i] = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
    }

    const offset = digest[19] & 0xf;
    const v = ((digest[offset] & 0x7f) << 24) | (digest[offset + 1] << 16) | (digest[offset + 2] << 8) | digest[offset + 3];
    return (v % 10**6).toString().padStart(6, "0");
};

export const secureExchange = {
    encrypt: (payload, secret) => {
        const cur_date = new Date().getTime();
        const otp = generateOTP(cur_date, secret);

        const encrypted = CryptoJS.AES.encrypt(JSON.stringify(payload), otp).toString();

        return {
            data: encrypted,
            timestamp: cur_date
        };
    },

    decrypt: (encryptedData, timestamp, secret) => {
        const otp = generateOTP(timestamp, secret);
        const bytes = CryptoJS.AES.decrypt(encryptedData, otp);
        return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    }
};