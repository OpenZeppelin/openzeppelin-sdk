import { Loggy } from 'zos-lib';

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

  if (contractsData.length > 1) {
    Loggy.noSpin(
      __filename,
      'add-contracts',
      'All the selected contracts have been added to the project',
    );
  }
  controller.writePackage();
}
