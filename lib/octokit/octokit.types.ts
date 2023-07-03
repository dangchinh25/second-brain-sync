export interface GetRepoResponse {
    repository: {
        id: string;
        createdAt: string;
        defaultBranchRef: {
            target: {
                oid: string;
            };
        };
    };
}

export interface GetRepoParams {
    owner: string;
    repoName: string;
}

export interface CreateBranchParams {
    branchName: string;
    repositoryId: string;
    oid: string;
}

export interface CreateBranchResponse {
    createRef: {
        clientMutationId: string | null;
    };
}