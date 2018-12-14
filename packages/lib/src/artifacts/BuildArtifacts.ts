import _ from 'lodash';
import Contracts from './Contracts';
import { parseJson } from '../utils/FileSystem';

export function getBuildArtifacts(): BuildArtifacts {
  return new BuildArtifacts(Contracts.listBuildArtifacts());
}

// TS-TODO: can artifacts by typed?
type Artifact = any;

interface SourcePathMapping {
  [sourcePath: string]: Artifact[];
}

// TS-TODO: Review which members of this class could be private.
export class BuildArtifacts {

  private sourcesToArtifacts: SourcePathMapping;

  constructor(artifactsPaths: string[]) {

    this.sourcesToArtifacts = {};

    artifactsPaths.forEach((path) => {
      const artifact: any = parseJson(path);
      const sourcePath: string = this.getSourcePathFromArtifact(artifact);
      this.registerArtifactForSourcePath(sourcePath, artifact);
    });

  }

  public listSourcePaths(): string[] {
    return _.keys(this.sourcesToArtifacts);
  }

  public listArtifacts(): Artifact[] {
    return _.flatten(_.values(this.sourcesToArtifacts));
  }

  public getArtifactsFromSourcePath(sourcePath: string): Artifact[] {
    return this.sourcesToArtifacts[sourcePath];
  }

  public getSourcePathFromArtifact(artifact: Artifact): string {
    return artifact.ast.absolutePath;
  }

  public registerArtifactForSourcePath(sourcePath: string, artifact: Artifact): void {
    if (!this.sourcesToArtifacts[sourcePath]) this.sourcesToArtifacts[sourcePath] = [];
    this.sourcesToArtifacts[sourcePath].push(artifact);
  }
}
