---
title: Install OpenBazaar
weight: 1
---

<!--
Based on the existing install docs at https://github.com/OpenBazaar/openbazaar-desktop/blob/master/README.md
-->

For full installable versions of the OpenBazaar app, with the server and client bundled together, go to [the OpenBazaar download page.](https://www.openbazaar.org/download/)

## OpenBazaar 2.0 Desktop Application

This is the reference client for the OpenBazaar network. It is an interface for your OpenBazaar node, to use it you will need to run an [OpenBazaar node](https://github.com/OpenBazaar/openbazaar-go) either locally or on a remote server.

There are a variety of ways to install a copy of OpenBazaar on your system. We generally recommend [installing a prebuilt package](#installing-from-a-prebuilt-package), but here are a few other supported options:

* [Installing from a Prebuilt Package](#installing-from-a-prebuilt-package) (recommended)
* [Building from source](#building-from-source)
* [Upgrading OpenBazaar](#upgrading-openbazaar)
* [Troubleshooting](#troubleshooting)

Note these instructions may make use of the **command line.** We use `$` to indicate the command prompt — commands to type are on lines that are prefixed with that, while output lines are un-prefixed.

---

## Installing from a Prebuilt Package

First, download the right version of OpenBazaar for your platform:

<a class="button button-primary" href="https://openbazaar.org/download" role="button">
  Download OpenBazaar for your platform &nbsp;&nbsp;<i class="fa fa-download" aria-hidden="true"></i>
</a>

### Mac OS X and Windows

After downloading, install the application using the installer.

### Linux

After downloading, either install the application by double clicking the `.deb` file or from the terminal.

Terminal Instructions:

```
$ sudo dpkg -i /path/to/deb/file
$ sudo apt-get install -f
```

Congratulations! You now have a working OpenBazaar installation on your computer.

---


## Building from Source

If you want, you can also build OpenBazaar from source. You will need to install both a `server` and `client` separately if you go this
path. The installer described above bundles both of these together for you.

* For the OpenBazaar v2 Client take a look at [the readme](https://github.com/OpenBazaar/openbazaar-desktop/blob/master/README.md) for install instructions.
* For the OpenBazaar Server take a look at [this document](https://github.com/OpenBazaar/openbazaar-go/blob/master/README.md) for instructions.

---

## Upgrading OpenBazaar

### Upgrading using installer

You may simply download a newer version of OpenBazaar from the official web site and install it over your current version.

*Warning:* This may modify your configuration files and migrate your database to a later version in a way that is not
able to be downgraded. If you have any doubts about this you should backup your `data folder`.


### Upgrading manually from source

In order to perform a manual upgrade of `OpenBazaar`, you will need to manually run updates for both the `server` and `client`. The
procedure is as follows:

* Stop the `OpenBazaar` server and client if they are running
* Optionally backup your `OpenBazaar` data folder
* Update the git repository for `openbazaar-go` wherever you have it installed
* Update the git repository for `openbazaar-desktop` wherever you have it installed

You can also download the bundled version of the application from [https://openbazaar.org/download](https://openbazaar.org/download) and connect to
a manually installed local or remote version of the server.

---

## Troubleshooting

### Help!

If you have any problems, come get live help at the [OpenBazaar Slack](https://openbazaar.org/slack/) or via [Zendesk](../#community).
