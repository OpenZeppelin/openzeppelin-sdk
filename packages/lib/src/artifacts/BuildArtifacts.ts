import fs from 'fs-extra';
import { keys, flatten, values } from 'lodash';

import Contracts from './Contracts';

export function getBuildArtifacts(path?: string): BuildArtifacts {
  return new BuildArtifacts(Contracts.listBuildArtifacts(path));
}

export interface Artifact {
  abi: any[];
  ast: any;
  bytecode: string;
  compiler: any;
  contractName: string;
  deployedBytecode: string;
  deployedSourceMap: string;
  fileName: string;
  legacyAST?: any;
  networks: any;
  schemaVersion: string;
  source: string;
  sourceMap: string;
  sourcePath: string;
  updatedAt: string;
}

interface SourcePathMapping {
  [sourcePath: string]: Artifact[];
}

export class BuildArtifacts {
  private sourcesToArtifacts: SourcePathMapping;

  public constructor(artifactsPaths: string[]) {
    this.sourcesToArtifacts = {};

    artifactsPaths.forEach(path => {
      const artifact: Artifact = fs.readJsonSync(path);
      const sourcePath: string = this.getSourcePathFromArtifact(artifact);
      this.registerArtifactForSourcePath(sourcePath, artifact);
    });
  }

  public listSourcePaths(): string[] {
    return keys(this.sourcesToArtifacts);
  }

  public listArtifacts(): Artifact[] {
    return flatten(values(this.sourcesToArtifacts));
  }

  public getArtifactByName(name: string): Artifact | undefined {
    return this.listArtifacts().find(a => a.contractName === name);
  }

  public getArtifactsFromSourcePath(sourcePath: string): Artifact[] {
    return this.sourcesToArtifacts[sourcePath] || [];
  }

  public getSourcePathFromArtifact(artifact: Artifact): string {
    return artifact.ast.absolutePath;
  }

  private registerArtifactForSourcePath(sourcePath: string, artifact: Artifact): void {
    if (!this.sourcesToArtifacts[sourcePath]) this.sourcesToArtifacts[sourcePath] = [];
    this.sourcesToArtifacts[sourcePath].push(artifact);
  }
}
