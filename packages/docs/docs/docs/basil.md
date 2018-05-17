---
id: basil
title: Zeppelin's Basil
sidebar_label: Basil
---

Here at the Zeppelin headquarters we have a basil plant. She is a good mascot, always green, always faithful. For reasons unknown, we found that she enjoys a lot being under a light that changes color; so of course we got her the best multicolor LED bulb we could find.

![The Basil](https://pbs.twimg.com/media/DdL2qciX4AEMeoR.jpg "The basil")

However, after a few days we started having conflicts. Who gets the honor to set the light color for our friendly plant? What if they choose their favorite color instead of the one that's best for the plant? For how long do they get to keep their chosen color? We also found that somebody kept resetting the color back to an ugly lime green every morning. We are ok with anarchy, but we want transparency, so we have just decided to control the light bulb through a contract on the Ethereum blockchain.

First we will need to [install Node.js following the instructions from their website](https://nodejs.org/en/download/package-manager/). Then, let's set up a directory for our project and bootstrap it with the Truffle development environment:

    mkdir basil
    cd basil
    npm install --global truffle
    truffle init
    npm init --yes


## The sample contract, with initialize

Next, let's write the contract to control the light bulb in `contracts/Basil.sol`:

    pragma solidity ^0.4.23;

    import "openzeppelin-zos/contracts/ownership/Ownable.sol";


    contract Basil is Ownable {
      // Color in RGB.
      uint256 public red;
      uint256 public green;
      uint256 public blue;

      uint256 public highestDonation;

      event NewDonation(address indexed donor, uint256 value, uint256 red, uint256 green, uint256 blue);

      function initialize() public isInitializer("Basil", "0") {
        highestDonation = 10;
      }

      function donate(uint256 _red, uint256 _green, uint256 _blue) public payable {
        require(_red < 256);
        require(_green < 256);
        require(_blue < 256);
        require(msg.value > highestDonation);
        red = _red;
        green = _green;
        blue = _blue;
        emit NewDonation(msg.sender, msg.value, red, green, blue);
      }
    }

The contract is super simple. If somebody wants to set the light color, they have to make a donation that then goes to cover any plant necessities. If the donation is higher than the previous one, it is accepted, the light color changes and an event is emitted.

We set the initial donation amount to 10 wei, and here you will find the only difference to take into account when writing a contract for ZeppelinOS. Before ZeppelinOS, we would have set the initial value using a `constructor` function. In Ethereum, constructors are handled in a very different way compared to normal functions: they are executed during the deployment of the contract to initialize the state variables, and the code of the constructor is never deployed to the blockchain. In ZeppelinOS we rely on proxy contracts that will forward function calls to the contracts with the implementation. A proxy has no access to the constructor to initialize state variables, so instead we use an `initialize` function with the `isInitializer` modifier provided by the `Migratable` contract of `zos-lib`, which comes from the inheritance chain of `Ownable`. The modifier receives the name of the contract and a `migrationId` that starts in 0.

We need to install the `openzeppelin-zos` dependency and to compile the contract:

    npm install --save-dev openzeppelin-zos
    truffle compile

## Using ZeppelinOS to link to the OpenZeppelin standard library

Now, to get the niceties that ZeppelinOS provides, let's install the `zos` command line interface and initialize our application with the version 1.0.0:

    npm install --global zos
    zos init basil 0.0.1

This will create a `zos.json` file where ZeppelinOS will keep track of
the contracts of your application.

Next, let's add the implementation of our Basil contract:

    zos add Basil

To have your `zos.json` file always up-to-date, run `zos add` for every
new contract you add to your project.

To link our Basil contract to the OpenZeppelin standard library, we need an Ethereum network where the standard library has already been deployed. But first we want to test this in a local development network, so let's prepare truffle writing this in `truffle.js`:

    module.exports = {
      networks: {
        development: {
          host: "localhost",
          port: 9545,
          network_id: "*"
        }
      }
    };

Then, in a separate terminal, run:

    truffle develop

Truffle develop will print 10 accounts. Copy the address of the first one, and then back into the initial terminal, export it as the `OWNER` because it will be useful for us later:

    export OWNER=<address>

OK, so we finish this step by linking the standard library and pushing our application to the network:

    zos link openzeppelin-zos
    zos push --network development --deploy-stdlib

We pass that `--deploy-stdlib` flag because we are using a development network that started clean. When you deploy your application to a real network where the `openzeppelin-zos` standard library has already been deployed, you won't need this flag.

The first time you run this command for a specific network, a new
`zos.<network>.json` will be created. This file will reflect the status
of your project in that network.

## Upgrading a contract

The rules for our basil lights will now be set in stone, enforced by the immutability of the Ethereum blockchain. This sounded great... until we found an embarrassing bug: we are never updating `highestDonation`! The donations would not grow as we expect because the stakes will never be higher than 10 wei. Luckily we caught this before going to mainnet, but are we sure that our contract is bullet proof and something like this will never happen again? The same feature that makes Ethereum secure is now making us feel insecure about our programming abilities and scared of finding a security vulnerability too late.

Fear not, ZeppelinOS allows us to keep the transparency and immutability of a deployed version of a contract, but also to opt for a contract in which the owner can upgrade the implementation. This is done through a proxy that forwards the calls to the latest implementation of the contract. To create a proxy for Basil, run:

    zos create Basil --network development --init --args $OWNER

Let's fix our bug. Edit `contracts/Basil.sol` to add the missing line to the `donate` function:

    function donate(uint256 _red, uint256 _green, uint256 _blue) public payable {
      require(_red < 256);
      require(_green < 256);
      require(_blue < 256);
      require(msg.value > highestDonation);
      red = _red;
      green = _green;
      blue = _blue;
      highestDonation = msg.value;
      emit NewDonation(msg.sender, msg.value, red, green, blue);
    }

And to finish our fix, we compile the patched contract, sync with ZeppelinOS and upgrade the proxy:

    zos upgrade Basil <proxy_address_1> --network development

## Upgrading the Migratable initialize

Another common thing that happens when developing smart contracts for Ethereum is that new standards appear, all the new kids implement them in their contracts, and a very cool synergy between contracts starts to happen. The people who have immutable contracts already deployed will miss all the fun. This has just happened to us: it would be very nice to encourage donations to Basil by emitting a unique ERC721 token in exchange. Well, let's upgrade the contract with ZeppelinOS to do just that.

We could modify `contracts/Basil.sol` as before. But now let's try something different. Let's make a new contract in `contracts/BasilERC721.sol`, that inherits from our initial version of Basil:

    pragma solidity ^0.4.23;

    import "./Basil.sol";
    import "openzeppelin-zos/contracts/token/ERC721/MintableERC721Token.sol";

    contract BasilERC721 is Basil {
      using SafeMath for uint256;

      // ERC721 non-fungible tokens to be emitted on donations.
      MintableERC721Token public token;
      uint256 public numEmittedTokens;

      function initialize(MintableERC721Token _token) public isInitializer("Basil", "1") {
        require(_token != address(0));
        require(token == address(0));
        token = _token;
      }

      function donate(uint256 _red, uint256 _green, uint256 _blue) public payable {
        super.donate(_red, _green, _blue);
        emitUniqueToken(tx.origin);
      }

      function emitUniqueToken(address _tokenOwner) internal {
        token.mint(_tokenOwner, numEmittedTokens);
        numEmittedTokens = numEmittedTokens.add(1);
      }
    }

A few things to note:
 * This new version extends from the previous one. This is a very handy pattern, because the proxy used in ZeppelinOS requires new versions to preserve the state variables.
 * We increased the second argument of `isInitializer`. This is the `migrationId`, and is used to keep track of what initializations we need to execute. The `initialize` with `migrationId` 0 was executed when we first deployed Basil, so we set this id to 1.
 * We can add new state variables and new functions. The only thing that we can't do on a contract upgrade is to remove state variables.

Let's add this version to our ZeppelinOS application and push to the network again:

    zos add BasilERC721 Basil
    zos push --network development

This will print the address of the deployed Basil contract. Let's export this value to use it later:

    export BASIL_ADDRESS=<address>

We need to pass a token to the new `initialize` of our new version of Basil. Because we previously linked to the standard library that provides a MintableERC721Token implementation, let's just use that one:

    zos create-proxy MintableERC721Token --from $OWNER --init --args $BASIL_ADDRESS,BasilToken,BSL --network development

The new versions of our application's contracts were deployed to the network. However, the previously deployed proxies are still running with the old implementations. To finish the upgrade, run:

    zos upgrade Basil --network development
