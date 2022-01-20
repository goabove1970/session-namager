import { PgConfig } from './src/controllers/data-controller/database/PgConfig';

export interface ApplicationConfig {
  PgConfig?: PgConfig;
}

const CONFIG: ApplicationConfig = {
  PgConfig: {
    host: '134.122.16.140',
    port: 5432,
    login: 'zhenia',
    password: 'a84hg7dT!!a',
    database: 'postgres',
    schema: 'public',
  },
};

const LOCAL_CONFIG: ApplicationConfig = {
  PgConfig: {
    host: '127.0.0.1',
    port: 5432,
    login: 'postgres',
    password: 'admin',
    database: 'postgres',
    schema: 'public',
  },
};

export const getConfig = (): ApplicationConfig => {
  if (process.env.NODE_ENV === 'development') {
    return LOCAL_CONFIG;
  }
  return CONFIG;
};
