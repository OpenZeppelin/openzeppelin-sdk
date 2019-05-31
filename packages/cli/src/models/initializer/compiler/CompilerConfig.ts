// import { CompilerOptions } from "../../compiler/solidity/SolidityContractsCompiler";
// // import { existsSync } from 'fs';
// import { resolve } from 'path';
// import ZosPackageFile from "../../files/ZosPackageFile";
// // import { readJSONSync } from 'fs-extra';

// // export interface ProjectCompilerOptions extends CompilerOptions {
// //   inputDir: string;
// //   outputDir: string;
// // }

// export function loadConfig(packageFile = new ZosPackageFile()) : ProjectCompilerOptions {
//   // const co

//   // Awkward destructuring due to https://github.com/microsoft/TypeScript/issues/26235
//   const config = readJSONSync(configPath) || {};
//   const { solcVersion: version, contractsDir: inputDir, artifactsDir: outputDir } = config;
//   const compilerSettings = config && config.compilerSettings || {};
//   const { evmVersion, optimizer } = compilerSettings;

//   return {
//     inputDir,
//     outputDir,
//     evmVersion,
//     version,
//     optimizer
//   }
// }
