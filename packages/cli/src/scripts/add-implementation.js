import AppController from "../models/AppController";

export default function addImplementation({ contractName, contractAlias, packageFileName = null }) {
  if (contractName === undefined) throw new Error('Must provide a contract name')
  if (contractAlias === undefined) throw new Error('Must provide an alias')

  const appController = new AppController(packageFileName)
  appController.addImplementation(contractAlias, contractName)
  appController.writePackage()
}
