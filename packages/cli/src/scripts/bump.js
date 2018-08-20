import stdout from '../utils/stdout';
import ControllerFor from '../models/local/ControllerFor'

export default async function bumpVersion({ version, packageFile = undefined }) {
  const controller = ControllerFor(packageFile)
  if (!version) throw Error('A version name must be provided to initialize a new version.')
  controller.bumpVersion(version)
  controller.writePackage()
  stdout(version)
}
