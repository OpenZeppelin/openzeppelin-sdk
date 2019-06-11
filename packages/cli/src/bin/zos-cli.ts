#! /usr/bin/env node

import { lockSync } from 'lockfile';
import program from './program';
import findRootDirectory from './helpers';

const IGNORED_COMMANDS_IN_ROOT_DIR = ['init', 'unpack'];

const [nodePath, zosPath, command] = process.argv;

if (!IGNORED_COMMANDS_IN_ROOT_DIR.includes(command)) {
  const currentPath = process.cwd();
  const rootDirectory = findRootDirectory(currentPath) || currentPath;
  if (rootDirectory !== process.cwd()) process.chdir(rootDirectory);
}

// Acquire file lock to ensure no other instance is running
const LOCKFILE = '.zos.lock';
try {
  lockSync(LOCKFILE, { retries: 0 });
} catch (e) {
  console.error(
    `Cannot run more than one instance of 'zos' at the same time.\nIf you are sure that no other instances are actually running, manually remove the file ${LOCKFILE} and try again.`,
  );
  process.exit(1);
}

program.parse(process.argv);
if (program.args.length === 0) program.help();
