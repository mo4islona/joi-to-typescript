import { existsSync } from 'fs';
import { convert } from '../../index';
import { removeFilesByPattern } from '../../utils';
import path from 'path';

const basePath = path.join(__dirname, 'schemas');

describe('no schemas in directory', () => {
  beforeEach(async () => {
    await removeFilesByPattern(`${basePath}/*.type.ts`);
  });

  test('Throw and no index file', () => {
    expect(async () => {
      await convert({
        schemaFile: `${basePath}/*.ts`,
        exportFile: srcPath => `${srcPath}/index.ts`
      });
    }).rejects.toThrowError();

    expect(existsSync(`${basePath}/index.ts`)).toBeFalsy();
  });
});
