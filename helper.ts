import fs from 'fs';
import path from 'path';
import { FileChanges } from './lib/octokit';
import { getFileAsString } from './utils';
import { IGNORE_DIRECTORIES, IGNORE_FILES } from './config/constants';

type Dirent = {
    name: string;
    type: 'Dir' | 'File';
    path: string;
};

export const getNestedFileChanges = async (
    rootPath: string,
    rootName: string
): Promise<FileChanges> => {
    const fileChanges: FileChanges = {
        additions: [],
        deletions: []
    };

    const queue: Dirent[] = [];

    const entries = fs.readdirSync( rootPath, { withFileTypes: true } );

    for ( const entry of entries ) {
        if ( !entry.name.startsWith( '.' ) ) {
            queue.push( {
                name: entry.name,
                path: path.join( rootPath, entry.name ),
                type: entry.isDirectory() ? 'Dir' : 'File'
            } );
        }
    }

    while ( queue.length ) {
        const entry = queue.shift();

        if ( !entry ) {
            break;
        }

        if ( entry.type === 'Dir' ) {
            if ( IGNORE_DIRECTORIES.includes( entry.name ) ) {
                continue;
            }

            const subEntries = fs.readdirSync( entry.path, { withFileTypes: true } );

            for ( const subEntry of subEntries ) {
                queue.push( {
                    name: subEntry.name,
                    path: path.join( entry.path, subEntry.name ),
                    type: subEntry.isDirectory() ? 'Dir' : 'File'
                } );
            }
        } else {
            if ( IGNORE_FILES.includes( entry.name ) ) {
                continue;
            }

            const entryPathParts = entry.path.split( '/' );
            const rootFolderIndex = entryPathParts.findIndex( part => part === rootName );

            const localPath = entryPathParts.slice( rootFolderIndex + 1 ).join( '/' );
            const fileAsString = await getFileAsString( entry.path );


            fileChanges.additions?.push( {
                path: `docs/${ localPath }`,
                contents: Buffer.from( fileAsString ).toString( 'base64' )
            } );
        }
    }

    return fileChanges;
};