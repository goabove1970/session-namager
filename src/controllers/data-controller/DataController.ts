import pool from './database/PgPool';
import { Value, Result } from 'ts-postgres';
import { getConfig } from '@root/app.config';

export abstract class DataController<T> {}

export abstract class DatabaseController<T> extends DataController<T> {
    tableName: string;
    constructor(table: string) {
        super();
        this.tableName = table;
    }

    abstract readSelectResponse(values: Value[][]): T[];

    query(query?: string): Promise<Result> {
        return pool.query(query);
    }

    delete(where?: string): Promise<Result> {
        return pool.query(`DELETE FROM ${getConfig().PgConfig.schema}.${this.tableName} ${where}`);
    }

    select(where?: string, fields?: string): Promise<T[]> {
        return pool
            .query(`SELECT ${fields ? fields : '*'} FROM ${getConfig().PgConfig.schema}.${this.tableName} ${where}`)
            .then((value) => {
                const { rows } = value;
                const categories = this.readSelectResponse(rows);
                return categories;
            });
    }

    count(where?: string): Promise<number> {
        return pool
            .query(`SELECT * FROM ${getConfig().PgConfig.schema}.${this.tableName} ${where ? where : ''};`)
            .then((value) => {
                const { rows } = value;
                return rows.length;
            });
    }

    update(where?: string): Promise<Result> {
        return pool.query(`UPDATE ${getConfig().PgConfig.schema}.${this.tableName} ${where}`);
    }

    insert(where?: string): Promise<Result> {
        return pool.query(`INSERT INTO ${getConfig().PgConfig.schema}.${this.tableName} ${where}`);
    }
}
