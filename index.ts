import fs from 'fs'
import path from 'path'

function getAllFiles(folderPath: string): string[] {
    const files: string[] = [];
    function traverseDirectory(directory: string) {
        const entries = fs.readdirSync(directory, { withFileTypes: true });

        for (const entry of entries) {
            const entryPath = path.join(directory, entry.name);
    
            if (entry.isFile()) {
            files.push(entryPath);
            } else if (entry.isDirectory()) {
            traverseDirectory(entryPath);
            }
        }
    }

    traverseDirectory(folderPath);
    return files;
}

const folderPath = '/Users/chinhle/Documents/Learning/SecondBrain'
const filesInFolder = getAllFiles(folderPath)

console.log(filesInFolder)