---
title: "Order Flow"
menu:
    guides:
        parent: concepts
---

This document outlines the order flow for OpenBazaar transactions.

![OpenBazaar Order Flow](/assets/order-flow.png)

## Unreachable Nodes and Order States

It is important to note that when a node is unreachable (offline or unable to receive incoming messages), it may not receive messages from the other party that start an order or change the state of an order. Those messages will be saved to the DHT.

The receiver’s node should check for stored messages on startup, and every 10 minutes. When it detects stored messages, it will download them from the DHT, then make changes to order states as needed.

### Error Format
Errors should always have a success parameter of false, and a reason. Ideally errors will also supply an error code to assist with internationalization.

```
{
	"success": false,
	"reason": "Failed to get block for QmegBizmjT5L5g9Dx8YbKz2SYFX8sGamcKREEJm5PtvtW7: context deadline exceeded"
}
```

### Types
**Strings**: Strings should have a character max designated in the right side notes.
**Integers**: Unless otherwise specified, all numbers are 64 bit integers.

### Optional Values
Any keys that are not required to be sent in the JSON are blue.

### Quick Reference

| Call | Description |
|:-----|:--------|
| `wallet/estimatefee`         |  Get an estimate of the fee for this purchase.        |
| `wallet/spend`         |  Pay for an order.      |
| `ob/purchase`         |  Create an order.        |
| `ob/ordercancel`        |  Buyer cancels a funded order the seller hasn’t accepted yet.       |
| `ob/orderconfirmation`         |  Accept or Reject a funded order.        |
| `ob/orderfulfillment`         |  Fulfill an order.        |
| `ob/refund`        |  Send funds back to the buyer if the order isn't fulfilled yet.        |

## API Calls

### **POST** wallet/estimatefee
**Estimate the Fee**

**INCOMING STATUS**: N/A \
**OUTGOING STATUS**: N/A

This call will estimate the fee that would be paid for the designated amount, given the current state of the payer’s wallet. The fee may vary considerably based on the inputs required to construct the payment (more inputs will increase the fee).

*Warning*: This number is an estimate, the actual fee may be different when the order is paid for. It may change because network fees have changed, or because new inputs have arrived in the user’s wallet and changed which inputs are used to construct the output.

**Data Sent**
```
wallet/estimatefee/?feeLevel=NORMAL&amount=3372
```
The `feeLevel` and `amount` are sent as query parameters.

The amount is in the base units for that cryptocurrency, ie: satoshis for BTC and BCH.

**Data Received**
```
{
  "estimatedFee": 1190
}
```
The amount is in the base units for that cryptocurrency, ie: satoshis for BTC and BCH.

### **POST** ob/estimatetotal
**Estimate the Total**

**INCOMING STATUS**: N/A \
**OUTGOING STATUS**: N/A

The estimate total call can receive the same data as the purchase call, and will return the expected total, with fee. It does not require all the parameters, any that don’t impact the cost of the order can be skipped.

*Warning*: This number is an estimate, the actual fee may be different when the order is paid for. It may change because network fees have changed, or because new inputs have arrived in the user’s wallet and changed which inputs are used to construct the output.

**Data Sent**
```
{
  "moderator": "QmavDQXqqQYGEJpvZcJFWp89L1PSrG5V9Kws9b7wWe5evR",
  "items": [
	{
  	"listingHash": "zb2rheV4YDwBR9mo2qiwd5R9X8DAj5EndAC9prUL9mkmTzYqh",
  	"options": [
    	{
      	"name": "size",
      	"value": "small"
    	},
    	{
      	"name": "color",
      	"value": "red"
    	}
  	],
  	"shipping": {
    	"name": "test",
    	"service": "test1"
  	},
  	"memo": "",
  	"coupons": [],
  	"quantity": 1
	}
  ]
}
```
This call can take the same data as the purchase call, but not all of it is required.

- The `moderator` field is only required if it has a value. It can be left out if there is no moderator on the order.
- A `shipping` object is only required if the listing is a physical listing.
- `Memo` is only required if it has a value.
- `Coupons` is only required if it has a value.

**Data Received**
```
2255
```
The value is an integer in the base units of the cryptocurrency being used.

### **POST** ob/purchase
**Purchase**

**INCOMING STATUS**: N/A \
**OUTGOING STATUS**: AWAITING_PAYMENT

