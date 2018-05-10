import AppController from "../models/AppController";

export default function addImplementation({ contractName, contractAlias, packageFileName = undefined }) {
  if (contractName === undefined) throw new Error('Must provide a contract name')
  if (!contractAlias) contractAlias = contractName

  const appController = new AppController(packageFileName)
  appController.validateImplementation(contractName)
  appController.addImplementation(contractAlias, contractName)
  appController.writePackage()
}
