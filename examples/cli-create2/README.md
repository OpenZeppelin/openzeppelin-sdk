# OpenZeppelin SDK example: using the CREATE2 command

This project contains a sample `index.js` showing how to use the `openzeppelin create2` command. All scripts are executed using the `openzeppelin` javascript interface, though the command-line equivalent is also shown for completion.

## How the command works

This command requires a salt, and uses the CREATE2 opcode to deploy proxies at predictable addresses. By default, it uses the `from` address for deploying the contract and calculating the address, but it can also accept a `signature` of the deployment. When a signature is provided, the signer of such request is used to calculate the deployment address instead of the sender. This allows using a different sender (ie a relay) for performing a deployment signed by a different user.

The `openzeppelin create2` command also accepts a `query` flag that is used to calculate the deployment address, instead of actually executing the deployment.

## Running this project

- Install all dependencies via `npm install` or `lerna bootstrap`
- Start a ganache instance in port 9545 via `ganache-cli --port 9545 --deterministic`
- Run `npx truffle exec index.js --network local`

## Sample output

```
Using network 'local'.

$ openzeppelin session --network dev-1554478908078 --from undefined
> Initialized session on network dev-1554478908078

$ openzeppelin push
> Pushed logic contract to the network

$ openzeppelin create2 --salt 823
> Instance using salt 823 will be deployed at 0x34839B781F16Bc40eD33d894762bEeDdc49eCa74

$ openzeppelin create2 Sample --salt 823 --init --args 10
> Instance deployed at 0x34839B781F16Bc40eD33d894762bEeDdc49eCa74 with value 10

$ openzeppelin create2 Sample --query --salt 938 --signature 0x6980f8b0991446c6cf2967f615915c07e6658f5ab071d33539b729f5fe87f9432aabc363960b6bef3942af7519a6763e389f05a010108e493f60e7e4410408581c --init --args 20
> Instance of Sample initialized with 'initialize(20)' with salt 938 and signature 0x6980f8b0991446c6cf2967f615915c07e6658f5ab071d33539b729f5fe87f9432aabc363960b6bef3942af7519a6763e389f05a010108e493f60e7e4410408581c will be deployed at 0x0FBb9E5C3aE4C82E7a75211ED8Aba3bdDa3703a3

$ openzeppelin create2 Sample --salt 938 --signature 0x6980f8b0991446c6cf2967f615915c07e6658f5ab071d33539b729f5fe87f9432aabc363960b6bef3942af7519a6763e389f05a010108e493f60e7e4410408581c --init --args 20
> Instance deployed at 0x0FBb9E5C3aE4C82E7a75211ED8Aba3bdDa3703a3 with value 20 using signature 0x6980f8b0991446c6cf2967f615915c07e6658f5ab071d33539b729f5fe87f9432aabc363960b6bef3942af7519a6763e389f05a010108e493f60e7e4410408581c
```
