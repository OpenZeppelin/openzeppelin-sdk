---
id: version-2.0.0-upgradeability_governance
title: Upgradeability Governance in ZeppelinOS
sidebar_label: Upgradeability governance
original_id: upgradeability_governance
---

## Introduction

ZeppelinOS provides the chance to have upgradeable smart contracts which follows the immutability rules guaranteed by
the Ethereum blockchain. However, it is desirable to have a mechanism that allows all parties involved to decide on
whether a contract should be upgraded or not, instead of having an unilateral decision.

Given that there are many projects already working on really good solutions to achieve decentralized governance,
we've been exploring some of them to study how they can be integrated with ZeppelinOS to manage contracts upgradeability.
In this case, we will use a multisignature wallet.

## Getting started

A multisig is a contract that can execute arbitrary transactions, with the restriction that a certain number of owners
must agree upon them. We highly recommend using the [Gnosis MultiSig Wallet](https://github.com/gnosis/MultiSigWallet),
which was [audited by the Zeppelin team](https://blog.zeppelin.solutions/gnosis-multisig-wallet-audit-d702ff0e2b1e) and
has a [useful dApp](https://wallet.gnosis.pm/) for submitting and confirming transactions. You can use it easily to
deploy your own multisig wallet.

![](https://lh5.googleusercontent.com/CqtaZkTZqJ_jT9vdQdPj-CNj304InYItfIBi5LnWrnsySGNOpN0HVu9DFIZbE1TpIq20ZN-3bAB1fNhFQiD_fTKqoLFyzQR7bLmmyfMJZABQMYMOnOzfTrsAkk_sgxeEQTriSJAB)

Once inside your ZeppelinOS project, let's suppose we have an arbitrary contract called `MyContract`. Now let's see how
we can create an upgradeable instance of it being handled by a multisig wallet. In order to do that, we will need first
to register this contract, push it to the network and create a new upgradeable instance of it as we explained in the
previous sections:

```console
zos add MyContract
zos push -n ropsten
zos create MyContract -n ropsten
```

We have our contract deployed to the `ropsten` network, with an instance of our `MyContract` contract up and running.
At this point, the ownership of the project is being controlled by the deployer account, which can unilaterally
decide when to upgrade any of its contracts.

## Transferring control

Since we want to avoid having a single account with full control over our `MyContract` instance, we’ll transfer control
of it to our multisig contract. To do this, we’ll use the `set-admin` command to yield control to the multisig account.

```console
zos set-admin [MYCONTRACT_ADDRESS] [MULTISIG_ADDRESS] -y
```

> Please remember to replace `[MYCONTRACT_ADDRESS]` by the address of the upgradeable instance of `MyContract` we
created above. Additionally, `[MULTISIG_ADDRESS]` should be replaced by the address of your multisig wallet contract.

> The `-y` option is mandatory to carry out this action. Bear in mind that this could be an irreversible operation in
case you specify an incorrect admin address.

Now, if we want to upgrade our `MyContract` instance to a new version, we’ll need to perform the operation from the
multisig contract. Note that we have transferred only the ownership of our `MyContract` instance. If we had created
more instances of `MyContract`, or of any other contract, they would still be under control of the deployer account.

The same applies to our ZeppelinOS app. This allows us to keep interacting with our project via the CLI, by creating new
instances or registering new logic contracts, as we’ll be doing in the next step.

## Uploading a new version

Let’s suppose we extend the functionality somehow. The first step is to upload this new logic contract to the blockchain.
Since the whole project is still managed by our deployer account, we can easily do that from the CLI by running:

```console
zos add MyContract
zos push
```

Now that our new logic contract is uploaded to the network, we can proceed to upgrade our `MyContract` instance.

## Upgrading our contract instance

At this point, if we attempt to upgrade our `MyContract` instance to the new version through the CLI, we’ll get an error
since the deployer account no longer has upgradeability rights over the contract instance. We need to go through the
multisig to perform this operation, as the CLI’s account.

Let’s submit a transaction to the multisig wallet for our contract instance to be upgraded. We can do this from the
Gnosis dApp by including the contract’s ABI and choosing to invoke `upgradeTo`. We also need to supply the address of
the new implementation, which can be found in the output of the last `zos push` command or in the `zos.ropsten.json`
file.

![](https://lh3.googleusercontent.com/Wi76B5WGVs8_qGD1GPVYpA5oOF4hEVt1mfl1grCszZRfxRlkPS1PsPxm9-Kpm0NfX0qlmq-5rUNfXdEJrIlH8gJK9TNW7NjlZ_QVqAuv5JZRFW-zQNxATQpA9OapPq_6J85nzTLz)

This will create a new transaction in the multisig wallet for the `MyContract` instance to be upgraded to the latest
`MyContract` implementation. However, since this requires the approval of at least another multisig owner, the upgrade
is still pending.

![](https://lh3.googleusercontent.com/twzAZicQUubRZaPJpj0ZmjnRICKKkC28LyP6p-CgHH15N3ZVqrlOXuptOBR_hRbIqAxLF8K5sW9SnX3QjidDEKZ2fZ8BBdSGZXn_oibjWOm4Vgu1BshMN3zTgWM6KCafAcN2saHI)

As soon as another owner of the multisig account confirms this transaction, it will be executed on the spot and our
`MyContract` instance contract will be upgraded to the desired version, allowing us to make use of the new functionality
we built.
