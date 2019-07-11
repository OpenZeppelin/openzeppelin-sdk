---
id: create2
title: Upgradable Create2 Contracts with zOS
---



The CREATE2 opcode gives us the ability to calculate smart contracts addresses without actually deploying them on the Ethereum blockchain. This opens up a lot of possibilities to improve [user onboarding and scalability](https://blog.zeppelinos.org/getting-the-most-out-of-create2/).

In this guide, we will create an `upgradableWallet` contract with a `transfer` method, then we will reserve an address using Create2 without actually deploying Wallet contract and send some ethers to this address. At last, we will actually deploy our Wallet contract and execute transfer method to transfer contract funds to another account.

## Ethereum Accounts

Before diving into Create2, let’s understand a few basic things about Ethereum contract accounts. A contract account 

* has an Ether balance

* has associated code

* code execution is triggered by transactions

Ethereum provides Create opcode to create contract accounts.

## Account creation using Create opcode

Create opcode calculates new addresses as a function of the sender’s address and a nonce.

```console 
contract address = hash(sender, nonce)
```

But there is a major problem with this approch when calculating contract addresses for future use.

Every account has an associated nonce: for EOAs, this nonce is increased on every transaction, for contract accounts, it is increased on every contract created. But there are two conditions for using nonce:

* You can’t reuse a nonce.

* Nonce has to process in sequential order. For example, let’s say our latest transaction’s nonce was 101, now if we send a new transaction with a nonce of either 103 or higher, the transaction will not be processed until a transaction with nonce 102 has been processed. 

Because of these two conditions, we can’t rely on nonce as any arbitrary transaction in future can replace our contract.  

Hence Create opcode does not help us with calculating contract addresses in a secure and deterministic way for future use (parking an address).

## Create2

To solve this problem [EIP-1014](https://eips.ethereum.org/EIPS/eip-1014) introduced Create2 opcode which gives us the ability to calculate a contract address without actually deploying a contract.

Create2 calculates new addresses as a function of

* 0xFF (fixed value to prevent collision with Create opcode addresses)

* Sender’s address

* A salt (A random number given by the user)

* Contract creation code

```console 
contract address = hash(0xFF,sender, salt, contract creation code)
```


Here, salt is an independent value and will produce the same contract address when used with the same sender address and contract creation code. This allows a secure and deterministic way to calculate contract addresses.

## Create2 with zOS

Zeppelin OS supports the creation of **upgradeable** smart contracts using zos Create2 . Let’s [setup](https://docs.zeppelinos.org/docs/first.html#setting-up-your-project) our project and use CLI to initialize a ZeppelinOS project:

 ```console 
 zos init 
 ```


Next, we will create an upgradableWallet contract with a transfer method. We will reserve an address for it using Create2 and send some ethers to this contract without deploying it. In the end, we will actually deploy our Wallet contract and execute transfer method to transfer contract funds to another account.

## Add Wallet.sol

Next, we will add a Wallet.sol file in our contracts folder.
```solidity
pragma solidity ^ 0.5.0;
import "zos-lib/contracts/Initializable.sol";

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

Now, we need to install and run [Ganache](https://docs.zeppelinos.org/docs/first.html#deploying-to-a-development-network) to deploy our contracts on local development blockchain.

## Deploying Contract using Create2

Before deploying, we need to add our contract usingzos add, this will add our contract to ZeppelinOS project, so it can be deployed using zos push afterward.

```console 
zos add Wallet 
```

Now we will generate contract address using zos create2, we will use 12345 as salt, you can choose any random number and --query option tells zOS that we want to compute address, not the actual deployment of the contract. We will also pass network information using -n development, you can find this configuration in networks.js file.

```console 
$ zos create2 --salt 12345 --query -n development

✓ Deployed ProxyFactory at 0x4e08589Cd399474157f24f591B9fB100D1adD5d9

Any contract created with salt 12345 will be deployed to the following address

0x4e08589Cd399474157f24f591B9fB100D1adD5d9
```

> Note : Here zOS using proxy contract code as contract creation code under the hood and 0x4e08589Cd399474157f24f591B9fB100D1adD5d9 is computed address but contract is still not deployed on this address. Owner of Wallet contract is 0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1.

## Interacting with the Contract

Now, We will send 10 ether to our newly generated contract address using zos transfer.

```console 
$ zos transfer

Pick a network: development

Choose the account to send transactions from: 0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1

Enter the receiver account: 0x4e08589Cd399474157f24f591B9fB100D1adD5d9

Enter an amount to transfer: 10 ether

✓ Funds sent.

Transaction hash: 0xbcaefc07f4e03a69456f3cb40a1998a597914eb1352470ee01991631cab35c4a
```

> Note: Ganache provides us ten addresses with 100 Ether in each of them. These are test ethers, do not send or use them as real ether.

Next, we will verify Wallet contract balance and the sender’s balance using zos balance

```console 
-- Contract balance

$ zos balance 0x4e08589Cd399474157f24f591B9fB100D1adD5d9
Balance: 10 ETH

-- Sender's balance

$ zos balance 0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1Balance 
Balance: 89.97829973 ETH
```

> Note: Here 0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1 is sender as well as owner of our Contract.

## Deploy Wallet Contract

Now we will deploy our contract and withdraw 10 Ethers which we sent above.

To deploy first we need to execute zos push , which deploys our logic contract (with the code) and then create2 which deploys our proxy contract.
> Note: In zOS every contract is actually a combination of two contracts: [A proxy contract and a logic contract.](https://blog.zeppelinos.org/the-transparent-proxy-pattern/) Proxy pattern enables upgradibility in zOS.

```console 
zos push

zos create2 Wallet --salt 12345 --init --args 0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1 -n development
```

> Note: We are using same salt 12345 and mentioning ccontract owner address 0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1 which was used to initialize our Wallet contract above.

## Transfer Fund from Contract

Now, we will transfer funds from our Wallet contract using zos send-tx to another address 0xffcf8fdee72ac11b5c542428b35eef5769c409f0 . Remember, we have sent 10 ethers without deploying our contract above. 
```console 
$ zos send-tx

Pick an instance Wallet at 0x4e08589Cd399474157f24f591B9fB100D1adD5d9

Select which function transfer(receiver: address)

receiver (address): 0xffcf8fdee72ac11b5c542428b35eef5769c409f0

✓ Transaction successful. Transaction hash: 0xef464fecd93b609a001c1d439e89c77484797b217587ee8fb907531df9489275
```

> Note: We have *transfer* method in our *Wallet* contract, which will transfer contract funds to a given account. Here, we are tranferring funds to a receiver account 0xffcf8fdee72ac11b5c542428b35eef5769c409f0, it is one of the 10 accounts which Ganache provided us. 

Now, let’s check the balance of the contract and the receiver account using zos balance, contract balance should be 0 now as all the funds are transferred to the receiver's account.
```console 
-- Contract balance

$ zos balance 0x4e08589Cd399474157f24f591B9fB100D1adD5d9
Balance: 0 ETH

-- Receiver's balance

$ zos balance 0xffcf8fdee72ac11b5c542428b35eef5769c409f0
Balance: 110 ETH
 ```

> Note: Our Wallet contract is upgradeable and we can upgrade our contract using zos upgrade command.

## Wrapping up

To summarize, let’s see what we have learned so far, we have created an upgradable smart contract Wallet using Create2 and sent some ether into it, then we actually deployed the contract and executed transfer method to send funds to another account.

That’s it!! Now you know how to use Create2 to reserve an address and deploy upgradable contracts, [here](https://blog.zeppelinos.org/getting-the-most-out-of-create2/) is our blog post if you want to deep dive into Create2 and its use cases in *counterfactual instantiation *and* user onboarding.* In the next tutorial, we will learn how to create contracts using another contract.




