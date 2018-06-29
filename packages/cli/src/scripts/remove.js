import ControllerFor from '../models/local/ControllerFor';

export default function remove({ contracts, packageFile = undefined }) {
  if (contracts.length === 0) throw new Error('At least one contract name must be provided to remove.')

  const controller = ControllerFor(packageFile)
  contracts.forEach(alias => controller.remove(alias))
  controller.writePackage()
}