The purchase call can be made to a reachable or a unreachable vendor (offline or not able to receive incoming messages).

If the total of the purchase is not more than 4x the current transaction fee, the purchase will be rejected (ie: if the fee is 0.0001, the total purchase must be more than 0.0004).

*Note*: once a purchase creates an order, the order is permanent. This can cause some confusion, since the purchaser does not have to pay for the order, which can leave an order in the AWAITING_PAYMENT state indefinitely.

This is different from most eCommerce platforms, which only create an order when it’s paid for. It works this way because the user may not have sufficient funds at the moment of purchase, and could fund that order at any time in the future, even if it’s years later.

**Data Sent**

Listing Types: Physical, Digital, Service Listing

```
{
  "shipTo": "Alex Smith",
  "address": "100 1st Ave",
  "city": "Cityville",
  "state": "IL",
  "postalCode": "55555",
  "countryCode": "UNITED_STATES",
  "addressNotes": "Ring doorbell on delivery, please.",
  "moderator": "",
  "items": [
    {
       "listingHash": "zb2rhhuuYXFNHG3PQCwooKXLQYtqgQcdG4CoFfPWXhVeqKpGz",
      "quantity": 10,
      "options": [
        {
          "name": "size",
          "value": "small"
        },
        {
          "name": "color",
           "value": "red"
        }
      ],
      "shipping": {
        "name": "test",
        "service": "test1"
      },
      "memo": "",
      "coupons": [
        "test"
        ]
    }
  ],,
  "alternateContactInfo": "Email me at alexs@email.com",
  “RefundAddress”: “”
}
```

- Only the `shipTo` and `countryCode` are required in the address data, and only if the item is a **physical** good.
- For non-physical orders, the address fields are optional.
- If the `moderator` value is left blank or the parameter is not included, this will be an **unmoderated** order. If the value is not in the listing’s moderator list the purchase will be rejected.
- The items should be an array of item objects. This supports multiple items for future cart functionality.
- If the vendor is reachable, the purchase will be rejected if the `quantity` is over the amount left in inventory.
- If the vendor is not reachable, the `quantity` can be any integer greater than zero.
- The `options` describe each option (variant) that was chosen. Each option in the item must have a value. It should be an empty array if the item didn’t have `options`.
- If this is a **physical** good, the `shipping` object has the name of the shipping option, and one of the services in it.
- A `shipping` object is only required if the listing is a **physical** listing.
- `Memo` is only required if it has a value.
- `Coupons` is only required if it has a value.
- The coupon values are the coupon codes. If an invalid value is sent, it is ignored by the server.
- `Memo` and `alternateContactInfo` are both arbitrary strings.
- `RefundAddress` is an external address to return funds to when an order is **cancelled**, **refunded**, or a dispute is **resolved**. It should be used if the buyer pays with an external wallet.

**Data Sent**

Listing Types: Crypto Listing

```
{
  "moderator": "",
  "items": [
	{
  	"listingHash": "zb2rho7k4N62S4xMiXZB7xiQetm6FzR5MBryeceZQczgB9Mny",
  	"quantity": 100000000,
  	"memo": "",
  	"coupons": [],
  	"paymentAddress": "abcdefg"
	}
  ],
  "alternateContactInfo": ""
}
```

- For a crypto listing, the `quantity` represents base units of the currency.
- The `paymentAddress` is ideally a valid address, but it is not validated by the server.

**Data Received**

```
{
  "amount": 26570,
  "orderId": "QmPHxwtBB6yUyTryARxtmJW41rbz8871mfrFPSLz3so2rs",
  "paymentAddress": "tb1q2gzlqfs27al4087h56gg9pgza2l7fp0v7tl0llgd9agfhx6us8qs5ht6fw",
  "vendorOnline": false
}
```

- The `amount` is in the base unit of the cryptocurrency (ie: Satoshis for BTC and BCH).
- The `vendorOnline` boolean represents whether the seller could receive incoming messages when the purchase was made. This affects whether the order moves to **AWAITING_FULFILLMENT** or **PENDING** when the order is paid for and the TX (txid returned from the spend call) for the order is confirmed.

### **POST** wallet/spend
**Pay for the Purchase**

