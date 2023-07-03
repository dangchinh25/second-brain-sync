import fs from "fs";
import path from "path";

function getAllFiles(
  folderPath: string,
  folderName: string
): Map<string, string[]> {
  const directoriesFilesMap: Map<string, string[]> = new Map();
  function traverseDirectory(directory: string) {
    const entries = fs.readdirSync(directory, { withFileTypes: true });

    for (const entry of entries) {
      const entryPath = path.join(directory, entry.name);

      if (entry.isFile()) {
        const [, fileExtension] = entry.name.split(".");

        if (fileExtension === "md") {
          const directoryPath = path.dirname(entryPath);
          const directoryPathParts = directoryPath.split("/");
          let directoryName = directoryPathParts[directoryPathParts.length - 1];

          if (directoryName === folderName) {
            const entryPathParts = entryPath.split("/");
            const [entryFilename] =
              entryPathParts[entryPathParts.length - 1].split(".");

            directoryName = entryFilename;
          }

          if (!directoriesFilesMap.has(directoryName)) {
            directoriesFilesMap.set(directoryName, []);
          }

          directoriesFilesMap.get(directoryName)?.push(entryPath);
        }
      } else if (entry.isDirectory()) {
        traverseDirectory(entryPath);
      }
    }
  }

  traverseDirectory(folderPath);
  return directoriesFilesMap;
}

const folderName = "SecondBrain";
const folderPath = `/Users/chinhle/Documents/Learning/${folderName}`;
const filesInFolder = getAllFiles(folderPath, folderName);

console.log(filesInFolder);
