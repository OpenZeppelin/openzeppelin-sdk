import path from 'path';
import axios from 'axios';
import fs from 'fs-extra';

import { Logger } from 'zos-lib';

import stdout from '../../utils/stdout';
import patch from '../../utils/patch';
import child from '../../utils/child';

const ora = patch('ora');
const simpleGit = patch('simple-git/promise');

interface KitConfig {
  ignore: string[];
  hooks: object;
}
export default class KitController {
  public async unpack(url: string, workingDirPath: string = '', config: KitConfig): Promise<void | never> {
    if (!url) throw Error('A url must be provided.');
    if (!config) throw Error('A config must be provided.');

    const { exec } = child;
    const { readdir, remove, pathExists } = fs;

    // because zos always spawns '.zos.lock' file
    if ((await readdir(workingDirPath)).length > 1) throw Error('The directory must be empty');

    try {
      let spinner = ora(`Downloading kit from ${url}`).start();
      const git = simpleGit(workingDirPath);
      await git.init();
      await git.addRemote('origin', url);
      await git.pull('origin', 'stable');
      spinner.succeed();

      spinner = ora('Unpacking kit').start();
      // always delete .git folder
      config.ignore.push('.git');
      // delete all files/folders from ignore
      const paths = config.ignore.map(file => path.join(workingDirPath, file));
      const exists = await Promise.all(paths.map(pth => pathExists(pth)));
      await Promise.all(exists.map((ext, i) => ext ? remove(paths[i]) : null).filter(Boolean));
      // run kit commands like `npm install`
      await exec(config.hooks['post-unpack']);
      spinner.succeed();

      stdout('The kit is ready to use. Amazing!');
      stdout(`Please, continue at ${url}`);
    } catch(e) {
      // TODO: remove all files from directory on fail except .zos.lock
      e.message = `Failed to download and unpack kit from ${url}. Details: ${e.message}`;
      throw e;
    }
  }

  public async verifyRepo(url: string): Promise<KitConfig | never> {
    if (!url) throw Error('A url must be provided.');

    try {
      return JSON.parse((await axios.get(url
        .replace('.git', '/stable/kit.json')
        .replace('github.com', 'raw.githubusercontent.com')
      )).data);
    } catch(e) {
      e.message = `Failed to verify ${url}. Details: ${e.message}`;
      throw e;
    }
  }
}
