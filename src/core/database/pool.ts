import { Pool } from "pg";
import { databaseConfig } from "../../config";

export const pool = new Pool(databaseConfig);
