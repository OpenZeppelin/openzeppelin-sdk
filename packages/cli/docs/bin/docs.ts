#!/usr/bin/env node

import program from '../../src/bin/program';
import { writeFileSync } from 'fs';
import { ensureDirSync } from 'fs-extra';
import path from 'path';
import process from 'process';

const outputPath = '../docs/modules/cli';

function render(cmd) {
  const description = cmd.description() || '';
  const options = cmd.options.map(o => `\`${o.flags}\`:: ${o.description}`).join('\n');

  return `\
== ${cmd.name()}

Usage: \`${cmd.name()} ${cmd.usage()}\`

${description}

${options}
`;
}

function writeAdoc(id, title, content) {
  const data = content;
  writeFileSync(path.resolve(outputPath, 'pages', `${id}.adoc`), data);
}

function makeSidebar(program) {
  const makeEntry = name => `* xref:${name}.adoc[${name}]`;
  const commands = program.commands
    // TODO: remove filtering status command before next major release
    .filter(command => command.name() !== 'status')
    .map(command => makeEntry(command.name()));
  return ['.CLI', makeEntry('main'), ...commands].join('\n');
}

function run() {
  ensureDirSync(outputPath);
  ensureDirSync(path.join(outputPath, 'pages'));

  const main = render(program);
  writeAdoc('main', 'zos', main);

  program.commands
    // TODO: remove filtering status command before next major release
    .filter(command => command.name() !== 'status')
    .forEach(command => {
      const content = render(command);
      writeAdoc(command.name(), command.name(), content);
    });

  const sidebar = makeSidebar(program);
  writeFileSync(path.resolve(outputPath, 'nav.adoc'), sidebar);
}

run();
console.log(`Docs generated in ${path.resolve(outputPath)}`);
