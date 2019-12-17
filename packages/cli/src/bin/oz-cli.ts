#! /usr/bin/env node

import fs from 'fs-extra';

import { Loggy } from '@openzeppelin/upgrades';
import { lockSync } from 'lockfile';
import program from './program';
import findRootDirectory from './helpers';
import registerErrorHandler from './errors';
import { LOCK_FILE_PATH, OPEN_ZEPPELIN_FOLDER } from '../models/files/constants';

const IGNORED_COMMANDS_IN_ROOT_DIR = ['init', 'unpack'];

const [nodePath, binPath, command] = process.argv;

if (!IGNORED_COMMANDS_IN_ROOT_DIR.includes(command)) {
  const currentPath = process.cwd();
  const rootDirectory = findRootDirectory(currentPath) || currentPath;
  if (rootDirectory !== process.cwd()) process.chdir(rootDirectory);
}

// Acquire file lock to ensure no other instance is running

try {
  fs.ensureDirSync(OPEN_ZEPPELIN_FOLDER);
  lockSync(LOCK_FILE_PATH, { retries: 0 });
} catch (e) {
  console.error(
    `Cannot run more than one instance of 'openzeppelin' at the same time.\nIf you are sure that no other instances are actually running, manually remove the file ${LOCK_FILE_PATH} and try again.`,
  );
  process.exit(1);
}

Loggy.silent(false);

if (binPath.match(/zos$/)) {
  Loggy.noSpin.warn(
    __filename,
    'oz-cli',
    `deprecated-zos-bin`,
    `'zos' command is deprecated and will be removed in the next major version. Please use 'openzeppelin' or 'oz' instead.`,
  );
}

registerErrorHandler(program);

program.parse(process.argv);
if (program.args.length === 0) program.help();
