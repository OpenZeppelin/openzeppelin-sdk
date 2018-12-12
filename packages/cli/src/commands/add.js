'use strict';

import push from './push'
import add from '../scripts/add'
import addAll from '../scripts/add-all'
import Compiler from '../models/compiler/Compiler'
import ConfigVariablesInitializer from '../models/initializer/ConfigVariablesInitializer'

const name = 'add'
const signature = `${name} [contractNames...]`
const description = 'add contract to your project. Provide a list of whitespace-separated contract names'

const register = program => program
  .command(signature, { noHelp: true })
  .usage('[contractName1[:contractAlias1] ... contractNameN[:contractAliasN]] [options]')
  .description(description)
  .option('--all', 'add all contracts in your build directory')
  .withPushOptions()
  .action(action)

async function action(contractNames, options) {
  ConfigVariablesInitializer.initStaticConfiguration()
  if(!options.skipCompile) await Compiler.call()
  if(options.all) addAll({})
  else {
    const contractsData = contractNames.map(rawData => {
      let [ name, alias ] = rawData.split(':')
      return { name, alias: (alias || name) }
    })
    add({ contractsData })
  }
  await push.tryAction(options)
}

export default { name, signature, description, register, action }
