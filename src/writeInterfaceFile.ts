import path from 'path';
import { writeFileSync, mkdirSync, existsSync } from 'fs';

import { Settings, GenerateTypeFile } from './types';

export async function writeInterfaceFiles(settings: Settings, exportFiles: GenerateTypeFile[]) {
  const writeDirCache = {};

  return await Promise.all([exportFiles.map(file => writeInterfaceFile(settings, file, writeDirCache))]);
}
/**
 * Write interface file
 *
 * @param settings Settings
 * @param exportFile
 * @param dirCache
 * @returns The written file name
 */
export async function writeInterfaceFile(
  settings: Settings,
  exportFile: GenerateTypeFile,
  dirCache: Record<string, boolean>
): Promise<void> {
  let typeImports = '';

  const customTypeLocationDict: { [id: string]: string[] } = {};
  // const types = exportFile.externalTypes
  //   .map(x => x.customTypes)
  //   .flat()
  //   .filter((value, index, self) => {
  //     // Remove Duplicates
  //     return self.indexOf(value) === index;
  //   });

  const externalTypes = exportFile.internalTypes.filter(f => f.exportFilePath !== exportFile.exportFilePath);

  for (const type of externalTypes) {
    const dir = path.dirname(type.exportFilePath);

    if (!customTypeLocationDict[dir]) {
      customTypeLocationDict[dir] = [];
    }

    // if (!customTypeLocationDict[dir].includes(type)) {
    //   customTypeLocationDict[dir].push(type);
    // }
  }

  // for (const externalCustomType of types) {
  // if (settings.indexAllToRoot) {
  //   if (!customTypeLocationDict[settings.typeOutputDirectory]) {
  //     customTypeLocationDict[settings.typeOutputDirectory] = [];
  //   }
  //
  //   if (!customTypeLocationDict[settings.typeOutputDirectory].includes(externalCustomType)) {
  //     customTypeLocationDict[settings.typeOutputDirectory].push(externalCustomType);
  //   }
  // } else {
  // for (const generatedInternalType of generatedTypes
  //   .filter(f => f.typeFileName !== typeFileName)
  //   .map(x => x.internalTypes)
  //   .flat()
  //   .filter((value, index, self) => {
  //     return value.interfaceOrTypeName === externalCustomType && self.indexOf(value) === index;
  //   })) {
  //   if (generatedInternalType && generatedInternalType.location) {
  //     if (!customTypeLocationDict[path.dirname(generatedInternalType.location)]) {
  //       customTypeLocationDict[path.dirname(generatedInternalType.location)] = [];
  //     }
  //
  //     if (!customTypeLocationDict[path.dirname(generatedInternalType.location)].includes(externalCustomType)) {
  //       customTypeLocationDict[path.dirname(generatedInternalType.location)].push(externalCustomType);
  //     }
  //   }
  // }
  // }

  for (const customTypeLocation in customTypeLocationDict) {
    let relativePath = path.relative(exportFile.exportFilePath, customTypeLocation);
    relativePath = relativePath ? `${relativePath}` : '.';
    relativePath = relativePath.includes('..') || relativePath == '.' ? relativePath : `./${relativePath}`;
    typeImports += `import { ${customTypeLocationDict[customTypeLocation].join(', ')} } from '${relativePath.replace(
      /\\/g,
      '/'
    )}';\n`;
  }

  if (typeImports) {
    typeImports += `\n`;
  }

  // const fileContent = `${settings.fileHeader}\n\n${typeImports}${exportFile.exportFileContent}`;

  ensurePathExists(exportFile.exportFilePath, dirCache);
  // writeFileSync(exportFile.exportFilePath, fileContent);
}

function ensurePathExists(filePath: string, cache: Record<string, boolean>) {
  const dirPath = path.dirname(filePath);

  if (cache[dirPath]) return;

  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }

  cache[dirPath] = true;
}
