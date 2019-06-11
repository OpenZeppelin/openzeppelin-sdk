import { Loggy } from 'zos-lib';
import LocalController from '../models/local/LocalController';
import ZosPackageFile from '../models/files/ZosPackageFile';

export default function addAll({
  packageFile,
}: {
  packageFile?: ZosPackageFile;
}): void {
  const controller = new LocalController(packageFile);
  controller.addAll();
  Loggy.noSpin(
    __filename,
    'add',
    'add-contracts',
    'All local contracts have been added to the project.',
  );
  controller.writePackage();
}
