import omitBy from 'lodash.omitby';
import isEmpty from 'lodash.isempty';
import pick from 'lodash.pick';
import compact from 'lodash.compact';
import { FileSystem as fs, Logger } from 'zos-lib';

const log: Logger = new Logger('Session');

const ZOS_SESSION_PATH: string = '.zos.session';
const DEFAULT_TX_TIMEOUT: number = 10 * 60; // 10 minutes
const DEFAULT_EXPIRATION_TIMEOUT: number = 15 * 60; // 15 minutes

interface SessionOptions {
  network?: string;
  from?: string;
  timeout?: number;
  expires?: Date;
}

const Session = {

  getOptions(overrides: SessionOptions = {}, silent?: boolean): SessionOptions {
    const session = this._parseSession();
    if (!session || this._hasExpired(session)) return this._setDefaults(overrides);
    if (!silent) {
      const fields = omitBy(session, (v, key) => overrides[key] && overrides[key] !== v);
      log.info(`Using session with ${describe(fields)}`);
    }

    return { ...session, ...overrides };
  },

  setDefaultNetworkIfNeeded(network: string): void {
    const session = this._parseSession();
    if (!session || this._hasExpired(session)) this.open({ network }, 0, false);
  },

  getNetwork(): { network: string | undefined, expired: boolean } {
    const session = this._parseSession();
    const network = session ? session.network : undefined;
    return { network, expired: this._hasExpired(session) };
  },

  open({ network, from, timeout }: SessionOptions, expires: number = DEFAULT_EXPIRATION_TIMEOUT, logInfo: boolean = true): void {
    const expirationTimestamp = new Date(new Date().getTime() + expires * 1000);
    fs.writeJson(ZOS_SESSION_PATH, { network, from, timeout, expires: expirationTimestamp });
    if (logInfo) log.info(`Using ${describe({ network, from, timeout })} by default.`);
  },

  close(): void {
    if (fs.exists(ZOS_SESSION_PATH)) fs.remove(ZOS_SESSION_PATH);
    log.info(`Closed zos session.`);
  },

  ignoreFile(): void {
    const GIT_IGNORE = '.gitignore';
    if (fs.exists(GIT_IGNORE) && fs.read(GIT_IGNORE).toString().indexOf(ZOS_SESSION_PATH) < 0) {
      fs.append(GIT_IGNORE, `\n${ZOS_SESSION_PATH}\n`);
    }
  },

  _parseSession(): SessionOptions | undefined {
    const session = fs.parseJsonIfExists(ZOS_SESSION_PATH);
    if (isEmpty(session)) return undefined;
    const parsedSession = pick(session, 'network', 'timeout', 'from', 'expires');
    return this._setDefaults(parsedSession);
  },

  _setDefaults(session: SessionOptions): SessionOptions {
    if (!session.timeout) session.timeout = DEFAULT_TX_TIMEOUT;
    return session;
  },

  _hasExpired(session: SessionOptions): boolean {
    return !!session && new Date(session.expires) <= new Date();
  }
};

function describe(session: SessionOptions): string {
  return compact([
    session.network && `network ${session.network}`,
    session.from && `sender address ${session.from}`,
    session.timeout && `timeout ${session.timeout} seconds`
  ]).join(', ') || 'no options';
}

export { DEFAULT_TX_TIMEOUT };
export default Session;
