import stdout from '../utils/stdout';
import LocalController from '../models/local/LocalController';
import { BumpParams } from './interfaces';

export default async function bumpVersion({ version, packageFile }: BumpParams): Promise<void | never> {
  if (!version) throw Error('A version name must be provided to initialize a new version.');
  const controller = new LocalController(packageFile);
  controller.bumpVersion(version);
  controller.writePackage();
  stdout(version);
}
