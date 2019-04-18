import LocalController from '../models/local/LocalController';
import { RemoveParams } from './interfaces';

export default function remove({ contracts, packageFile }: RemoveParams): void | never {
  if (contracts.length === 0) throw new Error('At least one contract name must be provided to remove.');

  const controller = new LocalController(packageFile);
  contracts.forEach((alias) => controller.remove(alias));
  controller.writePackage();
}
