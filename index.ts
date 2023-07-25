import fs from 'fs';

import {
    OAuth2Client,
    OAuth2ClientOptions
} from 'google-auth-library';
import open from 'open';
import { app } from './server';
import { env } from './config';
import {
    getFilesUnderFolder as getGooleDriveFilesUnderFolder,
    getFileInfo as getGoogleDriveFileInfo,
    Folder as GoogleDriveFolder,
    MimeType as GoogleMimeType,
    GenericFile as GoogleGenericFile
} from './lib/googleService';
import { getFileAsString } from './utils';
import { FileChanges } from './lib/octokit';

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

    const introFileAsString = await getFileAsString( 'assets/intro.md' );

    const fileChanges: FileChanges = {
        additions: [
            {
                path: 'docs/intro.md',
                contents: btoa( introFileAsString )
            }
        ],
        deletions: []
    };

    const getNestedFileChangesResult = await getNestedFileChanges( oAuth2Client, env.ROOT_FOLDER_ID );

    fileChanges.additions.push( ...getNestedFileChangesResult.additions );
    fileChanges.deletions.push( ...getNestedFileChangesResult.deletions );

    console.log( fileChanges );
};

main().finally( () => fs.unlinkSync( env.TOKEN_CODE_PATH ) );

const getNestedFileChanges = async (
    oAuth2Client: OAuth2Client,
    rootFolderId: GoogleDriveFolder['id']
): Promise<FileChanges>  => {
    const fileChanges: FileChanges = {
        additions: [],
        deletions: []
    };

    const folderIdFolderMap: Map<GoogleDriveFolder['id'], GoogleDriveFolder> = new Map();
    const fileIdParentMap: Map<GoogleGenericFile['id'], GoogleDriveFolder> = new Map();

    const getRootGoogleDriveFolder = await getGoogleDriveFileInfo( oAuth2Client, rootFolderId ) as GoogleDriveFolder;
    const rootFolderName = getRootGoogleDriveFolder.name;
    folderIdFolderMap.set( rootFolderId, getRootGoogleDriveFolder );

    const getRootGoogleDriveFilesResult = await getGooleDriveFilesUnderFolder( oAuth2Client, rootFolderId );
    const googleDriveFilesQueue = getRootGoogleDriveFilesResult;

    while ( googleDriveFilesQueue.length ) {
        const googleDriveFile = googleDriveFilesQueue.shift();

        if ( !googleDriveFile ) {
            break;
        }

        if ( googleDriveFile.mimeType === GoogleMimeType.FOLDER ) {
            folderIdFolderMap.set( googleDriveFile.id, googleDriveFile as GoogleDriveFolder );
            const getGoogleDriveFilesResult = await getGooleDriveFilesUnderFolder( oAuth2Client, googleDriveFile.id );

            for ( const file of getGoogleDriveFilesResult ) {
                fileIdParentMap.set( file.id, googleDriveFile as GoogleDriveFolder );
            }

            googleDriveFilesQueue.push( ...getGoogleDriveFilesResult );
        } else {
            let parentFolder = fileIdParentMap.get( googleDriveFile.id );

            if ( !parentFolder ) {
                continue;
            }

            let path = `/${ parentFolder.name }/${ googleDriveFile.name }`;

            while ( parentFolder.name !== rootFolderName ) {
                path = `/${ parentFolder.name }` + path;
                const [ grandParentId ] = parentFolder.parents;

                const grandParentFolder = folderIdFolderMap.get( grandParentId );

                if ( !grandParentFolder ) {
                    continue;
                }

                parentFolder = grandParentFolder;
            }

            fileChanges.additions.push( {
                path: 'docs' + path,
                contents: Buffer.from( '' ).toString( 'base64' )
            } );
        }
    }

    return fileChanges;
};