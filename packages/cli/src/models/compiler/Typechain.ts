import { mkdirpSync } from 'fs-extra';
import path from 'path';
import { tsGenerator } from 'ts-generator';
import { TypeChain as typeChain } from 'typechain/dist/TypeChain';

export default async function typechain(files: string, outDir: string, target: string): Promise<void> {
  const cwd = process.cwd();
  mkdirpSync(outDir);

  return tsGenerator(
    { cwd },
    new typeChain({
      cwd,
      rawConfig: {
        files,
        outDir,
        target,
      },
    }),
  );
}
