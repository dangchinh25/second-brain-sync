/* eslint-disable @typescript-eslint/naming-convention */
import dotenv from 'dotenv';
import {
    cleanEnv,
    str,
    num
} from 'envalid';

dotenv.config( { path: '.env' } );

export const env = cleanEnv( process.env, {
    PORT: num( { default: 3000 } ),
    CLIENT_ID: str( { default: undefined } ),
    CLIENT_SECRET: str( { default: undefined } ),
    REDIRECT_URI: str( { default: 'http://localhost:3000/oauth2callback' } ),
    TOKEN_CODE_PATH: str( { default: 'token-code.json' } ),
    SCOPE: str(),
    ROOT_FOLDER_ID: str()
} );