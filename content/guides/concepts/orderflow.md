---
title: "Order Flow"
menu:
    guides:
        parent: concepts
---


# Order Flow

This document outlines the order flow for OpenBazaar transactions.

![OpenBazaar Order Flow](/assets/order-flow.png)


## Optimal Order Path

An order that is completed with no issues should follow the steps below:
- Buyer: ob/purchase
- Buyer: wallet/spend
- Seller: ob/orderconfirm (offline orders only)
- Seller: ob/orderfullfillment
- Buyer: ob/ordercompletion

Funds are transferred to the seller immediately for direct orders.

Multisig orders (the seller node was unreachable at the moment of purchase, or the order is moderated) hold their funds in escrow until the order is completed (ob/ordercompletion), refunded, disputed and the dispute is resolved, or after the order has timed out and ob/releaseescrow is called.


### Unreachable Nodes and Order States

It is important to note that when a node is unreachable (offline or unable to receive incoming messages), it may not receive messages from the other party to start or change the state of an order.

The receiver’s node should check for messages stored on any connected push node on startup, and every 10 minutes. When it detects stored messages, it will download them from the push node, then make changes to order states as needed.

Once an hour nodes also check the DHT for any messages that have not yet been retrieved. If messages are found, they are pulled from the original sender or a push node.

### Error Format
Errors should always have a success parameter of false, and a reason. Ideally errors will also supply an error code to assist with internationalization.

```
{
	"success": false,
	"reason": "Failed to get block for QmegBizmjT5L5g9Dx8YbKz2SYFX8sGamcKREEJm5PtvtW7: context deadline exceeded"
}
```

## API Calls
The following is a detailed list of purchase-related API calls.

### Quick Reference

| Call | Description |
|:-----|:--------|
| `wallet/estimatefee` | Get an estimate of the fee for this purchase. |
| `wallet/spend` | Send funds to an address. |
| `wallet/orderspend` | Pay for an order. |
| `ob/estimatetotal` | Returns estimated todal, including fee. |
| `ob/purchase` | Create an order. |
| `ob/ordercancel` | Buyer cancels a funded order the seller hasn’t accepted yet. |
| `ob/refund` | Send funds back to the buyer if the order isn't fulfilled yet. |
| `ob/orderconfirmation` |  Accept or Reject a funded order. |
| `ob/orderfulfillment` | Fulfill an order. |
| `ob/ordercompletion` | Buyer completes the order. |
| `ob/opendispute` | Dispute an order. |
| `ob/closedispute` | Send a resolution to a dispute. |
| `ob/releasefunds` | Accept a dispute resolution. |
| `ob/releaseescrow` | Release funds to the seller after the order has timed out. |


### Types
**Strings**: Strings should have a character max. \
**Integers**: Unless otherwise specified, all numbers are 64 bit integers.

### Optional Values
Any keys that are not required to be sent in the JSON are marked as optional.

### **POST** wallet/estimatefee
**Estimate the Fee To Spend Funds**

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

*Note*: once a purchase creates an order, the order is permanent, and cannot be deleted. This can cause some confusion, since the purchaser does not have a time limit to pay for the order, which can leave an order in the AWAITING_PAYMENT state indefinitely.

This is different from most eCommerce platforms, which only create an order when it’s paid for. It works this way because the user may not have sufficient funds at the moment of purchase, and could fund that order at any time in the future, even years later.

Orders are independent of their listings once they are created. Modifying or deleting a listing will not affect existing orders for it.

**Data Sent (Listing Types: PHYSICAL_GOOD, DIGITAL_GOOD, SERVICE)**

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

- Only the `shipTo` and `countryCode` are required in the address data, and only if the listing type is **PHYSICAL_GOOD**.
- For non-physical good orders, the address fields are optional.
- If the `moderator` value is left blank or the parameter is not included, this will be an **unmoderated** order.
- If the value of `moderator` is not in the listing’s moderator list the purchase will be rejected.
- The items should be an array of item objects. This supports multiple items from the same seller for future cart functionality.
- If the vendor is reachable, the purchase will be rejected if the `quantity` is over the amount left in inventory.
- If the vendor is not reachable, the `quantity` can be any integer greater than zero.
- The `options` describe each option (variant) that was chosen. Each option in the item must have a value. It should be an empty array if the item didn’t have `options`.
- If this is a listing of type **PHYSICAL_GOOD**, the `shipping` object has the name of the shipping option, and one of the services in it.
- A `shipping` object is only required if the listing has a type of **PHYSICAL_GOOD**.
- `Memo` is only required if it has a value.
- `Coupons` is only required if it has a value.
- The coupon values are the coupon codes. If an invalid value is sent, it is ignored.
- `Memo` and `alternateContactInfo` are both arbitrary strings, and optional.
- `RefundAddress` is an external address to return funds to when an order is **cancelled**, **refunded**, or a dispute is **resolved**. It should be used if the buyer pays with an external wallet.

