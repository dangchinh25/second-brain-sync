import { Either, success } from '../../types';
import { octokitClient } from './octokit.client';
import {
    CreateBranchParams
    , CreateBranchResponse
    , CreateCommitOnBranchParams
    , CreateCommitOnBranchResponse
    , CreatePullRequestParams, CreatePullRequestResponse, GetRepoParams
    , GetRepoResponse
} from './octokit.types';

export const getRepo = async (
    params: GetRepoParams
): Promise<Either<Error, GetRepoResponse>> => {
    const response: GetRepoResponse = await octokitClient.graphql( {
        query: `
            query getRepo($owner: String!, $repoName: String!) {
                repository(owner: $owner, name: $repoName) {
                    createdAt
                    id
                    defaultBranchRef {
                        target {
                            oid
                        }
                    }
                }
            }
        `
        , owner: params.owner
        , repoName: params.repoName
    } );

    return success( response );
};

export const createBranch = async (
    params: CreateBranchParams
): Promise<Either<Error, CreateBranchResponse>> => {
    const branchRef = `refs/heads/${ params.branchName }`;

    const response: CreateBranchResponse = await octokitClient.graphql( {
        query: `
            mutation createBranchFromRef($branchRef: String!, $repositoryId: ID!, $oid: GitObjectID!) {
                createRef(input: {
                    name: $branchRef
                    oid: $oid
                    repositoryId: $repositoryId
                }) {
                    clientMutationId
                    ref {
                        target {
                            oid
                        }
                        name
                    }
                }
            }
        `
        , branchRef: branchRef
        , repositoryId: params.repositoryId
        , oid: params.oid
    } );

    return success( response );
};

export const createCommitOnBranch = async (
    params: CreateCommitOnBranchParams
): Promise<Either<Error, CreateCommitOnBranchResponse>> => {
    const repositoryNameWithOwner = `${ params.ownerName }/${ params.repoName }`;

    const response: CreateCommitOnBranchResponse = await octokitClient.graphql( {
        query: `
            mutation ($input: CreateCommitOnBranchInput!) {
                createCommitOnBranch(input: $input) {
                    clientMutationId
                    commit {
                        url
                    }
                    ref {
                        target {
                            oid
                        }
                        name
                    }
                }
            }
        `
        , input: {
            branch: {
                repositoryNameWithOwner: repositoryNameWithOwner
                , branchName: params.branchName
            }
            , expectedHeadOid: params.expectedHeadOid
            , fileChanges: params.fileChanges
            , message: {
                headline: params.commitMessage.headline
                , body: params.commitMessage.body || params.commitMessage.headline
            }
        }
    } );

    return success( response );
};

export const createPullRequest = async (
    params: CreatePullRequestParams
): Promise<Either<Error, CreatePullRequestResponse>> => {
    const response: CreatePullRequestResponse = await octokitClient.graphql( {
        query: `
            mutation ($input: CreatePullRequestInput!) {
                createPullRequest(input: $input) {
                    clientMutationId
                }
            }
        `
        , input: {
            baseRefName: params.toBranchName
            , headRefName: params.fromBranchName
            , headRepositoryId: params.repositoryId
            , repositoryId: params.repositoryId
            , title: params.title
        }
    } );

    return success( response );
};