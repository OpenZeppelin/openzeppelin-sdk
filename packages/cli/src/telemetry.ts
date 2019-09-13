/// <reference lib="dom" />
import envPaths from 'env-paths';
import uuid from 'uuid/v4';
import path from 'path';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';

import ProjectFile from './models/files/ProjectFile';
import ConfigManager from './models/config/ConfigManager';

const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyAZoGB2p26UejODezZPmczgwehI6xlSKPs',
  authDomain: 'cli-telemetry.firebaseapp.com',
  databaseURL: 'https://cli-telemetry.firebaseio.com',
  projectId: 'cli-telemetry',
  storageBucket: '',
  messagingSenderId: '449985678611',
  appId: '1:449985678611:web:88b411adc68e6521e19ee6',
};

// TODO: change
interface GlobalTelemetry {
  optIn: boolean;
  uuid: string;
  salt: unknown;
}

//TODO: rename
export async function telemetry(commandName: string, options: any): Promise<void> {
  const telemetry = await checkOptIn();
  if (!telemetry) return;

  // Initialize Firebase and anonymously authenticate
  const app = firebase.initializeApp(FIREBASE_CONFIG);
  const db = app.firestore();
  const { FieldValue } = firebase.firestore;
  await app.auth().signInAnonymously();

  // create a new command document for the current uuid
  await db.runTransaction(async tx => {
    try {
      const dbSnapshot = await tx.get(db.doc(`users/${telemetry.uuid}`));
      let incrementalId;
      // if the current user document exists, retreive the latest id and create a new command document.
      // otherwise, create a document for the user and set the id to 0.
      if (dbSnapshot.exists) {
        incrementalId = (await tx.get(db.doc(`users/${telemetry.uuid}`))).get('latestId') + 1;
        await tx.update(db.doc(`users/${telemetry.uuid}`), { latestId: FieldValue.increment(1) });
      } else {
        incrementalId = 0;
        await tx.set(db.doc(`users/${telemetry.uuid}`), { latestId: 0 });
      }
      await tx.set(db.collection(`users/${telemetry.uuid}/commands`).doc(), { ...options, id: incrementalId });
    } catch (_) {
      return;
    }
  });

  // TODO: remove. query all created rows
  const query = (await db
    .collection(`users/${telemetry.uuid}/commands`)
    .orderBy('id')
    .get()).docs.map(i => i.data());

  console.log(query);
}

// TODO: test
async function checkOptIn(): Promise<GlobalTelemetry | undefined> {
  const project = new ProjectFile();
  const localOptIn = project.telemetryOptIn;

  const { data: globalDataDir } = envPaths('openzeppelin-sdk');
  const globalDataPath = path.join(globalDataDir, 'telemetry.json');
  let globalOptIn: GlobalTelemetry | undefined = await fs.readJson(globalDataPath).catch(() => undefined);

  if (localOptIn === false) return undefined;

  if (globalOptIn === undefined) {
    const { telemetry } = await inquirer.prompt({
      name: 'telemetry',
      type: 'confirm',
      message: 'telemetry?',
      default: true,
    });

    globalOptIn = { optIn: telemetry, uuid: uuid(), salt: 0 };
    await fs.ensureDir(globalDataDir);
    await fs.writeJson(globalDataPath, globalOptIn);
  }

  if (localOptIn === undefined) {
    project.telemetryOptIn = globalOptIn.optIn;
    // Note: following function is sync
    project.write();
  }

  return globalOptIn;
}
