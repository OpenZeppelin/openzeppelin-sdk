#!/usr/bin/env node

import React from 'react';
import program from '../../src/bin/program';
import { renderToStaticMarkup } from 'react-dom/server';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import Main from '../components/Main';
import Command from '../components/Command';
import path from 'path';
import process from 'process';

const outputPath = 'docs/build';

function formatContent(id, title, content) {
  return `---
id: cli_${id}
title: ${title}
---

${content}
`;
}

function writeMd(id, title, content) {
  const data = formatContent(id, title, content);
  writeFileSync(path.resolve(outputPath, `cli_${id}.md`), data);
}

function makeSidebar(program) {
  const commands = program.commands.map(command => `cli_${command.name()}`)
  return {
    'cli-api': {
      commands: ['cli_main', ...commands]
    }
  };
}

function run() {
  if (!existsSync(outputPath)) {
    mkdirSync(outputPath);
  }

  const main = renderToStaticMarkup(React.createElement(Main, { program }));
  writeMd('main', 'zos', main);

  program.commands.forEach(command => {
    const content = renderToStaticMarkup(React.createElement(Command, { command }));
    writeMd(command.name(), command.name(), content);
  });

  const sidebar = makeSidebar(program);
  writeFileSync(path.resolve(outputPath, 'sidebars.json'), JSON.stringify(sidebar, null, 2));
}

run();
console.log(`Docs generated in ${process.cwd()}/${outputPath}`);
