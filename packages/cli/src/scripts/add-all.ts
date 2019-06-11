import path from 'path';
import { Loggy, SpinnerAction } from 'zos-lib';
import LocalController from '../models/local/LocalController';
import ZosPackageFile from '../models/files/ZosPackageFile';

const fileName = path.basename(__filename);

export default function addAll({
  packageFile,
}: {
  packageFile?: ZosPackageFile;
}): void {
  const controller = new LocalController(packageFile);
  controller.addAll();
  Loggy.add(
    `${fileName}#add`,
    'add-contracts',
    'All local contracts have been added to the project.',
    {
      spinnerAction: SpinnerAction.NonSpinnable,
    },
  );
  controller.writePackage();
}
