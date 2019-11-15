import { mkdirpSync } from 'fs-extra';
import path from 'path';

export default async function typechain(files: string, outDir: string, target: string): Promise<void> {
  checkModule();

  /* eslint-disable @typescript-eslint/no-var-requires */
  const { tsGenerator } = require('ts-generator');
  const { TypeChain: typeChain } = require('typechain/dist/TypeChain');
  /* eslint-enable @typescript-eslint/no-var-requires */

  const cwd = process.cwd();
  mkdirpSync(outDir);

  // Hack required until https://github.com/ethereum-ts/TypeChain/pull/186 is merged
  const relativeOutDir = path.relative(cwd, outDir);

  return tsGenerator(
    { cwd },
    new typeChain({
      cwd,
      rawConfig: {
        files,
        outDir: relativeOutDir,
        target,
      },
    }),
  );
}

function checkModule() {
  try {
    require.resolve('typechain');
  } catch {
    throw new Error("Could not find module 'typechain'. Please install it to support typescript contract wrappers.");
  }
}
