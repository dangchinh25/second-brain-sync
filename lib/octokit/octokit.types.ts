export interface GetRepoResponse {
    repository: {
        id: string;
        createdAt: string;
    };
}

export interface GetRepoParams {
    owner: string;
    repoName: string;
}

export interface CreateBranchParams {
    branchName: string;
    repositoryId: string;
    commitHash: string;
}

export interface CreateBranchResponse {
    createRef: {
        clientMutationId: string | null;
    };
}