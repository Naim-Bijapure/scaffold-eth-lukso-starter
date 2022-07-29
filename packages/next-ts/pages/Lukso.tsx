import ERC725 from "@erc725/erc725.js";
import erc725schema from "@erc725/erc725.js/schemas/LSP3UniversalProfileMetadata.json";
import { LSPFactory } from "@lukso/lsp-factory.js";
import KeyManager from "@lukso/lsp-smart-contracts/artifacts/LSP6KeyManager.json";
import UniversalProfile from "@lukso/lsp-smart-contracts/artifacts/UniversalProfile.json";
import { ethers, Signer } from "ethers";
import Collapse, { Panel } from "rc-collapse";
// require("rc-collapse/assets/index.css");

import React, { ReactElement, useState } from "react";
import { useAccount, useNetwork, useProvider, useSigner } from "wagmi";

import account from "../contracts/account.json";
import { YourLukso__factory } from "../contracts/contract-types";

// Our static variables
const SAMPLE_PROFILE_ADDRESS = "0x277050a8f747B8dCfA7Df7da28590b99aDDF2eBf";
const IPFS_GATEWAY = "https://2eff.lukso.dev/ipfs/";
const yourLuksoAddress = "0x28521cdFfBa62d81a246042f573a53C710EFAbDE";

const yourLuksotBytecode = YourLukso__factory.bytecode;

