# Sample use case of ZeppelinOS programmatic library

ZeppelinOS has a JavaScript library that (besides `zos` CLI ) can be used directly to operate ZeppelinOS projects. It can be especially useful when a programmatic interface is preferred or more flexibility and lower-level access is required. 

## How simple-lib works

This project contains two smart contracts: `MyContractV0` and `MyContractV1`. The V1 contract is an upgrade for the V0 contract and we use ZeppelinOS library to apply this upgrade. 

`index.js` script executes the process of creating an upgradeable instance of V0 contract and upgrading it to V1.

## Running this project

To run this project locally first, install all dependencies with:

 `$ npm install`

Then start a ganache instance by running:

 `$ npx ganache-cli -p 9545`. 

Next run `index.js` script using the command:

`$ npm run start`