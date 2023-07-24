import fs from 'fs';

import {
    OAuth2Client,
    OAuth2ClientOptions
} from 'google-auth-library';
import open from 'open';
import { app } from './server';
import { env } from './config';
import {
    getFiles as getGooleDriveFiles,
    getFolder as getGoogleDriveFolder
} from './lib/googleService';

const main = async () => {
    const server = app.listen( env.PORT, () => {
        console.log( `Server running on port ${ env.PORT }` );
    } );

    const oAuth2ClientOptions: OAuth2ClientOptions = {
        clientId: env.CLIENT_ID,
        clientSecret: env.CLIENT_SECRET,
        redirectUri: env.REDIRECT_URI
    };

    const oAuth2Client = new OAuth2Client( oAuth2ClientOptions );

    // Generate the url that will be used for the consent dialog.
    const authorizeUrl = oAuth2Client.generateAuthUrl( {
        [ 'access_type' ]: 'offline',
        scope: env.SCOPE
    } );

    open( authorizeUrl, { wait: false } );

    while ( !fs.existsSync( env.TOKEN_CODE_PATH ) ) {
        console.log( 'TokenCode has not been set. Try again in 2 second.' );

        await new Promise( resolve => setTimeout( resolve, 2000 ) );
    }

    server.close();

    const tokenCodePayload = JSON.parse( fs.readFileSync( env.TOKEN_CODE_PATH ).toString() );

    const getTokenResponse = await oAuth2Client.getToken( tokenCodePayload.tokenCode );

    oAuth2Client.setCredentials( getTokenResponse.tokens );

    const files = await getGooleDriveFiles(
        oAuth2Client,
        env.ROOT_FOLDER_ID
    );

    const folder = await getGoogleDriveFolder( oAuth2Client, env.ROOT_FOLDER_ID );

    /*
     * console.log( 'Files:' );
     * files?.map( ( file ) => {
     *     console.log( file );
     * } );
     */

    console.log( folder );
};

main().then( () => fs.unlinkSync( env.TOKEN_CODE_PATH ) );