declare module 'solc-wrapper' {
  export default function(binary: any): Compiler;

  export interface Compiler {
    version(): string;
    loadRemoteVersion(version: string, cb: (error: any, compiler: Compiler) => void);
    compile(input: string, readCb: (dependency: any) => void): string;
    setupMethods(input: any): Compiler;
  }

  export interface CompilerOptimizerOptions {
    enabled: boolean;
    runs?: number;
  }

  export interface CompilerSettings {
    evmVersion: string;
    outputSelection: any;
    optimizer: CompilerOptimizerOptions;
    remappings?: string[];
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
          abi: {
            constant: boolean;
            inputs: any[];
            name: string;
            outputs: any[];
            payable: string;
          }[];
        };
      };
    };
    sources: {
      [fileName: string]: {
        ast: any;
        legacyAST: any;
      };
    };
    errors: any[];
  }

  export interface CompilerVersionsInfo {
    builds: {
      path: string;
      version: string;
      build: string;
      longVersion: string;
      keccak256: string;
      urls: string[];
    }[];
    releases: {
      [version: string]: string;
    };
    latestRelease: string;
  }
}
