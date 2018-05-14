import { ContractsProvider, FileSystem as fs } from 'zos-lib'
import Stdlib from '../models/stdlib/Stdlib';

ContractsProvider.getFromLib = contractName => {
  const data = require(`zos-lib/build/contracts/${contractName}.json`);
  return ContractsProvider.getByJSONData(data)
}

ContractsProvider.getFromKernel = contractName => {
  const data = require(`zos-kernel/build/contracts/${contractName}.json`);
  return ContractsProvider.getByJSONData(data)
}

ContractsProvider.getFromStdlib = (stdlibName, contractAlias) => {
  const implementationName = new Stdlib(stdlibName).contract(contractAlias)
  if (!implementationName) throw Error(`Could not find contract ${contractAlias} in stdlib package file`)
  const contractData = fs.parseJson(`node_modules/${stdlibName}/build/contracts/${implementationName}.json`)
  return ContractsProvider.getByJSONData(contractData)
}

export default ContractsProvider
