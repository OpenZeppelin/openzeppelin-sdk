/// <reference lib="dom" />
import fs from 'fs-extra';
import uuid from 'uuid/v4';
import path from 'path';
import crypto from 'crypto';
import envPaths from 'env-paths';
import mapValues from 'lodash.mapvalues';
import pickBy from 'lodash.pickby';
import inquirer from 'inquirer';
import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';
import { DISABLE_INTERACTIVITY } from './prompts/prompt';

import { Params } from './scripts/interfaces';
import ProjectFile from './models/files/ProjectFile';

const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyAZoGB2p26UejODezZPmczgwehI6xlSKPs',
  authDomain: 'cli-telemetry.firebaseapp.com',
  databaseURL: 'https://cli-telemetry.firebaseio.com',
  projectId: 'cli-telemetry',
  storageBucket: '',
  messagingSenderId: '449985678611',
  appId: '1:449985678611:web:88b411adc68e6521e19ee6',
};

type Field = string | number | boolean;

interface GlobalTelemetryOptions {
  optIn: boolean;
  uuid: string;
  salt: string;
}

type CommandData = Params & {
  name: string;
  network: string;
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
    const concealedData = concealData(options, telemetry.salt) as object;
    const commandData = network ? { ...concealedData, name: commandName, network } : concealedData;

    await this.sendToFirebase(telemetry.uuid, commandData);
  },

  async sendToFirebase(uuid: string, commandData: CommandData): Promise<void> {
    // Initialize Firebase and anonymously authenticate
    const app = firebase.initializeApp(FIREBASE_CONFIG);
    const db = app.firestore();
    const { FieldValue } = firebase.firestore;

    try {
      await app.auth().signInAnonymously();

      // create a new command document for the current uuid
      await db.runTransaction(async tx => {
        const dbSnapshot = await tx.get(db.doc(`users/${uuid}`));
        let incrementalId;
        // if the current user document exists, retreive the latest command id and create a new command document.
        // otherwise, create a document for the user and set the id to 0.
        if (dbSnapshot.exists) {
          incrementalId = dbSnapshot.get('latestId') + 1;
          await tx.update(db.doc(`users/${uuid}`), { latestId: FieldValue.increment(1) });
        } else {
          incrementalId = 0;
          await tx.set(db.doc(`users/${uuid}`), { latestId: 0 });
        }
        await tx.set(db.collection(`users/${uuid}/commands`).doc(), { ...commandData, id: incrementalId });
      });

      // close all connections
      await app.delete();
    } catch (_) {
      return;
    }
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
      message: 'telemetry?',
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
