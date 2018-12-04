import _ from 'lodash'
import { FileSystem as fs, Logger } from 'zos-lib'

const log = new Logger('Session')

const ZOS_SESSION_PATH = '.zos.session'
const DEFAULT_TX_TIMEOUT = 10 * 60 // 10 minutes
const DEFAULT_EXPIRATION_TIMEOUT = 15 * 60 // 15 minutes

const Session = {

  getOptions(overrides = {}) {
    const session = this._parseSession()
    if (!session) return overrides
    log.info(`Using session with ${describe(_.omitBy(session, (v, key) => overrides[key]))}`)
    return { ...session, ...overrides }
  },

  open({ network, from, timeout }, expires = DEFAULT_EXPIRATION_TIMEOUT) {
    const expirationTimestamp = new Date(new Date().getTime() + expires * 1000)
    fs.writeJson(ZOS_SESSION_PATH, { network, from, timeout, expires: expirationTimestamp })
    log.info(`Using ${describe({ network, from, timeout })} by default.`)
  },

  close() {
    if (fs.exists(ZOS_SESSION_PATH)) fs.remove(ZOS_SESSION_PATH)
    log.info(`Closed zos session.`)
  },

  ignoreFile() {
    const GIT_IGNORE = '.gitignore'
    if (fs.exists(GIT_IGNORE) && fs.read(GIT_IGNORE).toString().indexOf(ZOS_SESSION_PATH) < 0) {
      fs.append(GIT_IGNORE, `\n${ZOS_SESSION_PATH}\n`)
    }
  },

  _parseSession() {
    const session = fs.parseJsonIfExists(ZOS_SESSION_PATH)
    if (_.isEmpty(session)) return undefined
    const expires = new Date(session.expires)
    if (expires <= new Date()) return undefined
    const parsedSession = _.pick(session, 'network', 'timeout', 'from')
    if (parsedSession.from) parsedSession.from = parsedSession.from.toLowerCase()
    if (!parsedSession.timeout) parsedSession.timeout = DEFAULT_TX_TIMEOUT
    return parsedSession
  },
}

function describe(session) {
  return _.compact([
    session.network && `network ${session.network}`,
    session.from && `sender address ${session.from}`,
    session.timeout && `timeout ${session.timeout} seconds`
  ]).join(', ') || 'no options'
}

export { DEFAULT_TX_TIMEOUT }
export default Session
