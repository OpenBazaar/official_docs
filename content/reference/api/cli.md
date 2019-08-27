---
title: "CLI Commands"
identifier: clicommands
weight: 10
menu:
    reference:
        parent: api
---

## openbazaard init

```
USAGE
  openbazaard init - Initializes a new repo without starting the server.

SYNOPSIS
  openbazaard init [--password | -p] [--datadir | -d] [--mnemonic | -m] [--testnet | -t] [--force | -f] [--walletcreationdate | -w]

ARGUMENTS

  This command has no arguments.

OPTIONS

  -p,          --password            string   - the encryption password if the database is to be encrypted.
  -d,          --datadir             string   - specify the data directory to be used.
  -m,          --mnemonic            string   - specify a mnemonic seed to use to derive the keychain.
  -t           --testnet             bool     - use the test OpenBazaar network.
  -f,          --force               bool     - force overwrite existing data folder (!dangerous).
  -w,          --walletcreationdate  bool     - specify the date the seed was created. if omitted the wallet will sync from the oldest checkpoint.  

DESCRIPTION

  Initializes a new data directory for OpenBazaar without starting the server.
```

## openbazaard convert

_This command is deprecated and is no longer required as of OpenBazaar v2.3.0 (daemon v0.13.0)._

```
Usage:
  openbazaard [OPTIONS] convert [convert-OPTIONS]

This command will convert the node to use a different cryptocurrency

Application Options:
  -v, --version       Print the version number and exit

Help Options:
  -h, --help          Show this help message

[convert command options]
      -p, --password= the encryption password if the database is encrypted
      -d, --datadir=  specify the data directory to be used
      -t, --testnet   use the test network
```

## openbazaard decryptdatabase

```
Usage:
  openbazaard [OPTIONS] decryptdatabase [decryptdatabase-OPTIONS]

This command decrypts the database containing your bitcoin private keys, identity key, and contracts.
[Warning] doing so may put your bitcoins at risk.

Application Options:
  -v, --version      Print the version number and exit

Help Options:
  -h, --help         Show this help message

[decryptdatabase command options]
      -d, --datadir= specify the data directory to be used
```

## openbazaard encryptdatabase

```
Usage:
  openbazaard [OPTIONS] encryptdatabase [encryptdatabase-OPTIONS]

This command encrypts the database containing your bitcoin private keys, identity key, and contracts

Application Options:
  -v, --version      Print the version number and exit

Help Options:
  -h, --help         Show this help message

[encryptdatabase command options]
      -d, --datadir= specify the data directory to be used
```

## openbazaard gencerts

```
Usage:
  openbazaard [OPTIONS] gencerts [gencerts-OPTIONS]

Generate self-singned certificates

Application Options:
  -v, --version       Print the version number and exit

Help Options:
  -h, --help          Show this help message

[gencerts command options]
      -d, --datadir=  specify the data directory to be used
      -t, --testnet   config file is for testnet node
      -h, --host=     comma-separated hostnames and IPs to generate a certificate for
          --duration= duration that certificate is valid for
```

## openbazaard restore

```
Usage:
  openbazaard [OPTIONS] restore [restore-OPTIONS]

This command will attempt to restore user data (profile, listings, ratings, etc) by downloading them from the network. This will only work if the IPNS mapping is still available in the DHT. Optionally it will take a mnemonic seed to restore from.

Application Options:
  -v, --version                 Print the version number and exit

Help Options:
  -h, --help                    Show this help message

[restore command options]
      -p, --password=           the encryption password if the database is encrypted
      -d, --datadir=            specify the data directory to be used
      -t, --testnet             use the test network
          --torpassword=        Set the tor control password. This will override the tor password in the config.
          --tor                 Automatically configure the daemon to run as a Tor hidden service and use Tor exclusively. Requires Tor to be running.
      -m, --mnemonic=           specify a mnemonic seed to use to derive the keychain
      -w, --walletcreationdate= specify the date the seed was created. if omitted the wallet will sync from the oldest checkpoint.
```

## openbazaard setapicreds

```
Usage:
  openbazaard [OPTIONS] setapicreds [setapicreds-OPTIONS]

The API password field in the config file takes a SHA256 hash of the password. This command will generate the hash for you and save it to the config file.

Application Options:
  -v, --version      Print the version number and exit

Help Options:
  -h, --help         Show this help message

[setapicreds command options]
      -d, --datadir= specify the data directory to be used
      -t, --testnet  config file is for testnet node
```

## openbazaard start

```
Usage:
  openbazaard [OPTIONS] start [start-OPTIONS]

The start command starts the OpenBazaar-Server

Application Options:
  -v, --version                   Print the version number and exit

Help Options:
  -h, --help                      Show this help message

[start command options]
      -p, --password=             the encryption password if the database is encrypted
      -t, --testnet               use the test network
      -r, --regtest               run in regression test mode
      -l, --loglevel=             set the logging level [debug, info, notice, warning, error, critical] (default: debug)
      -f, --nologfiles            save logs on disk
      -a, --allowip=              only allow API connections from these IPs
      -s, --stun                  use stun on µTP IPv4
      -d, --datadir=              specify the data directory to be used
      -c, --authcookie=           turn on API authentication and use this specific cookie
      -u, --useragent=            add a custom user-agent field
      -v, --verbose               print openbazaar logs to stdout
          --torpassword=          Set the tor control password. This will override the tor password in the config.
          --tor                   Automatically configure the daemon to run as a Tor hidden service and use Tor exclusively. Requires Tor to be running.
          --dualstack             Automatically configure the daemon to run as a Tor hidden service IN ADDITION to using the clear internet. Requires Tor to be running. WARNING: this mode is not private
          --disablewallet         disable the wallet functionality of the node
          --disableexchangerates  disable the exchange rate service to prevent api queries
          --storage=              set the outgoing message storage option [self-hosted, dropbox] default=self-hosted
          --bitcoincash           use a Bitcoin Cash wallet in a dedicated data directory
          --zcash=                use a ZCash wallet in a dedicated data directory. To use this you must pass in the location of the zcashd binary.
```

## openbazaard status

```
Usage:
  openbazaard [OPTIONS] status [status-OPTIONS]

Returns the status of the repo ― Uninitialized, Encrypted, Decrypted. Also returns whether Tor is available.

Application Options:
  -v, --version      Print the version number and exit

Help Options:
  -h, --help         Show this help message

[status command options]
      -d, --datadir= specify the data directory to be used
      -t, --testnet  use the test network
```
