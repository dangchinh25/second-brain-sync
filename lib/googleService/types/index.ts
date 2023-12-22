export enum MimeType {
    FOLDER = 'application/vnd.google-apps.folder',
    MARKDOWN_FILE = 'text/markdown'
}


export interface GenericFile {
    id: string;
    mimeType: MimeType;
    name: string;
    parents: string[];
}

export interface Folder extends GenericFile {
    mimeType: MimeType.FOLDER;
}