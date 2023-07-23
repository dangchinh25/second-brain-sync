export enum MimeType {
    FOLDER = 'application/vnd.google-apps.folder',
    MARKDOWN_FILE = 'text/markdown'
}


export interface File {
    id: string;
    mimeType: MimeType;
    name: string;
    parents: string[];
}