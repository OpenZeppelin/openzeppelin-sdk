import LocalController from '../models/local/LocalController';
import ZosPackageFile from '../models/files/ZosPackageFile';

export default function addAll({
  packageFile,
}: {
  packageFile?: ZosPackageFile;
}): void {
  const controller = new LocalController(packageFile);
  controller.addAll();
  controller.writePackage();
}
