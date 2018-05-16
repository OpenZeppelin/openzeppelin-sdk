import ControllerFor from "../models/local/ControllerFor";

export default function addImplementation({ contractsData, packageFileName = undefined }) {
  if (contractsData.length === 0) throw new Error('At least one contract name must be provided to add a new implementation.')

  const appController = ControllerFor(packageFileName)
  contractsData.forEach(({ name, alias }) => {
    appController.validateImplementation(name)
    appController.addImplementation(alias || name, name)
  })
  appController.writePackage()
}
