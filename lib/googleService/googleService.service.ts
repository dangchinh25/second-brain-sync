import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import {
    Folder,
    GenericFile,
    MimeType
} from './types';

export const getFiles = async (
    oAuth2Client: OAuth2Client,
    folderId: string
): Promise<GenericFile[]> => {
    const driveService = google.drive( { version: 'v3', auth: oAuth2Client } );
    const getFilesResult = await driveService.files.list(
        {
            q: `'${ folderId }' in parents and (mimeType='${ MimeType.FOLDER }' or mimeType='${ MimeType.MARKDOWN_FILE }')`,
            fields: 'nextPageToken, files(id, name, mimeType, parents)'
        }
    );

    const files = getFilesResult.data.files as GenericFile[];

    return files;
};

export const getFolder = async (
    oAuth2Client: OAuth2Client,
    folderId: string
): Promise<Folder> => {
    const driveService = google.drive( { version: 'v3', auth: oAuth2Client } );
    const getFolderResult = await driveService.files.get( {
        fileId: folderId,
        fields: 'id, name, mimeType, createdTime, parents'
    } );

    const folder = getFolderResult.data as Folder;

    return folder;
};