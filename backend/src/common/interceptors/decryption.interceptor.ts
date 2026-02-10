import {
    BadRequestException,
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import {EncryptionInterceptor} from "./encryption.interceptor";// Make sure this is the Service, not the Interceptor
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DecryptionInterceptor implements NestInterceptor {
    constructor(
        private readonly encryptionInterceptor: EncryptionInterceptor,
        private readonly configService: ConfigService,
    ) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        console.log('[Backend] Received Encrypted Data:', request.body);
        const timestamp = request.headers['x-server-timestamp'];
        const body = request.body;

        // 1. Guard: Skip if it's not an encrypted request
        if (!timestamp || !body || !body.data) {
            return next.handle();
        }

        // 2. Resolve Secret (Fintech standard: use ConfigService)
        const secret = this.configService.get<string>('USER_SECRET_KEY') ||
            this.configService.get<string>('SECRET_KEY');

        if (!secret) {
            // Log for server-side debugging, but send generic error to client
            console.error('CRITICAL: Secret key is missing in environment variables.');
            throw new BadRequestException('System Configuration Error');
        }

        try {
            // 3. Normalize types to satisfy TS
            const validTimestamp = Array.isArray(timestamp) ? timestamp[0] : String(timestamp);
            const validData = String(body.data);

            // 4. Perform Handshake Decryption
            // This replaces the request body before it hits your Controller
            request.body = this.encryptionInterceptor.decrypt(
                validData,
                validTimestamp,
                secret,
            );

            console.log('[Backend] Decrypted Data for Controller:', request.body);

            return next.handle();
        } catch (error) {
            // This catch handles invalid OTPs, tampered data, or expired timestamps
            throw new BadRequestException('Security Handshake Failed: Invalid Encryption');
        }
    }
}