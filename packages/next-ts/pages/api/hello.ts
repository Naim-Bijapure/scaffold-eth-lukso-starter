// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import ERC725 from "@erc725/erc725.js";
import LSP10ReceivedVaults from "@erc725/erc725.js/schemas/LSP10ReceivedVaults.json";
import erc725schema from "@erc725/erc725.js/schemas/LSP3UniversalProfileMetadata.json";
import LSP6Schema from "@erc725/erc725.js/schemas/LSP6KeyManager.json";
import LSP9Vault from "@erc725/erc725.js/schemas/LSP9Vault.json";
import KeyManager from "@lukso/lsp-smart-contracts/artifacts/LSP6KeyManager.json";
import UniversalProfile from "@lukso/lsp-smart-contracts/artifacts/UniversalProfile.json";
import { ethers } from "ethers";
import type { NextApiRequest, NextApiResponse } from "next";
import Web3 from "web3";

import account from "../../contracts/account.json";

const UP_ADDRESS = "0xc8bA499818d0AD3579e8E85A7775378A4886c485";

type Data = {
  data: number[];
};

const data: number[] = [];

const RPC_URL = "http://0.0.0.0:8545";

const myString = {
  name: "String",
  key: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("String")),
  keyType: "Singleton",
  valueType: "string",
  valueContent: "String",
};

const myStringArr = {
  name: "String[]",
  key: ethers.utils.keccak256(ethers.utils.toUtf8Bytes("String[]")),
  keyType: "Array",
  valueType: "string",
  valueContent: "String",
};

erc725schema.push(myString);
erc725schema.push(myStringArr);

async function LoadContracts(): Promise<void> {
  const provider = new ethers.providers.StaticJsonRpcProvider(RPC_URL);
  // const providerTest = new ethers.providers.Web3Provider(provider);

  const web3provider = new Web3.providers.HttpProvider(RPC_URL);

  const walletSigner = new ethers.Wallet(account.privateKey, provider); // <---- custom signer from EOA account

  const UP = new ethers.Contract(UP_ADDRESS, UniversalProfile.abi, walletSigner); // <---- create UP contract instance from address
  const upOwner = await UP?.owner(); // <---- get owner of UP contract
  console.log("UP: ", UP.address);
  console.log("upOwner: ", upOwner);

  const KM = new ethers.Contract(upOwner as string, KeyManager.abi, walletSigner); // <---- get key manager from UP contract
  console.log("KM:address ", KM.address);

  const erc725 = new ERC725(
    // @ts-ignore
    [...erc725schema, ...LSP6Schema, ...LSP10ReceivedVaults, ...LSP9Vault],
    UP_ADDRESS,
    web3provider
  );

  const encodedData = erc725?.encodeData({
    // @ts-ignore
    keyName: "String[]",
    value: ["awesome new thing"],
  });

  const abiPayload = UP.interface.encodeFunctionData("setData(bytes32[],bytes[])", [
    encodedData?.keys,
    encodedData?.values,
  ]);

  const tx = await KM.connect(walletSigner).execute(abiPayload, { gasLimit: 10000000 }); // <---- call the execute on key manager contract
  const rcpt = await tx.wait();
  // console.log("rcpt: ", rcpt);

  const result = await erc725?.fetchData("String[]");
  console.log("result: ", result);
}

void LoadContracts();

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>): Promise<any> {
  data.push(1);

  res.status(200).json({ data: data });
}
