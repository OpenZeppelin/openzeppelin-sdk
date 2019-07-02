import stdout from '../utils/stdout';
import LocalController from '../models/local/LocalController';
import { LinkParams } from './interfaces';

export default async function link({ dependencies = [], installDependencies = false, projectFile }: LinkParams) {
  if (!dependencies.length) throw Error('At least one dependency name and version to be linked must be provided.');
  const controller = new LocalController(projectFile);

  await controller.linkDependencies(dependencies, installDependencies);
  controller.writePackage();
}
