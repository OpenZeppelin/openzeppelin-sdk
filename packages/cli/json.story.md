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
  "stdlib": "???"
}

// -------------------------------------------------------------
// 2. Adds the first basil implementation to the project
$ zos add-implementation Basil_v0.sol Basil
// -------------------------------------------------------------

// -> package.zos.json
{
  "name": "Basil",
  "version": "0.0.1",
  "contracts": {
    "Basil": "Basil_v0.sol" // <-----------------------------
  },
  "stdlib": "???"
}

// -------------------------------------------------------------
// 3. Sync on development network
$ zos sync --network development
// -------------------------------------------------------------

// -> package.zos.json
{
  "name": "Basil",
  "version": "0.0.1",
  "contracts": {
    "Basil": "Basil_v0.sol"
  },
  "stdlib": "???"
}

// -> package.zos.development.json // <-----------------------------
{
  "app": {
    "address": "0x123",
    "version": "0.0.1"
  },
  "proxies": {},
  "package": {
    "contracts": {
      "Basil": "0x123"
    },
    "stdlib": "???"
  }
}

// -------------------------------------------------------------
// 4. Creates a proxy for Basil
$ zos create-proxy Basil --network development
// -------------------------------------------------------------

// -> package.zos.json
{
  "name": "Basil",
  "version": "0.0.1",
  "contracts": {
    "Basil": "Basil_v0.sol"
  },
  "stdlib": "???"
}

// -> package.zos.development.json
{
  "app": {
    "address": "0x123",
    "version": "0.0.1"
  },
  "proxies": {
    "Basil": [ // <------------------------------------------------
      {
        "address": "0x123",
        "version": "0.0.1"
      }
    ]
  },
  "package": {
    "contracts": {
      "Basil": "0x123"
    },
    "stdlib": "???"
  }
}

// -------------------------------------------------------------
// SOME MONTHS LATER...
// 6. Creates a new version of the app
$ zos version 0.0.2
// -------------------------------------------------------------

// -> package.zos.json
{
  "name": "Basil",
  "version": "0.0.2", // <----------------------------------
  "contracts": {}, // <-----------------------------
  "stdlib": "???"
}

// -> package.zos.development.json
// same

// -------------------------------------------------------------
// 7. Adds a new implementation of basil
$ zos add Basil Basil_v1.sol
// -------------------------------------------------------------

// -> package.zos.json
{
  "name": "Basil",
  "version": "0.0.2",
  "contracts": {
    "Basil": "Basil_v1.sol" // <---------------------------------
  },
  "stdlib": "???"
}

// -> package.zos.development.json
// same

// -------------------------------------------------------------
// 8. Sync on development network
$ zos sync --network development
// -------------------------------------------------------------

// -> package.zos.json
{
  "name": "Basil",
  "version": "0.0.2",
  "contracts": {
    "Basil": "Basil_v1.sol" 
  },
  "stdlib": "???"
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
        "address": "0x123",
        "version": "0.0.2" 
      }
    ]
  },
  "package": {
    "contracts": {
      "Basil": "0x456" // CHANGED ADDRESS <---------------------------------------
    },
    "stdlib": "???"
  }
}

// -------------------------------------------------------------
// 9. Upgrades Basil's proxy
$ zos upgrade Basil --network development
// -------------------------------------------------------------

// -> package.zos.json
{
  "name": "Basil",
  "version": "0.0.2",
  "contracts": {
    "Basil": "Basil_v1.sol" 
  },
  "stdlib": "???"
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
        "address": "0x123",
        "version": "0.0.2" // CHANGED <-----------------------------------
      }
    ]
  },
  "package": {
    "contracts": {
      "Basil": "0x456" 
    },
    "stdlib": "???"
  }
}
