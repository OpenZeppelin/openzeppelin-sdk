'use strict';

import push from './push'
import addImplementation from '../scripts/add-implementation'
import addAllImplementations from '../scripts/add-all-implementations'

const signature = 'add [contractNames...]'
const description = 'add contract implementations to your project. Provide a list of whitespace-separated contract names'
module.exports = {
  signature, description,
  register: function(program) {
    program
      .command(signature, {noHelp: true})
      .usage('[contractName1[:contractAlias1] ... contractNameN[:contractAliasN]] [options]')
      .description(description)
      .option('--all', 'add all contracts in your build directory')
      .option('--push <network>', 'push changes to the specified network after adding')
      .option('-f, --from <from>', 'specify the transaction sender address for --push')
      .action(function (contractNames, options) {
        if(options.all) addAllImplementations({})
        else {
          const contractsData = contractNames.map(rawData => {
            let [ name, alias ] = rawData.split(':')
            return { name, alias: (alias || name) }
          })
          addImplementation({ contractsData })
        }
        if(options.push) push.action({ network: options.push, from: options.from })
      })
  }
}
