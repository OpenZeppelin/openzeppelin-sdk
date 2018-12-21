import ControllerFor from '../models/local/ControllerFor';
import { RemoveParams } from './interfaces';

export default function remove({ contracts, packageFile }: RemoveParams): void | never {
  if (contracts.length === 0) throw new Error('At least one contract name must be provided to remove.');

  const controller = ControllerFor(packageFile);
  contracts.forEach((alias) => controller.remove(alias));
  controller.writePackage();
}
