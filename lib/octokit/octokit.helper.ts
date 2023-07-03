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
                }
            }
        `
        , branchRef: branchRef
        , repositoryId: params.repositoryId
        , oid: params.oid
    } );

    return success( response );
};
