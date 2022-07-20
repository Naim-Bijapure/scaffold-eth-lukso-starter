import ERC725 from "@erc725/erc725.js";
import erc725schema from "@erc725/erc725.js/schemas/LSP3UniversalProfileMetadata.json";
import { LSPFactory } from "@lukso/lsp-factory.js";
import KeyManager from "@lukso/lsp-smart-contracts/artifacts/LSP6KeyManager.json";
import UniversalProfile from "@lukso/lsp-smart-contracts/artifacts/UniversalProfile.json";
import { ethers, Signer } from "ethers";
import React, { ReactElement } from "react";
import { useAccount, useProvider, useSigner } from "wagmi";

import account from "../contracts/account.json";
import { YourLukso__factory } from "../contracts/contract-types";
import useAppLoadContract from "../hooks/useAppLoadContract";
import { useStore } from "../store/useStore";

// Our static variables
const SAMPLE_PROFILE_ADDRESS = "0x27aA856743f2e5FCd277C75e605342e0e097e5C8";
// const RPC_ENDPOINT = "https://rpc.l16.lukso.network";
const RPC_ENDPOINT = "http://0.0.0.0:8545";
const IPFS_GATEWAY = "https://2eff.lukso.dev/ipfs/";

const yourLuksotBytecode = YourLukso__factory.bytecode;

export default function PocPage(): ReactElement {
  // const { ethPrice, usdPrice } = useDexPrice();
  // console.log("ethPrice: ", ethPrice, usdPrice);
  const { data, isSuccess } = useAccount();
  const provider = useProvider();
  const { data: signer } = useSigner();
  const [state, dispatch] = useStore();

  const yourLukso = useAppLoadContract({ contractName: "YourLukso" });

  // console.log("account: ", account);

  const onFactoryDeploy = async (): any => {
    try {
      /** ----------------------
       *
       *TO CREATE UP
       * ---------------------*/
      const lspFactory = new LSPFactory(RPC_ENDPOINT, {
        deployKey: account.privateKey,
        chainId: 2828,
      });
      // @ts-ignore
      async function createUniversalProfile(): any {
        console.log("createUniversalProfile:creating ");
        const deployedContracts = await lspFactory.UniversalProfile.deploy({
          controllerAddresses: [account.address], // our EOA that will be controlling the UP
          lsp3Profile: {
            name: "My Universal Profile",
            description: "My Cool Universal Profile",
            tags: ["Public Profile"],
            links: [
              {
                title: "My Website",
                url: "https://my-website.com",
              },
            ],
          },
        });
        console.log("createUniversalProfile:done ");
        return deployedContracts;
      }
      void createUniversalProfile().then((deployedContracts) => {
        console.log("UP deployed", deployedContracts);
      });
    } catch (error) {
      console.log("error: ", error);
    }
  };

  const onFetchProfileData = async (): any => {
    try {
      // const yourLukso = new YourLukso__factory(signer as Signer);
      // const yDeploy = await yourLukso.deploy(account.address);
      // console.log("yDeploy: ", yDeploy.address);
      // const lspFactory = new LSPFactory(RPC_ENDPOINT, {
      //   deployKey: account.privateKey,
      //   chainId: 22,
      // });
      //
      /** ----------------------
       * FETCH PROFILE DATA
       * ---------------------*/
      const provider = window.ethereum;
      const config = { ipfsGateway: IPFS_GATEWAY };
      // @ts-ignore
      async function fetchProfile(address): any {
        try {
          const profile = new ERC725(erc725schema, address, provider, config);
          return await profile.fetchData();
        } catch (error) {
          console.log("error: ", error);
          return console.log("This is not an ERC725 Contract");
        }
      }
      // Debug
      fetchProfile(SAMPLE_PROFILE_ADDRESS).then((profileData) =>
        console.log(JSON.stringify(profileData, undefined, 2))
      );
    } catch (error) {
      console.log("error: ", error);
    }
  };

  const onDeployOtherContract = async (): any => {
    try {
      // const yourLukso = new YourLukso__factory(signer as Signer);
      // const yDeploy = await yourLukso.deploy(account.address);
      const targetPayload = yourLukso?.interface.encodeFunctionData("setPurpose", ["cool purpose"]);
      console.log("setPurposeEncoded: ", targetPayload);
      const OPERATION_CALL = 0;

      const wallet = new ethers.Wallet(account);
      console.log("wallet: ", wallet.address);

      const pSigner = signer?.connect(wallet.provider);

      const myUP = new ethers.Contract(SAMPLE_PROFILE_ADDRESS, UniversalProfile.abi, pSigner as Signer);
      console.log("myUP: ", myUP);

      const myKM = new ethers.Contract(account.address, KeyManager.abi, pSigner as Signer);
      console.log("myKM: ", myKM);

      const abiPayload = myUP.interface.encodeFunctionData("execute", [
        OPERATION_CALL,
        yourLukso?.address,
        0,
        targetPayload,
      ]);

      const response = await myKM.connect(account.address).execute(abiPayload);
      console.log("response: ", response);
      // console.log("response: ", response);
      // console.log("abiPayload: ", abiPayload);
    } catch (error) {
      console.log("error: ", error);
    }
  };

  return (
    <>
      <div className="flex flex-col  items-center justify-start">
        <button onClick={onFactoryDeploy} className="m-2 btn btn-primary">
          on factory deploy
        </button>

        <button onClick={onFetchProfileData} className="m-2 btn btn-primary">
          on fetch profile
        </button>

        <button onClick={onDeployOtherContract} className="m-2 btn btn-primary">
          deploy other contract
        </button>
      </div>
    </>
  );
}
