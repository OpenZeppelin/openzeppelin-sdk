import fs from 'fs-extra';
import path from 'path';

import { transpileContracts, OutputFile } from '@openzeppelin/upgradeability-transpiler';

export async function transpileAndSave(contracts: string[], buildDir: string): Promise<OutputFile[]> {
  const artifacts = fs.readdirSync(buildDir).map(file => {
    return JSON.parse(fs.readFileSync(path.join(buildDir, file)).toString());
  });

  const output = transpileContracts(contracts, artifacts);

  for (const file of output) {
    await fs.ensureDir(path.dirname(file.path));
    fs.writeFileSync(file.path, file.source);
  }

  return output;
}
