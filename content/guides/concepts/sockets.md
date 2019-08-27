---
title: "Web Socket Communication"
menu:
    guides:
        parent: concepts
---


# Web Socket Communication

This is a guide to the various communications sent from the OB Go server using web sockets. Most are received either in response to a message from another node, or to an API call triggered by a user action.

The type of socket message being received is determined by the keys present in the data.

- "walletUpdate": a status update for the user's wallets.
- "wallet": a transaction message.
- "notification": a notification, usually in response to receiving a message from another node.
- "id" and "peerId": a response to an async `ob/fetchprofiles` API call.
- "message": a chat message or chat data.
- "status": an update to publishing status.

Notification messages have a `notificationId` that can be used to track the notification. The same notifications can be loaded from the `ob/notifications` API, and will have the same IDs.


## Wallet Updates

#### Regular Update

The server will regularly send updates with the state of the wallet.

```
{
  "walletUpdate": {
    "BCH": {
      "confirmed": 0,
      "height": 569437,
      "unconfirmed": 0
    },
    "BTC": {
      "confirmed": 2657,
      "height": 562734,
      "unconfirmed": 0
    },
    "LTC": {
      "confirmed": 83591,
      "height": 1578370,
      "unconfirmed": 0
    },
    "ZEC": {
      "confirmed": 0,
      "height": 480276,
      "unconfirmed": 0
    }
  }
}
```

#### New Transaction 
When new funds are moved into or out of a wallet, a socket message will be received.

An incoming transaction will have a positive `value`, and outgoing transaction will have a negative `value`.

If a transaction is a payment for an order, it will have values for `orderId` and `thumbnail`. The name of the listing will be in the `memo` field.

#### Incoming Funds 
```
{
  "wallet": {
    "address": "",
    "canBumpFee": true,
    "confirmations": 0,
    "height": 0,
    "memo": "",
    "orderId": "",
    "status": "UNCONFIRMED",
    "thumbnail": "",
    "timestamp": "2019-02-12T13:23:43.599771-05:00",
    "txid": "410374604d58fe9840004d3377e36f3aaf1994d154a8ca4c557c3d10fa32aa5c",
    "value": 21756,
    "wallet": "LTC"
  }
}
```

#### Incoming Payment for an Order
```
{
  "wallet": {
    "address": "",
    "canBumpFee": true,
    "confirmations": 1,
    "height": 1578522,
    "memo": "Test Issue v2",
    "orderId": "QmaAeFMH6Ny8XFVZVYXNHfJtyjgyYLxxA4xUc1yvRaBadB",
    "status": "PENDING",
    "thumbnail": "zb2rhcAvGem3fPs8bA2G3qe6LJWhEf7dTjzaBTuXxbSbq9W2a",
    "timestamp": "2019-02-12T15:22:45-05:00",
    "txid": "380b8cac2ceb7bc5c706a88be05519ac111b255048c493fdbd52ea11b451543f",
    "value": 7801,
    "wallet": "LTC"
  }
}
```

#### Outgoing Payment for an Order

```
{
  "wallet": {
    "address": "ltc1qrrrqtazefwln9en5zhex4elswgj7qfupwrc7z4eydh5mv5frwauqhlpnmj",
    "canBumpFee": false,
    "confirmations": 1,
    "height": 1578469,
    "memo": "test ltc 2.3",
    "orderId": "QmTCTBF57ujtZDd7KzHodZdsiHp7zwnzL798s2CB8uftKC",
    "status": "PENDING",
    "thumbnail": "zb2rhjj2XQEJ4XrquY6C1ATdAvYN6HL1HzFcZg65Se9cMnBhk",
    "timestamp": "2019-02-12T13:22:07-05:00",
    "txid": "cf0bd34a7934f4741a62b603cf557f79fc41c25480eba0beecb6ca6d1847001a",
    "value": -27236,
    "wallet": "LTC"
  }
}
```



## Order Updates

Order have notifications tied to most of the changes in order state, normally as a response to one of the other parties in the order taking an action.

### Buyer Updates

#### Payment Made

When the user has called the `wallet/orderSpend` API to pay for an order, they receive a socket message when the payment has been made.

This message *does not* mean the recipient's node is aware of the payment yet.

