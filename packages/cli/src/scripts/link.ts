import stdout from '../utils/stdout';
import ControllerFor from '../models/local/ControllerFor';
import { LinkParams } from './interfaces';

export default async function link({ dependencies = [], installDependencies = false, packageFile }: LinkParams) {
  if (!dependencies.length) throw Error('At least one dependency name and version to be linked must be provided.');
  const controller = ControllerFor(packageFile);

  await controller.linkDependencies(dependencies, installDependencies);
  controller.writePackage();
  dependencies.forEach((depNameVersion) => stdout(depNameVersion));
}
