import React from 'react'

export function Usage({ name, usage }) {
  return (
    <p className="cli-usage">
      Usage: <code>{name} {usage}</code>
    </p>
  );
}

export function Options({ options }) {
  return (
    <dl>
      <dt><span>Options:</span></dt>
      <dd>
      {options.map(option => (
        <div key={option.flags}>
          <code>{option.flags}</code> {option.description}
        </div>
      ))}
      </dd>
    </dl>
  );
}

export function Description({ description }) {
  return (
    <p>
      {description.split('\n').reduce((arr, line, i) => arr.concat([line, (<br key={i} />)]), [])}
    </p>
  );
}