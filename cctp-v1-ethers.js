const { ethers } = require("ethers");
const dotenv = require("dotenv");
const tokenMessengerAbi = require("./abis/cctp/TokenMessenger.json");
const messageAbi = require("./abis/cctp/Message.json");
const usdcAbi = require("./abis/Usdc.json");
const messageTransmitterAbi = require("./abis/cctp/MessageTransmitter.json");

dotenv.config();

const main = async () => {
  const ethProvider = new ethers.providers.JsonRpcProvider(
    process.env.ETH_TESTNET_RPC
  );
  const baseProvider = new ethers.providers.JsonRpcProvider(
    process.env.BASE_TESTNET_RPC
  );

  // Wallets
  const ethWallet = new ethers.Wallet(process.env.ETH_PRIVATE_KEY, ethProvider);
  const baseWallet = new ethers.Wallet(
    process.env.BASE_PRIVATE_KEY,
    baseProvider
  );

  // Testnet Contract Addresses
  const ETH_TOKEN_MESSENGER_CONTRACT_ADDRESS =
    "0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5";
  const USDC_ETH_CONTRACT_ADDRESS =
    "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";
  const ETH_MESSAGE_CONTRACT_ADDRESS =
    "0x80537e4e8bAb73D21096baa3a8c813b45CA0b7c9";
  const BASE_MESSAGE_TRANSMITTER_CONTRACT_ADDRESS =
    "0x7865fAfC2db2093669d92c0F33AeEF291086BEFD";

  // Initialize contracts
  const ethTokenMessenger = new ethers.Contract(
    ETH_TOKEN_MESSENGER_CONTRACT_ADDRESS,
    tokenMessengerAbi,
    ethWallet
  );
  const usdcEth = new ethers.Contract(
    USDC_ETH_CONTRACT_ADDRESS,
    usdcAbi,
    ethWallet
  );
  const ethMessage = new ethers.Contract(
    ETH_MESSAGE_CONTRACT_ADDRESS,
    messageAbi,
    ethWallet
  );
  const baseMessageTransmitter = new ethers.Contract(
    BASE_MESSAGE_TRANSMITTER_CONTRACT_ADDRESS,
    messageTransmitterAbi,
    baseWallet
  );

  const mintRecipient = process.env.RECIPIENT_ADDRESS;
  const BASE_DESTINATION_DOMAIN = 6;
  const amount = process.env.AMOUNT;

  // Convert recipient address to bytes32
  const destinationAddressInBytes32 = await ethMessage.addressToBytes32(
    mintRecipient
  );

  // Approve
  const approveTx = await usdcEth.approve(
    ETH_TOKEN_MESSENGER_CONTRACT_ADDRESS,
    amount
  );
  await approveTx.wait();
  console.log("ApproveTxReceipt:", approveTx.hash);

  // Burn USDC
  const burnTx = await ethTokenMessenger.depositForBurn(
    amount,
    BASE_DESTINATION_DOMAIN,
    destinationAddressInBytes32,
    USDC_ETH_CONTRACT_ADDRESS
  );
  await burnTx.wait();
  console.log("BurnTxReceipt:", burnTx.hash);

  // Retrieve message bytes
  const receipt = await ethProvider.getTransactionReceipt(burnTx.hash);
  const eventTopic = ethers.utils.id("MessageSent(bytes)");
  const log = receipt.logs.find((l) => l.topics[0] === eventTopic);
  const messageBytes = ethers.utils.defaultAbiCoder.decode(
    ["bytes"],
    log.data
  )[0];
  const messageHash = ethers.utils.keccak256(messageBytes);

  console.log("MessageBytes:", messageBytes);
  console.log("MessageHash:", messageHash);

  // Fetch attestation signature
  let attestationResponse = { status: "pending" };
  while (attestationResponse.status !== "complete") {
    const response = await fetch(
      `https://iris-api-sandbox.circle.com/attestations/${messageHash}`
    );
    attestationResponse = await response.json();
    await new Promise((r) => setTimeout(r, 2000));
  }

  const attestationSignature = attestationResponse.attestation;
  console.log("Signature:", attestationSignature);

  // Receive funds on BASE
  const receiveTx = await baseMessageTransmitter.receiveMessage(
    messageBytes,
    attestationSignature
  );
  await receiveTx.wait();
  console.log("ReceiveTxReceipt:", receiveTx.hash);
};

main().catch(console.error);
