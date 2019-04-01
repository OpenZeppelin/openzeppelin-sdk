# Sample ZeppelinOS project - creating upgradeable contracts from the factory

This project demonstrates how to create instances of upgradeable contracts using contract factory. It consists of two smart contracts: `Instance` (a simple contract that stores a *value*) and `Factory` which is a contract factory to create `Instance` contracts. In this example, we use the script executed with Truffle, but the entire process can be also done from the `zos` CLI.



## Running the project

To run this project locally first, install all dependencies with:

 `$ npm install`

Then start a ganache instance by running:

 `$ npx ganache-cli -p 9545`. 

Next run `index.js` script using the command:

`$ npm run start`



## The code

`index.js` script executes the whole process of the creation of upgradeable contracts from another contract including contracts compilation, `zos` project initiation, registering contracts in `zos` project, pushing them to the network, creating `Factory` contract and then using it to create upgradeable `Instance` contract.

