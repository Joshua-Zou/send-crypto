var Account = function(address, secret, coin, apiProvider, apiKey){

const fetch = require('node-fetch');
const Web3 = require("web3");
var EthAccounts = require('web3-eth-accounts');
var ethAccounts = new EthAccounts();
const axios = require('axios');
const bitcore = require("bitcore-lib");
const litecore = require('litecore-lib')

var web3;
const RippleAPI = require('ripple-lib').RippleAPI;
var rippleapi;

this.coin = coin;
this.address = address;
this.secret = secret;
this.apiKey = apiKey;
let apis = {
    btc: {'sochain':"open", "blockcypher":"key"},
    eth: {'etherscan':'key', 'web3':'key', 'blockcypher':'key'},
    xrp: {'ripple.api': 'key'},
    ltc: {'sochain':'open'}
}
// start of pre-flight checking
if (!address) throw "No address in constructor";
if (!secret) throw "No secret address in constructor";
if (!coin) throw "No coin in constructor";
if (!apiProvider) throw "No api provider in constructor"

if (!apis[coin]) throw "The coin was not valid!"
if (!apis[coin][apiProvider]) throw "not a valid coin or api service";
if (apis[coin][apiProvider] === "key" && !apiKey) throw "selected api service requires an api KEY. If you are using a web3 provider, the apiKey is the connection url | if you are using ripple's api, the key is your connectioni URL";

if (coin === "eth"){
    if (apiProvider === "etherscan"){
        fetch(`https://api.etherscan.io/api?module=account&action=balance&address=0xddbd2b932c763ba5b1b7ae3b362eac3e8d40121a&tag=latest&apikey=${this.apiKey}`).then(json => json.json()).then(result => {
            if (result.status === "0") throw "Invalid Etherscan API key! Tip: Use they key 'YourApiKeyToken' to still get access to the API service, but ratelimited to once every 5 seconds";
        })
    }else if (apiProvider === "web3"){
        const ethNetwork = apiKey;
        web3 = new Web3(new Web3.providers.HttpProvider(ethNetwork));
    }else if (apiProvider === "blockcypher"){
        fetch(`https://api.blockcypher.com/v1/btc/main?token=${this.apiKey}`).then(json => json.json()).then(result => {
            if (result.error) throw "Invalid Blockcypher API key!"
        })
    }
}
if (coin === "xrp"){
    if (apiProvider === "ripple.api"){
        rippleapi = new RippleAPI({
            server: apiKey
          });
    }
}
this.apiProvider = apiProvider;

// start of ETH 
if (this.coin === "eth"){
    // start of ETH GET balance
    this.getBalance = async function(){
        if (this.apiProvider === "web3"){
            return Number(await web3.eth.getBalance(this.address))*0.000000000000000001;
        }else if (this.apiProvider === "etherscan"){
            let result = await fetch(`https://api.etherscan.io/api?module=account&action=balance&address=${this.address}&tag=latest&apikey=${this.apiKey}`);
            result = await result.json();
            return Number(result.result)*0.000000000000000001;
        }else if (this.apiProvider === "blockcypher"){
            let result = await fetch(`https://api.blockcypher.com/v1/eth/main/addrs/${this.address}/balance?token=${this.apiKey}`);
            result = await result.json();
            return result.balance * 0.000000000000000001;
        }
    }
    // start of ETH sending balance
    this.send = async function(reciever, amountToSend, gas){
        var maxGas = 2100;
        if (gas) maxGas = gas;
        var sweep = false;
        if (amountToSend === "all") sweep = true;
        else if (Number(amountToSend).toString().toLowerCase() === "nan") throw "amounttosend parameter wasn't a valid number. To sweep a wallet, pass: 'all' as the parameter"
        var rawtx;
        var gasPrice = await getCurrentGasPrices();
        gasPrice = Math.trunc(gasPrice);
        if (this.apiProvider === "web3"){
            var nonce = await web3.eth.getTransactionCount(this.address);
            if (sweep === false){
                let weitoSend = amountToSend*1000000000000000000;
                weitoSend = Math.trunc(weitoSend);
                let results = await ethAccounts.signTransaction({
                    to: reciever,
                    value: weitoSend,
                    gas: maxGas,
                    gasPrice: gasPrice,
                    nonce: nonce,
                    chainId: 1,
                    change: this.address
                }, this.secret);
                rawtx = results.rawTransaction
            }else if (sweep === true){
                var balance = await web3.eth.getBalance(this.address);
                var balanceMinusFee = balance - (gas * gasPrice);
                if (balanceMinusFee < 0) throw "Balance does not cover ethereum transaction fees!";
                let results = await ethAccounts.signTransaction({
                    to: recieverAddress,
                    value: balanceMinusFee,
                    gas: maxGas,
                    gasPrice: gasPrice,
                    nonce: nonce,
                    chainId: 1,
                }, this.secret);
                rawtx = results.rawTransaction;
            }else throw "sweep parameter must be a boolean";
            return web3.eth.sendSignedTransaction(rawtx);
        }else if (this.apiProvider === "etherscan"){
            let nonce = await fetch(`https://api.etherscan.io/api?module=proxy&action=eth_getTransactionCount&address=0xde0b295669a9fd93d5f28d9ec85e40f4cb697bae&tag=latest&apikey=${this.apiKey}`);
            nonce = await nonce.json();
            nonce = parseInt(nonce.result, 16);
            nonce = Number(nonce);
            if (sweep === false){
                let weitoSend = amountToSend*1000000000000000000;
                weitoSend = Math.trunc(weitoSend);
                let results = await ethAccounts.signTransaction({
                    to: reciever,
                    value: weitoSend,
                    gas: maxGas,
                    gasPrice: gasPrice,
                    nonce: nonce,
                    chainId: 1,
                    change: this.address
                }, this.secret);
                rawtx = results.rawTransaction
            }else if (sweep === true){
                var result = await fetch(`https://api.etherscan.io/api?module=account&action=balance&address=${this.address}&tag=latest&apikey=${this.apiKey}`);
                result = await result.json();
                let balance =  Number(result.result);
                var balanceMinusFee = balance - (gas * gasPrice);
                if (balanceMinusFee < 0) throw "Balance does not cover ethereum transaction fees!";
                let results = await ethAccounts.signTransaction({
                    to: recieverAddress,
                    value: balanceMinusFee,
                    gas: maxGas,
                    gasPrice: gasPrice,
                    nonce: nonce,
                    chainId: 1,
                }, this.secret);
                rawtx = results.rawTransaction;
            }else throw "sweep parameter must be a boolean";
            let sentTx = await fetch(`https://api.etherscan.io/api?module=proxy&action=eth_sendRawTransaction&hex=${rawtx}0&apikey=${this.apiKey}`);
            return await sentTx.json();
        }else if (this.apiProvider === "blockcypher"){
            var addressinfo = await fetch(`https://api.blockcypher.com/v1/eth/main/addrs/${this.address}?token=${this.apiKey}`);
            addressinfo = await addressinfo.json();
            nonce = Number(addressinfo.nonce);
            if (sweep === false){
                let weitoSend = amountToSend*1000000000000000000;
                weitoSend = Math.trunc(weitoSend);
                let results = await ethAccounts.signTransaction({
                    to: reciever,
                    value: weitoSend,
                    gas: maxGas,
                    gasPrice: gasPrice,
                    nonce: nonce,
                    chainId: 1,
                    change: this.address
                }, this.secret);
                rawtx = results.rawTransaction
            }else if (sweep === true){
                var balance = addressinfo.balance;
                var balanceMinusFee = balance - (gas * gasPrice);
                if (balanceMinusFee < 0) throw "Balance does not cover ethereum transaction fees!";
                let results = await ethAccounts.signTransaction({
                    to: recieverAddress,
                    value: balanceMinusFee,
                    gas: maxGas,
                    gasPrice: gasPrice,
                    nonce: nonce,
                    chainId: 1,
                }, this.secret);
                rawtx = results.rawTransaction;
            }else throw ("sweep parameter must be a boolean");
            let todo = {
                tx: rawtx
            };
            
            let hash = await fetch(`https://api.blockcypher.com/v1/eth/main/txs/push?token=${this.apiKey}`, {
                method: 'POST',
                body: JSON.stringify(todo),
                headers: { 'Content-Type': 'application/json' }
            })
            hash = await hash.json();
            return hash.hash
        }
    }
}
// start of BTC 
if (this.coin === "btc"){
    // start of BTC GET balance
    this.getBalance = async function(){
        if (this.apiProvider === "sochain"){
            let result = await fetch(`https://sochain.com/api/v2/get_address_balance/BTC/${this.address}`);
            result = await result.json();
            return Number(result.data.confirmed_balance);
        }else if (this.apiProvider === "blockcypher"){
            let result = await fetch(`https://api.blockcypher.com/v1/btc/main/addrs/${this.address}/balance?token=${this.apiKey}`);
            result = await result.json();
            return result.balance * 0.000000000000000001;
        }else if (this.apiProvider === "blockchain.com"){
            let result = await fetch(`https://blockchain.info/rawaddr/${this.address}`);
            result = await result.json();
            return result.final_balance*0.00000001;
        }
    }
    // start of BTC push transactions
    this.send = async function(reciever, amountToSend){
        var sweep = false;
        if (amountToSend === "all") sweep === true;
        else if (Number(amountToSend).toString().toLowerCase() === "nan") throw "amounttosend parameter wasn't a valid number. To sweep a wallet, pass: 'all' as the parameter"
        if (this.apiProvider === "sochain"){
            if (sweep === true) amountToSend = 0.00018;
            const satoshiToSend = amountToSend * 100000000;
            let fee = 0;
            let inputCount = 0;
            let outputCount = 2;
            var utxos = await axios.get(
                `https://sochain.com/api/v2/get_tx_unspent/BTC/${this.address}`
            ).catch(err => {
                return "error: "+err.toString()
            })
            if (utxos.toString().includes("error: ")){
                utxos = utxos.slice(7)
                return utxos.toString()
            }
            const transaction = new bitcore.Transaction();
            let totalAmountAvailable = 0;
            
            let inputs = [];
            utxos.data.data.txs.forEach(async (element) => {
                let utxo = {};
                utxo.satoshis = Math.floor(Number(element.value) * 100000000);
                utxo.script = element.script_hex;
                utxo.address = utxos.data.data.address;
                utxo.txId = element.txid;
                utxo.outputIndex = element.output_no;
                totalAmountAvailable += utxo.satoshis;
                inputCount += 1;
                inputs.push(utxo);
            });
            
            let transactionSize = inputCount * 146 + outputCount * 34 + 10 - inputCount;
            // Check if we have enough funds to cover the transaction and the fees assuming we want to pay 20 satoshis per byte
            
            fee = transactionSize * 20
            if (totalAmountAvailable - satoshiToSend  < 0) {
                throw new Error("Balance is too low for this transaction. If you are sweeping, the minimum amount in wallet is 0.00018 BTC");
            }
            var totalsend = satoshiToSend-fee-1000;

            //Set transaction input
            transaction.from(inputs);
            // set the recieving address and the amount to send
            transaction.to(reciever, totalsend);
            // Set change address - Address to receive the left over funds after transfer
            if (sweep === false)
                transaction.change(this.address);
            else if (sweep === true)
                transaction.change(reciever)
            //manually set transaction fees: 20 satoshis per byte
            transaction.fee(fee);
            // Sign transaction with your private key
            transaction.sign(this.secret);
            // serialize Transactions
            const serializedTX = transaction.serialize()

            // Send transaction
            const result = await axios({
                method: "POST",
                url: `https://sochain.com/api/v2/send_tx/${sochain_network}`,
                data: {
                   tx_hex: serializedTX,
                },
            });
            return result.data.data;
        }else if (this.apiProvider === "blockcypher"){
            if (sweep === true) amountToSend = 0.00018;
            const satoshiToSend = amountToSend * 100000000;
            let fee = 0;
            let inputCount = 0;
            let outputCount = 2;
            var utxos = await axios.get(
                `https://sochain.com/api/v2/get_tx_unspent/BTC/${this.address}`
            )
            const transaction = new bitcore.Transaction();
            let totalAmountAvailable = 0;
            
            let inputs = [];
            utxos.data.data.txs.forEach(async (element) => {
                let utxo = {};
                utxo.satoshis = Math.floor(Number(element.value) * 100000000);
                utxo.script = element.script_hex;
                utxo.address = utxos.data.data.address;
                utxo.txId = element.txid;
                utxo.outputIndex = element.output_no;
                totalAmountAvailable += utxo.satoshis;
                inputCount += 1;
                inputs.push(utxo);
            });
            
            let transactionSize = inputCount * 146 + outputCount * 34 + 10 - inputCount;
            // Check if we have enough funds to cover the transaction and the fees assuming we want to pay 20 satoshis per byte
            
            fee = transactionSize * 20
            if (totalAmountAvailable - satoshiToSend  < 0) {
                throw new Error("Balance is too low for this transaction. If you are sweeping, the minimum amount in wallet is 0.00018 BTC");
            }
            var totalsend = satoshiToSend-fee-1000;

            //Set transaction input
            transaction.from(inputs);
            // set the recieving address and the amount to send
            transaction.to(reciever, totalsend);
            // Set change address - Address to receive the left over funds after transfer
            if (sweep === false)
                transaction.change(this.address);
            else if (sweep === true)
                transaction.change(reciever)
            //manually set transaction fees: 20 satoshis per byte
            transaction.fee(fee);
            // Sign transaction with your private key
            transaction.sign(this.secret);
            // serialize Transactions
            const serializedTX = transaction.serialize()

            // Send transaction
            const result = await axios({
                method: "POST",
                url: `https://api.blockcypher.com/v1/btc/main/txs/push?token=${this.apiKey}`,
                data: {
                   tx: serializedTX,
                },
            });
            return result.data;
        }
    }
}
// start of XRP 
if (this.coin === "xrp"){
    // start of XRP GET balance
    this.getBalance = async function(){
        if (this.apiProvider === "ripple.api"){
            await rippleapi.connect();
            let addressresult = await rippleapi.getAccountInfo(this.address);
            await rippleapi.disconnect();
            return addressresult.xrpBalance;
        }
    }
    this.send = async function(reciever, amountToSend, tag){
        var sweep = false;
        if (amountToSend === "all") sweep = true;
        var tagx = "none";
        if (Number(tag).toString().toLowerCase() === "nan") throw "the xrp ledger requires the tag to be numerical";
        else tagx = Number(tag);
        let result = await sendXRP(reciever, this.address, this.secret, amountToSend, tagx, sweep);
        return result;
    }
}
// start of LTC
if (this.coin === "ltc"){
    this.getBalance = async function(){
        if (this.apiProvider === "sochain"){
            let result = await fetch(`https://sochain.com/api/v2/get_address_balance/LTC/${this.address}`);
            result = await result.json();
            return Number(result.data.confirmed_balance)
        }
    }
    this.send = async function(reciever, amountToSend, sweep){
        //
        var sweepin = false;
        if (sweep) sweepin = sweep;
        let result = await sendLtc(reciever, amountToSend, this.secret, this.address, sweepin);
        return result;
    }
}

async function getCurrentGasPrices() {
    if (this.apiProvider === "etherScan"){
        let response = await fetch(`https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${this.apiKey}`);
        response = await response.json();
        return Number(response.result.ProposeGasPrice)*1000000000;
    }else if (this.apiProvider === "blockcypher"){
        let response = await fetch(`https://api.blockcypher.com/v1/eth/main`);
        response = await response.json();
        return Number(response.medium_gas_price);
    }else if (this.apiProvider === "web3"){
        return Number(await web3.eth.getGasPrice());
    }
}
async function sendXRP(recieverAddress, sourcePublicAddress, sourcePrivateAddress, amountToSend, tagx, sweepin){
    var tag;
    if (tagx === "none") tag = undefined
    else tag = Number(tagx);
    var sweep = false;
    if (!sweepin) sweep = false;
    else sweep = sweepin;
    // TESTNET ADDRESS 1
  const ADDRESS_1 = sourcePublicAddress
  const SECRET_1 = sourcePrivateAddress
  // TESTNET ADDRESS 2
  const ADDRESS_2 = recieverAddress
  const instructions = {maxLedgerVersionOffset: 5}
  const currency = 'XRP'
  const amount = amountToSend
  const payment = {
    source: {
      address: ADDRESS_1,
      maxAmount: {
        value: amount,
        currency: currency
      }
    },
    destination: {
      tag: tag,
      address: ADDRESS_2,
      amount: {
        value: amount,
        currency: currency
      }
    }
  }
  
  let finalresult = await rippleapi.connect().then(async () => {
    let secondaryresult = await rippleapi.preparePayment(ADDRESS_1, payment, instructions).then(async prepared => {
      const {signedTransaction, id} = rippleapi.sign(prepared.txJSON, SECRET_1)
      let primaryresult = await rippleapi.submit(signedTransaction).then(async result => {
        rippleapi.disconnect()
        return JSON.stringify(result, null, 2)
      })
      return primaryresult;
    })
    return secondaryresult;
  }).catch(err => {throw err;});
  return finalresult;
  }
async function sendLtc(recieverAddress, amountToSend, privateKey, sourceAddress, sweepin){
    var sweep = false;
    if (!sweepin) sweep = false;
    else sweep = sweepin;
    //var privateKey = privateKey;
    var address = sourceAddress;
    let results = await getUTXOsBETA(address)
      .then(async (utxos) => {
        //utxos[0].outputIndex = utxos[0].output_no;
        //utxos[0].script = utxos[0].script_hex;
        utxos[0].satoshis = amountToSend*100000000;
        //utxos[0].amount = Number((amountToSend+0.00001500).toString().slice(0, 7));
      let balance = 0;
      for (var i = 0; i < utxos.length; i++) {
        balance +=utxos[i]['satoshis'];
      } //add up the balance in satoshi format from all utxos
      // var fee = 0.00021; //fee for the tx
      var fee = 21000;
      
      var tx = new litecore.Transaction() //use litecore-lib to create a transaction
        tx.from(utxos)
        tx.to(recieverAddress, amountToSend*100000000-fee)
        tx.fee(fee)
        if (sweep === false) tx.change(sourceAddress);
        else tx.change(recieverAddress);
        tx.sign(privateKey)
        tx = tx.serialize();
    return broadcastTX(tx) //broadcast the serialized tx
    })
    .then((result) => {
        return result;
    })
    .catch((error) => {
      throw error;
    })
    return results;
  }
  function getUTXOsBETA(address) {
    return new Promise((resolve, reject) => {
      request({
        uri: 'https://insight.litecore.io/api/addr/' + address + '/utxo',
        json: true
      },
        (error, response, body) => {
          if(error) reject(error);
          resolve(body)
        }
      )
    })
  }
  function broadcastTX(rawtx) {
    let todo = {
      tx_hex: rawtx
    }
    return new Promise((resolve, reject) => {
      fetch('https://chain.so/api/v2/send_tx/LTC', {
        method: 'POST',
        body: JSON.stringify(todo),
        headers: { 'Content-Type': 'application/json' }
    }).then(res => res.json())
      .then(json => resolve(json));
    })
  }

}

module.exports = Account

