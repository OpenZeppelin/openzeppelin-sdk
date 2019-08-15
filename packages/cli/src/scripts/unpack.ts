import process from 'process';

import KitController from '../models/local/KitController';
import { UnpackParams } from './interfaces';

const nameToRepo = {
  // TODO-v3: Remove legacy zepkit support
  zepkit: 'openzeppelin/starter-kit',
  starter: 'openzeppelin/starter-kit',
  tutorial: 'openzeppelin/tutorial-kit',
};

// https://github.com/openzeppelin/starter-kit.git

export default async function unpack({ repoOrName }: UnpackParams): Promise<void | never> {
  if (!repoOrName) throw Error('A kit name or GitHub repo must be provided to unpack to the current directory.');
  repoOrName = repoOrName.toLowerCase();

  if (!repoOrName.includes('/') && !repoOrName.includes('#')) {
    // predefined name has been passed
    // check if it is registered
    if (!nameToRepo.hasOwnProperty(repoOrName)) {
      throw new Error(`Kit named ${repoOrName} doesn't exist`);
    }
    repoOrName = nameToRepo[repoOrName];
  }

  let branchName = 'stable';
  if (repoOrName.includes('#')) {
    [repoOrName, branchName] = repoOrName.split('#', 2);
  }

  const url = `https://github.com/${repoOrName}.git`;
  const controller = new KitController();
  const config = await controller.verifyRepo(url, branchName);
  await controller.unpack(url, branchName, process.cwd(), config);
}
