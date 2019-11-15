import { mkdirpSync } from 'fs-extra';
import path from 'path';
import { tsGenerator } from 'ts-generator';
import { TypeChain as typeChain } from 'typechain/dist/TypeChain';

export default async function typechain(files: string, outDir: string, target: string): Promise<void> {
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
