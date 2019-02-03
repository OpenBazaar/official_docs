---
title: "CLI Commands"
identifier: clicommands
weight: 10
menu:
    reference:
        parent: api
---

<!-- TODO: Remove index since it's handled by the TOC in the menu? -->

OpenBazaar has many command line commands that you can execute.

- [openbazaard init](#openbazaard-init)
- [openbazaard convert](#openbazaard-convert)
- [openbazaard decryptdatabase](#openbazaard-decryptdatabase)
- [openbazaard encryptdatabase](#openbazaard-encryptdatabase)
- [openbazaard gencerts](#openbazaard-gencerts)
- [openbazaard restart](#openbazaard-restart)
- [openbazaard restore](#openbazaard-restore)
- [openbazaard setapicreds](#openbazaard-setapicreds)
- [openbazaard start](#openbazaard-start)
- [openbazaard status](#openbazaard-status)
- [openbazaard stop](#openbazaard-stop)

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

- [openbazaard convert](#openbazaard-convert)
- [openbazaard decryptdatabase](#openbazaard-decryptdatabase)
- [openbazaard encryptdatabase](#openbazaard-encryptdatabase)
- [openbazaard gencerts](#openbazaard-gencerts)
- [openbazaard restart](#openbazaard-restart)
- [openbazaard restore](#openbazaard-restore)
- [openbazaard setapicreds](#openbazaard-setapicreds)
- [openbazaard start](#openbazaard-start)
- [openbazaard status](#openbazaard-status)
- [openbazaard stop](#openbazaard-stop)

## openbazaard convert

## openbazaard decryptdatabase

## openbazaard encryptdatabase

## openbazaard gencerts

## openbazaard restart

## openbazaard restore

## openbazaard setapicreds

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
      -l, --loglevel=             set the logging level [debug, info, notice, warning, error, critical]
                                  (default: debug)
      -f, --nologfiles            save logs on disk
      -a, --allowip=              only allow API connections from these IPs
      -s, --stun                  use stun on µTP IPv4
      -d, --datadir=              specify the data directory to be used
      -c, --authcookie=           turn on API authentication and use this specific cookie
      -u, --useragent=            add a custom user-agent field
      -v, --verbose               print OpenBazaar logs to stdout
          --torpassword=          Set the tor control password. This will override the tor password in
                                  the config.
          --tor                   Automatically configure the daemon to run as a Tor hidden service and
                                  use Tor exclusively. Requires Tor to be running.
          --dualstack             Automatically configure the daemon to run as a Tor hidden service IN
                                  ADDITION to using the clear internet. Requires Tor to be running.
                                  WARNING: this mode is not private
          --disablewallet         disable the wallet functionality of the node
          --disableexchangerates  disable the exchange rate service to prevent api queries
          --storage=              set the outgoing message storage option [self-hosted, dropbox]
                                  (default=self-hosted)
          --bitcoincash           use a Bitcoin Cash wallet in a dedicated data directory
          --zcash=                use a Zcash wallet in a dedicated data directory. To use this you must
                                  pass in the location of the zcashd binary.
```

## openbazaard status

## openbazaard stop
