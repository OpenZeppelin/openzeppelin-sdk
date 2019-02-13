import React from 'react'
import { Usage, Options, Description } from './Shared';

export default function Command({ command }) {
  return (
    <div className='cli-command'>
      <h2 className='cli-title'>{command.name()}</h2>
      <Usage name={command.name()} usage={command.usage()} />
      <Description description={command.description()} />
      <Options options={command.options} />
    </div>
  );
}

