import fs from 'fs';

import {
    OAuth2Client,
    OAuth2ClientOptions
} from 'google-auth-library';
import open from 'open';
import { app } from './server';
import { google } from 'googleapis';
import { env } from './config';

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

    open( authorizeUrl, { wait: false } ).then( cp => cp.unref() );

    while ( !fs.existsSync( env.TOKEN_CODE_PATH ) ) {
        console.log( 'TokenCode has not been set. Try again in 2 second.' );

        await new Promise( resolve => setTimeout( resolve, 2000 ) );
    }

    const tokenCodePayload = JSON.parse( fs.readFileSync( env.TOKEN_CODE_PATH ).toString() );

    const getTokenResponse = await oAuth2Client.getToken( tokenCodePayload.tokenCode );

    oAuth2Client.setCredentials( getTokenResponse.tokens );

    const drive = google.drive( { version: 'v3', auth: oAuth2Client } );
    const res = await drive.files.list();

    const files = res.data.files;

    console.log( 'Files:' );
    files?.map( ( file ) => {
        console.log( `${ file.name } (${ file.id })` );
    } );
};

main();

process.on( 'SIGINT', () => {
    fs.unlinkSync( env.TOKEN_CODE_PATH );
} );