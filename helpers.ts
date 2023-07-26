import {
    getFilesUnderFolder as getGooleDriveFilesUnderFolder,
    getFileInfo as getGoogleDriveFileInfo,
    Folder as GoogleDriveFolder,
    MimeType as GoogleMimeType,
    GenericFile as GoogleGenericFile,
    getFileContent as getGoogleDriveFileContent
} from './lib/googleService';

import { OAuth2Client } from 'google-auth-library';
import { FileChanges } from './lib/octokit';
import {
    Either, error, success
} from './types';

export const getNestedFileChanges = async (
    oAuth2Client: OAuth2Client,
    rootFolderId: GoogleDriveFolder['id']
): Promise<Either<Error, FileChanges>>  => {
    const fileChanges: FileChanges = {
        additions: [],
        deletions: []
    };

    const folderIdFolderMap: Map<GoogleDriveFolder['id'], GoogleDriveFolder> = new Map();
    const fileIdParentMap: Map<GoogleGenericFile['id'], GoogleDriveFolder> = new Map();

    const getRootGoogleDriveFolderResult
        = await getGoogleDriveFileInfo<GoogleDriveFolder>( oAuth2Client, rootFolderId );

    if ( getRootGoogleDriveFolderResult.isError() ) {
        return error( getRootGoogleDriveFolderResult.value );
    }

    const rootGoogleDriveFolder = getRootGoogleDriveFolderResult.value;

    const rootFolderName = rootGoogleDriveFolder.name;
    folderIdFolderMap.set( rootFolderId, rootGoogleDriveFolder );

    const getRootGoogleDriveFilesResult = await getGooleDriveFilesUnderFolder( oAuth2Client, rootFolderId );

    if ( getRootGoogleDriveFilesResult.isError() ) {
        return error( getRootGoogleDriveFilesResult.value );
    }

    const googleDriveFilesQueue = getRootGoogleDriveFilesResult.value;

    while ( googleDriveFilesQueue.length ) {
        const googleDriveFile = googleDriveFilesQueue.shift();

        if ( !googleDriveFile ) {
            break;
        }

        if ( googleDriveFile.mimeType === GoogleMimeType.FOLDER ) {
            folderIdFolderMap.set( googleDriveFile.id, googleDriveFile as GoogleDriveFolder );
            const getGoogleDriveFilesResult = await getGooleDriveFilesUnderFolder( oAuth2Client, googleDriveFile.id );

            if ( getGoogleDriveFilesResult.isError() ) {
                return error( getGoogleDriveFilesResult.value );
            }

            for ( const file of getGoogleDriveFilesResult.value ) {
                fileIdParentMap.set( file.id, googleDriveFile as GoogleDriveFolder );
            }

            googleDriveFilesQueue.push( ...getGoogleDriveFilesResult.value );
        } else {
            let parentFolder = fileIdParentMap.get( googleDriveFile.id );

            if ( !parentFolder ) {
                continue;
            }

            let path = `/${ googleDriveFile.name }`;

            while ( parentFolder.name !== rootFolderName ) {
                path = `/${ parentFolder.name }` + path;
                const [ grandParentId ] = parentFolder.parents;

                const grandParentFolder = folderIdFolderMap.get( grandParentId );

                if ( !grandParentFolder ) {
                    continue;
                }

                parentFolder = grandParentFolder;
            }

            const getFileContentResult = await getGoogleDriveFileContent(
                oAuth2Client,
                googleDriveFile.id
            );

            if ( getFileContentResult.isError() ) {
                return error( getFileContentResult.value );
            }

            fileChanges.additions.push( {
                path: 'docs' + path,
                contents: Buffer.from( getFileContentResult.value ).toString( 'base64' )
            } );
        }
    }

    return success( fileChanges );
};