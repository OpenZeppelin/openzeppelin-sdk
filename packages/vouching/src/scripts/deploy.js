import log from '../helpers/log'
import { scripts, stdout } from 'zos'
import { OUTPUT_FILE } from '../constants'
import { FileSystem as fs } from 'zos-lib'
import configureTPL from '../kernel/configureTPL'
import exportKernelData from '../kernel/exportKernelData'
import createKernelContracts from '../kernel/createKernelContracts'

const { push, session, publish } = scripts

export default async function deploy(options) {
  const oneDay = 60 * 60 * 24
  session({ expires: oneDay, ...options })
  log.base(`Pushing ZeppelinOS app with options ${JSON.stringify(options, null, 2)}...`)
  const isLocalOrTest = options.network === 'local' || options.network === 'test'
  if (isLocalOrTest) removeZosFiles(options)
  await push({ deployLibs: isLocalOrTest, ...options })
  await publish({ ...options })
  stdout.silent(true)
  const { app, jurisdiction, validator, zepToken, vouching } = await createKernelContracts(options)
  await configureTPL(jurisdiction, validator, options)
  exportKernelData(OUTPUT_FILE(options.network), app, jurisdiction, zepToken, validator, vouching)
}

function removeZosFiles({ network }) {
  const rootZosNetworkFile = `./zos.${network}.json`
  if(fs.exists(rootZosNetworkFile)) fs.remove(rootZosNetworkFile)

  const tplZosNetworkFile = `./node_modules/tpl-contracts-zos/zos.${network}.json`
  if(fs.exists(tplZosNetworkFile)) fs.remove(tplZosNetworkFile)
}
