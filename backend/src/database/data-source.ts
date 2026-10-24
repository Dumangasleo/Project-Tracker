import 'reflect-metadata';
import 'dotenv/config';
import { DataSource } from 'typeorm';
import { buildDatabaseOptions } from '../config/database.config';
import { validateDatabaseEnv } from '../config/env.validation';

/** Used only by the TypeORM CLI (`yarn migration:*`). The app connects through AppModule. */
export const AppDataSource = new DataSource({
  ...buildDatabaseOptions(validateDatabaseEnv(process.env)),
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
});

export default AppDataSource;
