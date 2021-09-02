import { convert } from './index';
import path from 'path';

const basePath = path.join(__dirname, '__tests__/multipleFiles/schemas');

async function main() {
  await convert({
    schemaFile: `${basePath}/*.ts`
  });
}

main();
