---
title: "Offline Messages"
menu:
    guides:
        parent: concepts
---

There are many instances when two OpenBazaar users cannot directly communicate through our messaging system (libp2p). A system for exchanging offline messages through the OpenBazaar network was devised to store messages on the network temporarily for retrieval later. This enables features like allowing OpenBazaar merchants to take orders while offline and users to send chat messages to friends when they aren't online.

## How it Works

Let's walk through a typical message scenario: sending a chat message.

- Client software sends a Chat API call (`/ob/chat`) to the OpenBazaar server
- Server decodes the JSON request into a `ChatMessage` struct
- Server validates the contents of the `ChatMessage`
- Server generates a message ID:
  - Calculate the SHA256 hash digest of `<message_body><message_subject><timestamp_string>`
  - Encode the hash digest to a multihash digest `<length_of_digest><digest>`
- Server creates a `Chat` protobuf as follows:

```
{
	MessageId: <BASE58(message ID)>,
	Subject:   <subject>,
	Message:   <body>,
	Timestamp: <timestamp>,
	Flag:      <TYPING OR MESSAGE>,
}
```

- Server embeds the `Chat` protobuf into a `Message` protobuf
- Server attempts to send the `Message` object as an online message

If sending the online message fails the server will attempt to send it as an offline message. The following outlines this process:

- Grab the public key for the sending node
- Encode the protobuf into the wire format for sending
- Generate signature of the encoded content with the sending node's private key
- Wrap the `Message` protobuf in an `Envelope` protobuf

```
{
  Message: <message_protobuf>,
  Pubkey: <public_key>,
  Signature: <signature>
}
```

- Convert the `Envelope` protobuf to the wire format
- Generate a ciphertext of the converted `Envelope` by encrypting it with the recipient's public key
- Store the ciphertext in offline storage

    Currently OpenBazaar supports two offline storage types: self-hosted and Dropbox. The default option is to use self-hosted storage, which stores the messages in the `outbox` folder in the user's data directory.

    - Generate SHA256 checksum of the ciphertext
    - Convert the checksum to a string
    - Create file to store offline message `outbox/<hash_string>`
    - Write the ciphertext content to the file
    - Add the file to the IPFS network by using the `AddFile` command
      - Generate merkledag node and adds it to the blockstore
      - Generate key (IPFS address) pointing to the file's node
    - Decode the address into a content ID
    - Publish the content ID to the OpenBazaar push nodes:

        This is a somewhat complex process that sends content to our custom push nodes. Essentially we send a list of content IDs to the push node tricking it into asking our own node for the content. This will then seed the content to the push node itself. The following steps outline how this happens:

        - Create a `CidList` protobuf (in this case it only contains a single ID)
        - Create a `Message` protobuf with the following content:

            ```
            {
          		MessageType: <Message_STORE>,
          		Payload:     <protobuf any type containing the CidList>,
          	}
            ```

        - Send the message to the push node as a request
        - The push node will send back a `CidList` of IDs to retrieve
        - Loop through the list and `SendBlock` to the push node so it can mirror it

    - Generate an IPFS MultiAddress (/ipfs/<address_of_content>)

- Generate an IPFS MultiHash
- Create an IPFS pointer for this content

    ```
    /* A pointer is a custom provider inserted into the DHT which points to a location of a file.
    For offline messaging purposes we use a hash of the recipient's ID as the key and set the
    provider to the location of the ciphertext. We set the Peer ID of the provider object to
    a magic number so we distinguish it from regular providers and use a longer ttl.
    Note this will only be compatible with the OpenBazaar/go-ipfs fork. */
    ```

- If this message **IS NOT** an `OFFLINE_ACK` (for CHAT messages it is not obviously), put the pointer object into the datastore database (pointers table)
- Publish the pointer into the DHT
    - Get peers closest to the Cid
    - Loop through peers and send an `ADD_PROVIDER` message to each of them
- Publish the pointer to all of the push nodes
    - Loop through peers and send an `ADD_PROVIDER` message to each of them
- Publish the ciphertext to PubSub at the topic `/offlinemessage/<Cid_String>`
