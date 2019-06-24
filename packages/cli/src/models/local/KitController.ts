import path from 'path';
import axios from 'axios';
import fs from 'fs-extra';
import Ajv from 'ajv';
import { Loggy } from 'zos-lib';

import { OPEN_ZEPPELIN_FOLDER } from '../files/constants';
import KitFile, { MANIFEST_VERSION } from '../files/KitFile';
import kitConfigSchema from '../files/kit-config.schema.json';
import patch from '../../utils/patch';
import child from '../../utils/child';

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

    // because zos always spawns '.lock' file
    const files = (await readdir(workingDirPath)).filter(
      (file): boolean => file !== OPEN_ZEPPELIN_FOLDER,
    );
    if (files.length > 0) {
      throw Error(
        `Unable to unpack ${url} in the current directory, as it must be empty.`,
      );
    }

    try {
      Loggy.spin(
        __filename,
        'unpack',
        'unpack-kit',
        `Downloading kit from ${url}`,
      );
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
      Loggy.update('unpack-kit', 'Unpacking kit');

      // always delete .git folder
      await remove(path.join(workingDirPath, '.git'));
      // run kit commands like `npm install`
      await exec(config.hooks['post-unpack']);
      Loggy.succeed('unpack-kit', 'Kit downloaded and unpacked');

      Loggy.noSpin(
        __filename,
        'unpack',
        'unpack-succeeded',
        `The kit is ready to use. \n${config.message}`,
      );
    } catch (e) {
      // TODO: remove all files from directory on fail except .lock
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
      if (!isValid) {
        throw new Error(
          `kit.json is not valid. Errors: ${test.errors.reduce(
            (ret, err): string => `${err.message}, ${ret}`,
            '',
          )}`,
        );
      }

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
