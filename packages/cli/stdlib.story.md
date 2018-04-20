Scenario 1: develop stdlib
$ init --release OpenZeppelin 0.1.0
$ add-implementation ERC20 ERC20v0
$ deploy


Scenario 2: vouching for a stdlib version


--------


// -------------------------------------------------------------
// 1. Initializes the release
$ zos init --release OpenZeppelin 0.1.0
// -------------------------------------------------------------

// -> package.zos.json // <--------------------------
{
  "name": "OpenZeppelin",
  "version": "0.1.0",
  "contracts": {},
  "stdlib": {}
}

// -------------------------------------------------------------
// 2. Adds the first ERC20 implementation to the project
$ zos add-implementation ERC20_v0 ERC20
// -------------------------------------------------------------

// -> package.zos.json
{
  "name": "OpenZeppelin",
  "version": "0.1.0",
  "contracts": {
    "ERC20": "ERC20_v0" // <-----------------------------
  },
  "stdlib": {}
}

// -------------------------------------------------------------
// 3. Sync on development network
$ zos deploy --network development
// -------------------------------------------------------------

// -> package.zos.json
{
  "name": "OpenZeppelin",
  "version": "0.1.0",
  "contracts": {
    "ERC20": "ERC20_v0"
  },
  "stdlib": {},
}

// -> package.zos.development.json // <-----------------------------
{
  "app": {
    "address": "0x101",
    "version": "0.1.0"
  },
  "proxies": {},
  "contracts": {
    "ERC20": "0x123"
  },
  "stdlib": {},
  "provider": "0x780"
}

// -------------------------------------------------------------
// 4. Creates a proxy for ERC20
$ zos create-proxy ERC20 --network development
// -------------------------------------------------------------

// -> package.zos.json
{
  "name": "OpenZeppelin",
  "version": "0.1.0",
  "contracts": {
    "ERC20": "ERC20_v0"
  },
  "stdlib": {}
}

// -> package.zos.development.json
{
  "app": {
    "address": "0x101",
    "version": "0.1.0"
  },
  "proxies": {
    "ERC20": [ // <------------------------------------------------
      {
        "address": "0x321",
        "version": "0.1.0"
      }
    ]
  },
  "contracts": {
    "ERC20": "0x123"
  },
  "stdlib": {},
  "provider": "0x780"
}

// -------------------------------------------------------------
// SOME MONTHS LATER...
// 6. Creates a new version of the app
$ zos version 0.0.2
// -------------------------------------------------------------

// -> package.zos.json
{
  "name": "OpenZeppelin",
  "version": "0.0.2", // <----------------------------------
  "contracts": {}, // <-----------------------------
  "stdlib": {}
}

// -> package.zos.development.json
// same

// -------------------------------------------------------------
// 7. Adds a new implementation of ERC20
$ zos add ERC20 Basil_v1
// -------------------------------------------------------------

// -> package.zos.json
{
  "name": "OpenZeppelin",
  "version": "0.0.2",
  "contracts": {
    "ERC20": "Basil_v1" // <---------------------------------
  },
  "stdlib": {}
}

// -> package.zos.development.json
// same

// -------------------------------------------------------------
// 8. Sync on development network
$ zos sync --network development
// -------------------------------------------------------------

// -> package.zos.json
{
  "name": "OpenZeppelin",
  "version": "0.0.2",
  "contracts": {
    "ERC20": "Basil_v1" 
  },
  "stdlib": {}
}

// -> package.zos.development.json
{
  "app": {
    "address": "0x101",
    "version": "0.0.2"
  },
  "proxies": {
    "ERC20": [
      {
        "address": "0x321",
        "version": "0.1.0" 
      }
    ]
  },
  "contracts": {
    "ERC20": "0x456" // CHANGED ADDRESS <---------------------------------------
  },
  "stdlib": {},
  "provider": "0x987"
}

// -------------------------------------------------------------
// 9. Upgrades ERC20's proxy
$ zos upgrade 0x321 ERC20 --network development
// -------------------------------------------------------------

// -> package.zos.json
{
  "name": "OpenZeppelin",
  "version": "0.0.2",
  "contracts": {
    "ERC20": "Basil_v1" 
  },
  "stdlib": {}
}

// -> package.zos.development.json
{
  "app": {
    "address": "0x123",
    "version": "0.0.2"
  },
  "proxies": {
    "ERC20": [
      {
        "address": "0x321",
        "version": "0.0.2" // CHANGED <-----------------------------------
      }
    ]
  },
  "contracts": {
    "ERC20": "0x456" 
  },
  "stdlib": {},
  "provider": "0x987"
}