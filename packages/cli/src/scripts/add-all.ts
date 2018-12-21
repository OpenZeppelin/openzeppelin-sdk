import ControllerFor from '../models/local/ControllerFor';
import ZosPackageFile from '../models/files/ZosPackageFile';

export default function addAll({ packageFile }: { packageFile?: ZosPackageFile }): void {
  const controller = ControllerFor(packageFile);
  controller.addAll();
  controller.writePackage();
}
