import LocalController from '../models/local/LocalController';
import { RemoveParams } from './interfaces';

export default function remove({ contractNames, packageFile }: RemoveParams): void | never {
  if (contractNames.length === 0) throw new Error('At least one contract name must be provided to remove.');

  const controller = new LocalController(packageFile);
  contractNames.forEach((alias) => controller.remove(alias));
  controller.writePackage();
}
