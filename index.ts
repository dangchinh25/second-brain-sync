import fs from 'fs';
import path from 'path';
import {
    createBranch
    , createCommitOnBranch
    , createPullRequest
    , getRepo
    , mergePullRequest
} from './lib/octokit';
import { getFileAsString } from './utils';
import { FileChanges } from './lib/octokit';

import { OAuth2Client, OAuth2ClientOptions } from 'google-auth-library';
import open from 'open';
import { app } from './server';
import { google } from 'googleapis';
import { env } from './config';

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

                    if ( !( directoryName in directoriesFileNamesWithPath ) ) {
                        directoriesFileNamesWithPath[ directoryName ] = [];
                    }

                    const entryPathParts = entryPath.split( '/' );
                    const entryFilename = entryPathParts[ entryPathParts.length - 1 ];

                    directoriesFileNamesWithPath[ directoryName ].push( {
                        fileName: entryFilename
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
        branchName: `sync-${ new Date().getTime() }`
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

    if ( createCommitAddDocsResponse.isError() ) {
        return;
    }

    const createPullRequestResponse = await createPullRequest( {
        title: `Sync at ${ new Date().toUTCString() }`
        , fromBranchName: createCommitAddDocsResponse.value.createCommitOnBranch.ref.name
        , toBranchName: 'main'
        , repositoryId: repoResponse.value.repository.id
    } );

    console.log( createPullRequestResponse.value );

    if ( createPullRequestResponse.isError() ) {
        return;
    }

    const mergeRequestResponse = await mergePullRequest(
        {
            pullRequestId:
                createPullRequestResponse.value.createPullRequest.pullRequest.id
        }
    );

    console.log( mergeRequestResponse.value );
};

const main = async () => {
    const server = app.listen( env.PORT, () => {
        console.log( `Server running on port ${ env.PORT }` );
    } );

    const oAuth2ClientOptions: OAuth2ClientOptions = {
        clientId: env.CLIENT_ID
        , clientSecret: env.CLIENT_SECRET
        , redirectUri: env.REDIRECT_URI
    };

    const oAuth2Client = new OAuth2Client( oAuth2ClientOptions );

    // Generate the url that will be used for the consent dialog.
    const authorizeUrl = oAuth2Client.generateAuthUrl( {
        [ 'access_type' ]: 'offline'
        , scope: env.SCOPE
    } );

    open( authorizeUrl, { wait: false } ).then( cp => cp.unref() );

    while ( !fs.existsSync( env.TOKEN_CODE_PATH ) ) {
        console.log( 'TokenCode has not been set. Try again in 2 second.' );

        await new Promise( resolve => setTimeout( resolve, 2000 ) );
    }

    const tokenCodePayload = JSON.parse( fs.readFileSync( env.TOKEN_CODE_PATH ).toString() );

    const getTokenResponse = await oAuth2Client.getToken( tokenCodePayload.tokenCode );

    oAuth2Client.setCredentials( getTokenResponse.tokens );

    const drive = google.drive( { version: 'v3', auth: oAuth2Client } );
    const res = await drive.files.list();

    const files = res.data.files;

    console.log( 'Files:' );
    files?.map( ( file ) => {
        console.log( `${ file.name } (${ file.id })` );
    } );
};

main();