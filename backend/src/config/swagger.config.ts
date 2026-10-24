import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

interface SwaggerRequest {
  headers: Record<string, string>;
}

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Vortex Sync API')
    .setDescription('Project, task and team management API.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      // Serialized into the Swagger UI page, so it must stay self-contained.
      requestInterceptor: (request: SwaggerRequest) => {
        request.headers['x-client-id'] = 'vortex-swagger';
        request.headers['x-client-timestamp'] = String(Date.now());
        return request;
      },
    },
  });
}
