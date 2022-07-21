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
const SAMPLE_PROFILE_ADDRESS = "0x5DA6cbe08A4321b9368f7B315b658C0C15171129";
const RPC_ENDPOINT = "https://rpc.l16.lukso.network";
// const RPC_ENDPOINT = "http://0.0.0.0:8545";
const IPFS_GATEWAY = "https://2eff.lukso.dev/ipfs/";
const yourLuksoAddress = "0xf4c29832c29723b70Fb77729dA9187250C9d5A90";

const yourLuksotBytecode = YourLukso__factory.bytecode;

export default function PocPage(): ReactElement {
  // const { ethPrice, usdPrice } = useDexPrice();
  // console.log("ethPrice: ", ethPrice, usdPrice);
  const { data: mainAccount, isSuccess } = useAccount();
  const provider = useProvider();
  const { data: signer } = useSigner();
  const [state, dispatch] = useStore();

  const yourLukso = useAppLoadContract({ contractName: "YourLukso" });

  // console.log("account: ", account);

  const onFactoryDeploy = async (): any => {
    try {
      // const MAIN_PRIVATE_KEY = "d8bc935f06c027c7e0edeedcc46593554dbb3e9e01101f4f3b8ab69e36e2e484";
      /** ----------------------
       *
       *TO CREATE UP
       * ---------------------*/
      const lspFactory = new LSPFactory(RPC_ENDPOINT, {
        deployKey: account.privateKey,
        // deployKey: MAIN_PRIVATE_KEY,
        chainId: 2828,
      });

      // @ts-ignore
      async function createUniversalProfile(): any {
        console.log("createUniversalProfile:creating ");
        const deployedContracts = await lspFactory.UniversalProfile.deploy({
          controllerAddresses: [account.address, mainAccount?.address as string], // our EOA that will be controlling the UP
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
      //@ts-ignore
      // const etherProvider = new ethers.providers.Web3Provider(window.ethereum);

      const provider = window.ethereum;
      // const provider = etherProvider;
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
      const OPERATION_CALL = 0;

      const myProvider = provider;
      const mySigner = signer as Signer;

      // const myProvider = new ethers.Wallet(account.privateKey, provider);
      // signer?.connect(myProvider.provider);
      // const mySigner = myProvider.getSigner(account.address);
      // console.log("mySigner: ", mySigner);
      // console.log("signer: ", await mySigner?.getAddress());

      // contracts
      const myUP = new ethers.Contract(SAMPLE_PROFILE_ADDRESS, UniversalProfile.abi, myProvider);
      console.log("myUP: ", myUP);

      const ownerKM = await myUP?.owner();
      console.log("ownerKM: ", ownerKM);

      const myKM = new ethers.Contract(ownerKM as string, KeyManager.abi, myProvider);
      console.log("myKM: ", myKM.address);

      const targetContract = new ethers.Contract(yourLuksoAddress, YourLukso__factory.abi, myProvider);
      console.log("yourLukso: ", targetContract.address);

      /** ----------------------
       * transfer token code
       * ---------------------*/
      // const recipient = account.address; // address the recipient (any address, including an other UP)
      // const amount = ethers.utils.parseUnits("1", "ether");
      // console.log("amount: ", amount);
      // // payload executed at the target (here nothing, just a plain LYX transfer)
      // const data = "0x";

      // const transferPayload = myUP?.interface.encodeFunctionData("execute", [OPERATION_CALL, recipient, amount, data]);
      // console.log("transferPayload: ", transferPayload);

      // const response = await myKM.connect(signer as Signer).execute(transferPayload, { gasLimit: 10000000 });

      /** ----------------------
       * CALL OTHER FROM UP COD
       * ---------------------*/
      const targetPayload = targetContract.interface.encodeFunctionData("setPurpose", ["cool man from up"]);
      console.log("targetPayload: ", targetPayload);

      const abiPayload = myUP.interface.encodeFunctionData("execute", [
        OPERATION_CALL,
        targetContract.address,
        0,
        targetPayload,
      ]);

      console.log("abiPayload: ", abiPayload);
      // const tx = await myKM.connect(signer as Signer).execute(abiPayload, { gasLimit: 10000000 });
      // const rcpt = await tx.wait();
      // console.log("rcpt: ", rcpt);

      const data = await targetContract.purpose();
      console.log("purpose data: ", data);

      /** ----------------------
       * DIRECT CONTRACT CALL
       * ---------------------*/
      // const targetContract = new ethers.Contract(yourLuksoAddress, YourLukso__factory.abi, myProvider);
      // console.log("yourLukso: ", targetContract.address);

      // const data = await targetContract.purpose();
      // console.log("data: ", data);

      // const tx = await targetContract.connect(signer as Signer).setPurpose("updated man");
      // const rcpt = await tx.wait();
      // console.log("rcpt: ", rcpt);
    } catch (error) {
      console.log("error: ", error);
    }
  };

  const onDeployYourLukso = async (): any => {
    try {
      const yourLoksoFactory = new YourLukso__factory(signer as Signer);
      const yourLukso = await yourLoksoFactory.deploy();
      console.log("yourLukso: ", yourLukso.address);
      const data = await yourLukso.pu;
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

        <button onClick={onDeployYourLukso} className="m-2 btn btn-primary">
          deploy yourLokso Contract
        </button>

        <button onClick={onDeployOtherContract} className="m-2 btn btn-primary">
          interact other contract
        </button>
      </div>
    </>
  );
}
