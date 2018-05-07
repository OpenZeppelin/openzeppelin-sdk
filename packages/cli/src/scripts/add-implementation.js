import AppController from "../models/AppController";

export default function addImplementation({ contractName, contractAlias, packageFileName = null }) {
  if (contractName === undefined) throw new Error('Must provide a contract name')
  if (!contractAlias) contractAlias = contractName

  const appController = new AppController(packageFileName)
  appController.addImplementation(contractAlias, contractName)
  appController.writePackage()
}
