import ControllerFor from '../models/local/ControllerFor';

export default function add({ contractsData, packageFile = undefined }) {
  if (contractsData.length === 0) throw new Error('At least one contract name must be provided to add.')

  const controller = ControllerFor(packageFile)
  contractsData.forEach(({ name, alias }) => {
    controller.validateImplementation(name)
    controller.add(alias || name, name)
  })
  controller.writePackage()
}
