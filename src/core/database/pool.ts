import { Pool } from "pg";
import { DatabaseClient } from './database.client.js';
import { databaseConfig } from "@/config/index.js";

export const pool = new Pool(databaseConfig);
export const dbClient = new DatabaseClient(pool);
