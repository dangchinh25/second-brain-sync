/* eslint-disable @typescript-eslint/naming-convention */
import dotenv from 'dotenv';
import { cleanEnv, str } from 'envalid';

dotenv.config( { path: '.env' } );

export const env = cleanEnv( process.env, {
    GITHUB_TOKEN: str(),
    GITHUB_OWNER: str(),
    GITHUB_REPO_NAME: str(),
    VAULT_NAME: str(),
    VAULT_PATH: str()
} );