```
{
  "notification": {
    "coinType": "LTC",
    "fundingTotal": 23366,
    "notificationId": "QmYuSCXrR1Bk46VVjzVwE3aw9JcTLPKReYGv6pVHPzCJET",
    "orderId": "QmTCTBF57ujtZDd7KzHodZdsiHp7zwnzL798s2CB8uftKC",
    "type": "payment"
  }
}
```

#### Offline Purchase Rejected

This is received when the seller calls `ob/orderconfirmation` with a `reject` value of `true`.

```
{
  "notification": {
    "notificationId": "QmRVdHai627YZ9GcTvWNsGAhvEkndJVbSct1MkUrbH6665",
    "orderId": "QmV27u6aXm6bBu9oLSxnQG1k4Zta3q8iB2BpCA65LV1wAY",
    "thumbnail": {
      "small": "zb2rhdmv4SqzsxFzZK6tPeYkant6rRyFHDfJx3saUZLQsf6VT",
      "tiny": "zb2rhjj2XQEJ4XrquY6C1ATdAvYN6HL1HzFcZg65Se9cMnBhk"
    },
    "type": "declined",
    "vendorHandle": "",
    "vendorId": "QmeVMcgXsy9xyXshREU5avCYYPyrz5bgMZyTZjv44KhNnT"
  }
}
```

#### Offline Order Accepted 

This is received when the seller calls `ob/orderconfirmation` with a `reject` value of `false`.

```
{
  "notification": {
    "notificationId": "QmNirzKXfDySd9qAfH1JjPtLxp9hDqmtcZr9ANccdU3kRW",
    "orderId": "QmRmMj5A3drnnnxBbA5zs2i9PYTw6osQdfxAdJ5cWpFW6G",
    "thumbnail": {
      "small": "zb2rhdmv4SqzsxFzZK6tPeYkant6rRyFHDfJx3saUZLQsf6VT",
      "tiny": "zb2rhjj2XQEJ4XrquY6C1ATdAvYN6HL1HzFcZg65Se9cMnBhk"
    },
    "type": "orderConfirmation",
    "vendorHandle": "",
    "vendorId": "QmeVMcgXsy9xyXshREU5avCYYPyrz5bgMZyTZjv44KhNnT"
  }
}
```


#### Refund Received

This is received when the seller calls `ob/refund`.

```
{
  "notification": {
    "notificationId": "QmWURc2PX3ho67vHy1gW83kDBHTf3piz7AXVgorXvuLBMU",
    "orderId": "QmTCTBF57ujtZDd7KzHodZdsiHp7zwnzL798s2CB8uftKC",
    "thumbnail": {
      "small": "zb2rhdmv4SqzsxFzZK6tPeYkant6rRyFHDfJx3saUZLQsf6VT",
      "tiny": "zb2rhjj2XQEJ4XrquY6C1ATdAvYN6HL1HzFcZg65Se9cMnBhk"
    },
    "type": "refund",
    "vendorHandle": "",
    "vendorId": "QmeVMcgXsy9xyXshREU5avCYYPyrz5bgMZyTZjv44KhNnT"
  }
}
```

#### Order Fulfilled

This is received when the seller calls `orderfulfillment`.

```
{
  "notification": {
    "notificationId": "QmT2LkRZHEZ8Sw7nPys35i5eKtBL4aZR34wiZSirTeemhi",
    "orderId": "QmPDrJEzzz7XgKqgJoJfRis32T7uGpRK3EqTURCwB7CmUa",
    "thumbnail": {
      "small": "zb2rhXytP3KvSpk2w8uMNi8ApM6cEBkcSmAcEp4xuzJ3HXH8W",
      "tiny": "zb2rhimYUmqHiXmPJ1FaAaZse8GvXC9mKSoHAPfbJpninVvqw"
    },
    "type": "fulfillment",
    "vendorHandle": "",
    "vendorId": "Qmdy44rwpPQ2opSJi9LjKSzChMgHXgdC5vPq5zfVUGNYbh"
  }
}
```

#### Dispute Window Expiry

When an order reaches one of the dispute timeout warning intervals, a notification is sent to the buyer.

