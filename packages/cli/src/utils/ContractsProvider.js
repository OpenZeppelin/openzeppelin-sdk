import { ContractsProvider } from 'zos-lib'

ContractsProvider.getFromLib = contractName => {
  const data = require(`zos-lib/build/contracts/${contractName}.json`);
  return ContractsProvider.getByJSONData(data)
}

ContractsProvider.getFromKernel = contractName => {
  const data = require(`zos-kernel/build/contracts/${contractName}.json`);
  return ContractsProvider.getByJSONData(data)
}

export default ContractsProvider
