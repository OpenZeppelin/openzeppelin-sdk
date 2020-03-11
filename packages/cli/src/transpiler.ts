import { transpileContracts } from '@openzeppelin/upgradeability-transpiler';
import { CompiledContract } from './models/compiler/solidity/SolidityContractsCompiler';
import { Contracts } from '@openzeppelin/upgrades';
import fs from 'fs-extra';

export async function transpileAndSave(contracts: string[]): Promise<void> {
  const artifacts: CompiledContract[] = await Promise.all(Contracts.listBuildArtifacts().map(p => fs.readJson(p)));
  const output = transpileContracts(contracts, artifacts, Contracts.getLocalContractsDir());

  for (const file of output) {
    await fs.outputFile(file.path, file.source);
  }
}
