import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import { File, MimeType } from './types';

export const getFiles = async (
    oAuth2Client: OAuth2Client,
    folderId: string
): Promise<File[]> => {
    const driveService = google.drive( { version: 'v3', auth: oAuth2Client } );
    const getFilesResult = await driveService.files.list(
        {
            q: `'${ folderId }' in parents and (mimeType='${ MimeType.FOLDER }' or mimeType='${ MimeType.MARKDOWN_FILE }')`,
            fields: 'nextPageToken, files(id, name, mimeType, parents)'
        }
    );

    const files = getFilesResult.data.files as File[];

    return files;
};