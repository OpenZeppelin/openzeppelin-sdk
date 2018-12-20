declare module 'solc' {

  const version: Compiler['version'];
  const loadRemoteVersion: Compiler['loadRemoteVersion'];
  const compile: Compiler['compile'];

  export interface Compiler {
    version(): string;
    loadRemoteVersion(version: string, cb: (error: any, compiler: Compiler) => void);
    compile(input: string, readCb: (dependency: any) => void);
  }

  export interface CompilerOptimizerOptions {
    enabled: boolean;
  }

  export interface CompilerSettings {
    evmVersion: string;
    outputSelection: any;
    optimizer: CompilerOptimizerOptions;
  }

  export interface CompilerInput {
    language: string;
    settings: CompilerSettings;
    sources: { [filePath: string]: { content: string } };
  }

  export interface CompilerInfo {
    name: string;
    version: string;
    optimizer: CompilerOptimizerOptions;
    evmVersion: string;
  }

  export interface CompilerBytecodeOutput {
    linkReferences: any;
    object: string;
    opcodes: string;
    sourceMap: string;
  }

  export interface CompilerOutput {
    contracts: {
      [fileName: string]: {
        [contractName: string]: {
          evm: {
            bytecode: CompilerBytecodeOutput;
            deployedBytecode: CompilerBytecodeOutput;
          };
          abi: Array<{
            constant: boolean;
            inputs: any[];
            name: string;
            outputs: any[];
            payable: string;
          }>;
        }
      }
    };
    sources: {
      [fileName: string]: {
        ast: any;
        legacyAST: any;
      }
    };
    errors: any[];
  }

  export interface CompilerVersionsInfo {
    builds: Array<{
      path: string;
      version: string;
      build: string;
      longVersion: string;
      keccak256: string;
      urls: string[];
    }>;
    releases: {
      [version: string]: string
    };
    latestRelease: string;
  }
}