```
{
  "notification": {
    "expiresIn": 2592000,
    "notificationId": "QmU9F8nhiDQ88oAR4eFiyH3iJKUYzfNkK1KuvJGoVujZBp",
    "orderId": "QmcoKERsaetjQX3cF5YySXQHabh5bthvsrk9WxyuooRsH3",
    "thumbnail": {
      "small": "zb2rhnjzCRVpJKqNvVSmWGG9yJW5vN6kb7x3pLt6mhTpoCiSP",
      "tiny": "zb2rhWtVHeuGumL5u11E7DDqwXMtHinPiAfKmh7kwJv17B5vz"
    },
    "type": "buyerDisputeExpiry"
  }
}
```

#### Funds Claimed

This notification is received after a seller calls the `ob/releaseescrow` API.

```
TODO
```

### Seller Updates

#### New Order Received

This notification is received after a buyer has paid for a purchase and the payment is detected by the seller's node.

```
{
  "notification": {
    "buyerHandle": "",
    "buyerId": "QmeVMcgXsy9xyXshREU5avCYYPyrz5bgMZyTZjv44KhNnT",
    "listingType": "DIGITAL_GOOD",
    "notificationId": "Qmbe1AVhpsbdnMnNjEeq44N6L3ujTXVEtEeLcVje3Mk3uE",
    "orderId": "QmbMY8sGFeZ4cF9LGFmDRgT6Ao3sVRtGcYW5vuJ9ckWFAZ",
    "price": {
      "amount": 23422,
      "coinDivisibility": 100000000,
      "currencyCode": "LTC",
      "priceModifier": 0
    },
    "slug": "test-digital-for-2.3",
    "thumbnail": {
      "small": "zb2rhXytP3KvSpk2w8uMNi8ApM6cEBkcSmAcEp4xuzJ3HXH8W",
      "tiny": "zb2rhimYUmqHiXmPJ1FaAaZse8GvXC9mKSoHAPfbJpninVvqw"
    },
    "title": "test digital for 2.3.1",
    "type": "order"
  }
}
```

#### Order Completed

This is received when the buyer calls `ob/ordercompletion`.

```
{
  "notification": {
    "buyerHandle": "",
    "buyerId": "QmeVMcgXsy9xyXshREU5avCYYPyrz5bgMZyTZjv44KhNnT",
    "notificationId": "Qmde61M777DpehxhckTBJbEwpNSzC4PqXhsevesw6BgJPi",
    "orderId": "QmbMY8sGFeZ4cF9LGFmDRgT6Ao3sVRtGcYW5vuJ9ckWFAZ",
    "thumbnail": {
      "small": "zb2rhXytP3KvSpk2w8uMNi8ApM6cEBkcSmAcEp4xuzJ3HXH8W",
      "tiny": "zb2rhimYUmqHiXmPJ1FaAaZse8GvXC9mKSoHAPfbJpninVvqw"
    },
    "type": "orderComplete"
  }
}
```

### Buyer and Seller Updates

#### Dispute Opened

This is received when either the buyer or seller calls `ob/opendispute`.

```
{
  "notification": {
    "buyer": "Qmdy44rwpPQ2opSJi9LjKSzChMgHXgdC5vPq5zfVUGNYbh",
    "disputeeHandle": "",
    "disputeeId": "Qmdy44rwpPQ2opSJi9LjKSzChMgHXgdC5vPq5zfVUGNYbh",
    "disputerHandle": "",
    "disputerId": "QmeVMcgXsy9xyXshREU5avCYYPyrz5bgMZyTZjv44KhNnT",
    "notificationId": "QmY9tD3fhZDDSs4NjUtKfYKU7JiP2S1vgx8eF3qKg7Ppgb",
    "orderId": "Qmbxj8B1FaUSjQLZyG9u6yBNZ87HzdJuWkwRK6N2vwQ7gf",
    "thumbnail": {
      "small": "zb2rhdmv4SqzsxFzZK6tPeYkant6rRyFHDfJx3saUZLQsf6VT",
      "tiny": "zb2rhjj2XQEJ4XrquY6C1ATdAvYN6HL1HzFcZg65Se9cMnBhk"
    },
    "type": "disputeOpen"
  }
}
```

#### Dispute Closed

This is received when the moderator calls `ob/closedispute`.

