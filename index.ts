import fs from 'fs';
import path from 'path';
import { Octokit } from '@octokit/core';

const convertToURLStyleString = ( str: string ): string => {
    const lowerCaseStr = str.toLowerCase();
    const strParts = lowerCaseStr.split( ' ' );

    return strParts.join( '-' );
};

const octokit = new Octokit( { auth: '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' } );

const getAllFiles = (
    folderPath: string
    , folderName: string
): Map<string, string[]> => {
    const directoriesFilesMap: Map<string, string[]> = new Map();

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

                    directoryName = convertToURLStyleString( directoryName );

                    if ( !directoriesFilesMap.has( directoryName ) ) {
                        directoriesFilesMap.set( directoryName, [] );
                    }

                    directoriesFilesMap.get( directoryName )?.push( entryPath );
                }
            } else if ( entry.isDirectory() ) {
                traverseDirectory( entryPath );
            }
        }
    };

    traverseDirectory( folderPath );
    return directoriesFilesMap;
};

const folderName = 'SecondBrain';
const folderPath = `/Users/chinhle/Documents/Learning/${ folderName }`;
const filesInFolder = getAllFiles( folderPath, folderName );

const getRepo = async () => {
    const response = await octokit.graphql( `
	query {
		repository(owner: "dangchinh25", name: "second-brain") {
			createdAt
			id
		}
	}
  ` );

    console.log( response );
};

const createBranch = async () => {
    const response = await octokit.graphql( `
		mutation {
			createRef(input: {
				name: "refs/heads/test_branch"
				oid: "52ad7efdb1471defd91bee68198b0d9be2da2e21"
				repositoryId: "R_kgDOJ22RMQ"
			}) {
				clientMutationId
			}
		}
	` );

    console.log( response );
};

/*
 * Call getRepo to get Repo Id
 * Fetch the most recent commit of the default branch to get the latest hash
 * Call create branch to create a new branch that is up to date with the default branch
 * Commit?
 */

// getRepo();
createBranch();
