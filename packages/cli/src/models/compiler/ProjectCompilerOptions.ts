import { CompilerOptions } from './solidity/SolidityContractsCompiler';

export interface TypechainOptions {
  enabled: boolean;
  outDir?: string;
  target?: string;
}

export interface ProjectCompilerOptions extends CompilerOptions {
  /** Either truffle or openzeppelin */
  manager?: string;
  /** Folder from which root contracts will be loaded */
  inputDir?: string;
  /** Output dir for compilation json artifacts */
  outputDir?: string;
  /** Imports like 'contracts/foo/bar.sol' will be relative to this path */
  workingDir?: string;
  /** Compile even if there were no changes to the sources */
  force?: boolean;
  /** Options for generating typechain wrappers for contracts */
  typechain?: TypechainOptions;
}
