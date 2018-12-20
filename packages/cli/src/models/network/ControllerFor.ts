import ControllerFor from '../local/ControllerFor';
import ZosPackageFile from '../files/ZosPackageFile';
import ZosNetworkFile from '../files/ZosNetworkFile';
import NetworkController from './NetworkController';

export default function(network: string, txParams: any, networkFile?: ZosNetworkFile): NetworkController {
  if(!networkFile) {
    const packageFile = new ZosPackageFile();
    networkFile = packageFile.networkFile(network);
  }

  const controller = ControllerFor(networkFile.packageFile);
  return controller.onNetwork(network, txParams, networkFile);
}
