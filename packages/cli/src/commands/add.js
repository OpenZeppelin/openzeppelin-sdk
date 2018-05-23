'use strict';

import push from './push'
import add from '../scripts/add'
import addAll from '../scripts/add-all'

const signature = 'add [contractNames...]'
const description = 'add contract to your project. Provide a list of whitespace-separated contract names'
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
        if(options.all) addAll({})
        else {
          const contractsData = contractNames.map(rawData => {
            let [ name, alias ] = rawData.split(':')
            return { name, alias: (alias || name) }
          })
          add({ contractsData })
        }
        if(options.push) push.action({ network: options.push, from: options.from })
      })
  }
}
