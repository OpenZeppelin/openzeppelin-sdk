/// <reference lib="dom" />
import fs from 'fs-extra';
import uuid from 'uuid/v4';
import path from 'path';
import crypto from 'crypto';
import envPaths from 'env-paths';
import mapValues from 'lodash.mapvalues';
import inquirer from 'inquirer';
import proc from 'child_process';

import { DISABLE_INTERACTIVITY } from '../prompts/prompt';
import { Params } from '../scripts/interfaces';
import ProjectFile from '../models/files/ProjectFile';

type Field = string | number | boolean;

interface GlobalTelemetryOptions {
  optIn: boolean;
  uuid: string;
  salt: string;
}

export type CommandData = Params & {
  name: string;
  network?: string;
};

export default {
  async report(commandName: string, options: Params, interactive: boolean): Promise<void> {
    const telemetry = await checkOptIn(interactive);
    if (telemetry === undefined || !telemetry.optIn) return;

    // extract network name if present
    let network;
    if ('network' in options) {
      network = options.network;
      delete options.network;
      if (network.match(/dev-/)) network = 'development';
    }

    // Conceal data before sending it
    const concealedData = concealData(options, telemetry.salt);
    const commandData: CommandData = { ...concealedData, name: commandName };
    if (network !== undefined) commandData.network = network;

    this.sendToFirebase(telemetry.uuid, commandData);
  },

  sendToFirebase(uuid: string, commandData: CommandData): void {
    // We send to Firebase in a child process so that the CLI is not blocked from exiting.
    const child = proc.fork(path.join(__dirname, './send-to-firebase'));
    child.send({ uuid, commandData });

    // Allow this process to exit while the child is still alive.
    child.disconnect();
    child.unref();
  },
};

async function checkOptIn(interactive: boolean): Promise<GlobalTelemetryOptions | undefined> {
  const project = new ProjectFile();
  const localOptIn = project.telemetryOptIn;

  const { data: globalDataDir } = envPaths('openzeppelin-sdk');
  const globalDataPath = path.join(globalDataDir, 'telemetry.json');
  let globalOptIn: GlobalTelemetryOptions | undefined = await fs.readJson(globalDataPath).catch(() => undefined);

  if (localOptIn === false) return undefined;

  // disable interactivity manually for tests and CI
  if (DISABLE_INTERACTIVITY) interactive = false;

  if (globalOptIn === undefined && interactive) {
    const { telemetry } = await inquirer.prompt({
      name: 'telemetry',
      type: 'confirm',
      message:
        'Would you like to contribute anonymous usage data to help us improve the OpenZeppelin CLI? Learn more at https://zpl.in/telemetry',
      default: true,
    });

    const salt = crypto.randomBytes(32);
    globalOptIn = { optIn: telemetry, uuid: uuid(), salt: salt.toString('hex') };
    await fs.ensureDir(globalDataDir);
    await fs.writeJson(globalDataPath, globalOptIn);
  }

  if (localOptIn === undefined && globalOptIn !== undefined) {
    project.telemetryOptIn = globalOptIn.optIn;
    // following function is sync
    project.write();
  }

  return globalOptIn;
}

function hashField(field: Field, salt: string): string {
  const hash = crypto.createHash('sha256');
  hash.update(salt);
  hash.update(String(field));

  return hash.digest('hex');
}

function concealData<T>(obj: T, salt: string): Concealed<T> {
  return mapValues(obj, function recur(val) {
    if (Array.isArray(val)) {
      return val.map(recur);
    } else if (typeof val === 'object') {
      return mapValues(val, recur);
    } else {
      return hashField(val, salt);
    }
  });
}

// This type essentially recursively converts everything into a string.
type Concealed<T> = T extends (infer U)[]
  ? ConcealedArray<U>
  : T extends object
  ? { [P in keyof T]: Concealed<T[P]> }
  : string;

// Necessary to avoid error on the recursive type alias.
// https://github.com/Microsoft/TypeScript/issues/3496#issuecomment-128553540
interface ConcealedArray<T> extends Array<Concealed<T>> {}
