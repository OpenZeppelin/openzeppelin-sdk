import ZosPackageFile from '../files/ZosPackageFile'
import LocalController from './LocalController';

export default function(packageFile = new ZosPackageFile()) {
  if(!packageFile.exists()) throw Error(`ZeppelinOS file ${packageFile.fileName} not found. Run 'zos init' first to initialize the project.`)

  return new LocalController(packageFile)
}
