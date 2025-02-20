# Quickstart of CCTP Using Ethers

## Overview

This example uses ethers to transfer USDC from an address on Sepolia to another address on BASE testnet.

## Usage

1. Install dependencies by running `npm install`
2. Create a `.env` file and add below variables to it:

```
ETH_TESTNET_RPC=<ETH_TESTNET_RPC_URL>
AVAX_TESTNET_RPC=<AVAX_TESTNET_RPC_URL>
ETH_PRIVATE_KEY=<ADD_ORIGINATING_ADDRESS_PRIVATE_KEY>
AVAX_PRIVATE_KEY=<ADD_RECEIPIENT_ADDRESS_PRIVATE_KEY>
RECIPIENT_ADDRESS=<ADD_RECEIPIENT_ADDRESS_FOR_AVAX>
AMOUNT=<ADD_AMOUNT_TO_BE_TRANSFERED>
```

3. Make the `.env` file executable by running `source .env`

4. Make sure you have testnet funds on both the source and destination chain and testnet USDC on the source chain. 

5. Run the script by running node `cctp-v1-ethers.js`