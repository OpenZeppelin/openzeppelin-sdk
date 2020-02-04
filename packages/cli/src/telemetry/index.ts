import fs from 'fs-extra';
import uuid from 'uuid/v4';
import path from 'path';
import crypto from 'crypto';
import envPaths from 'env-paths';
import { mapValues } from 'lodash';
import inquirer from 'inquirer';
import proc from 'child_process';
import process from 'process';

import { DISABLE_INTERACTIVITY } from '../prompts/prompt';
import ProjectFile from '../models/files/ProjectFile';

type Field = string | number | boolean;

interface GlobalTelemetryOptions {
  optIn: boolean;
  uuid: string;
  salt: string;
}

export interface UserEnvironment {
  platform: string;
  arch: string;
  nodeVersion: string;
  cliVersion: string;
  upgradesVersion?: string;
  web3Version?: string;
  truffleVersion?: string;
}

// We export an object with report and sendToFirebase so that we can stub them in tests.
export default {
  DISABLE_TELEMETRY: !!process.env.OPENZEPPELIN_DISABLE_TELEMETRY,

  async report(commandName: string, params: { [key: string]: unknown }, interactive: boolean): Promise<void> {
    const telemetryOptions = await checkOptIn(interactive);
    if (telemetryOptions === undefined || !telemetryOptions.optIn) return;

    // normalize network name
    const { ZWeb3 } = await import('@openzeppelin/upgrades');
    let network = await ZWeb3.getNetworkName();
    if (network.match(/dev-/)) {
      network = 'development';
    }

    // Conceal data before sending it
    const concealedData = concealData(params, telemetryOptions.salt);
    const commandData: StringObject = { ...concealedData, name: commandName };
    if (network !== undefined) commandData.network = network;

    const userEnvironment = await getUserEnvironment();
    this.sendToFirebase(telemetryOptions.uuid, commandData, userEnvironment);
  },

  sendToFirebase(uuid: string, commandData: StringObject, userEnvironment: UserEnvironment): void {
    // We send to Firebase in a child process so that the CLI is not blocked from exiting.
    const child = proc.fork(path.join(__dirname, './send-to-firebase'), [], {
      stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
    });
    child.send({ uuid, commandData, userEnvironment });

    // Allow this process to exit while the child is still alive.
    child.disconnect();
    child.unref();
  },
};

async function checkOptIn(interactive: boolean): Promise<GlobalTelemetryOptions | undefined> {
  // disable via env var for local development
  if (module.exports.DISABLE_TELEMETRY) return undefined;

  const project = new ProjectFile();
  const localOptIn = project.telemetryOptIn;

  const { data: globalDataDir } = envPaths('openzeppelin-sdk');
  const globalDataPath = path.join(globalDataDir, 'telemetry.json');
  let globalOptions: GlobalTelemetryOptions | undefined = await fs.readJson(globalDataPath).catch(() => undefined);

  if (localOptIn === false) return undefined;

  // disable interactivity manually for tests and CI
  if (DISABLE_INTERACTIVITY) interactive = false;

  if (globalOptions === undefined && interactive) {
    const { optIn } = await inquirer.prompt({
      name: 'optIn',
      type: 'confirm',
      message:
        'Would you like to contribute anonymous usage data to help us improve the OpenZeppelin CLI? Learn more at https://zpl.in/telemetry',
      default: true,
    });

    const salt = crypto.randomBytes(32);
    globalOptions = { optIn, uuid: uuid(), salt: salt.toString('hex') };
    await fs.ensureDir(globalDataDir);
    await fs.writeJson(globalDataPath, globalOptions);
  }

  if (project.exists() && localOptIn === undefined && globalOptions !== undefined) {
    project.telemetryOptIn = globalOptions.optIn;
    // following function is sync
    project.write();
  }

  return globalOptions;
}

async function getUserEnvironment(): Promise<UserEnvironment> {
  return {
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    cliVersion: await getCLIVersion(),
    upgradesVersion: getDependencyVersion('@openzeppelin/upgrades'),
    truffleVersion: getDependencyVersion('truffle'),
    web3Version: getDependencyVersion('web3'),
  };
}

async function getCLIVersion(): Promise<string> {
  return JSON.parse(await fs.readFile(__dirname + '/../../package.json', 'utf8')).version;
}

function getDependencyVersion(dep: string): string | undefined {
  try {
    return require(`${dep}/package.json`).version;
  } catch {
    return undefined;
  }
}

function hashField(field: Field, salt: string): string {
  const hash = crypto.createHash('sha256');
  hash.update(salt);
  hash.update(String(field));

  return hash.digest('hex');
}

function concealData(obj: { [key: string]: unknown }, salt: string): StringObject {
  return mapValues(obj, function recur(val) {
    if (Array.isArray(val)) {
      return val.map(recur);
    } else if (typeof val === 'object') {
      return mapValues(val, recur);
    } else {
      return hashField(val as Field, salt);
    }
  });
}

export type StringObject = { [key in string]?: string | StringObject };
