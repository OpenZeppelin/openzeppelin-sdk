import { Loggy, LogStatus } from 'zos-lib';

import LocalController from '../models/local/LocalController';
import { AddParams } from './interfaces';

export default function add({
  contractsData,
  packageFile,
}: AddParams): void | never {
  if (contractsData.length === 0)
    throw new Error('At least one contract name must be provided to add.');
  contractsData = contractsData.map(data =>
    typeof data === 'string' ? { name: data, alias: data } : data,
  );

  const controller = new LocalController(packageFile);
  contractsData.forEach(({ name, alias }) => {
    controller.checkCanAdd(name);
    controller.add(alias || name, name);
  });

  Loggy.add(
    `${__filename}#add`,
    'add-contracts',
    `All contracts have been successfully added to the project.`,
    LogStatus.NonSpinnable,
  );
  controller.writePackage();
}
