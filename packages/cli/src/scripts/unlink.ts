import stdout from '../utils/stdout';
import ControllerFor from '../models/local/ControllerFor';
import { UnlinkParams } from './interfaces';

export default async function unlink({ dependencies = [], packageFile }: UnlinkParams): Promise<void | never> {
  if (!dependencies.length) throw Error('At least one dependency name must be provided.');
  const controller = ControllerFor(packageFile);

  controller.unlinkDependencies(dependencies);
  controller.writePackage();
  dependencies.forEach((dependencyName) => stdout(dependencyName));
}
