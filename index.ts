import fs from 'fs';
import path from 'path';
import {
    createBranch,
    createCommitOnBranch,
    createPullRequest,
    getRepo,
    mergePullRequest
} from './lib/octokit';
import { getFileAsString } from './utils';
import { FileChanges } from './lib/octokit';

interface FileNameWithPath {
    fileName: string;
    filePath: string;
}

interface DirectoriesFileNamesWithPath {
    [key: string]: FileNameWithPath[];
}

const getAllFiles = (
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

const folderName = 'Chinh\'s Vault';
const folderPath = `/Users/chinhle/Documents/${ folderName }`;
const filesInFolder = getAllFiles( folderPath, folderName );

/*
 * Call getRepo to get Repo Id
 * Fetch the most recent commit of the default branch to get the latest hash
 * Call create branch to create a new branch that is up to date with the default branch
 * Commit?
 */

const test = async () => {
    const repoResponse = await getRepo( {
        owner: 'dangchinh25',
        repoName: 'second-brain'
    } );

    if ( repoResponse.isError() ) {
        return;
    }

    console.log( 'Creating new branch...' );

    const newBranchResponse = await createBranch( {
        branchName: `sync-${ new Date().getTime() }`,
        repositoryId: repoResponse.value.repository.id,
        oid: repoResponse.value.repository.defaultBranchRef.target.oid
    } );

    if ( newBranchResponse.isError() ) {
        return;
    }

    console.log( 'New branch created!' );
    console.log( 'Create commit on branch to remove current docs folder...' );

    const createCommitDeletionDocsResponse = await createCommitOnBranch( {
        branchName: newBranchResponse.value.createRef.ref.name,
        repoName: 'second-brain',
        ownerName: 'dangchinh25',
        expectedHeadOid: newBranchResponse.value.createRef.ref.target.oid,
        fileChanges: { deletions: [ { path: 'docs' } ] },
        commitMessage: { headline: 'Remove docs folder' }
    } );

    if ( createCommitDeletionDocsResponse.isError() ) {
        return;
    }

    console.log( 'Changes commited!' );

    const introFileAsString = await getFileAsString( 'assets/intro.md' );

    const fileChanges: FileChanges = {
        additions: [
            {
                path: 'docs/intro.md',
                contents: btoa( introFileAsString )
            }
        ]
    };

    for ( const [ directoryName, fileNamesWithPath ] of Object.entries( filesInFolder ) ) {
        for ( const { fileName, filePath } of fileNamesWithPath ) {
            const fileAsString = await getFileAsString( filePath );

            fileChanges.additions?.push( {
                path: `docs/${ directoryName }/${ fileName }`,
                contents: Buffer.from( fileAsString ).toString( 'base64' )
            } );
        }
    }

    console.log( 'Create commit on branch to add new docs...' );

    const createCommitAddDocsResponse = await createCommitOnBranch( {
        branchName: newBranchResponse.value.createRef.ref.name,
        repoName: 'second-brain',
        ownerName: 'dangchinh25',
        expectedHeadOid: createCommitDeletionDocsResponse.value.createCommitOnBranch.ref.target.oid,
        fileChanges: fileChanges,
        commitMessage: { headline: 'Add docs file' }
    } );

    if ( createCommitAddDocsResponse.isError() ) {
        return;
    }

    console.log( 'Changes commited!' );
    console.log( 'Creating pull request...' );

    const createPullRequestResponse = await createPullRequest( {
        title: `Sync at ${ new Date().toUTCString() }`,
        fromBranchName: createCommitAddDocsResponse.value.createCommitOnBranch.ref.name,
        toBranchName: 'main',
        repositoryId: repoResponse.value.repository.id
    } );

    console.log( 'Pull requested created! ', createPullRequestResponse.value );

    if ( createPullRequestResponse.isError() ) {
        return;
    }

    console.log( 'Auto approve and merge pull request...' );
    const mergeRequestResponse = await mergePullRequest(
        {
            pullRequestId:
                createPullRequestResponse.value.createPullRequest.pullRequest.id
        }
    );

    console.log( 'Pull request merged! ', mergeRequestResponse.value );
};

test();