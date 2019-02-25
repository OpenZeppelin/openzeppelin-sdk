import ControllerFor from '../models/local/ControllerFor';
import ZosPackageFile from '../models/files/ZosPackageFile';
import { AddParams } from './interfaces';

export default function add({ contractsData, packageFile }: AddParams): void | never {
  if (contractsData.length === 0) throw new Error('At least one contract name must be provided to add.');
  contractsData = contractsData.map((data) => typeof(data) === 'string' ? { name: data, alias: data } : data);

  const controller = ControllerFor(packageFile);
  contractsData.forEach(({ name, alias }) => {
    controller.checkCanAdd(name);
    controller.add(alias || name, name);
  });
  controller.writePackage();
}
