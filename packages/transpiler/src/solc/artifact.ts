import { SourceUnit } from './ast-node';

export interface Artifact {
  contractName: string;
  fileName: string;
  ast: SourceUnit;
  source: string;
  sourcePath: string;
}
