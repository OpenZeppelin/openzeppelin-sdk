# Develop a new zOS Kernel standard library release using `zos`

The **zeppelin_os** kernel handles releases of the standard library. Any developer can register new stdlib releases with the kernel, which can then be vouched for by other users, earning the developer a fraction of the `ZepTokens` staked. The *zos* CLI allows developers to go through this process seamlessly, by creating distributions that handle the different releases of the stdlib. 

The first step is creating a distribution with the following command:
```
zos init-distribution <distribution-name> <kernel-address> --network=<network>.
```
Here, `<distribution-name>` is the name chosen for the distribution, and `<kernel-address>` is the address of the **zeppelin_os** kernel. The `network` parameter states which network will be used for deployment (use `development` for local testing, `ropsten` for testnet, and so on, as defined in your truffle configuration). 

Initializing the distribution will create a `package.zos.json` file that will track the contracts included in the distribution. After this first step, the desired contracts must be individually added to the distribution through:
```
zos add-implementation <contract-name> <alias> --network=<network>,
```
where `<contract-name>` is the name of the contract and the optional `<alias>` is an alternative reference to it. Note that this command must be repeated once for each contract included in the distribution. This will update the `package.zos.json` file with the contract names. 

Finally, we need to deploy the `Package` representing the distribution, the `Release` containing the stdlib, and the individual library contracts, which must then be registered in the kernel. All of this is accomplished by:
```
zos deploy --network=<network>.
```
This command creates a file `package.zos.<network>.json` that, apart from the included contracts, has the address of the `Package` representing the distribution. This completes the deployment of the new stdlib release to the chosen network.

Send your zOS Kernel standard library release address to other developers to get them to use it. If they think it's worth vouching tokens for, send them the guide below and start earning ZEP tokens!
