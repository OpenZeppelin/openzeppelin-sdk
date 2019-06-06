import path from 'path';
import { Loggy, SpinnerAction } from 'zos-lib';

import LocalController from '../models/local/LocalController';
import { AddParams } from './interfaces';

const fileName = path.basename(__filename);

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

  const message =
    contractsData.length > 1
      ? `All contracts have been successfully added to the project. Try running 'zos create' to deploy them!`
      : `Contract has been successfully added to the project. Try running 'zos create' to deploy it!`;

  Loggy.add(`${fileName}#add`, 'add-contracts', message, {
    spinnerAction: SpinnerAction.NonSpinnable,
  });
  controller.writePackage();
}
