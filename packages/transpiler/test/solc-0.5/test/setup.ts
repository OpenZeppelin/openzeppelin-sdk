import fs from 'fs-extra';

export const artifacts = fs.readdirSync('./build/contracts/').map(file => {
  return JSON.parse(fs.readFileSync(`./build/contracts/${file}`).toString());
});
