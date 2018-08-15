import ControllerFor from '../local/ControllerFor'
import ZosPackageFile from '../files/ZosPackageFile'

export default function(network, txParams, networkFile = undefined) {
  if(!networkFile) {
    const packageFile = new ZosPackageFile()
    networkFile = packageFile.networkFile(network)
  }

  const controller = ControllerFor(networkFile.packageFile);
  return controller.onNetwork(network, txParams, networkFile)
}
