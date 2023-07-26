import fs from 'fs';

import {
    OAuth2Client,
    OAuth2ClientOptions
} from 'google-auth-library';
import open from 'open';
import { app } from './server';
import { env } from './config';

import { getFileAsString } from './utils';
import {
    FileChanges,
    createBranch,
    createCommitOnBranch,
    createPullRequest,
    getRepo,
    mergePullRequest
} from './lib/octokit';
import { getNestedFileChanges } from './helpers';

const main = async () => {
    const server = app.listen( env.PORT, () => {
        console.log( `Server running on port ${ env.PORT }` );
    } );

    const oAuth2ClientOptions: OAuth2ClientOptions = {
        clientId: env.CLIENT_ID,
        clientSecret: env.CLIENT_SECRET,
        redirectUri: env.REDIRECT_URI
    };

    const oAuth2Client = new OAuth2Client( oAuth2ClientOptions );

    // Generate the url that will be used for the consent dialog.
    const authorizeUrl = oAuth2Client.generateAuthUrl( {
        [ 'access_type' ]: 'offline',
        scope: env.SCOPE
    } );

    open( authorizeUrl, { wait: false } );

    while ( !fs.existsSync( env.TOKEN_CODE_PATH ) ) {
        console.log( 'TokenCode has not been set. Try again in 2 second.' );

        await new Promise( resolve => setTimeout( resolve, 2000 ) );
    }

    server.close();

    const tokenCodePayload = JSON.parse( fs.readFileSync( env.TOKEN_CODE_PATH ).toString() );

    const getTokenResponse = await oAuth2Client.getToken( tokenCodePayload.tokenCode );

    oAuth2Client.setCredentials( getTokenResponse.tokens );

    const introFileAsString = await getFileAsString( 'assets/intro.md' );

    const fileChanges: FileChanges = {
        additions: [
            {
                path: 'docs/intro.md',
                contents: btoa( introFileAsString )
            }
        ],
        deletions: []
    };

    const getNestedFileChangesResult = await getNestedFileChanges( oAuth2Client, env.ROOT_FOLDER_ID );

    if ( getNestedFileChangesResult.isError() ) {
        return;
    }

    fileChanges.additions.push( ...getNestedFileChangesResult.value.additions );
    fileChanges.deletions.push( ...getNestedFileChangesResult.value.deletions );

    const repoResponse = await getRepo( {
        owner: env.GITHUB_REPO_OWNER,
        repoName: env.GITHUB_REPO_NAME
    } );

    if ( repoResponse.isError() ) {
        return;
    }

    const newBranchResponse = await createBranch( {
        branchName: `sync-${ new Date().getTime() }`,
        repositoryId: repoResponse.value.repository.id,
        oid: repoResponse.value.repository.defaultBranchRef.target.oid
    } );

    if ( newBranchResponse.isError() ) {
        return;
    }

    const createCommitDeletionDocsResponse = await createCommitOnBranch( {
        branchName: newBranchResponse.value.createRef.ref.name,
        repoName: env.GITHUB_REPO_NAME,
        ownerName: env.GITHUB_REPO_OWNER,
        expectedHeadOid: newBranchResponse.value.createRef.ref.target.oid,
        fileChanges: { deletions: [ { path: 'docs' } ], additions: [] },
        commitMessage: { headline: 'Remove docs folder' }
    } );

    if ( createCommitDeletionDocsResponse.isError() ) {
        return;
    }

    const createCommitAddDocsResponse = await createCommitOnBranch( {
        branchName: newBranchResponse.value.createRef.ref.name,
        repoName: env.GITHUB_REPO_NAME,
        ownerName: env.GITHUB_REPO_OWNER,
        expectedHeadOid: createCommitDeletionDocsResponse.value.createCommitOnBranch.ref.target.oid,
        fileChanges: fileChanges,
        commitMessage: { headline: 'Add docs file' }
    } );

    if ( createCommitAddDocsResponse.isError() ) {
        return;
    }

    const createPullRequestResponse = await createPullRequest( {
        title: `Sync at ${ new Date().toUTCString() }`,
        fromBranchName: createCommitAddDocsResponse.value.createCommitOnBranch.ref.name,
        toBranchName: 'main',
        repositoryId: repoResponse.value.repository.id
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

main().finally( () => fs.unlinkSync( env.TOKEN_CODE_PATH ) );