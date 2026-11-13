import type { Auth } from "../auth";
import type { Db } from "../db";
import type { Env } from "../env";

export type SessionUser = Auth["$Infer"]["Session"]["user"];

export type AppEnv = {
  Variables: {
    db: Db;
    env: Env;
    user: SessionUser | null;
  };
};
