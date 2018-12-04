---
title: "OpenBazaar Startup"
menu:
    guides:
        parent: concepts
        weight: 1
---

# Introduction

There are many steps involved with configuring and starting the OpenBazaar server that powers compatible applications. OpenBazaar leverages both IPFS and OpenBazaar specific code and processes that interact in a fairly complex way. This document is aimed at helping others understand exactly what is happening, how it works and why it works that way.

What is described below is the process followed when users run the Golang version of OpenBazaar and execute the [following command](http://localhost:1313/reference/api/cli/#openbazaard-start):

```
go run openbazaard.go start
```

## Overview

The OpenBazaar architecture consists of several components:

- **OpenBazaar database** - OpenBazaar specific data is stored in a sqlite database that contains items like:
  - Dispute cases
  - Chat messages/conversations
  - Followers/Following data
  - Purchase and sales history
  - Wallet transaction data
- **IPFS data repository** - This is also synonymous with the OpenBazaar data folder. IPFS requires a specific folder that stores information related to IPFS and the data that your node is publishing to the network. OpenBazaar makes use of this folder by extending it to hold OpenBazaar related data as well. This data folder is very important as it holds your wallet keys and all information needed for your OpenBazaar instance. Proper backup of this folder is critical.
- **OpenBazaar API Server** - OpenBazaar client software interacts with the OpenBazaar server through this API just the same as any other client server application.
- **IPFS Gateway** - The OpenBazaar server starts an IPFS Gateway server that listens to connections from other IPFS nodes

![OpenBazaar Network](/assets/network.png)

## Parameters:

There are many parameters that can be passed into the `start` command and this is a short description of how they affect the server.

### OpenBazaar Specific
- Password - It is possible to encrypt the OpenBazaar sqlite database. In order to decrypt it at startup you can pass this parameter through the command line.
- Testnet - OpenBazaar has a testnet network that is segregated from the mainnet users. This flag enables the testnet.
- Regtest - OpenBazaar has a regtest network that is segregated from the mainnet users. This flag enables the regtest network.
- DataDir - Specify where the OpenBazaar data directory resides.
- UserAgent - Specify a custom user-agent field. (Default: /openbazaar-go:<version#>/)
- Storage - Set the outgoing message store option default to self-hosted but you can choose dropbox.

### Logging
- LogLevel - Set the logging level (can be debug, info, notice, warning).
- NoLogFiles - Turn off log files being stored on disk.
- Verbose - Print OpenBazaar logs to stdout.

### Networking
- AllowIP - Only allow these IPs to access the OpenBazaar API server.
- STUN - STUN allows traversal of NAT connections through the use of a STUN server.
- AuthCookie - Specify the AuthCookie to use to authenticate to the OpenBazaar API server.

### Tor
- TorPassword - Specify the Tor control password.
- Tor - Enable Tor mode
- DualStack - Set the node to use Tor and clearnet.

### Traffic Controls
- DisableWallet - Disable wallet functionality of the node.
- DisableExchangeRates - Disable querying exchange rates for pricing.

### Wallets
- BitcoinCash/ZCash - Enable other wallets (being deprecated once multi-wallet is enabled)


## Startup Process Walkthrough

The following section walks through the activities that occur during the startup of an OpenBazaar server node.

### Constants
```
var offlineMessageFailoverTimeout = 30 * time.Second
```

### Print the Splash Screen
Simply print a nice splash screen for users along with the version number being run.
```
________                      __________
\_____  \ ______   ____   ____\______   \_____  _____________  _____ _______
 /   |   \\____ \_/ __ \ /    \|    |  _/\__  \ \___   /\__  \ \__  \\_  __ \
/    |    \  |_> >  ___/|   |  \    |   \ / __ \_/    /  / __ \_/ __ \|  | \/
\_______  /   __/ \___  >___|  /______  /(____  /_____ \(____  (____  /__|
        \/|__|        \/     \/       \/      \/      \/     \/     \/

OpenBazaar Server v0.12.4
```

### Setup

#### Network Checks
Analyze specified flags and configuration for network connectivity and handle any conflicting settings.

- Check if `testnet` and `regtest` set and fail if positive
- Check if Tor and `dualstack` and fail if positive
- Keep track of if `testnet` or `regtest` is activated
- Check if user set multiple currencies simultaneously (currently we only support one at a time)

#### Set up Data Directory Location
Every OpenBazaar node has a corresponding data directory where all important user data is stored. There is a default location that we determine if a specific location is not provided.

If user set the data directory:
  then set it explicitly

Else: Get data directory path from the **Schema Manager**

#### Clear Lock File
Remove lock file from the data directory in case the server closed uncleanly.

#### Set up Logging Levels
Loggers must be configured for location to store log files, rotation and content settings. There are several log files generated with different content:

- ob.log - Contains OpenBazaar specific log data
- ipfs.log - All debugging data for IPFS is stored here.
- api.log - Logs API calls to the OpenBazaar server.
- bitcoin.log - Wallet logging.

#### Increase OS file descriptors due to low default limits
IPFS consumes a massive amount of file descriptors that exceed most operating system defaults and this results in crashing of the server. We proactively raise these limits to prevent this problem.

#### Set Wallet Type by Getting the Coin Type
Grab the specified coin type so that OpenBazaar migrations can run for the appropriate coin.

### Database Initialization
If a database (datastore/mainnet.db) has not been created yet, then create it.

### Initialize Config File Objects
The main configuration file (config) is broken up into several schema objects that make interacting with them easier including:

- apiConfig
- torConfig
- dataSharingConfig
- resolverConfig
- walletsConfig

Several configuration settings also are extracted from the config file:

- dropboxToken
- republishInterval

### Check SSL Configuration
- If the SSL files are specified then set up SSL authentication

### Get IPFS Config
	Call BuildCfg which creates an IPFS node config
	Configure ipnsps if we've set usepersistentcache
	Set a new defaultHostOption if Tor is configured because we use a new type of transport for new host connections

### IPFS Check
- If no gateways are configured the server cannot start so error out

### Get IPFS Identity
	Ask OB database for identity key
	Get IPFS identity from key

### Set up Testnet Settings
	Get Testnet bootstrap nodes
	Set protocol strings for testnet rather than mainnet
	Clear push nodes

### Configure IPFS Swarm for Tor Support
	Create Hidden Service not created
		Tell Tor to add hidden service
	Add onion addresses to the IPFS swarm

### Process Swarm Addresses
	Loop through swarm addresses we're listening on and convert them to onion addresses

### Set up Custom DNS Resolver

### Set Up the Tor Transport
	Get control port from Tor
	Get Tor config password
	Create new Tor transport (go-onion-transport)

### Create a Background Context to Send to IPFS

### Create a new IPFS Node

### Configure IPFS Context
- Set Node Online
- Set Configuration Root folder to the data folder path
- LoadConfig
- ConstructNode

### Configure Custom DHT Query Size
	Grab config file querysize
	If querysize between 1 and 20 then use it otherwise default to 16

### Grab IPFS Root Hash
	Grab IPNS key from your identity (basically it returns /pk/peerid and /ipns/peerid as strings)
	Look in the IPFS datastore by your key
	Ummarshal from a Record object
	Unmarshal from a IPNSEntry object
	Send back this value

### Configure Push Nodes
- Loop through push nodes and add them to the pushNodes to send to the OB service

### GetMnemonic for Wallet

### Set up Wallet
	Grab network parameters (testnet3, regressionnet, mainnet)
	Create wallet.log file and set up logger
	Create WalletConfig object with all necessary parameters
	Create new MultiWallet

### Create Resync Manager

### Configure Gateway Authentication
	Get multiaddress for Gateway
	Get P_IP4 address
	Protect the gateway from open authentication if public IP, mainnet and apiconfig has been enabled
	Set allowed IPs in the api config
	If cookie file does not exist:
		Create random base58 byte array (32)
		Create the file
	Else
		Check for valid cookie prefix
		set authcookie from file

### Set Up Ban Manager
	Collect settings table from the OB database
	If blockednodes is not empty:
		add blocked nodes to the Ban Manager object

### Get Custom Name System
	Create Blockstack Client resolver
	If clearnet:
		Add OpenBazaar DNS resolver
	Create new Name System with these resolvers

### Setup PubSub
	New Pubsub Publisher
	New Pubsub Subscriber
	Configure IPFS to use those pubsub objects

### Create OpenBazaar Node Object

### Create PublishLock

### Configure Offline Message Storage
	If custom storage is self-hosted or not defined:
		- create a new self hosted storage store
	If custom storage is Dropbox
		- Check for Tor because it can't be used
		- Check for Dropbox token
		- Create new Dropbox storage store

### Setup OpenBazaar HTTP Gateway

### Start OpenBazaar Server Loop
	- If wallet is enabled:
		- Wait for message retriever to finish if resyncManager is not set
		- Create a TX listener
		- Loop through wallets
			Create Wallet Listener
			Add WL and TL to the wallet
		- Create Status Updater
		- Start Status Updater
		- Start Multiwallet
		- If resyncManager is set then
			- Start it
			- Start Resync Loop
				- Wait for Message Retriever Completion
				- Check for Unfunded transactions
	- Setup Node Service
	- Start Message Retriever
	- Start Pointer Republisher
	- Start Record Aging Notifier

	- Unlock PublishLock

	- Update Follow List

	If initial publish not complete:
		- seed nodes

	- Set up republisher using the republish interval

## Start Gateway Server
