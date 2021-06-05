  

<hr />

  

A minimal JavaScript library for sending crypto assets.

  

Currently doesn't support hierarchical or single-use addresses.

  

## Supported assets

  

- <img  style="margin-bottom: -5px;"  height="20"  width="20"  src="https://bitcoin.org/img/icons/opengraph.png?1621851118" /> BTC

  

- <img  style="margin-bottom: -5px;"  height="20"  width="20"  src="https://qph.fs.quoracdn.net/main-qimg-6b38de5b5d9320901235aa116d38bfda" /> LTC

  

- <img  style="margin-bottom: -5px;"  height="20"  width="20"  src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Ethereum-icon-purple.svg/1200px-Ethereum-icon-purple.svg.png" /> ETH

  

- <img  style="margin-bottom: -5px;"  height="20"  width="20"  src="https://brandslogos.com/wp-content/uploads/thumbs/ripple-logo-vector-1.svg" /> XRP

  

<br /><br />

  

# Usage

  

```sh

npm install --save @joshyzou/sendcrypto

```

  

Replace "btc" with any supported asset:

  

```js

const  Accounts  =  require("@joshyzou/sendcrypto");

  

/* Load account from private key, select crypto API provider, coin. ApiKey is optional*/

const  account  =  new  Accounts(address, privateKey, "btc", apiProvider, apiKey);

  
  

/* Print balance */

console.log(await account.getBalance());

// > 0.01

  

/* Send 0.01 BTC */

const  txHash  =  await account.send("Reciever address", 0.01, "Eth Gas (Only applies to ethereum)")

// > 1

// > 2 ...

```

# Docs

When creating a new account, there are 4 required parameters and 1 optional parameter.

```js

new  Accounts(crypto_address, crypto_secret, coin, api_provider, api_key-optional);

```

### crypto_address

This is your crypto address. For example, a bitcoin address looks like `1KHwtS5mn7NMUm7Ls7Y1XwxLqMriLdaGbX`

### crypto_secret

This is your crypto secret. You need this to prove to the network that you are the owner of the coin, which then enables you to send crypto to other wallets.

### coin

Supported assets - use the lowercase ticker in the "coin" parameter

| Coin | Ticker |
|--|--|
| BITCOIN | btc |
|ETHEREUM|eth|
|LITECOIN|ltc|
|RIPPLE|xrp|

### api_provider

This is the api provider you would like to use to interact with the rest of the blockchain.

**Supported BTC apis**

|API|Key required? | send_crypto parameter name|
|--|--|--|
| [Sochain](https://sochain.com/) | No |sochain|
|[Blockcypher](https://www.blockcypher.com/)|Yes|blockcypher|

**Supported ETH apis**

|API|Key required? | send_crypto parameter name|
|--|--|--|
| [Etherscan](https://etherscan.io/) | Yes |etherscan|
|[Blockcypher](https://www.blockcypher.com/)|Yes|blockcypher|
|[Web3](https://web3js.readthedocs.io/)|Yes*|web3|

  

*note: If you would like to use your own web3 server, (like infura) the "key" parameter is your connection string/url

  

**Supported LTC apis**

|API|Key required? | send_crypto parameter name|
|--|--|--|
| [Sochain](https://sochain.com/) | No |sochain|

**Supported XRP apis**

|API|Key required? | send_crypto parameter name|
|--|--|--|
| [Ripple.API](https://xrpl.org/rippled-api.html) | Yes* |ripple.api|

*note: If you would like to use your own ripple API serverthe "key" parameter is your connection string/url - The public no-key-required api service is `wss://s1.ripple.com`

<br>

### Sending transactions

When sending transactions, there are normally 2 parameters, with an optional third for ETH

```js

account.send(reciever, amountToSend, *gas*)

```

**reciever**

The reciever address you would like to send the crypto to.

**amountToSend**

This is the amount of crypto you would like to send

If you would like to send all of the crypto in your wallet (Sweeping) pass "all" as a string instead of a number in this parameter

**gas**

The max gas you would like to be consumed in ETH transactions. The default is 2100 gwei, but you can increase/decrease this number as you please.

<br /><br />

  

# Examples

  
  

## BTC, LTC

  




<summary>Send BTC (Bitcoin)</summary>

  

```ts

const  Accounts  =  require("@joshyzou/sendcrypto");

  

// Send BTC

  

const  account  =  new  Accounts("BTC Address", "BTC Secret", "btc", "sochain");

await account.send("reciever address", 0.01);

  

```


  


<summary>Send LTC (Litecoin)</summary>

  

```ts

const  Accounts  =  require("@joshyzou/sendcrypto");

  

// Send LTC

  

const  account  =  new  Accounts("LTC Address", "LTC Secret", "ltc", "sochain");

await account.send("reciever address", 0.01);

```

  




  

You can replace `"BTC"` with `"ZEC"` or `"BCH"` in the following examples:

  




<summary>Send entire balance (sweep)</summary>

  

```ts

const  Accounts  =  require("@joshyzou/sendcrypto");

  

// Send LTC

  

const  account  =  new  Accounts("BTC Address", "BTC Secret", "btc", "sochain");

await account.send("reciever address", "all");

```


  
  



  

## ETH, ERC20

  




<summary>Send ETH (Ether, Ethereum)</summary>

  

```ts

const  Accounts  =  require("@joshyzou/sendcrypto");

  

// Send ETH

  

const  account  =  new  Accounts("ETH Address", "ETH Secret", "eth", "web3", "web3 connection string");

await account.send("reciever address", 0.01, 2100);

```

  



  
  

  

<br /><br /><br /><br /><br /><br />
