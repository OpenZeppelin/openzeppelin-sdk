~~~ ALL THIS IS PSEUDO CODE ~~~

// -------------------------------------------------------------
// 1. Initializes the project
$ zos init Basil 0.0.1
// -------------------------------------------------------------

// -> package.zos.json // <--------------------------
{
  "name": "Basil",
  "version": "0.0.1",
  "contracts": {},
  "stdlib": {}
}

// -------------------------------------------------------------
// 2. Adds the first basil implementation to the project
$ zos add-implementation Basil_v0 Basil
// -------------------------------------------------------------

// -> package.zos.json
{
  "name": "Herbs",
  "version": "0.0.1",
  "contracts": {
    "Basil": "Basil_v0" // <-----------------------------
  },
  "stdlib": {}
}

// -------------------------------------------------------------
// 3. Sync on development network
$ zos sync --network development
// -------------------------------------------------------------

// -> package.zos.json
{
  "name": "Herbs",
  "version": "0.0.1",
  "contracts": {
    "Basil": "Basil_v0"
  },
  "stdlib": {}
}

// -> package.zos.development.json // <-----------------------------
{
  "app": {
    "address": "0x101",
    "version": "0.0.1"
  },
  "proxies": {},
  "contracts": {
    "Basil": "0x123"
  },
  "stdlib": {},
  "provider": "0x780"
}

// -------------------------------------------------------------
// 4. Creates a proxy for Basil
$ zos create-proxy Basil --network development
// -------------------------------------------------------------

// -> package.zos.json
{
  "name": "Herbs",
  "version": "0.0.1",
  "contracts": {
    "Basil": "Basil_v0"
  },
  "stdlib": {}
}

// -> package.zos.development.json
{
  "app": {
    "address": "0x101",
    "version": "0.0.1"
  },
  "proxies": {
    "Basil": [ // <------------------------------------------------
      {
        "address": "0x321",
        "version": "0.0.1"
      }
    ]
  },
  "contracts": {
    "Basil": "0x123"
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
  "name": "Herbs",
  "version": "0.0.2", // <----------------------------------
  "contracts": {}, // <-----------------------------
  "stdlib": {}
}

// -> package.zos.development.json
// same

// -------------------------------------------------------------
// 7. Adds a new implementation of basil
$ zos add Basil Basil_v1
// -------------------------------------------------------------

// -> package.zos.json
{
  "name": "Herbs",
  "version": "0.0.2",
  "contracts": {
    "Basil": "Basil_v1" // <---------------------------------
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
  "name": "Herbs",
  "version": "0.0.2",
  "contracts": {
    "Basil": "Basil_v1" 
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
    "Basil": [
      {
        "address": "0x321",
        "version": "0.0.1" 
      }
    ]
  },
  "contracts": {
    "Basil": "0x456" // CHANGED ADDRESS <---------------------------------------
  },
  "stdlib": {},
  "provider": "0x987"
}

// -------------------------------------------------------------
// 9. Upgrades Basil's proxy
$ zos upgrade 0x321 Basil --network development
// -------------------------------------------------------------

// -> package.zos.json
{
  "name": "Herbs",
  "version": "0.0.2",
  "contracts": {
    "Basil": "Basil_v1" 
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
    "Basil": [
      {
        "address": "0x321",
        "version": "0.0.2" // CHANGED <-----------------------------------
      }
    ]
  },
  "contracts": {
    "Basil": "0x456" 
  },
  "stdlib": {},
  "provider": "0x987"
}
