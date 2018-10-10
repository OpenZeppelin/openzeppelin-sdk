import log from '../helpers/log'
import push from 'zos/lib/scripts/push'
import session from 'zos/lib/scripts/session'
import configureTPL from '../kernel/configureTPL'
import createKernelContracts from '../kernel/createKernelContracts'

export default async function deploy(options) {
  const oneDay = 60 * 60 * 24
  session({ expires: oneDay, ...options })
  log.base(`Pushing ZeppelinOS app with options ${JSON.stringify(options, null, 2)}...`)
  await push({ ...options })
  const { validator, jurisdiction } = await createKernelContracts(options)
  await configureTPL(validator, jurisdiction, options)
}
