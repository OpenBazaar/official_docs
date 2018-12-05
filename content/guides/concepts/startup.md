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

Else: Get data directory path from the **[Schema Manager](/go/pkg/openbazaar-go/schema/#NewCustomSchemaManager)**

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
Retrieve the configuration file from the user's data folder. This gives you an IPFS struct of the configuration file that includes things relevant to IPFS alone and ignoring the OpenBazaar extension.
	<!-- Call BuildCfg which creates an IPFS node config
	Configure ipnsps if we've set usepersistentcache
	Set a new defaultHostOption if Tor is configured because we use a new type of transport for new host connections -->

### IPFS Gateway Check
IPFS requires a gateway to be specified so that it can listen to other nodes via HTTP. If it isn't configured the node cannot start.

### Get IPFS Identity
OpenBazaar stores the node's master private key in the database. We retrieve it and then send it to IPFS to turn into an IPFS Identity, which consists of a Peer ID and a Private Key.

```
// Identity tracks the configuration of the local node's identity.
type Identity struct {
	PeerID  string
	PrivKey string `json:",omitempty"`
}
```

### Set up Testnet Settings
Testnet and Regtest modes require some different configuration settings to be updated including:

- Special bootstrap nodes
- Custom protocol strings for:
  - DHT
  - Bitswap
  - OpenBazaar

### Tor Configuration

#### Configure IPFS Swarm for Tor Support
Using Tor with IPFS requires us to create a hidden service using the Tor control service. If one has not been created we go ahead and generate an onion key and get the address of our hidden service. If we already have one in our data directory then we grab it.

We then need to configure the IPFS swarm to support our service by adding the onion address to our swarm addresses.

*If we are operating in `Dual Stack` mode then we need to add our clearnet addresses to listen on as well as the hidden service address*

#### Process Swarm Addresses
There are two scenarios where we need to modify our swarm addresses: if we're using STUN and also UTP transport protocol and if it's an onion address.

If we're using UTP STUN then we need to remove the current STUN swarm address and replace it with a proper address that uses the STUN port we found.

If the address is an onion address we need to tell IPFS that we have a custom Tor transport that we need to load when starting up.

Lastly if we find any addresses that don't meet the above conditions then we know we're supporting clearnet and need to track this.

#### Set Up the Tor Transport
If we are operating in `Tor` or `Dual Stack` mode we need to create a custom Onion transport for IPFS. We talk to a running Tor instance through a utility called [bulb](https://github.com/yawning/bulb). First we grab the control port from the configuration file or through bulb if we have not configured it manually. Next we retrieve the Tor control password the user passed in. The Onion transport needs these pieces of data in order to initialize itself.

### Set up Custom DNS Resolver
It's possible to resolve IPNS entries by using DNS TXT records, which we support. We just call out to IPFS to get a DNS style resolver to add to our IPFS setup.

### Initialize Our IPFS Node

#### Create a Background Context to Send to IPFS
We need to create a context object to send to our IPFS instance so that we can cancel it whenever we need to (e.g. shutdown).

#### Create a new IPFS Node
Create a fresh IPFS node with the context we created and our custom configuration.

We also need to make sure to support IPNSPS (IPNS pubsub) and swap out the default host setup if we're using Tor that makes sure that IPFS knows how to connect to peers through Tor rather than the default method.

#### Configure IPFS Context
*This might be something we can refactor out of this code to reduce complexity.*

We create a custom IPFS context struct.

- Set Node Online (redundant)
- Set Configuration Root folder to the data folder path
- LoadConfig
- ConstructNode

#### Configure Custom DHT Query Size
DHT query size is essentially how many results we must receive for a DHT record before we accept it as the newest available data on the network. Lower numbers will be quicker results, but potentially deliver stale content. We want the configured value to be between 1 and 20 or default to 16 if the user has not customized this.

### Set Up OpenBazaar Service

#### Grab IPFS Root Hash
Our OpenBazaar service requires the IPFS hash of our root folder so we must retrieve it now. This hash is essentially stored as an IPNS entry inside of a DHT record in the datastore.

- Grab IPNS key from your identity (basically it returns /pk/peerid and /ipns/peerid as strings)
- Look in the IPFS datastore (key-value) by your key
- Ummarshal from a Record object
- Unmarshal from a IPNSEntry object

#### Configure Push Nodes
OpenBazaar uses custom push nodes to act as caching supernodes in the network and improve availability of content. These push nodes are located in the configuration file so we grab those locations for later.

### Create Multiwallet
The OpenBazaar Multiwallet is an API based wallet that allows users to control multiple wallets rather than our previous version which was an SPV based wallet and limited to one currency at a time.

The source code for this multiwallet is located at [https://github.com/OpenBazaar/multiwallet](https://github.com/OpenBazaar/multiwallet). If you are interested in creating an integration with a new coin type developers must leverage the wallet interface located at [https://github.com/OpenBazaar/wallet-interface](https://github.com/OpenBazaar/wallet-interface).

#### GetMnemonic for Wallet
Retrieve the wallet mnemonic from the OpenBazaar database.

#### Set up Multiwallet
- Retrieve the appropriate network parameters (testnet3, regressionnet, mainnet).
- Configure logger settings for the wallet (located at logs/wallet.log).
- Create WalletConfig object with all necessary parameters to create a new `Multiwallet`.
- Create new `MultiWallet`.

#### Create Resync Manager
The OpenBazaar `resync manager` is responsible for inspecting unfunded merchant sales and resyncing the wallet to see if it can detect missing payments.

This functionality currently occurs according to the `ResyncInterval`, which is hourly.

### Configure Gateway Authentication
It is possible to make the OpenBazaar API accessible from remote hosts, but it is recommended that cookie-based API authentication be enabled to protect your server. You can read more about this functionality in our [guide](/reference/api/http/).

If the AuthCookie value has been specified then this value is used. If one has not been passed in then the `setAuthCookie` function is called, which sets this up.

The AuthCookie is a file called `.cookie` that resides in the root of the data directory. It contains a value in the format:

```
OpenBazaar_Auth_Cookie=<base58-encoded 32 byte value>
```

If a value is not specified on startup then the server creates a random value and creates this file.

### Set Up Ban Manager
OpenBazaar has a `Ban Manager` that tracks blocked peer IDs that the network service uses to determine if we should accept incoming messages or not. These blocked peer IDs are tracked in the OpenBazaar database and passed to the `Ban Manager` on startup.

### Get Custom Name System Resolvers
OpenBazaar configures several custom resolvers to pass to IPFS for mapping names to peer IDs. There are currently two available:

- [Blockstack](https://github.com/OpenBazaar/go-blockstackclient)
- [DNS TXT](/go/pkg/openbazaar-go/namesys/#DNSResolver) (only if not using Tor)

### Setup PubSub
OpenBazaar nodes are set up to publish and receive data through the PubSub mechanism in IPFS. The publisher and subscriber must be configured first before enabling it within our IPFS node.

### Initialize and Start OpenBazaar Node

#### Create OpenBazaar Node Object
The `OpenBazaarNode` structure encapsulates everything about what an OpenBazaar node is including but not limited to:

- IPFS Node
- Network Services
- Multiwallet
- Offline Storage Layer
- Message Retriever
- Name System

#### Lock Publishing
We lock publishing down during startup so that the initial publish can occur and once that happens we unlock it for use later.

#### Configure Offline Message Storage
OpenBazaar supports offline messaging on top of IPFS. There are several different options for how these messages are stored for the sending node. Currently OpenBazaar ships with support for local file storage and Dropbox hosted storage.

If another OpenBazaar node is not online or is unreachable we construct an offline message and store it in the network for retrieval at a later date. The message to send is signed and encrypted, stored in offline message storage, then the pointer to this content is published to the closest peers in the DHT as well as the push nodes.

#### Setup OpenBazaar HTTP Gateway
OpenBazaar listens on port 4002 as an http server listening for multiplexed API calls for several endpoints. These endpoints route calls to handlers to process the requests.

- /ob/ (json API)
- /wallet/ (json API)
- /ws (websocket)

### Configure Node as a Gateway (optional)
If you intend to run your OpenBazaar node as a public gateway for content you can specify the API field in the config file. This will expose the `/ipfs` and `ipns` endpoints. You can enable this by making the modification shown below:

```
...
"Addresses": {
    "API": "/ip4/127.0.0.1/tcp/4003",   // MODIFIED LINE
    "Announce": null,
    "Gateway": "/ip4/127.0.0.1/tcp/4002",
    "NoAnnounce": null,
    "Swarm": [
      "/ip4/0.0.0.0/tcp/4001",
      "/ip6/::/tcp/4001",
      "/ip4/0.0.0.0/tcp/9005/ws",
      "/ip6/::/tcp/9005/ws"
    ]
  },
...
```

### Main OpenBazaar Process Loop
The following loop continues to run until the server is shut down and acts as the central hub for all OpenBazaar processes.


#### Wallet Functionality
If the wallet has not been disabled the server will conduct a few things:

- Create wallet and transaction listeners for all wallets found in the MultiWallet
- Kick off the `StatusUpdater`
- Start all the wallets in the multiwallet
- Start the `resyncManager`

#### OpenBazaar Network Service
The OpenBazaar network service handles the custom OpenBazaar protocol (`/openbazaar/app/<version>`) and stream communications with other nodes. This includes sending message and requests.

#### Message Retriever
Message Retriever fetches offline messages from the network periodically. It will ask the `push Nodes` for messages every 10 minutes and from the DHT every 60 minutes.

#### Pointer Republisher
The `Pointer Republisher` republishes content every 12 hours. The republisher loops through all pointers we are tracking and republishes them if they have not expired. For offline messages, any message that is newer than 30 days will be republished to the push nodes. If they have expired then they are deleted from the pointers table.

Moderator messages don't ever expire and continue to get published every 12 hours.

#### Record Aging Notifier
Every 10 minutes the `Record Aging Notifier` scans many different items in order to send reminder notifications. The following items are included in the scan:

- Seller Disputes
- Buyer Dispute Timeouts
- Buyer Dispute Expiry Notifications
- Moderator Dispute Expiry Notifications

#### Start Gateway Server
We finally start the gateway server and we are off and running!
