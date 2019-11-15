import LocalController from '../models/local/LocalController';
import ProjectFile from '../models/files/ProjectFile';
import { InitParams } from './interfaces';

export default async function init({
  name,
  version,
  publish = false,
  dependencies = [],
  installDependencies = false,
  force = false,
  projectFile = new ProjectFile(),
  typechainEnabled = false,
  typechainOutdir = null,
  typechainTarget = null,
}: InitParams): Promise<void | never> {
  const controller = new LocalController(projectFile, true);
  controller.init(name, version, force, publish);

  const typechain = { enabled: typechainEnabled };
  if (typechainEnabled) Object.assign(typechain, { outDir: typechainOutdir, target: typechainTarget });
  controller.projectFile.setCompilerOptions({ typechain });

  if (dependencies.length !== 0) await controller.linkDependencies(dependencies, installDependencies);
  controller.writePackage();
}
