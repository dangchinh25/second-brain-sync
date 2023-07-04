import fs from 'fs';
import path from 'path';
import {
    createBranch, createCommitOnBranch, getRepo
} from './lib/octokit';

const convertToURLStyleString = ( str: string ): string => {
    const lowerCaseStr = str.toLowerCase();
    const strParts = lowerCaseStr.split( ' ' );

    return strParts.join( '-' );
};


const getAllFiles = (
    folderPath: string
    , folderName: string
): Map<string, string[]> => {
    const directoriesFilesMap: Map<string, string[]> = new Map();

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

                    directoryName = convertToURLStyleString( directoryName );

                    if ( !directoriesFilesMap.has( directoryName ) ) {
                        directoriesFilesMap.set( directoryName, [] );
                    }

                    directoriesFilesMap.get( directoryName )?.push( entryPath );
                }
            } else if ( entry.isDirectory() ) {
                traverseDirectory( entryPath );
            }
        }
    };

    traverseDirectory( folderPath );
    return directoriesFilesMap;
};

const folderName = 'SecondBrain';
const folderPath = `/Users/chinhle/Documents/Learning/${ folderName }`;
const filesInFolder = getAllFiles( folderPath, folderName );

/*
 * Call getRepo to get Repo Id
 * Fetch the most recent commit of the default branch to get the latest hash
 * Call create branch to create a new branch that is up to date with the default branch
 * Commit?
 */

const test = async () => {
    const repoResponse = await getRepo( {
        owner: 'dangchinh25'
        , repoName: 'second-brain'
    } );

    if ( repoResponse.isError() ) {
        return;
    }

    const newBranchResponse = await createBranch( {
        branchName: 'test-branch-2'
        , repositoryId: repoResponse.value.repository.id
        , oid: repoResponse.value.repository.defaultBranchRef.target.oid
    } );

    if ( newBranchResponse.isError() ) {
        return;
    }

    const commitResponse = await createCommitOnBranch( {
        branchName: newBranchResponse.value.createRef.ref.name
        , repoName: 'second-brain'
        , ownerName: 'dangchinh25'
        , expectedHeadOid: newBranchResponse.value.createRef.ref.target.oid
    } );

    console.log( commitResponse.value );
};

test();