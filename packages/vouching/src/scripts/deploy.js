import log from '../helpers/log'
import push from 'zos/lib/scripts/push'
import session from 'zos/lib/scripts/session'
import { FileSystem as fs } from 'zos-lib'
import configureTPL from '../kernel/configureTPL'
import createKernelContracts from '../kernel/createKernelContracts'

export default async function deploy(options) {
  const oneDay = 60 * 60 * 24
  session({ expires: oneDay, ...options })
  log.base(`Pushing ZeppelinOS app with options ${JSON.stringify(options, null, 2)}...`)
  const isLocalOrTest = options.network === 'local' || options.network === 'test'
  if (isLocalOrTest) removeZosFiles(options)
  await push({ deployLibs: isLocalOrTest, ...options })
  const { validator, jurisdiction } = await createKernelContracts(options)
  await configureTPL(validator, jurisdiction, options)
}

function removeZosFiles({ network }) {
  const rootZosNetworkFile = `./zos.${network}.json`
  if(fs.exists(rootZosNetworkFile)) fs.remove(rootZosNetworkFile)

  const tplZosNetworkFile = `./node_modules/tpl-contracts-zos/zos.${network}.json`
  if(fs.exists(tplZosNetworkFile)) fs.remove(tplZosNetworkFile)
}
