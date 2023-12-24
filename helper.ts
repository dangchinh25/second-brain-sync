import fs from 'fs';
import path from 'path';
import { FileChanges } from './lib/octokit';
import { getFileAsString } from './utils';

type FileNameWithPath = {
    fileName: string;
    filePath: string;
};

type DirectoriesFileNamesWithPath = {
    [key: string]: FileNameWithPath[];
};

export const getAllFiles = (
    folderPath: string,
    folderName: string
): DirectoriesFileNamesWithPath => {
    const directoriesFileNamesWithPath: DirectoriesFileNamesWithPath = {};

    const traverseDirectory = ( directory: string ) => {
        const entries = fs.readdirSync( directory, { withFileTypes: true } );

        for ( const entry of entries ) {
            const entryPath = path.join( directory, entry.name );

            if ( entry.isFile() ) {
                const [ , fileExtension ] = entry.name.split( '.' );

                if ( fileExtension === 'md' ) {
                    const directoryPath = path.dirname( entryPath );
                    const directoryPathParts = directoryPath.split( '/' );
                    let directoryName = directoryPathParts[ directoryPathParts.length - 1 ];

                    if ( directoryName === folderName ) {
                        const entryPathParts = entryPath.split( '/' );
                        const [ entryFilename ]
              = entryPathParts[ entryPathParts.length - 1 ].split( '.' );

                        directoryName = entryFilename;
                    }

                    if ( !( directoryName in directoriesFileNamesWithPath ) ) {
                        directoriesFileNamesWithPath[ directoryName ] = [];
                    }

                    const entryPathParts = entryPath.split( '/' );
                    const entryFilename = entryPathParts[ entryPathParts.length - 1 ];

                    directoriesFileNamesWithPath[ directoryName ].push( {
                        fileName: entryFilename,
                        filePath: entryPath
                    } );
                }
            } else if ( entry.isDirectory() ) {
                traverseDirectory( entryPath );
            }
        }
    };

    traverseDirectory( folderPath );

    return directoriesFileNamesWithPath;
};

export const getNestedFileChanges = async (
    folderPath: string,
    folderName: string
): Promise<FileChanges> => {
    const fileChanges: FileChanges = {
        additions: [],
        deletions: []
    };

    const filesInFolder = getAllFiles( folderPath, folderName );

    for ( const [ directoryName, fileNamesWithPath ] of Object.entries( filesInFolder ) ) {
        for ( const { fileName, filePath } of fileNamesWithPath ) {
            const fileAsString = await getFileAsString( filePath );

            fileChanges.additions?.push( {
                path: `docs/${ directoryName }/${ fileName }`,
                contents: Buffer.from( fileAsString ).toString( 'base64' )
            } );
        }
    }

    return fileChanges;
};