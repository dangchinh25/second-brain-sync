import {
    createBranch,
    createCommitOnBranch,
    createPullRequest,
    getRepo,
    mergePullRequest
} from './lib/octokit';
import { getFileAsString } from './utils';
import { FileChanges } from './lib/octokit';
import { env } from './config';
import { getNestedFileChanges } from './helper';

/*
 * Call getRepo to get Repo Id
 * Fetch the most recent commit of the default branch to get the latest hash
 * Call create branch to create a new branch that is up to date with the default branch
 * Commit?
 */
const main = async () => {
    const repoResponse = await getRepo( {
        owner: env.GITHUB_OWNER,
        repoName: env.GITHUB_REPO_NAME
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
        repoName: env.GITHUB_REPO_NAME,
        ownerName: env.GITHUB_OWNER,
        expectedHeadOid: newBranchResponse.value.createRef.ref.target.oid,
        fileChanges: { deletions: [ { path: 'docs' } ], additions: [] },
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
        ],
        deletions: []
    };

    const nestedFileChanges = await getNestedFileChanges( env.VAULT_PATH, env.VAULT_NAME );

    fileChanges.additions.push( ...nestedFileChanges.additions );
    fileChanges.deletions.push( ...nestedFileChanges.deletions );

    console.log( 'Create commit on branch to add new docs...' );

    const createCommitAddDocsResponse = await createCommitOnBranch( {
        branchName: newBranchResponse.value.createRef.ref.name,
        repoName: env.GITHUB_REPO_NAME,
        ownerName: env.GITHUB_OWNER,
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

main();