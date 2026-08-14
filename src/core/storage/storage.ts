import { storageConfig } from "@/config/index.js";
import type { IFileStorage } from "./file-storage.interface.js";
import { LocalFileStorage } from "./local-file-storage.js";

export const fileStorage: IFileStorage = new LocalFileStorage(
  storageConfig.root,
);
