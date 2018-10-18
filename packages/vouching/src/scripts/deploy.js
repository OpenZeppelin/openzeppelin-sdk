import log from '../helpers/log'
import { scripts, stdout } from 'zos'
import { OUTPUT_FILE } from '../constants'
import configureTPL from '../kernel/configureTPL'
import exportKernelData from '../kernel/exportKernelData'
import createKernelContracts from '../kernel/createKernelContracts'

const { push, session } = scripts

export default async function deploy(options) {
  const oneDay = 60 * 60 * 24
  session({ expires: oneDay, ...options })
  log.base(`Pushing ZeppelinOS app with options ${JSON.stringify(options, null, 2)}...`)
  const isLocalOrTest = options.network === 'local' || options.network === 'test'
  await push({ deployLibs: isLocalOrTest, ...options })
  stdout.silent(true)
  const { app, jurisdiction, validator, zepToken, vouching } = await createKernelContracts(options)
  await configureTPL(jurisdiction, validator, options)
  exportKernelData(OUTPUT_FILE(options.network), app, jurisdiction, zepToken, validator, vouching)
}
