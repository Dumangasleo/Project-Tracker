import type { SqlServerConnectionOptions } from 'typeorm/driver/sqlserver/SqlServerConnectionOptions';
import type { DatabaseEnv } from './env.validation';

export function buildDatabaseOptions(
  env: Pick<
    DatabaseEnv,
    'DB_HOST' | 'DB_PORT' | 'DB_USERNAME' | 'DB_PASSWORD' | 'DB_NAME'
  >,
): SqlServerConnectionOptions {
  return {
    type: 'mssql',
    host: env.DB_HOST,
    port: env.DB_PORT,
    username: env.DB_USERNAME,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    options: {
      encrypt: false,
      trustServerCertificate: true,
    },
  };
}
