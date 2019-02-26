import stdout from '../utils/stdout';
import LocalController from '../models/local/LocalController';
import { UnlinkParams } from './interfaces';

export default async function unlink({ dependencies = [], packageFile }: UnlinkParams): Promise<void | never> {
  if (!dependencies.length) throw Error('At least one dependency name must be provided.');
  const controller = new LocalController(packageFile);

  controller.unlinkDependencies(dependencies);
  controller.writePackage();
}
