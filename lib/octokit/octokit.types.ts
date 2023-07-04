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

export interface FileChangesAdditions {
    path: string;
    contents: string;
}

export interface FileChangesDeletions {
    path: string;
}

export interface FileChanges {
    additions?: FileChangesAdditions[];
    deletions?: FileChangesDeletions[];
}

export interface CommitMessage {
    headline: string;
    body?: string;
}

export interface CreateCommitOnBranchParams {
    branchName: string;
    repoName: string;
    ownerName: string;
    expectedHeadOid: string;
    fileChanges: FileChanges;
    commitMessage: CommitMessage;
}

export interface CreateCommitOnBranchResponse {
    createCommitOnBranch: {
        clientMutationId: string | null;
        commit: {
            url: string;
        };
        ref: Ref;
    };
}

export interface CreatePullRequestParams {
    toBranchName: string;
    fromBranchName: string;
    repositoryId: string;
    title: string;
}

export interface CreatePullRequestResponse {
    createPullRequest: {
        clientMutationId: string | null;
        pullRequest: {
            id: string;
        };
    };
}

export interface MergePullRequestParams {
    pullRequestId: string;
}

export interface MergePullRequestResponse {
    mergePullRequest: {
        clientMutationId: string | null;
    };
}