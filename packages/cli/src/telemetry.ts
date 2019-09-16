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

export async function report(commandName: string, options: any, interactive: boolean): Promise<void> {
  const telemetry = await checkOptIn(interactive);
  if (telemetry === undefined || !telemetry.optIn) return;

  // extract network name if present
  let { network } = pickBy(options, (_, key) => key === 'network');
  if (network) delete options.network;
  if (network && network.match(/dev-/)) network = 'development';

  // encrypt data before sending it
  const concealedData = concealData(commandName, options, telemetry.salt);
  const commandData = network ? { ...concealedData, network } : concealedData;

  // Initialize Firebase and anonymously authenticate
  const app = firebase.initializeApp(FIREBASE_CONFIG);
  const db = app.firestore();
  const { FieldValue } = firebase.firestore;
  try {
    await app.auth().signInAnonymously();

    // create a new command document for the current uuid
    await db.runTransaction(async tx => {
      const dbSnapshot = await tx.get(db.doc(`users/${telemetry.uuid}`));
      let incrementalId;
      // if the current user document exists, retreive the latest command id and create a new command document.
      // otherwise, create a document for the user and set the id to 0.
      if (dbSnapshot.exists) {
        incrementalId = dbSnapshot.get('latestId') + 1;
        await tx.update(db.doc(`users/${telemetry.uuid}`), { latestId: FieldValue.increment(1) });
      } else {
        incrementalId = 0;
        await tx.set(db.doc(`users/${telemetry.uuid}`), { latestId: 0 });
      }
      await tx.set(db.collection(`users/${telemetry.uuid}/commands`).doc(), { ...commandData, id: incrementalId });
    });

    // close all connections
    await app.delete();
  } catch (_) {
    return;
  }
}

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

function concealData(name: string, options: any, salt: string) {
  const hashedOptions = mapValues(options, function recur(x) {
    if (Array.isArray(x)) {
      return x.map(recur);
    } else if (typeof x === 'object') {
      return mapValues(x, recur);
    } else {
      return hashField(x, salt);
    }
  });

  const commandData = {
    name,
    options: hashedOptions,
  };

  return commandData;
}
