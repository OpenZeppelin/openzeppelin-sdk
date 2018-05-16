import LocalAppController from './LocalAppController';
import LocalLibController from './LocalLibController';
import { FileSystem as fs } from 'zos-lib';

export default function(packageFileName) {
  if (!fs.exists(packageFileName)) {
    throw Error(`Package file ${packageFileName} not found. Run 'zos init' first to initialize the project.`);
  }
  
  const packageData = fs.parseJson(packageFileName);
  if (packageData.lib) {
    return new LocalLibController(packageFileName);
  } else {
    return new LocalAppController(packageFileName);
  }
}