export default function LuksoPage(): ReactElement {
  const { data: mainAccount, isSuccess } = useAccount();
  const provider = useProvider();
  console.log("provider: ", provider);
  const { data: signer } = useSigner();

  const [outputData, setOutputData] = useState({ createUP: "", UPData: "", interactedContract: "" });
  const [upAddress, setUpAddress] = useState("");
  const [contractPurpose, setContractPurpose] = useState("");
  const [yourLuksoContract, setYourLuksoContract] = useState<any>();

  const { activeChain } = useNetwork();
  console.log("activeChain: ", activeChain);

  const RPC_ENDPOINT = activeChain?.rpcUrls ? activeChain?.rpcUrls.default : "";

  const onCreateUP = async (): any => {
    try {
      console.log("onCreateUP: started ");

      setOutputData({ ...outputData, createUP: "executing" });
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
      console.log("output: ", output["LSP0ERC725Account"]["address"]);
      console.log("output: ", output);
      setUpAddress(output["LSP0ERC725Account"]["address"] as string);
      setOutputData({ ...outputData, createUP: JSON.stringify(output, null, 4) });
    } catch (error) {
      console.log("error: ", error);
    }
  };

  const onFetchUPData = async (): any => {
    try {
      //
      /** ----------------------
       * FETCH PROFILE DATA
       * ---------------------*/

      const provider = window.ethereum;
      // const provider = etherProvider;
      const config = { ipfsGateway: IPFS_GATEWAY };
      // @ts-ignore
      async function fetchProfile(address): any {
        // @ts-ignore
        const profile = new ERC725(erc725schema, address, provider, config);
        return await profile.fetchData();
      }

      console.log("upAddress: ", upAddress);
      const output = await fetchProfile(upAddress);
      console.log("output: ", output);

      setOutputData({ ...outputData, UPData: JSON.stringify(output, null, 4) });
    } catch (error) {
      setOutputData(() => ({ ...outputData, UPData: JSON.stringify("profile not loaded try in some time", null, 4) }));
      console.log("error: ", error);
    }
  };

  const onInteractOtherContract = async (): any => {
    try {
      const OPERATION_CALL = 0;

      const myWalletSigner = new ethers.Wallet(account.privateKey, provider); // <---- custom signer from EOA account

      // contracts
      const myUP = new ethers.Contract(upAddress, UniversalProfile.abi, myWalletSigner); // <---- create UP contract instance from address
      console.log("myUP: ", myUP);

      const ownerUP = await myUP?.owner(); // <---- get owner of UP contract
      console.log("ownerUP: ", ownerUP);

      const myKM = new ethers.Contract(ownerUP as string, KeyManager.abi, myWalletSigner); // <---- get key manager from UP contract
      console.log("myKM: ", myKM.address);

      const targetContract = new ethers.Contract(
        yourLuksoContract?.address as string,
        YourLukso__factory.abi,
        myWalletSigner
      ); // <----  create targeted contract instance in our case it is yourLukso

      /** ----------------------
       * transfer token code
       * ---------------------*/
      // const recipient = mainAccount?.address; // address the recipient (any address, including an other UP)
      // const amount = ethers.utils.parseUnits("5", "ether");
      // console.log("amount: ", amount);
      // // payload executed at the target (here nothing, just a plain LYX transfer)
      // const data = "0x";

      // const transferPayload = myUP?.interface.encodeFunctionData("execute", [OPERATION_CALL, recipient, amount, data]);
      // console.log("transferPayload: ", transferPayload);

      // const tx = await myKM.connect(myWalletSigner as Signer).execute(transferPayload, { gasLimit: 10000000 });
      // const rcpt = await tx.wait();
      // console.log("rcpt: ", rcpt);

      /** ----------------------
       * call other from up code
       * ---------------------*/

      const targetPayload = targetContract.interface.encodeFunctionData("setPurpose", [
        "yay !! updated from UP contract",
      ]); // <----  encode the target contract call
      console.log("targetPayload: ", targetPayload);

      const abiPayload = myUP.interface.encodeFunctionData("execute", [
        OPERATION_CALL,
        targetContract.address,
        0,
        targetPayload,
      ]); // <---- encode the exectue contract call with target payload

      console.log("abiPayload: ", abiPayload);
      const tx = await myKM.connect(myWalletSigner as Signer).execute(abiPayload, { gasLimit: 10000000 }); // <---- call the execute on key manager contract
      const rcpt = await tx.wait();
      console.log("rcpt: ", rcpt);

      setOutputData({ ...outputData, interactedContract: JSON.stringify(rcpt, null, 4) });

      const purpose = await targetContract.purpose();
      console.log("purpose: ", purpose);
      setContractPurpose(purpose as string);
    } catch (error) {
      console.log("error: ", error);
    }
  };

  const onDeployYourLukso = async (): any => {
    try {
      const mySigner = new ethers.Wallet(account.privateKey, provider);

      const yourLoksoFactory = new YourLukso__factory(mySigner);
      const yourLukso = await yourLoksoFactory.deploy();
      console.log("yourLukso: ", yourLukso.address);
      const purpose = await yourLukso.purpose();
      console.log("purpose: ", purpose);
      setYourLuksoContract(yourLukso);
      setContractPurpose(purpose);
    } catch (error) {
      console.log("error: ", error);
    }
  };

  const onRefreshPurpose = async (): any => {
    try {
      const purpose = await yourLuksoContract.purpose();
      console.log("purpose: ", purpose);
      setContractPurpose(purpose as string);
    } catch (error) {
      console.log("error: ", error);
    }
  };

  const onGetUPAddress = async (): any => {
    try {
      const data = signer?.getAddress();
      console.log("data: ", data);

      // console.log("accountsData: ", accountsData);
      // @ts-ignore
      const etherProvider = new ethers.providers.Web3Provider(window.ethereum);
      console.log("mainAccount: ", mainAccount?.address);

      // const accountsRequest: string[] = await etherProvider.send("eth_requestAccounts", []);
      // const signer = etherProvider.getSigner();
      // const upAddress = await signer.getAddress(); // should also yield the same address
      // console.log("upAddress: ", upAddress);

      console.log(provider);
    } catch (error) {
      console.log("error: ", error);
    }
  };

  return (
    <>
      <div className="flex flex-wrap  items-center justify-center w-[100%]">
        {/* <button onClick={onFactoryDeploy} className="m-2 btn btn-primary">
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

        <button onClick={onGetUPAddress} className="m-2 btn btn-primary">
          Get UP address
        </button> */}

        {/* CREATE UNIVERSAL PROFILE */}
        <div className="m-2 w-[80%]  shadow-sm card card-bordered bg-base-100">
          <div className="card-body">
            <h2 className="card-title">Create UP </h2>
            {upAddress && (
              <div>
                Created UP address <span className="p-1 bg-base-300 rounded-md">{upAddress}</span>
              </div>
            )}
            <div>
              <Collapse accordion={true}>
                <Panel
                  header={
                    <div className="flex justify-between">
                      <div>Output</div>
                      <div className={`text-center text-green-500 mx-14 ! `}>
                        {outputData["createUP"] === "executing" && "executing..."}
                        {outputData["createUP"] !== "executing" && outputData["createUP"] && "executed"}
                      </div>
                    </div>
                  }
                  headerClass="my-header-class">
                  <div className="mockup-code">
                    <pre data-prefix=">">
                      <code>{outputData["createUP"]}</code>
                    </pre>
                  </div>
                </Panel>
              </Collapse>
            </div>
            <div className="justify-end card-actions">
              <button className="btn btn-primary" onClick={onCreateUP}>
                Send
              </button>
            </div>
          </div>
        </div>

        {/* FETCH UNIVERSAL PROFILE */}
        <div className="m-2 w-[80%]  shadow-sm card card-bordered bg-base-100">
          <div className="card-body">
            <h2 className="card-title">Fetch UP Data </h2>

            {upAddress && (
              <div>
                Fetch UP data for address <span className="p-1 bg-base-300 rounded-md">{upAddress}</span>
              </div>
            )}
            <div>
              <Collapse accordion={true}>
                <Panel
                  header={
                    <div className="flex justify-between  ">
                      <div>Output</div>
                      <div className={`text-center text-green-500 mx-14 ! `}>
                        {outputData["UPData"] === "executing" && "executing..."}
                        {outputData["UPData"] !== "executing" && outputData["UPData"] && "executed"}
                      </div>
                    </div>
                  }
                  headerClass="my-header-class">
                  <div className="mockup-code">
                    <pre data-prefix=">">
                      <code>{outputData["UPData"]}</code>
                    </pre>
                  </div>
                </Panel>
              </Collapse>
            </div>
            <div className="justify-end card-actions">
              <button className="btn btn-primary" onClick={onFetchUPData}>
                Send
              </button>
            </div>
          </div>
        </div>

        {/* INTEREACT WITH A CONTRACT */}
        <div className="m-2 w-[80%]  shadow-sm card card-bordered bg-base-100">
          <div className="card-body">
            <h2 className="card-title">Intereact with a contract </h2>
            <div className="flex flex-col items-start justify-center">
              <div className="m-1">Deploy a yourLukso contract</div>
              <div className="m-1">
                <button onClick={onDeployYourLukso} className="btn btn-secondary">
                  Deploy
                </button>
              </div>

              {yourLuksoContract && (
                <div className="m-1">
                  YourLukso Contract deployed at{" "}
                  <span className="p-1 mx-1 bg-base-300 rounded-md"> {yourLuksoContract?.address}</span>
                </div>
              )}
              {contractPurpose && (
                <div className="m-1">
                  purpose of yourLukso contract is
                  <span className="p-1 mx-1 bg-base-300 rounded-md">{contractPurpose}</span>
                  <span>
                    <button className="btn btn-accent btn-sm" onClick={onRefreshPurpose}>
                      refresh
                    </button>
                  </span>
                </div>
              )}
            </div>

            <div>
              <Collapse accordion={true}>
                <Panel
                  header={
                    <div className="flex justify-between  ">
                      <div>Output</div>
                      <div className={`text-center text-green-500 mx-14 `}>
                        {outputData["interactedContract"] === "executing" && "executing..."}
                        {outputData["interactedContract"] !== "executing" &&
                          outputData["interactedContract"] &&
                          "executed"}
                      </div>
                    </div>
                  }
                  headerClass="my-header-class">
                  <div className="mockup-code">
                    <pre data-prefix=">">
                      <code>{outputData["interactedContract"]}</code>
                    </pre>
                  </div>
                </Panel>
              </Collapse>
            </div>
            <div className="justify-end card-actions">
              <button className="btn btn-primary" onClick={onInteractOtherContract}>
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