**INCOMING STATUS**: AWAITING_PAYMENT \
**OUTGOING STATUS**: PENDING or AWAITING_FULFILLMENT

The buyer will pay a fee in addition to the amount of the order. The fee is determined by the fee level (ECONOMIC, NORMAL, PRIORITY) sent to the call.

- If the order is `unmoderated`, and the seller is reachable, the payment will be ?
- If the order is `moderated`, the payment will be a 2-of-3 multisig.
- If the seller is unreachable, the payment will be a 2-of-2 multisig.

If the seller is reachable, the order will move to the AWAITING_FULFILLMENT state.

If the seller is unreachable, the order will move to the PENDING state.

For multi-signature payments, the crypto transaction is set to be claimable by the seller after roughly 45 days (measured by blocks). The `ob/releaseescrow` API will reset the timer for a new 45 days if the order is disputed, but this doesn’t change the original payment. It can be claimed directly by the seller if they use an external wallet.

**Data Sent**

```
{
  "feeLevel": "NORMAL",
  "memo": "",
  "address": "tb1q2gzlqfs27al4087h56gg9pgza2l7fp0v7tl0llgd9agfhx6us8qs5ht6fw",
  "amount": 26570
}
```

The fee level will be used for the initial transaction. Transactions after that will use the NORMAL fee, set by the server.

**Q**: Does this normal fee get used by the transaction when completing the order?

**Data Received**
```
{
  "amount": 27106,
  "confirmedBalance": 145637,
  "memo": "test new listing",
  "timestamp": "2018-04-19T15:16:18-04:00",
  "txid": "ee4f0bb4b405f17eeeb3e84aaf6bb02a13763cf87a71375f7d59ca5fe916a47d",
  "unconfirmedBalance": 0
}
```

- `Amount` is the total amount paid. It is not known until the payment is made.
- `confirmedBalance` is the amount in the buyer’s wallet.
- `unconfirmedBalance` is the amount in the buyer’s wallet that hasn’t been confirmed yet.
- The `memo` is usually the name of the listing.

**Q**: What is the purpose of returning the balances?

### **POST** ob/ordercancel
**Buyer cancels the order**

**INCOMING STATUS**: PENDING \
**OUTGOING STATUS**: CANCELLED

If the order is in the **PENDING** state (it has been funded but the seller has not accepted it yet) the buyer can cancel it. This will move the funds back to their wallet and change the state to **CANCELLED**.

This will subtract a NORMAL fee from the transaction.

**Data Sent**

```
{
  orderId: "QmPHxwtBB6yUyTryARxtmJW41rbz8871mfrFPSLz3so2rs"
}
```

**Data Received**

```
{}
```

Empty data is returned if successful.

### **POST** ob/orderconfirmation
**Seller confirms the order**

**INCOMING STATUS**: PENDING \
**OUTGOING STATUS**: AWAITING_FULFILLMENT or DECLINED

This will accept or reject the order. If it is accepted, it will move to the **AWAITING_FULFILLMENT** state.

If it is rejected, it will move to the **DECLINED** state. The funds will be moved to the buyer’s wallet, after a NORMAL fee is subtracted from them.

**Data Sent**

```
{
  "orderId": "QmSPBFQgZ8GHmVLbhivG4YoeH3dHwsfi7UqcJUH9p2CDEr",
  "reject": false
}
```

Set `reject` to false to accept the order, true to reject it.

**Data Received**

```
{}
```

Empty data is returned if successful.

### **POST** ob/orderfulfillment
**Seller fulfills the order**

**INCOMING STATUS**: AWAITING_FULFILLMENT \
**OUTGOING STATUS**: FULFILLED

This will trigger a 45 day timer on the order. After 45 days if the state of the order is still **FULFILLED** the seller will be able to call the `releaseescrow` API to change the state to **PAYMENT_FINALIZED** and claim the funds.

**Data Sent** (Physical Good)

```
{
  "orderId": "QmcpbX5T5sJEVno2ARFCxswREMkJ5P1Wg2vijz9Jo3ZNSc",
  "physicalDelivery": [
	{
  	"shipper": "UPS",
  	"trackingNumber": "123abc"
	}
  ],
  "note": "A note"
}
```

`Shipper` should be the name of the shipping option chosen by the buyer.

**Data Sent** (Digital Good)

