import { ERC725 } from "@erc725/erc725.js";
import { LSPFactory } from "@lukso/lsp-factory.js";
import KeyManager from "@lukso/lsp-smart-contracts/artifacts/LSP6KeyManager.json";
import UniversalProfile from "@lukso/lsp-smart-contracts/artifacts/UniversalProfile.json";
import { ethers } from "ethers";
import { BytesLike } from "ethers/lib/utils";
import { useState } from "react";
import { useNetwork, useProvider } from "wagmi";

import { schemas } from "../constants/luksoConstants";
import account from "../contracts/account.json";

// const UP_ADDRESS = "0xcfb5B64e4a6675116C638d450213eB3c3092Ad30";
const UP_ADDRESS = "0xcfb5B64e4a6675116C638d450213eB3c3092Ad30"; // main lukso address
const erc725 = new ERC725(schemas, UP_ADDRESS);

const encode = (key: string, val: any): any => {
  try {
    const encoded = erc725.encodeData([{ keyName: key, value: val }]);
    console.log("encoded: ", encoded);
    return encoded;
  } catch (error) {
    console.log("error: ", error);
  }
};

const decode = (key: string, val: any): any => {
  try {
    const decoded = erc725.decodeData([{ keyName: key, value: val }]);
    return decoded;
  } catch (error) {
    console.log("error: ", error);
  }
};

export default function PocPage(): JSX.Element {
  const [upAddress, setUpAddress] = useState<string>("");

  const provider = useProvider();
  const { activeChain } = useNetwork();

  const RPC_ENDPOINT: string = activeChain?.rpcUrls ? activeChain?.rpcUrls.default : "";
  const CHAIN_ID: number = activeChain?.id ? activeChain?.id : 0;

  const onCreateUP = async (): any => {
    try {
      console.log("onCreateUP: started ");

      /** ----------------------
       *
       *TO CREATE UP
       * ---------------------*/
      const lspFactory = new LSPFactory(RPC_ENDPOINT, {
        deployKey: account.privateKey,
        // deployKey: MAIN_PRIVATE_KEY,
        chainId: CHAIN_ID,
      });

      // @ts-ignore
      async function createUniversalProfile(): any {
        const deployedContracts = await lspFactory.UniversalProfile.deploy({
          controllerAddresses: [account.address], // our EOA that will be controlling the UP
          lsp3Profile: {
            name: "naim's profile",
            description: "this is naims cool profile ",
            tags: ["Public Profile cool test"],
            links: [
              {
                title: "My Website",
                url: "https://naimbijapure.eth",
              },
            ],
          },
        });
        console.log("createUniversalProfile:done ");
        return deployedContracts;
      }
      const output = await createUniversalProfile();
      console.log("up address: ", output["LSP0ERC725Account"]["address"]);
      setUpAddress(output["LSP0ERC725Account"]["address"] as string);
      console.log("output: ", output);
    } catch (error) {
      console.log("error: ", error);
    }
  };

  const onSendData: () => any = async (): Promise<any> => {
    const OPERATION_CALL = 0;
    // const myWalletSigner = new ethers.Wallet(account.privateKey, provider); // <---- custom signer from EOA account

    const myWalletSigner = provider; // <---- custom signer from EOA account

    // const etherProvider = new ethers.providers.Web3Provider(window.ethereum);
    // contracts
    const myUP = new ethers.Contract(UP_ADDRESS, UniversalProfile.abi, myWalletSigner); // <---- create UP contract instance from address
    console.log("myUP: ", myUP);

    const ownerUP = await myUP?.owner(); // <---- get owner of UP contract
    console.log("ownerUP: ", ownerUP);

    const myKM = new ethers.Contract(ownerUP as string, KeyManager.abi, myWalletSigner); // <---- get key manager from UP contract
    console.log("myKM: ", myKM.address);

    // encode the data
    const key = "0x7ff6a077f248416948843f592327444c45801847787632efa8e679f72a85215f";

    const encodedData = encode(key, "cool man");
    console.log("encodedData: ", encodedData);

    // const tx = await myUP["setData(bytes32,bytes)"](String(encodedData.keys), String(encodedData.values));

    // const rcpt = await tx.wait();
    // console.log("rcpt: ", rcpt);

    const targetPayload = myUP.interface.encodeFunctionData("setData(bytes32,bytes)", [
      String(encodedData.keys),
      String(encodedData.values),
    ]);
    console.log("targetPayload: ", targetPayload);

    // 2. encode the payload to be run on the UP,
    // passing the payload to be run at the targetContract as 4th parameter
    const abiPayload = myUP.interface.encodeFunctionData("execute", [OPERATION_CALL, myUP.address, 0, targetPayload]);
    console.log("abiPayload: ", abiPayload);

    const tx = await myKM.connect(myWalletSigner).execute(abiPayload, { gasLimit: 10000000 }); // <---- call the execute on key manager contract
    const rcpt = await tx.wait();
    console.log("rcpt: ", rcpt);
  };

  return (
    <>
      <div className="flex flex-col items-center justify-center">
        <button className="btn btn-primary" onClick={onCreateUP}>
          create up
        </button>

        <button className="m-2 btn btn-primary" onClick={onSendData}>
          sendData
        </button>
      </div>
    </>
  );
}
