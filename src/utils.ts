import fs from 'fs';
import { promisify } from 'util';
import glob from 'glob';

/**
 * Applies the mapper over each element in the list.
 * If the mapper returns undefined it will not show up in the result
 *
 * @param list - array to filter + map
 * @param mapper - mapper func to apply to map
 */
export function filterMap<T, K>(list: T[], mapper: (t: T) => K | undefined): K[] {
  return list.reduce((res: K[], val: T) => {
    const mappedVal = mapper(val);
    if (mappedVal !== undefined) {
      res.push(mappedVal);
    }
    return res;
  }, []);
}

/**
 * Escape value so that it can be go into single quoted string literal.
 * @param value
 */
export function toStringLiteral(value: string): string {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

/**
 * Promise-based glob version
 */
export const globAsync = promisify(glob);

/**
 * Delete all files by pattern
 */
export const removeFilesByPattern = async (pattern: string): Promise<void> => {
  const files = await globAsync(pattern);

  await Promise.all(files.map(file => fs.promises.unlink(file)));

  return;
};
