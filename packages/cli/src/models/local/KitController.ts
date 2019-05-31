import path from 'path';
import axios from 'axios';
import fs from 'fs-extra';
import Ajv from 'ajv';

import KitFile, { MANIFEST_VERSION } from '../files/KitFile';
import kitConfigSchema from '../files/kit-config.schema.json';
import stdout from '../../utils/stdout';
import patch from '../../utils/patch';
import child from '../../utils/child';
import Spinner from '../../utils/spinner';

const simpleGit = patch('simple-git/promise');

export default class KitController {
  public async unpack(
    url: string,
    workingDirPath: string = '',
    config: KitFile,
  ): Promise<void | never> {
    if (!url) throw Error('A url must be provided.');
    if (!config) throw Error('A config must be provided.');

    const { exec } = child;
    const { readdir, remove } = fs;

    // because zos always spawns '.zos.lock' file
    const files = (await readdir(workingDirPath)).filter(
      file => file !== '.zos.lock',
    );
    if (files.length > 0)
      throw Error(
        `Unable to unpack ${url} in the current directory, as it must be empty.`,
      );

    let spinner = new Spinner(`Downloading kit from ${url}`);
    try {
      spinner.start();
      const git = simpleGit(workingDirPath);
      await git.init();
      await git.addRemote('origin', url);
      await git.fetch();
      // if files are empty checkout everything
      if (!config.files.length) {
        await git.pull('origin', 'stable');
      } else {
        // if there are some files then do tree-ish checkout
        // http://nicolasgallagher.com/git-checkout-specific-files-from-another-branch/
        await git.checkout([`origin/stable`, `--`, ...config.files]);
      }
      spinner.succeed();

      spinner = new Spinner('Unpacking kit');
      spinner.start();
      // always delete .git folder
      await remove(path.join(workingDirPath, '.git'));
      // run kit commands like `npm install`
      await exec(config.hooks['post-unpack']);
      spinner.succeed();

      stdout('The kit is ready to use. Amazing!');
      stdout(config.message);
    } catch (e) {
      spinner.fail();
      // TODO: remove all files from directory on fail except .zos.lock
      e.message = `Failed to download and unpack kit from ${url}. Details: ${
        e.message
      }`;
      throw e;
    }
  }

  public async verifyRepo(url: string): Promise<KitFile | never> {
    if (!url) throw Error('A url must be provided.');

    try {
      const config = (await axios.get(
        url
          .replace('.git', '/stable/kit.json')
          .replace('github.com', 'raw.githubusercontent.com'),
      )).data as KitFile;

      // validate our json config
      // TODO: derive the schema directly from the KitConfig type
      const ajv = new Ajv({ allErrors: true });
      const test = ajv.compile(kitConfigSchema);
      const isValid = test(config);
      if (!isValid)
        throw new Error(
          `kit.json is not valid. Errors: ${test.errors.reduce(
            (ret, err) => `${err.message}, ${ret}`,
            '',
          )}`,
        );

      // has to be the same version
      if (config.manifestVersion !== MANIFEST_VERSION) {
        throw new Error(`Unrecognized kit version identifier ${
          config.manifestVersion
        }.
          This means the kit was built with an unknown version of zos.
          Please refer to the documentation at https://docs.zeppelinos.org for more info.`);
      }
      return config;
    } catch (e) {
      e.message = `Failed to verify ${url}. Details: ${e.message}`;
      throw e;
    }
  }
}
