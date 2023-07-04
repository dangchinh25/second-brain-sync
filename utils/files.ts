import { readFile } from 'fs/promises';

export const getFileAsString = async ( filePath: string ): Promise<string> => {
    const result = await readFile( filePath, 'utf8' );

    return result;
};