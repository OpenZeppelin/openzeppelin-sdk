import process from 'process';

import KitController from '../models/local/KitController';
import { UnpackParams } from './interfaces';

const nameToRepo = {
  zepkit: 'zeppelinos/zepkit',
};

// https://github.com/zeppelinos/zepkit.git

export default async function unpack({ repoOrName }: UnpackParams): Promise<void | never> {
  repoOrName = repoOrName.toLowerCase();
  if (!repoOrName.includes('/')) {
    // predefined name has been passed
    // check if it is registered
    if (!nameToRepo.hasOwnProperty(repoOrName)) {
      throw new Error(`Kit named ${repoOrName} doesn't exist`);
    }
    repoOrName = nameToRepo[repoOrName];
  }
  const url = `https://github.com/${repoOrName}.git`;
  const controller = new KitController();
  const config = await controller.verifyRepo(url);
  await controller.unpack(url, process.cwd(), config);
}
