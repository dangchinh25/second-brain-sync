export interface Ref {
    target: {
        oid: string;
    };
    name: string;
}

export interface GetRepoResponse {
    repository: {
        id: string;
        createdAt: string;
        defaultBranchRef: Ref;
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
        ref: Ref;
    };
}

export interface CreateCommitOnBranchParams {
    branchName: string;
    repoName: string;
    ownerName: string;
    expectedHeadOid: string;
}

export interface CreateCommitOnBranchResponse {
    createCommitOnBrach: {
        clientMutationId: string | null;
        commit: {
            url: string;
        };
        ref: Ref;
    };
}