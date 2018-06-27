import nfs from 'fs'
import { FileSystem as fs, Logger } from 'zos-lib'

const log = new Logger('Session')
const TIMEOUT_30_MIN = 30 * 60 * 1000
const ZOS_SESSION_PATH = '.zos.session'

const Session = {

  getNetwork() {
    const session = fs.parseJsonIfExists(ZOS_SESSION_PATH) || {}
    const expires = new Date(session.expires)
    if (!session || expires <= new Date()) return undefined
    log.info(`Using session network '${session.network}'`)
    return session.network
  },

  open(network, timeout = TIMEOUT_30_MIN) {
    const expirationTimestamp = new Date(new Date().getTime() + timeout)
    fs.writeJson(ZOS_SESSION_PATH, { network, expires: expirationTimestamp })
    log.info(`Using '${network}' as default network unless overriden.`)
  },

  close() {
    //TODO: use new version of zos-lib fs
    if (fs.exists(ZOS_SESSION_PATH)) nfs.unlinkSync(ZOS_SESSION_PATH)
    log.info(`Closed zos session.`)
  },

  ignoreFile() {
    const GIT_IGNORE = '.gitignore'
    if (fs.exists(GIT_IGNORE) && fs.read(GIT_IGNORE).toString().indexOf(ZOS_SESSION_PATH) < 0) {
      nfs.appendFileSync(GIT_IGNORE, `\n${ZOS_SESSION_PATH}\n`)
    }
  }
}

export default Session
