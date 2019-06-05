import { Loggy, LogStatus } from 'zos-lib';

import LocalController from '../models/local/LocalController';
import { RemoveParams } from './interfaces';

export default function remove({
  contracts,
  packageFile,
}: RemoveParams): void | never {
  if (contracts.length === 0)
    throw new Error('At least one contract name must be provided to remove.');

  const controller = new LocalController(packageFile);
  contracts.forEach(alias => controller.remove(alias));
  Loggy.add(
    `${__filename}#remove`,
    'remove-contracts',
    `All specified contracts have been successfully removed from the project.`,
    LogStatus.NonSpinnable,
  );
  controller.writePackage();
}