**Data Sent (Listing Type: CRYPTOCURRENCY)**

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

- When purchasing a listing of type CRYPTOCURRENCY, the `quantity` represents base units of the currency.
- The `paymentAddress` is ideally a valid address, but it is not validated.

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
**Send Funds**

**INCOMING STATUS**: N/A \
**OUTGOING STATUS**: N/A or PENDING or AWAITING_FULFILLMENT

This will send funds to an address. Typically it is used to send funds unrelated to an order. If this call is used to send funds to the funding address of an order, the order will be funded the same way it would be if an external wallet was used to fund it.

If an order address is funded in this way, it will move the state of the order according to the same rules as the wallet/orderspend endpoint.

**Data Sent**

```
{
  "feeLevel": "NORMAL",
  "memo": "",
  "address": "tb1q2gzlqfs27al4087h56gg9pgza2l7fp0v7tl0llgd9agfhx6us8qs5ht6fw",
  "amount": 26570
}
```

The `feeLevel` will be used for the initial transaction. Transactions after that will use the NORMAL fee.

The `memo` field is only used internally, and is shown later to the sender. It can be used for notes about the reason for sending the fund.

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
- The `memo` just returns the same memo data sent in the call.

### **POST** wallet/orderspend
**Pay for the Purchase**

**INCOMING STATUS**: AWAITING_PAYMENT \
**OUTGOING STATUS**: PENDING or AWAITING_FULFILLMENT

The buyer will pay a fee in addition to the amount of the order. The fee is determined by the fee level (ECONOMIC, NORMAL, PRIORITY) sent to the call.

- If the order is `unmoderated`, and the seller is reachable, the payment will be to a 2-of-2 multisignature escrow address.
- If the order is `moderated`, the payment will be to a 2-of-3 multisignature escrow address.
- If the seller is unreachable, the payment will be to a 2-of-2 multisignature escrow address.

If the seller is reachable, the order will move to the AWAITING_FULFILLMENT state.

If the seller is unreachable, the order will move to the PENDING state.

For multi-signature payments, the funds in the 2-of-3 address can be "claimed" by the seller and moved to their own OB wallet after roughly 45 days (measured by blocks) if the order is in a FULFILLED state.

The `ob/releaseescrow` API will reset the timer for a new 45 days if the order is disputed (ie: the server will reject calls to `ob/releaseescrow`).

**Note:** This call was added in version 2.3. Earlier version use the wallet/spend endpoint instead.

**Data Sent**

```
{
  "feeLevel": "NORMAL",
  "memo": "",
  "address": "tb1q2gzlqfs27al4087h56gg9pgza2l7fp0v7tl0llgd9agfhx6us8qs5ht6fw",
  "amount": 26570,
  "orderId": "QmZREfp2mxUS7Qwy1c7hkUTM5yFjyydhwp8fWDDYS7sajF"
}
```

The `feeLevel` will be used for the initial transaction. Transactions after that will use the NORMAL fee.

If a `memo` is sent, it will be used. If not, the title of the listing will be recorded as the memo.

**Data Received**
```
{
  "amount": 27106,
  "confirmedBalance": 145637,
  "memo": "name of listing",
  "timestamp": "2018-04-19T15:16:18-04:00",
  "txid": "ee4f0bb4b405f17eeeb3e84aaf6bb02a13763cf87a71375f7d59ca5fe916a47d",
  "unconfirmedBalance": 0
}
```

- `Amount` is the total amount paid. It is not known until the payment is made.
- `confirmedBalance` is the amount in the buyer’s wallet.
- `unconfirmedBalance` is the amount in the buyer’s wallet that hasn’t been confirmed yet.
- The `memo` is set to the name of the listing if no `memo` was sent in the POST.

### **POST** ob/ordercancel
**Buyer cancels the order**

**INCOMING STATUS**: PENDING \
**OUTGOING STATUS**: CANCELLED

If the order is in the **PENDING** state (it has been funded but the seller has not accepted it yet) the buyer can cancel it. This will move the funds back to their wallet and change the state to **CANCELLED**.

