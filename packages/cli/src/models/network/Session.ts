import fs from 'fs-extra';
import { omitBy, isEmpty, pick, compact } from 'lodash';
import path from 'path';

import { Loggy } from '@openzeppelin/upgrades';
import { OPEN_ZEPPELIN_FOLDER } from '../files/constants';
import { DEFAULT_TX_TIMEOUT, DEFAULT_TX_BLOCK_TIMEOUT, DEFAULT_EXPIRATION_TIMEOUT } from './defaults';

const state = { alreadyPrintedSessionInfo: false };
const SESSION_FILE = '.session';
const SESSION_PATH = path.join(OPEN_ZEPPELIN_FOLDER, SESSION_FILE);

export interface SessionOptions {
  network?: string;
  from?: string;
  timeout?: number;
  blockTimeout?: number;
  expires?: Date;
}

const Session = {
  getOptions(overrides: SessionOptions = {}, silent?: boolean): SessionOptions {
    const session = this._parseSession();
    if (!session || this._hasExpired(session)) return this._setDefaults(overrides);
    if (!silent && !state.alreadyPrintedSessionInfo) {
      state.alreadyPrintedSessionInfo = true;
      const fields = omitBy(session, (v, key) => overrides[key] && overrides[key] !== v);
      Loggy.noSpin(__filename, 'getOptions', `get-options`, `Using session with ${describe(fields)}`);
    }

    return { ...session, ...overrides };
  },

  setDefaultNetworkIfNeeded(network: string): void {
    const session = this._parseSession();
    if (!session || this._hasExpired(session)) this.open({ network }, 0, false);
  },

  getNetwork(): { network: string | undefined; expired: boolean } {
    const session = this._parseSession();
    const network = session ? session.network : undefined;
    return { network, expired: this._hasExpired(session) };
  },

  open(
    { network, from, timeout, blockTimeout }: SessionOptions,
    expires: number = DEFAULT_EXPIRATION_TIMEOUT,
    logInfo = true,
  ): void {
    const expirationTimestamp = new Date(new Date().getTime() + expires * 1000);
    fs.writeJsonSync(
      SESSION_PATH,
      {
        network,
        from,
        timeout,
        blockTimeout,
        expires: expirationTimestamp,
      },
      { spaces: 2 },
    );
    if (logInfo) {
      Loggy.noSpin(
        __filename,
        'getOptions',
        `get-options`,
        `Using ${describe({ network, from, timeout, blockTimeout })} by default.`,
      );
    }
  },

  close(): void {
    if (fs.existsSync(SESSION_PATH)) fs.unlinkSync(SESSION_PATH);
    Loggy.noSpin(__filename, 'getOptions', `close-session`, 'Closed openzeppelin session');
  },

  ignoreFile(): void {
    const GIT_IGNORE = '.gitignore';
    if (
      fs.existsSync(GIT_IGNORE) &&
      fs
        .readFileSync(GIT_IGNORE, 'utf8')
        .toString()
        .indexOf(SESSION_PATH) < 0
    ) {
      fs.appendFileSync(GIT_IGNORE, `\n${SESSION_PATH}\n`);
    }
  },

  _parseSession(): SessionOptions | undefined {
    const session = fs.existsSync(SESSION_PATH) ? fs.readJsonSync(SESSION_PATH) : null;
    if (isEmpty(session)) return undefined;
    const parsedSession = pick(session, 'network', 'timeout', 'blockTimeout', 'from', 'expires');
    return this._setDefaults(parsedSession);
  },

  _setDefaults(session: SessionOptions): SessionOptions {
    if (!session.timeout) session.timeout = DEFAULT_TX_TIMEOUT;
    if (!session.blockTimeout) session.blockTimeout = DEFAULT_TX_BLOCK_TIMEOUT;
    return session;
  },

  _hasExpired(session: SessionOptions): boolean {
    return !!session && new Date(session.expires) <= new Date();
  },
};

function describe(session: SessionOptions): string {
  return (
    compact([
      session.network && `network ${session.network}`,
      session.from && `sender address ${session.from}`,
      session.timeout && `timeout ${session.timeout} seconds`,
      session.blockTimeout && `blockTimeout ${session.blockTimeout} blocks`,
    ]).join(', ') || 'no options'
  );
}

export default Session;