```
{
  "orderId": "QmPYy3MpVyZ4pFQdCf6ZZJsvcjNro4ZjHxq9BGg1X9u5zc",
  "digitalDelivery": [
	{
  	"url": "http://blah.com",
  	"password": ""
	}
  ],
  "note": ""
}
```

The url is required, the password is optional.

**Data Sent** (Service)

```
{
  "orderId": "QmV3mBSSq992ETtFYJgK9mZeMKxdnqKQ7U1xQXL8eAXFNd",
  "note": "asddsa"
}
```

If neither physicalDelivery nor digitalDelivery is sent, the fulfillment is a service.

**Data Sent** (Cryptocurrency)
```
TODO
```

**Data Received**

```
{}
```

Empty data is returned if successful.

### **POST** ob/refund
**Seller refunds the order**

**INCOMING STATUS**: AWAITING_FULFILLMENT \
**OUTGOING STATUS**: REFUNDED

An order can be refunded when it is in the **AWAITING_FULFILLMENT** state. This will move it to the **REFUNDED** state.

**Data Sent**

```
{
  "orderId": "QmSPBFQgZ8GHmVLbhivG4YoeH3dHwsfi7UqcJUH9p2CDEr"
}
```

**Data Received**

```
{}
```

Empty data is returned if successful.

### **POST** ob/ordercompletion
**Buyer completes the order**

**INCOMING STATUS**: FULFILLED, RESOLVED, PAYMENT_FINALIZED \
**OUTGOING STATUS**: COMPLETED

**Data Sent**

```
{
  "ratings": [
	{
  	"review": "test",
  	"anonymous": false,
  	"overall": 4,
  	"quality": 2,
  	"description": 4,
  	"deliverySpeed": 3,
  	"customerService": 5,
  	"slug": "test-service"
	}
  ],
  "orderId": "QmNUgPAEyZAZCS5ic1rTVzo7QBUrz4RkdiuApox4kbPyG6"
}
```

The anonymous parameter controls whether the user’s peerID will be displayed by the seller on the review.

**Data Received**

```
{}
```

Empty data is returned if successful.

### **POST** ob/opendispute
**Buyer or Seller opens a dispute**

**INCOMING STATUS**: PENDING (buyer), AWAITING_FULFILLMENT (buyer), PARTIALLY_FULFILLED (buyer, seller), FULFILLED (buyer, seller), PROCESSING_ERROR (buyer if order funded) \
**OUTGOING STATUS**: DISPUTED

When a dispute is started, the order state becomes **DISPUTED**. A message will be sent to the moderator on the order. They are the only one able to change the state of the order once it is **DISPUTED** until 45 days after the start of the dispute, at which point the seller will be able to call the `releaseescrow` API to change the state to **PAYMENT_FINALIZED** and claim the funds.

**Data Sent**

```
{
  "claim": "Never delivered",
  "orderId": "QmV3mBSSq992ETtFYJgK9mZeMKxdnqKQ7U1xQXL8eAXFNd"
}
```

**Data Received**

```
{}
```

Empty data is returned if successful.

### **POST** ob/closedispute
**Moderator closes a dispute**

**INCOMING STATUS**: DISPUTED \
**OUTGOING STATUS**: DECIDED

This call will create a payout decision in a dispute. Once made, the decision is final, either the buyer or seller must accept the decision by calling `ob/releasefunds` to move the order out of the **DECIDED** state.

It is important to note that the actual payout to the buyer and seller is reduced by the moderators fee. The percentages are applied after the fee.

Since the moderator’s fee can be a fixed amount, it is possible for the actual payout to one or both parties to be below the dust limit, or zero. If that happens, no payment will be sent to that user.

**Data Sent**

```
{
  "resolution": "I am in favor of the buyer.",
  "orderId": "QmV3mBSSq992ETtFYJgK9mZeMKxdnqKQ7U1xQXL8eAXFNd",
  "buyerPercentage": 100,
  "vendorPercentage": 0
}
```

**Data Received**

```
{}
```

Empty data is returned if successful.

### **POST** ob/releasefunds
**Buyer or Seller releases funds**

**INCOMING STATUS**: DECIDED \
**OUTGOING STATUS**: RESOLVED

This call is used to accept the decision of the moderator. Either the buyer or the seller can make this call.

**Data Sent**