If a `RefundAddress` was provided with the payment, the funds will be moved to that address.

This will subtract a NORMAL fee from the transaction (ie: the buyer is refunded their payment not including the original fee, minus a fee to move the funds back to them).

This call is only needed when the buyer's node was not able to make a direct connection to the seller's node. The seller's node may be offline, or is otherwise unable to receive data about the payment.

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

If the order is in the **PENDING** state (it has been funded but the seller has not accepted it yet), this will accept or reject the order. If it is accepted, it will move to the **AWAITING_FULFILLMENT** state.

If it is rejected, it will move to the **DECLINED** state. The funds will be moved to the buyer’s wallet, after a NORMAL fee is subtracted from them.

This call is only needed when an "offline" order is created due to the buyer's node not being able to connect directly to the seller's node. Listings that are out of date may have been purchased while the seller's node is unreachable, those purchases will stay in the PENDING state until the buyer cancels them or the seller accepts or rejects them.

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

This will change the state of the order to FULFILLED, and will send a notification along with any additional fulfillment data to the buyer.

**Data Sent (Physical Good)**

```
{
  "orderId": "QmcpbX5T5sJEVno2ARFCxswREMkJ5P1Wg2vijz9Jo3ZNSc",
  "physicalDelivery": [
	{
  	"shipper": "UPS",
  	"trackingNumber": "123abc"
	}
  ],
  "note": "Will arrive in a blue box."
}
```

`shipper` should be the name of the shipping option chosen by the buyer.
`trackingNumber` is optional.
`note` is optional.

**Data Sent (Digital Good)**

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

`url` is required, `password` is optional.
`note` is optional.

**Data Sent (Service)**

```
{
  "orderId": "QmV3mBSSq992ETtFYJgK9mZeMKxdnqKQ7U1xQXL8eAXFNd",
  "note": "I will call 30 minutes before I arrive."
}
```

If neither a physicalDelivery nor a digitalDelivery object is sent, the fulfillment is a service.
`note` is optional.

**Data Sent (Cryptocurrency)**

