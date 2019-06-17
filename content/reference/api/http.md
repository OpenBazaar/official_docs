---
title: "HTTP API"
weight: 20
menu:
    reference:
        parent: api
---

The OpenBazaar daemon combines a forked version of IPFS, a collection of wallets, and the logic which manages Ricardian Contracts that represent transactions on the network. The daemon is controlled primarily via the HTTP API which offers a RESTful interface for building applications on the network. In this documentation you'll learn how to take advantage of the HTTP API to build your own applications.

## Getting started

The OpenBazaar application is composed of two parts: the client and the daemon. The client is a front-end desktop application and acts as a reference implementation which demonstrates good practices for integrating with the daemon. The daemon is a background process which handles requests and responses on the network. It manages a user's identity and represents an individual 'node' on the peer-to-peer network.

The [client](https://github.com/OpenBazaar/openbazaar-desktop) and [daemon](https://github.com/OpenBazaar/openbazaar-go) may be downloaded separately from each other on Github or the bundle containing both the client and daemon from https://openbazaar.org/download/.

### Installation
To interact with the APIs directly, the OpenBazaar daemon will need to be installed either as a pre-packaged binary or from source. Instructions are available to install from source on [Windows](https://github.com/OpenBazaar/openbazaar-go/blob/master/docs/install-windows.md), [macOS](https://github.com/OpenBazaar/openbazaar-go/blob/master/docs/install-osx.md), [Linux](https://github.com/OpenBazaar/openbazaar-go/blob/master/docs/install-linux.md), and [Raspberry Pi](https://github.com/OpenBazaar/openbazaar-go/blob/master/docs/install-pi3.md).

### Running OpenBazaar
Firstly we need to initialize the daemon's data directory which only needs to be performed once.

*(Note: The example commands below assume that you're compiling the openbazaar-go binary from source. You can also run the same command using the pre-packaged binary by replacing `go run openbazaard.go` with the path of the downloaded binary. `go run` conveniently compiles openbazaar-go and runs the compiled binary with the given options.)*

```
$ cd $GOPATH/github.com/OpenBazaar/openbazaar-go
$ go run openbazaard.go init
```

Or specify the location where you'd like to store your node's data:

```
$ go run openbazaard.go init -d ./path/to/datastore
```

Next, you can run the daemon with the following command:

```
$ go run openbazaard.go start
```

*(Note: If you do not use the `init` subcommand, `start` will automatically initialize the datastore before starting.)*

For more options in running the node, please refer to this [guide](/reference/api/cli).

### Authentication
When running on localhost (the default), the API is unauthenticated. You can enable authentication when starting the daemon with the following command in the terminal:

```
$ go run openbazaard setapicreds
```

This will prompt you to select a username and password. The username and SHA256 hash of the password are saved in the configuration file.

*(Note: The daemon enables authentication automatically if the gateway url is bound to anything other than localhost (implying open internet access). This authentication is not forced while running the daemon on testnet (enabled with `--testnet` flag when `start`ing the daemon).*

There are two ways for a client to authenticate. The default (and preferred) is via an authentication cookie. On start up the server generates a random cookie and saves it in the data directory as a `.cookie` file. You need to add this cookie to the header of all requests.

For example:

```
cookie: OpenBazaar_Auth_Cookie=2Yc7VZtG/pVKrH5Lp0mKRSEPC4xlm1dGpkbUXLehTUI
```
Alternatively, you can use basic authentication in the request header following [RFC 2617](https://www.ietf.org/rfc/rfc2617.txt):

```
Authorization: Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ==
```
This authorization token may be produced with the following process:

```
base64encode(username + ":" + password)
```

*(IMPORTANT: If you apply API credentials, the cookie authorization will be ignored. To enable cookie authorization, API credentials must be empty.)*

### SSL
**NEVER** open the HTTP API to the internet without also encrypting the connection with SSL. Without SSL enabled your authentication information be sent to the server in the clear allowing anyone who views your packets to access your server and potentially steal your funds.

For instructions on how to enable SSL, see [these instructions](https://github.com/OpenBazaar/openbazaar-go/blob/master/docs/ssl.md).

### Cross-Origin Resource Sharing
CORS is turned off by default, meaning that you will not be able to make API calls from a browser to a running server on localhost. You can turn CORS on for a specific domain by setting an origin in the config file.

Use "\*" to allow all domains. Keep in mind that running the server with CORS enabled for all domains is a potential security risk as it will allow any website you visit to make calls to your server. Authentication should be enabled along side CORS.

## Using the APIs
Your node is driven entirely by the desktop client through the HTTP API exposed by the openbazaar-go daemon. The HTTP API exposes the subsystems which, together, allow the user to conduct commerce and other actions on the network. Understanding how these subsystems work together is important for the proper usage of the API and part of the reason for the desktop client. The desktop client was designed as a reference implementation to guide other developers toward best practices for consuming the daemon's API and should be used to help clarify where documentation may be lacking.

*(Note: The API (and underlying protocol) is under development and we reserve the right to shift the API until it becomes more mature. Despite this, the core usage of the API changes very little with most of the protocol shifting hidden behind it. It is not recommended attempting to access or reproduce the protocol logic or use internals until a formal protocol library is published for external use.)*

To develop applications on top of platform, the APIs must be understood in context of the application architecture and the OpenBazaar protocol. A summary of this architecture would be to describe it as using IPFS as a layer of persistence for content which describes offers for trade (in the form of Listings) and as well as a means of transporting messages (which are peer-to-peer and encrypted) to achieve commerce around these Listings. The OpenBazaar protocol is behavior built on top of this persistence and communication layer which uses Ricardian Contracts and cryptocurrencies to enable trustless and permissionless trade.

When the OpenBazaar server starts for the first time, it generates a unique identity (called your Peer ID) and a public directory of data that is hosted or 'seeded' by other peers. This identity and public data is distributed into the live network and is what allows your data to be available to others on-demand. By default, the public data includes boilerplate profile with random data associated to your Peer ID and an empty store without Listings. Depending on how you connect to the internet, your public data would also include any IP addresses which originated the data and remains in the network routing tables until they expire.

The first step after generating an identity is to create a public profile and configure your private settings for the node. Creating a public facing profile will allow other users to see details such as display name, avatar, and header image when they visit your node. This can be done with `POST /ob/profile` to create and `PUT /ob/profile` to update. The Peer ID can be retrieved by calling `GET /ob/config`. The settings allow you to set your preferred currency (to display prices), country, create a delivery etc; these setting are private and are not visible to the network. This can be done with `POST /ob/settings` to create or `PUT /ob/settings` to update.

For a full list of API endpoints, please review the current HTTP API documentation available at https://api.docs.openbazaar.org.

### Timestamps in the API
The HTTP API returns RFC3339-compliant timestamps which typically take the following forms:

 - without sub-second precision `2017-08-17T04:52:19Z`
 - with sub-second precision `2017-08-17T04:52:19.00000001Z` which may have an inconsistent number of places after the decimal
