import { Either, success } from '../../types';
import { octokitClient } from './octokit.client';
import {
    CreateBranchParams
    , CreateBranchResponse, GetRepoParams, GetRepoResponse
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
    const response: CreateBranchResponse = await octokitClient.graphql( {
        query: `
            mutation createBranchFromRef($branchName: String!, $repositoryId: ID!, $commitHash: GitObjectID!) {
                createRef(input: {
                    name: $branchName
                    oid: $commitHash
                    repositoryId: $repositoryId
                }) {
                    clientMutationId
                }
            }
        `
        , branchName: params.branchName
        , repositoryId: params.repositoryId
        , commitHash: params.commitHash
    } );

    return success( response );
};
