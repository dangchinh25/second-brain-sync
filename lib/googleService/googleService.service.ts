import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import {
    GenericFile,
    MimeType
} from './types';
import { Either, success } from '../../types';

export const getFilesUnderFolder = async (
    oAuth2Client: OAuth2Client,
    folderId: string
): Promise<Either<Error, GenericFile[]>> => {
    const driveService = google.drive( { version: 'v3', auth: oAuth2Client } );
    const getFilesResult = await driveService.files.list(
        {
            q: `'${ folderId }' in parents and (mimeType='${ MimeType.FOLDER }' or mimeType='${ MimeType.MARKDOWN_FILE }')`,
            fields: 'nextPageToken, files(id, name, mimeType, parents)'
        }
    );

    const files = getFilesResult.data.files as GenericFile[];

    return success( files );
};

export const getFileInfo = async<T extends GenericFile> (
    oAuth2Client: OAuth2Client,
    fileId: string
): Promise<Either<Error, T>> => {
    const driveService = google.drive( { version: 'v3', auth: oAuth2Client } );
    const getFileResult = await driveService.files.get( {
        fileId: fileId,
        fields: 'id, name, mimeType, createdTime, parents'
    } );

    const file = getFileResult.data as T;

    return success( file );
};

export const getFileContent = async (
    oAuth2Client: OAuth2Client,
    fileId: string
): Promise<Either<Error, string>> => {
    const driveService = google.drive( { version: 'v3', auth: oAuth2Client } );
    const getFileContentResult = await driveService.files.get(
        {
            fileId: fileId,
            alt: 'media'
        }
    );

    const fileContent = getFileContentResult.data as string;

    return success( fileContent );
};