```
{
  "notification": {
    "buyer": "QmShZpfoqTsdov6R7z46YgspWJxcvDmQNQuMMfMxUNBSFr",
    "notificationId": "QmSvTTKgcKj9AwQ4zqnnNPQewy9dJrBfpAL8c1XqeoucfX",
    "orderId": "QmcoKERsaetjQX3cF5YySXQHabh5bthvsrk9WxyuooRsH3",
    "otherPartyHandle": "",
    "otherPartyId": "QmaWkAWZ5ZS1dGmYkkJRBMVGMmAbjpRCPCNeGsxgYLCcx9",
    "thumbnail": {
      "small": "zb2rhnjzCRVpJKqNvVSmWGG9yJW5vN6kb7x3pLt6mhTpoCiSP",
      "tiny": "zb2rhWtVHeuGumL5u11E7DDqwXMtHinPiAfKmh7kwJv17B5vz"
    },
    "type": "disputeClose"
  }
}
```

#### Dispute Accepted

This is received when either the buyer or seller calls `ob/releasefunds`.

```
{
  "notification": {
    "buyer": "Qmdy44rwpPQ2opSJi9LjKSzChMgHXgdC5vPq5zfVUGNYbh",
    "notificationId": "QmeFmw8UWQbXyqRCMfLg99u73wN6rgc8BCQ4YN4bQqxw76",
    "orderId": "Qmbxj8B1FaUSjQLZyG9u6yBNZ87HzdJuWkwRK6N2vwQ7gf",
    "otherPartyHandle": "",
    "otherPartyId": "QmeVMcgXsy9xyXshREU5avCYYPyrz5bgMZyTZjv44KhNnT",
    "thumbnail": {
      "small": "zb2rhdmv4SqzsxFzZK6tPeYkant6rRyFHDfJx3saUZLQsf6VT",
      "tiny": "zb2rhjj2XQEJ4XrquY6C1ATdAvYN6HL1HzFcZg65Se9cMnBhk"
    },
    "type": "disputeAccepted"
  }
}
```

### Moderator Updates

#### Dispute Window Expired

This is received when the window to resolve a dispute has expired.

```
{
  "notification": {
    "disputeCaseId": "QmPgRCqyHq3KRQf7nKkqA5m6gyNyBU6gtZ4tx787csgGpG",
    "expiresIn": 2592000,
    "notificationId": "QmVFtZH85xEnWqEKDimJSLY7uMSAhY6X9MHzsSo4jhcPJt",
    "thumbnail": {
      "small": "zb2rhcmCAkJSDmmC2B7vQ2bWdKsNzuuuJny5aMV47KiKEhYxB",
      "tiny": "zb2rhfrfJrssPwMKxxxjJeiA1k2XuQ3p26hjAJtbmwhqufME3"
    },
    "type": "moderatorDisputeExpiry"
  }
}
```


## Profile Lookups

When the `ob/fetchprofiles` API is called with an `async` value of `true`, the data on the profiles fetched is returned in socket messages, with each profile delivered in a separate message.

The API will return an `id`, each socket message that is a reply to the API will have the same `id`. It's possible to fire multiple calls to `ob/fetchprofiles` and you may want to track which responses belong to which request, especially if some have `usecache` set to `true` and others have it set to `false`.

