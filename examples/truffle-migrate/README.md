# Sample ZeppelinOS project with truffle migrations

This is a sample ZeppelinOS project that runs `zos` from truffle migrations, using the CLI javascript interface. 
This allows any project that currently relies on truffle migrations to switch over to `zos`, thus deploying 
upgradeable instances instead of regular ones. Also, by using the CLI interface, `zos` keeps track of all deployed 
logic contracts and all upgradeable instances, and also tracks them in truffle build artifacts.

## Running this project

To run this project locally, first install all dependencies with `npm install`, and then start a ganache instance by 
running `npx ganache-cli -p 9545`. Next, run all migrations via `npx truffle migrate --network local`. Finally, check 
the state of the deployment via `npm run check`.

## The code

All relevant code is in the two `deploy` scripts in the `migrations` folder. These scripts will each register a 
different version of a contract `MyContract`, push the logic contract to the network, and then either create a new 
instance, or upgrade the existing one. The script in `index.js` then checks the deployment state, retrieving the 
deployed instance via truffle's `MyContract.deployed()`.

### Initial deployment

```js
// Register v0 of MyContract in the zos project
add({ contractsData: [{ name: 'MyContract_v0', alias: 'MyContract' }] });

// Push implementation contracts to the network
await push(options);

// Create an instance of MyContract, setting initial value to 42
await create(Object.assign({ contractAlias: 'MyContract', initMethod: 'initialize', initArgs: [42] }, options));
```

### Upgrade

```js
// Register v1 of MyContract in the zos project as MyContract
add({ contractsData: [{ name: 'MyContract_v1', alias: 'MyContract' }] });

// Push implementation contracts to the network
await push(options);

// Update instance, adding +10 to value as part of the migration
await update(Object.assign({ contractAlias: 'MyContract', initMethod: 'add', initArgs: [10] }, options));
```

### Boilerplate

Due to limitations on how global variables are managed within truffle scripts, both deployment functions need to be 
run after the `ConfigVariablesInitializer` object exported by `zos` CLI is called. We have ongoing efforts to remove this restriction 
in the near future.