/// <reference lib="dom" /> - Necessary for firebase types.
import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';

import { StringObject, UserEnvironment } from '.';

const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyAZoGB2p26UejODezZPmczgwehI6xlSKPs',
  authDomain: 'cli-telemetry.firebaseapp.com',
  databaseURL: 'https://cli-telemetry.firebaseio.com',
  projectId: 'cli-telemetry',
  storageBucket: '',
  messagingSenderId: '449985678611',
  appId: '1:449985678611:web:88b411adc68e6521e19ee6',
};

interface Arguments {
  uuid: string;
  commandData: StringObject;
  userEnvironment: UserEnvironment;
}

process.once('message', async function({ uuid, commandData, userEnvironment }: Arguments) {
  const unixWeek = Math.floor(Date.now() / (1000 * 60 * 60 * 24 * 7));

  // Initialize Firebase and anonymously authenticate
  const app = firebase.initializeApp(FIREBASE_CONFIG);

  try {
    const db = app.firestore();
    const { FieldValue } = firebase.firestore;

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
      await tx.set(db.collection(`users/${uuid}/commands`).doc(), {
        ...commandData,
        userEnvironment,
        unixWeek,
        id: incrementalId,
      });
    });
  } finally {
    // close all connections
    await app.delete();
  }
});
