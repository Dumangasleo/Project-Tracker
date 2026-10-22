import 'reflect-metadata';
import 'dotenv/config';
import { DataSource } from 'typeorm';

/**
 * Standalone DataSource for the TypeORM CLI (migrations only).
 *
 * The running app connects via TypeOrmModule.forRootAsync in app.module.ts.
 * This mirror exists so the `yarn migration:*` scripts have a config to load.
 * Keep the connection options in sync with app.module.ts.
 */
export const AppDataSource = new DataSource({
    type: 'mssql',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    // Matches the project's `*.entities.ts` naming convention.
    entities: ['src/**/*.entities.ts'],
    migrations: ['src/database/migrations/*.ts'],
    options: {
        encrypt: false,
        trustServerCertificate: true,
    },
});

export default AppDataSource;
