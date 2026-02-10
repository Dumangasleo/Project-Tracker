import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Better CORS Configuration
  // We need to allow 'X-Server-Timestamp' because your Axios interceptor sends it
  app.enableCors({
    origin: true, // In production, replace with your specific domain
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Accept, X-Server-Timestamp', // Add your custom header here
    exposedHeaders: 'X-Server-Timestamp', // Allow the frontend to read the response timestamp
  });

  // 2. Global Prefix
  app.setGlobalPrefix('api');

  // 3. Enable Global Validation
  // This activates the class-validator decorators in your DTOs
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,            // Strips out data that isn't in your DTO
    forbidNonWhitelisted: true, // Rejects requests with extra "junk" data
    transform: true,            // Automatically converts types (e.g., string to number)
  }));

  await app.listen(process.env.PORT ?? 3001);
  console.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap().catch((err) => {
  console.error('Error during NestJS startup:', err);
  process.exit(1);
});