```
{
"orderId":"QmV3mBSSq992ETtFYJgK9mZeMKxdnqKQ7U1xQXL8eAXFNd"
}
```

**Data Received**
```
{}
```

Empty data is returned if successful.

### **POST** ob/releaseescrow
**Seller releases the escrow**

**INCOMING STATUS**: FULFILLED, DISPUTED \
**OUTGOING STATUS**: PAYMENT_FINALIZED

If the order is in the **FULFILLED** state, and 45 days have passed since the order was funded, the seller can call this API. The time is based on the number of confirmations on the payment  (each confirmation is roughly 10 minutes).

If the order is in the **DISPUTED** state, and 45 days have passed since the dispute was started, the seller can call this API.

If the order was in the **AWAITING_FULFILLMENT** state before the dispute was started,

In both cases, the buyer can call `ob/ordercompletion` to leave a review and complete the order.

## Location of Funds

The location of a user’s funds depend on the state of the order, and whether it was a multisig transaction.

## TODO

- Fees and Dust Limits

Fees can reduce an offline payment, dispute payment, or a refund below the dust level, which means the user will never receive those funds. This is mostly prevented by a server rule that multisig payments must be at least 4 times larger than the current fee.

Fees can change, however. It’s possible for a $5 order to be allowed when fees are $1, but when a refund is issued the fee is now $6, and the refund fails.

More information on fees can be found in this doc:

https://docs.google.com/document/d/1-pydZ6CXZl2KNyTYWFXBBvqlzUTtWiEFNjEkaz8iFWg/edit?usp=sharing

State
Code
Details
Can be Changed From
Can be Changed To
PENDING
0
Order has been funded and a message has been sent to the vendor, but they were unreachable. The vendor must accept or decline the order when they see it.
AWAITING_PAYMENT
AWAITING_FULFILLMENT
CANCELLED
DECLINED
DISPUTED
AWAITING_PAYMENT
1
Waiting for the buyer to fund the payment address.
New Order
PENDING
AWAITING_FULFILLMENT
AWAITING_PICKUP
2
Waiting for the customer to pick up the order (customer pickup option only)
?
COMPLETED
PAYMENT_FINALIZED
AWAITING_FULFILLMENT
3
Order has been fully funded and we're waiting for the vendor to fulfill
PENDING
AWAITING_PAYMENT
PARTIALLY_FULFILLED
FULFILLED
REFUNDED
DISPUTED
PARTIALLY_FULFILLED
4
Vendor has fulfilled part of the order. This is part of the cart functionality that is currently not used by any implementations.
AWAITING_FULFILLMENT
FULFILLED
REFUNDED
DISPUTED
FULFILLED
5
Vendor has fulfilled the order
AWAITING_FULFILLMENT
PARTIALLY_FULFILLED
COMPLETED
PAYMENT_FINALIZED
DISPUTED
COMPLETED
6
Buyer has completed the order and left a review
FULFILLED
AWAITING_PICKUP
RESOLVED
PAYMENT_FINALIZED


CANCELLED
7
Buyer canceled the order (offline order only)
PENDING


DECLINED
8
Vendor declined to confirm the order (offline order only)
PENDING


REFUNDED
9
Vendor refunded the order
AWAITING_FULFILLMENT
PARTIALLY_FULFILLED


DISPUTED
10
Contract is under active dispute
Buyer:
PENDING
FULFILLED
AWAITING_FULFILLMENT
PARTIALLY_FULFILLED
FULFILLED
PROCESSING_ERROR

Seller:
PARTIALLY_FULFILLED
FULFILLED


DECIDED
PAYMENT_FINALIZED
DECIDED
11
The moderator has resolved the dispute and we are waiting for the winning party to accept the payout.
DISPUTED
RESOLVED


RESOLVED
12
The winning party has accepted the dispute and it is now complete. After the buyer leaves a review the state should be set to COMPLETE.
DECIDED
COMPLETED
PAYMENT_FINALIZED
13
Escrow has been released after waiting the timeout period. After the buyer leaves a review the state should be set to COMPLETE.
FULFILLED
DISPUTED
COMPLETED
PROCESSING_ERROR
14
This state is only used for offline orders. If a processing error occurred with an open connection between buyer and vendor the vendor just rejects the order on the spot neither party commits the order to the database.


DISPUTED
