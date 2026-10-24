import { plainToInstance, Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

export enum NodeEnv {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

const toBoolean = ({ value }: { value: unknown }) =>
  value === true || value === 'true';

export class DatabaseEnv {
  @IsEnum(NodeEnv)
  NODE_ENV: NodeEnv = NodeEnv.Development;

  @IsString()
  @IsNotEmpty()
  DB_HOST: string;

  @IsInt()
  DB_PORT: number = 1433;

  @IsString()
  @IsNotEmpty()
  DB_USERNAME: string;

  @IsString()
  DB_PASSWORD: string;

  @IsString()
  @IsNotEmpty()
  DB_NAME: string;

  @Transform(toBoolean)
  DB_SYNC: boolean = false;

  @IsString()
  RABBITMQ_URL: string = 'amqp://guest:guest@localhost:5672';
}

export class ApiEnv extends DatabaseEnv {
  @IsInt()
  PORT: number = 3001;

  @IsString()
  @MinLength(32)
  JWT_SECRET: string;

  @IsInt()
  @Min(60)
  @Max(3600)
  JWT_ACCESS_TTL_SECONDS: number = 900;

  @IsInt()
  @Min(1)
  @Max(90)
  REFRESH_TOKEN_TTL_DAYS: number = 7;

  @IsString()
  CORS_ORIGINS: string = 'http://localhost:3000';

  @IsUrl({ require_tld: false })
  FRONTEND_URL: string = 'http://localhost:3000';

  @IsString()
  ALLOWED_CLIENT_IDS: string = 'vortex-web,vortex-swagger';

  @IsInt()
  @Min(30)
  CLIENT_TIMESTAMP_TOLERANCE_SEC: number = 300;

  @IsUrl({ require_tld: false })
  SSO_CALLBACK_BASE_URL: string = 'http://localhost:3000';

  @IsOptional()
  @IsString()
  GOOGLE_CLIENT_ID?: string;

  @IsOptional()
  @IsString()
  GOOGLE_CLIENT_SECRET?: string;

  @IsOptional()
  @IsString()
  MICROSOFT_CLIENT_ID?: string;

  @IsOptional()
  @IsString()
  MICROSOFT_CLIENT_SECRET?: string;

  @IsString()
  MICROSOFT_TENANT_ID: string = 'common';

  @IsString()
  @MinLength(32)
  DATA_ENCRYPTION_KEY: string;

  @Transform(({ value }: { value: unknown }) => value || undefined)
  @IsOptional()
  @IsUrl({ require_tld: false, require_protocol: true })
  GITEA_URL?: string;

  @IsOptional()
  @IsString()
  GITEA_TOKEN?: string;

  @IsString()
  GITEA_ORG: string = 'vortex';

  @IsOptional()
  @IsString()
  GITEA_WEBHOOK_SECRET?: string;

  @IsUrl({ require_tld: false, require_protocol: true })
  GITEA_WEBHOOK_URL: string =
    'http://host.docker.internal:3001/api/v1/integrations/gitea/webhook';
}

function validateWith<T extends object>(
  schema: new () => T,
  raw: Record<string, unknown>,
): T {
  const env = plainToInstance(schema, raw, {
    enableImplicitConversion: true,
    exposeDefaultValues: true,
  });
  const errors = validateSync(env);
  if (errors.length > 0) {
    const details = errors
      .map((error) => Object.values(error.constraints ?? {}).join(', '))
      .join('; ');
    throw new Error(`Invalid environment configuration: ${details}`);
  }
  return env;
}

export const validateApiEnv = (raw: Record<string, unknown>) =>
  validateWith(ApiEnv, raw);

export const validateDatabaseEnv = (raw: Record<string, unknown>) =>
  validateWith(DatabaseEnv, raw);
