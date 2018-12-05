import Contracts from "./Contracts";
import { parseJson } from "../utils/FileSystem";
import _ from 'lodash';

export function getBuildArtifacts() {
  return new BuildArtifacts(Contracts.listBuildArtifacts())
}

class BuildArtifacts {
  constructor(artifactsPaths) {
    this.sourcesToArtifacts = {};
    artifactsPaths.forEach(path => {
      const artifact = parseJson(path)
      const sourcePath = this.getSourcePathFromArtifact(artifact)
      this.registerArtifactForSourcePath(sourcePath, artifact)
    })
  }

  listSourcePaths() {
    return _.keys(this.sourcesToArtifacts)
  }

  listArtifacts() {
    return _.flatten(_.values(this.sourcesToArtifacts));
  }

  getArtifactsFromSourcePath(sourcePath) {
    return this.sourcesToArtifacts[sourcePath];
  }

  getSourcePathFromArtifact(artifact) {
    return artifact.ast.absolutePath;
  }

  registerArtifactForSourcePath(sourcePath, artifact) {
    if (!this.sourcesToArtifacts[sourcePath]) {
      this.sourcesToArtifacts[sourcePath] = []
    }
    this.sourcesToArtifacts[sourcePath].push(artifact)
  }
}