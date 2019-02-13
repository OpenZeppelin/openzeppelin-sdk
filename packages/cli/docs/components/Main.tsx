import React from 'react';
import { Usage, Options } from './Shared';

export default function Main({ program }) {
  return (
    <div className='cli-command'>
      <h2 className='cli-title'>{program.name()}</h2>
      <Usage name={program.name()} usage={program.usage()} />
      <Options options={program.options} />
      <Commands commands={program.commands} />
    </div>
  );
}

function Commands({ commands }) {
  return null;
}
