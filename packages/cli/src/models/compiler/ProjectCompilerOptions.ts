import { CompilerOptions } from './solidity/SolidityContractsCompiler';

export interface TypechainOptions {
  enabled: boolean;
  outDir?: string;
  target?: string;
}

export interface ProjectCompilerOptions extends CompilerOptions {
  manager?: string;
  inputDir?: string;
  outputDir?: string;
  force?: boolean;
  typechain?: TypechainOptions;
}
