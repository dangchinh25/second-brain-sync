import fs from 'fs';
import path from 'path';
import {
    createBranch
    , createCommitOnBranch
    , getRepo
} from './lib/octokit';
import { convertToURLStyleString, getFileAsString } from './utils';
import { FileChanges } from './lib/octokit';

interface FileNameWithPath {
    fileName: string;
    filePath: string;
}

interface DirectoriesFileNamesWithPath {
    [key: string]: FileNameWithPath[];
}

const getAllFiles = (
    folderPath: string
    , folderName: string
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

                    directoryName = convertToURLStyleString( directoryName );

                    if ( !( directoryName in directoriesFileNamesWithPath ) ) {
                        directoriesFileNamesWithPath[ directoryName ] = [];
                    }

                    const entryPathParts = entryPath.split( '/' );
                    const entryFilename = entryPathParts[ entryPathParts.length - 1 ];

                    directoriesFileNamesWithPath[ directoryName ].push( {
                        fileName: convertToURLStyleString( entryFilename )
                        , filePath: entryPath
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

    const createCommitDeletionDocsResponse = await createCommitOnBranch( {
        branchName: newBranchResponse.value.createRef.ref.name
        , repoName: 'second-brain'
        , ownerName: 'dangchinh25'
        , expectedHeadOid: newBranchResponse.value.createRef.ref.target.oid
        , fileChanges: { deletions: [ { path: 'docs' } ] }
        , commitMessage: { headline: 'Remove docs folder' }
    } );

    if ( createCommitDeletionDocsResponse.isError() ) {
        return;
    }

    const introFileAsString = await getFileAsString( 'assets/intro.md' );

    const fileChanges: FileChanges = {
        additions: [
            {
                path: 'docs/intro.md'
                , contents: btoa( introFileAsString )
            }
        ]
    };

    for ( const [ directoryName, fileNamesWithPath ] of Object.entries( filesInFolder ) ) {
        for ( const { fileName, filePath } of fileNamesWithPath ) {
            const fileAsString = await getFileAsString( filePath );

            fileChanges.additions?.push( {
                path: `docs/${ directoryName }/${ fileName }`
                , contents: Buffer.from( fileAsString ).toString( 'base64' )
            } );
        }
    }

    const createCommitAddDocsResponse = await createCommitOnBranch( {
        branchName: newBranchResponse.value.createRef.ref.name
        , repoName: 'second-brain'
        , ownerName: 'dangchinh25'
        , expectedHeadOid: createCommitDeletionDocsResponse.value.createCommitOnBranch.ref.target.oid
        , fileChanges: fileChanges
        , commitMessage: { headline: 'Add docs file' }
    } );

    console.log( createCommitAddDocsResponse.value );
};

test();