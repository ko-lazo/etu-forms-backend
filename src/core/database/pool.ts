import { Pool } from "pg";
import { databaseConfig } from "../../config";
import { DatabaseClient } from "./database.client";

export const pool = new Pool(databaseConfig);
export const dbClient = new DatabaseClient(pool);
