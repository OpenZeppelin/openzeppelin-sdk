---
id: CREATE2
title: Using CREATE2 for deploying precomputed addresses
---

The CREATE2 opcode gives us the ability to calculate smart contracts addresses without actually deploying them on the Ethereum blockchain. This opens up a lot of possibilities to improve [user onboarding and scalability](https://blog.zeppelinos.org/getting-the-most-out-of-create2/).

In this guide, we will create an upgradable `Wallet` contract with a `transfer` method, then we will reserve an address using CREATE2 without actually deploying `Wallet` contract and send some `ethers` to this address. At last, we will actually deploy our `Wallet` contract and execute `transfer` method to transfer contract funds to another account.

## Contract creation using CREATE opcode

The `CREATE` opcode calculates new addresses as a function of the sender’s address and a nonce.

```console 
contract address = hash(sender, nonce)
```

But there is a major problem with this approch when calculating contract addresses for future use.

Every account has an associated nonce: for EOAs, this nonce is increased on every transaction, for contract accounts, it is increased on every contract created. But there are two conditions for using nonce:

* You can’t reuse a nonce.

* Nonce has to process in sequential order. For example, let’s say our latest transaction’s nonce is 101, now if we send a new transaction with a nonce of either 103 or higher, the transaction will not be processed until a transaction with nonce 102 has been processed. 

Because of these two conditions, we can’t rely on nonce as any arbitrary transaction in future can replace our contract.  

Hence the `CREATE` opcode does not help us with calculating contract addresses in a secure and deterministic way for future use (ie parking an address).

## CREATE2

To solve this problem [EIP-1014](https://eips.ethereum.org/EIPS/eip-1014) introduced CREATE2 opcode which gives us the ability to calculate a contract address without actually deploying a contract.

CREATE2 calculates new addresses as a function of

* 0xFF (fixed value to prevent collision with Create opcode addresses)

* Sender’s address

* A salt (A random number given by the user)

* Contract creation code

```console 
contract address = hash(0xFF,sender, salt, contract creation code)
```

Here, `salt` is an independent value and will produce the same contract address when used with the same sender address and contract creation code. This allows a secure and deterministic way to calculate contract addresses for future use.

## CREATE2 with OpenZeppelin SDK

The OpenZeppelin SDK supports the creation of **upgradeable** smart contracts using openzeppelin CREATE2 . Let’s [setup](https://docs.zeppelinos.org/docs/first.html#setting-up-your-project) our project and use CLI to initialize an OpenZeppelin SDK project:

 ```console 
 openzeppelin init 
 ```

Next, we will create an upgradable `Wallet` contract with a `transfer` method. We will reserve an address for it using CREATE2 and send some `ethers` to this contract without deploying it. In the end, we will actually deploy our `Wallet` contract and execute `transfer` method to transfer contract funds to another account.

## Add Wallet.sol

Now, create a `Wallet.sol` file in your `contracts` folder:

```solidity
pragma solidity ^ 0.5.0;
import "@openzeppelin/upgrades/contracts/Initializable.sol";

contract Wallet is Initializable {
  address owner;
  function initialize(address _owner) initializer public {
    owner = _owner;
  }
  
  function transfer(address payable receiver) public {
    require(owner == msg.sender);
    receiver.transfer(address(this).balance);
  }
}
```

Now, we need to install and run [Ganache](https://docs.zeppelinos.org/docs/first.html#deploying-to-a-development-network) to deploy our contracts on our local development blockchain.

## Deploying a contract using CREATE2

Before deploying, we need to add our contract using `openzeppelin add`, this will add our contract to our OpenZeppelin SDK project, so it can be deployed using `openzeppelin push` afterward.

```console 
openzeppelin add Wallet 
```

Now, we will generate contract address using `openzeppelin create2`, we will use `12345` as salt, you can choose any random number and `--query` option tells openzeppelin that we want to compute address, not the actual deployment of the contract. We will also pass network information using `-n development`, you can find this configuration in networks.js file.

```console 
$ openzeppelin create2 --salt 12345 --query -n development
✓ Deployed ProxyFactory at 0x4e08589Cd399474157f24f591B9fB100D1adD5d9

Any contract created with salt 12345 will be deployed to the following address
0x4e08589Cd399474157f24f591B9fB100D1adD5d9
```

> Note : Here openzeppelin using proxy contract code as contract creation code under the hood and 0x4e08589Cd399474157f24f591B9fB100D1adD5d9 is computed address but contract is still not deployed on this address. Owner of Wallet contract is 0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1.

## Interacting with the Contract

Now, we will send 10 ethers to our newly generated contract address using `openzeppelin transfer`.

```console 
$ openzeppelin transfer

Pick a network: development
Choose the account to send transactions from: 0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1
Enter the receiver account: 0x4e08589Cd399474157f24f591B9fB100D1adD5d9
Enter an amount to transfer: 10 ether

✓ Funds sent.
Transaction hash: 0xbcaefc07f4e03a69456f3cb40a1998a597914eb1352470ee01991631cab35c4a
```

> Note: Ganache provides us ten addresses with 100 ethers in each of them. These are test ethers, do not send or use them as real ether.

Next, we will verify the `Wallet` contract balance and the sender’s balance using `openzeppelin balance`

```console 
$ openzeppelin balance 0x4e08589Cd399474157f24f591B9fB100D1adD5d9
Balance: 10 ETH
```

```
$ openzeppelin balance 0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1Balance 
Balance: 89.97829973 ETH
```

> Note: Here 0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1 is sender as well as owner of our `Wallet` contract.

## Deploy the wallet contract

Now, we will deploy our contract and withdraw 10 ethers which we sent above.

To deploy first we need to execute `openzeppelin push` , which deploys our logic contract (with the code) and then `create2` which deploys our proxy contract.

> Note: In openzeppelin every contract is actually a combination of two contracts: [a proxy contract and a logic contract](https://blog.zeppelinos.org/the-transparent-proxy-pattern/).

```console 
openzeppelin push
openzeppelin create2 Wallet --salt 12345 --init --args 0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1 -n development
```

> Note: We are using same salt `12345` and mentioning ccontract owner address 0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1 which was used to initialize our `Wallet` contract above.

## Transfer funds from the contract

Now, we will transfer funds from our `Wallet` contract using `openzeppelin send-tx` to another address 0xffcf8fdee72ac11b5c542428b35eef5769c409f0 . Remember, we have sent 10 ethers without deploying our contract above. 

```console 
$ openzeppelin send-tx

Pick an instance: Wallet at 0x4e08589Cd399474157f24f591B9fB100D1adD5d9
Select which function: transfer(receiver: address)
receiver (address): 0xffcf8fdee72ac11b5c542428b35eef5769c409f0

✓ Transaction successful. Transaction hash: 0xef464fecd93b609a001c1d439e89c77484797b217587ee8fb907531df9489275
```

> Note: We have `transfer` method in our `Wallet` contract, which will transfer contract's funds to a given account. Here, we are tranferring funds to a receiver account 0xffcf8fdee72ac11b5c542428b35eef5769c409f0, it is one of the 10 accounts which Ganache provided us. 

Now, let's check the balance of the `Wallet` contract and the receiver's account using `openzeppelin balance`, `Wallet` contract balance should be 0 now as all the funds are transferred to the receiver's account.

```console 
$ openzeppelin balance 0x4e08589Cd399474157f24f591B9fB100D1adD5d9
Balance: 0 ETH
```

```console
$ openzeppelin balance 0xffcf8fdee72ac11b5c542428b35eef5769c409f0
Balance: 110 ETH
 ```

> Note: Our `Wallet` contract is upgradeable and we can upgrade it using `openzeppelin upgrade` command.

## Wrapping up

To summarize, let’s see what we have learned so far. We have created an upgradable smart contract `Wallet` using CREATE2 and funded it with 10 ethers, then we actually deployed the contract and executed `transfer` method to send funds to another account.

That’s it!1 Now you know how to use CREATE2 to reserve an address and deploy upgradable contracts, [here](https://blog.zeppelinos.org/getting-the-most-out-of-create2/) is our blog post if you want to deep dive into CREATE2 and its use cases in *counterfactual instantiation* and *user onboarding*.