```
{
  "id": "cd29c03d-2736-1ad3-2cc9-88e1407041d0",
  "peerId": "QmdAJqBxLhYCMyfsaTR3rTWPAW8D1gBX5VET9dr25jXzQg",
  "profile": {
    "about": "",
    "avatarHashes": {
      "large": "zb2rhbCspUDPfmcWq9fEoTW3vbRAPiHhXxcViAidCt7uYndkG",
      "medium": "zb2rhf3fYMZ4gJkoBMT5H3aS71nPDYjmRHdJf4aBnudmtZfY6",
      "original": "zb2rhZTA5U1ysidVRd8iB28mLKPtaMQUFiasAKnidYFsXyVzc",
      "small": "zb2rhYDJtfaLSTQFdATtFEeUQV4fjH1D8sFQYV5rFAVJiWR7y",
      "tiny": "zb2rhhS44cknMFb2qZFmiCcTU4mH7mk76ug3VDj3K54u6Hk14"
    },
    "bitcoinPubkey": "0204345a9c686fc5bafbeb040c7cae6c8be2a61a862fcb0ba0c06ec839d0b58a39",
    "colors": {
      "highlight": "#2BAD23",
      "highlightText": "#252525",
      "primary": "#FFFFFF",
      "secondary": "#ECEEF2",
      "text": "#252525"
    },
    "contactInfo": {
      "email": "",
      "phoneNumber": "",
      "social": [],
      "website": ""
    },
    "currencies": [
      "BCH",
      "ZEC",
      "LTC",
      "BTC"
    ],
    "handle": "",
    "lastModified": "2019-01-21T21:20:41.058031Z",
    "location": "test location 1",
    "moderator": false,
    "name": "tester2",
    "nsfw": false,
    "peerID": "QmdAJqBxLhYCMyfsaTR3rTWPAW8D1gBX5VET9dr25jXzQg",
    "shortDescription": "",
    "stats": {
      "averageRating": 1,
      "followerCount": 6,
      "followingCount": 1,
      "listingCount": 3,
      "postCount": 0,
      "ratingCount": 2
    },
    "vendor": true
  }
}
```

```
{
  "error": "Not found",
  "id": "7863b9a5-118f-c1ed-0f34-c0b6a3e02edd",
  "peerID": "QmeVMcgXsy9xyXshREU5avCYYPyrz5bgMZyTZjv44KhNnT"
}
```

## Chat

Incoming chat messages are delivered over sockets. The data is the same as the data returned from the `ob/chatmessages` API.

### Message

#### Normal Chat Message

Chat messages should never have a value for the subject unless they are associated with an order.

```
{
  "message": {
    "message": "Example message.",
    "messageId": "QmSzWn8fM8bnnwrnUphovDagSqj4ShQwbQMr5ScEUAoxJZ",
    "outgoing": false,
    "peerId": "QmeVMcgXsy9xyXshREU5avCYYPyrz5bgMZyTZjv44KhNnT",
    "read": false,
    "subject": "",
    "timestamp": "2019-02-12T10:17:23.410576-05:00"
  }
}
```

#### Order Chat Message

If a chat message has a value for `subject` it should be an orderId. This means the message is connected to that order.

```
{
  "message": {
    "message": "Example order message.",
    "messageId": "QmNc3zQrXnGByravKMYsov8sxKiUV7mKPX1yWdoAUwdD7R",
    "outgoing": false,
    "peerId": "QmeVMcgXsy9xyXshREU5avCYYPyrz5bgMZyTZjv44KhNnT",
    "read": false,
    "subject": "QmbMY8sGFeZ4cF9LGFmDRgT6Ao3sVRtGcYW5vuJ9ckWFAZ",
    "timestamp": "2019-02-12T10:21:20.871564-05:00"
  }
}
```

#### Typing

A messageTyping message is an indicator the other party is currently typing.

```
{
  "messageTyping": {
    "messageId": "QmRuBDknbF1Fpw9kZFccNtLWJQ8t4YcMaouHnMNz9pwg1i",
    "peerId": "QmeVMcgXsy9xyXshREU5avCYYPyrz5bgMZyTZjv44KhNnT",
    "subject": ""
  }
}
```

## Moderator

A moderator node receives this notification when someone adds them as a moderator.

```
TODO
```


## Follow/Unfollow

This notification is recieved when the node is followed or unfollowed.

```
{
  "notification": {
    "notificationId": "QmQYebg3egh4TaMrmKrxezgbMNngHPY3cpsh3uEnz6wJPZ",
    "peerId": "QmX29bG4vhFhj9FzVt1wYovqFRJS4xcvwruwcYPevaV8dt",
    "type": "follow"
  }
}
```

```
{
  "notification": {
    "notificationId": "QmQYebg3egh4TaMrmKrxezgbMNngHPY3cpsh3uEnz6wJPZ",
    "peerId": "QmX29bG4vhFhj9FzVt1wYovqFRJS4xcvwruwcYPevaV8dt",
    "type": "unfollow"
  }
}
```

## Status

Status messages are received to show the state of publishing updates.

```
{
  "status": "publishing"
}
```
```
{
  "status": "publish complete"
}
```