import AppController from "../models/AppController";

export default function addImplementation({ contractName, contractAlias = contractName, packageFileName = undefined }) {
  if (!contractName) throw Error('A contract name must be provided to add a new implementation.')

  const appController = new AppController(packageFileName)
  appController.validateImplementation(contractName)
  appController.addImplementation(contractAlias, contractName)
  appController.writePackage()
}
