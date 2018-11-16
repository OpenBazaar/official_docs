---
title: "HTTP API"
weight: 20
menu:
    reference:
        parent: api
---

The OpenBazaar networking daemon combines a forked version of IPFS, a Bitcoin wallet, and a Ricardian contracting system. This JSON API is the primary mechanism for controlling the node. It offers a RESTful api for building user interfaces. In this documentation you'll find a full list of API calls and example usages.

## Getting started

OpenBazaar is composed of two components: client and server. The client is a front-end desktop application and primary user interface to the server. For each user, their server is an individual 'node' on the peer-to-peer network.

You can download both client and server from https://openbazaar.org/download.html

### Installation
To interact with the APIs directly, the OpenBazaar server will need to be installed either as a pre-packaged binary or from source. Instructions are available to install from source on Windows, macOS, and Linux.

### Running OpenBazaar
Firstly we need to setup the server:

```
$ go run openbazaard.go init
```
This will initialize the node; this only needs to be performed once. Next, you can run the server with the following command:

```
$ go run openbazaard.go start
```

*For more options in running the node, please refer to this [guide](/reference/api/cli).*

### Authentication
When running on localhost (the default), the API is unauthenticated. You can enable authentication when starting the openbazaar daemon with the following command in the terminal:

```
$ go run openbazaard setapicreds
```

This will prompt you to select a username and password. The username and SHA256 hash of the password are saved in the configuration file.

Note that on mainnet the server enables authentication automatically if the gateway url is bound to anything other than localhost (implying open internet access).

There are two ways for a client to authenticate. The default (and preferred) is via an authentication cookie. On start up the server generates a random cookie and saves it in the data directory as a .cookie file. You need to add this cookie to the header of all requests.

For example:

```
cookie: OpenBazaar_Auth_Cookie=2Yc7VZtG/pVKrH5Lp0mKRSEPC4xlm1dGpkbUXLehTUI
```
Alternatively, you can use basic authentication in the request header following [RFC 2617](https://www.ietf.org/rfc/rfc2617.txt):

```
Authorization: Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ==
```
Where the username and password are encoded as:

```
base64encode(username + ":" + password)
```

### SSL
**NEVER** open the JSON API to the internet without also encrypting the connection with SSL. Without SSL enabled your authentication information be sent to the server in the clear allowing anyone who views your packets to access your server and potentially steal your funds.

For instructions on how to enable SSL, see [here](https://github.com/OpenBazaar/openbazaar-go/blob/master/docs/ssl.md).

### Cross-Origin Resource Sharing
CORS is turned off by default, meaning that you will not be able to make API calls from a browser to a running server on localhost. You can turn CORS on for a specific domain by setting an origin in the config file.

Use "\*" to allow all domains. Keep in mind that running the server with CORS enabled for all domains is a potential security risk as it will allow any website you visit to make calls to your server. Authentication should be enabled along side CORS.

## Using the APIs
To develop applications on top of OpenBazaar, the APIs must be understood in context of the application architecture and the OpenBazaar protocol. In short, OpenBazaar is built on top of IPFS, which is a distributed file system hosted on its own peer-to-peer network. This allows content (i.e. listings, encrypted chat and purchase orders) to be persistently hosted by peers on the OpenBazaar network.

OpenBazaar is also a protocol for buying and selling any good or service with cryptocurrency. Using Ricardian contracts and multisignature escrow, buyers and sellers can transact safely with mechanisms to recover funds in the event of a dispute or accident.

When the OpenBazaar server starts for the first time, it creates a public directory of data that is hosted or 'seeded' by other peers:



The first step is to create a public profile and set your private settings for the node. Creating a public facing profile will allow other users to see details such as display name, avatar, and header image when they visit your node. The addresss of your node or peerID can be retrieved by making a GET /ob/config call, or from the profile response. The settings allow you to set your preferred currency (to display prices), country, create a delivery etc; these setting are private and are not visible to the network.