```
{
  "orderId": "QmYrhFUcCctNTp8fmUEzoELhQc7aBddnyr7AMgfhjk1QaM",
  "note": "Enjoy your coins."
}
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

An order can be refunded when it is in the **AWAITING_FULFILLMENT** state. This will move it to the **REFUNDED** state, and move the funds that paid for the order back to the buyer.

If a `RefundAddress` was provided with the payment, the funds will be moved to that address.

The seller will pay the fee needed to move the order funds to a new address.

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

The `anonymous` parameter controls whether the user’s peerID will be displayed by the seller on the review.

**Data Received**

```
{}
```

Empty data is returned if successful.

### **POST** ob/opendispute
**Buyer or Seller opens a dispute**

**INCOMING STATUS**: PENDING (buyer), AWAITING_FULFILLMENT (buyer), PARTIALLY_FULFILLED (buyer, seller), FULFILLED (buyer, seller), PROCESSING_ERROR (buyer if order funded) \
**OUTGOING STATUS**: DISPUTED

When a dispute is started, the order state becomes **DISPUTED**. A message will be sent to the moderator of the order (the one listed in the contract). They are the only one able to change the state of the order once it is **DISPUTED** until 45 days after the start of the dispute, at which point the seller will be able to call the `releaseescrow` API to change the state to **PAYMENT_FINALIZED** and claim the funds.

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

This call will create a payout decision in a dispute. Once the decision is made, either the buyer or seller must accept it by calling `ob/releasefunds` to move the order out of the **DECIDED** state.

It is important to note that the actual payout to the buyer and seller is reduced by both the network fee and the the moderator's fee.

The fee to move the funds is subtracted from the funds in the order first. After that, the moderator's fee is subtracted, and the percentages are applied to the remaining funds.

It is possible for the actual payout to one or more parties to be below the dust limit, or zero. If that happens, no payment will be sent to that party. The dispute will still be resolved and will otherwise proceed normally even if some participants in the dispute do not receive any funds.

**Data Sent**

```
{
  "resolution": "I am mostly in favor of the buyer.",
  "orderId": "QmV3mBSSq992ETtFYJgK9mZeMKxdnqKQ7U1xQXL8eAXFNd",
  "buyerPercentage": 80,
  "vendorPercentage": 20
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

If the order is in the **FULFILLED** state, and 45 days have passed since the order was funded, the seller can call this API. The time is based on the number of blocks since the payment was confirmed, multiplied by the average time for a block to be written.

If the order is in the **DISPUTED** state, and 45 days have passed since the dispute was started, the seller can call this API. The time in this case is based on the timestamp of the dispute.

In both cases, the buyer can call `ob/ordercompletion` to leave a review and complete the order.


## Location of Funds

The location of a user’s funds depend on the state of the order, and whether it was a multisig transaction.

Direct online transaction: the funds are sent directly to an address the seller controls.

Direct offline transaction: the funds are sent to a 1-of-2 multisignature escrow address, with the OB server as the 2rd party. The funds are moved to an address controlled by the seller's wallet after the seller accepts the order. If the seller rejects the order, the funds are moved back to the buyer.

Moderated transaction: the funds are sent to a 2-of-3 multisignature escrow address, with the moderator as the 3rd party.

## Fees and Dust Limits

Fees can reduce an offline payment, dispute payment, or a refund below the dust level, which means the user will never receive those funds. This is mostly prevented by a server rule that multisig payments must be at least 4 times larger than the current fee.

Fees can change, however. It’s possible for a $5 order to be allowed when fees are $1, but when a refund is issued the fee is now $6, and the refund fails.

More information on fees can be found in this doc:

https://docs.google.com/document/d/1-pydZ6CXZl2KNyTYWFXBBvqlzUTtWiEFNjEkaz8iFWg/edit?usp=sharing


| State |Code | Details | Can be Changed From | Can be Changed To |
|---|---|---|---|---|
| PENDING | 0 | Order has been funded and a message has been sent to the vendor, but they were unreachable. The vendor must accept or decline the order when they see it. | AWAITING_PAYMENT | AWAITING_FULFILLMENT, CANCELLED, DECLINED, DISPUTED |
| AWAITING_PAYMENT | 1 | Waiting for the buyer to fund the payment address. | New Order | PENDING, AWAITING_FULFILLMENT |
| AWAITING_PICKUP | 2 | Buyer has fully funded the order, waiting for them to pick up the item. (customer pickup shipping option only) | PENDING, AWAITING_PAYMENT | COMPLETED, PAYMENT_FINALIZED |
| AWAITING_FULFILLMENT | 3 | Buyer has fully funded the order, waiting for the vendor to fulfill it. | PENDING, AWAITING_PAYMENT | PARTIALLY_FULFILLED, FULFILLED, REFUNDED, DISPUTED |
| PARTIALLY_FULFILLED | 4 | Seller has fulfilled part of the order. This is part of the cart functionality that is currently not used by any known client implementations. | AWAITING_FULFILLMENT | FULFILLED, REFUNDED, DISPUTED |
| FULFILLED | 5 | Seller has fulfilled the order. | AWAITING_FULFILLMENT, PARTIALLY_FULFILLED | COMPLETED, PAYMENT_FINALIZED, DISPUTED |
| COMPLETED | 6 | Buyer has completed the order and left a review. | FULFILLED, AWAITING_PICKUP, RESOLVED, PAYMENT_FINALIZED |
| CANCELLED | 7 | Buyer canceled the order (this applies to offline order only). | PENDING | |
| DECLINED | 8 | Seller declined to confirm the order (this applies to offline order only). | PENDING | |
| REFUNDED | 9 | Seller refunded the order. | AWAITING_FULFILLMENT, PARTIALLY_FULFILLED | |
| DISPUTED | 10 | The order is being disputed by the buyer or seller. | Buyer: PENDING, FULFILLED, AWAITING_FULFILLMENT, PARTIALLY_FULFILLED, FULFILLED, PROCESSING_ERROR <br><br>Seller: PARTIALLY_FULFILLED, FULFILLED | DECIDED, PAYMENT_FINALIZED |
| DECIDED | 11 | The moderator has resolved the dispute. | DISPUTED | RESOLVED |
| RESOLVED | 12 | The winning party has accepted the dispute and it is now complete. After the buyer leaves a review the state should be set to COMPLETE. | DECIDED | COMPLETED |
| PAYMENT_FINALIZED | 13 | Escrow has been released after the timeout period has expired. After the buyer leaves a review the state should be set to COMPLETE. | FULFILLED, DISPUTED | COMPLETED |
| PROCESSING_ERROR | 14 | This state is only used for offline orders. If a processing error occurred with an open connection between buyer and seller the seller's node automatically rejects the order. |  | DISPUTED |
