import LocalController from '../models/local/LocalController';
import { BumpParams } from './interfaces';

export default async function bumpVersion({ version, projectFile }: BumpParams): Promise<void | never> {
  if (!version) throw Error('A version name must be provided to initialize a new version.');
  const controller = new LocalController(projectFile);
  controller.bumpVersion(version);
  controller.writePackage();
}
