// team/encryption.interceptor.ts
import {CallHandler, ExecutionContext, Injectable, NestInterceptor} from '@nestjs/common';
import CryptoJS from 'crypto-js';
import {map, Observable} from "rxjs";
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EncryptionInterceptor implements NestInterceptor {
    private readonly alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

    constructor(private readonly configService: ConfigService) {}

    // Decodes the Base32 Secret key (equivalent to your Postman 'decode' function)
    private decodeBase32(input: string) {
        let length = input.length;
        const leftover = (length * 5) % 8;
        const offset = leftover === 0 ? 0 : 8 - leftover;
        let bits = 0, value = 0, index = 0;
        const output = new Uint8Array(Math.ceil((length * 5) / 8));

        for (let i = 0; i < length; i++) {
            value = (value << 5) | this.alphabet.indexOf(input[i]);
            bits += 5;
            if (bits >= 8) {
                output[index++] = (value >>> (bits + offset - 8)) & 255;
                bits -= 8;
            }
        }
        const sliced = output.slice(leftover !== 0 ? 1 : 0);
        return CryptoJS.lib.WordArray.create(sliced as any);
    }

    // Generates the same 6-digit OTP as the Frontend
    private generateOTP(timestamp: number, secret: string): string {
        const time = Math.floor(timestamp / 1000);
        const interval = Math.floor(time / 30).toString(16).padStart(16, "0");

        const hmac = CryptoJS.HmacSHA1(
            CryptoJS.enc.Hex.parse(interval),
            this.decodeBase32(secret)
        );

        const words = hmac.words;
        const sigBytes = hmac.sigBytes;
        const digest = new Uint8Array(sigBytes);
        for (let i = 0; i < sigBytes; i++) {
            digest[i] = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
        }

        const offset = digest[19] & 0xf;
        const v = ((digest[offset] & 0x7f) << 24) |
            (digest[offset + 1] << 16) |
            (digest[offset + 2] << 8) |
            (digest[offset + 3]);

        return (v % 10**6).toString().padStart(6, "0");
    }

    decrypt(encryptedData: string, timestamp: string, secret: string): any {
        const otp = this.generateOTP(Number(timestamp), secret);
        const bytes = CryptoJS.AES.decrypt(encryptedData, otp);
        const decryptedStr = bytes.toString(CryptoJS.enc.Utf8);

        if (!decryptedStr) throw new Error("Decryption failed. Invalid OTP or Tampered Data.");
        return JSON.parse(decryptedStr);
    }

    encrypt(data: any, timestamp: number, secret: string): string {
        const otp = this.generateOTP(timestamp, secret);
        return CryptoJS.AES.encrypt(JSON.stringify(data), otp).toString();
    }
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            map((data) => {
                // Huwag i-encrypt kung walang data o error response
                if (!data) return data;

                const timestamp = Date.now();
                const secret = this.configService.get<string>('SECRET_KEY') || '';


                if (!secret) {
                    console.error('Encryption Error: SECRET_KEY is missing in .env');
                    return data;
                }

                // 1. I-encrypt ang actual data
                const encrypted = this.encrypt(data, timestamp, secret);

                // 2. I-set ang Timestamp sa Header para mabasa ng Axios
                const response = context.switchToHttp().getResponse();
                response.header('X-Server-Timestamp', timestamp.toString());

                // 3. Ibalik ang format na inaasahan ng Vue: { data: 'scrambled' }
                return { data: encrypted };
            }),
        );
    }
}