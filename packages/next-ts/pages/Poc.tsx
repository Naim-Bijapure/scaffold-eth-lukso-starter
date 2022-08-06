/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-misused-promises */
import { ERC725 } from "@erc725/erc725.js";
import LSP10ReceivedVaults from "@erc725/erc725.js/schemas/LSP10ReceivedVaults.json";
import erc725schema from "@erc725/erc725.js/schemas/LSP3UniversalProfileMetadata.json";
import LSP6Schema from "@erc725/erc725.js/schemas/LSP6KeyManager.json";
import LSP9Vault from "@erc725/erc725.js/schemas/LSP9Vault.json";
import { LSPFactory } from "@lukso/lsp-factory.js";
import KeyManager from "@lukso/lsp-smart-contracts/artifacts/LSP6KeyManager.json";
import UniversalProfile from "@lukso/lsp-smart-contracts/artifacts/UniversalProfile.json";
import { BytesLike, ContractInterface, ethers, Signer } from "ethers";
import { GetStaticProps } from "next";
import { useEffect, useState } from "react";
import { useAccount, useConnect, useNetwork, useProvider, useSigner } from "wagmi";

import account from "../contracts/account.json";
import { Vault, Vault__factory } from "../contracts/contract-types";
import useLocalStorage from "../hooks/useLocalStorage";

const UP_ADDRESS = "0x64f0615831E2FB211be5Bc786D5a86F1F4DBFf1B";
const VAULT_ADDRESS = "0x8a2089EC7b28489AEf1060f6C8cEE4bC0df3302C";
// const UP_ADDRESS = "0x68Fe47223c4DF4486C5df3588a6CEb60F113cb0F"; // main lukso address

const UP_EDIT_DATA = {
  LSP3Profile: {
    name: "cool test edit from vault",
    description:
      "Congratulation! You have successfully edited your profile, and completed step 2 of the Getting Started guide 😃",
  },
};

const IPFS_GATEWAY = "https://2eff.lukso.dev/ipfs/";

const config = { ipfsGateway: IPFS_GATEWAY };
// console.log("erc725schema: ", erc725schema);

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

const createMapkey: (keyName: string, propertyType: string) => string = (keyName, propertyType) => {
  // const baseHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("LSP8MetadataAddress"));
  // console.log("baseHash: ", baseHash);

  const key1 = ethers.utils.hexDataSlice(ethers.utils.keccak256(ethers.utils.toUtf8Bytes(keyName)), 0, 10);

  const key2 = ethers.utils.hexDataSlice(ethers.utils.keccak256(ethers.utils.formatBytes32String(propertyType)), 0, 20);
  // const key2 = ethers.utils.hexDataSlice(ethers.utils.keccak256(propertyType), 0, 20);

  const combined = ethers.utils.hexConcat([key1, "0x0000", key2]);
  return combined;
};

export default function PocPage({ data }): JSX.Element {
  console.log("data: ", data);
  const [upAddress, setUpAddress] = useState<string>("");
  const [myUP, setMyUP] = useState<any>();
  const [myKM, setMyKM] = useState<any>();
  const [myWalletSigner, setMyWalletSigner] = useState<any>();
  const [erc725, setErc725] = useState<ERC725 | any>();

  const [pocData, setPocData] = useLocalStorage("pocData", { upAddress: "", vaultAddress: "" });

  const provider = useProvider();
  const { chain: activeChain } = useNetwork();

  const { data: mainSigner } = useSigner();

  const RPC_ENDPOINT: string = activeChain?.rpcUrls ? activeChain?.rpcUrls.default : "";
  const CHAIN_ID: number = activeChain?.id ? activeChain?.id : 0;

  const { address: mainAddress } = useAccount();
  const { connect, connectors, error, pendingConnector } = useConnect();

  const loadAccounts = async (): Promise<any> => {
    const myWalletSigner = new ethers.Wallet(account.privateKey, provider); // <---- custom signer from EOA account
    // const myWalletSigner = provider; // <---- custom signer from EOA account
    const { upAddress, vaultAddress }: { upAddress: string; vaultAddress: string } = pocData;
    console.log("upAddress: ", upAddress);

    // const erc725 = new ERC725([...erc725schema, ...LSP6Schema], UP_ADDRESS, window.ethereum, config);
    const erc725 = new ERC725(
      // @ts-ignore
      [...erc725schema, ...LSP6Schema, ...LSP10ReceivedVaults, ...LSP9Vault],
      // UP_ADDRESS,
      upAddress,
      window.ethereum,
      config
    );

    // contracts
    const myUP = new ethers.Contract(upAddress, UniversalProfile.abi, myWalletSigner); // <---- create UP contract instance from address
    console.log("myUP: address ", myUP.address);

    const ownerUP = await myUP?.owner(); // <---- get owner of UP contract
    const myKM = new ethers.Contract(ownerUP as string, KeyManager.abi, myWalletSigner); // <---- get key manager from UP contract
    console.log("myKM: ", myKM.address);

    setMyWalletSigner(myWalletSigner);

    setErc725(erc725);

    setMyUP(myUP);
    setMyKM(myKM);

    // @ts-ignore
    const myVault: Vault = new ethers.Contract(vaultAddress, Vault__factory.abi as ContractInterface, myWalletSigner);

    // myVault.on("DataChanged", async (dataKey, value, value2): Promise<any> => {
    // console.log("value: ", value);
    // console.log("dataKey: ", dataKey);
    // const keyData = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("String[]"));
    // console.log("keyData: ", keyData);
    // const data = await erc725.getData(String(dataKey).slice(0, 34));
    // console.log("data: ", data);
    // });
  };

  useEffect(() => {
    const { upAddress } = pocData;
    if (mainSigner !== null && upAddress) {
      void loadAccounts();
    }
  }, [mainSigner, pocData]);

  const onCreateUP = async (): Promise<any> => {
    try {
      console.log("onCreateUP: started ");

      /** ----------------------
       *
       *TO CREATE UP
       * ---------------------*/
      const lspFactory = new LSPFactory(RPC_ENDPOINT, {
        deployKey: account.privateKey,
        chainId: CHAIN_ID,
      });

      // @ts-ignore
      // const lspFactory = new LSPFactory(provider, {
      //   // deployKey: account.privateKey,
      //   chainId: CHAIN_ID,
      // });

      const mainAddress = await mainSigner?.getAddress();

      // @ts-ignore
      async function createUniversalProfile(): any {
        const deployedContracts = await lspFactory.UniversalProfile.deploy({
          // controllerAddresses: [mainAddress as string], // our EOA that will be controlling the UP
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
          // @ts-ignore
          LSP4TokenName: "coool",
        });
        console.log("createUniversalProfile:done ");
        return deployedContracts;
      }
      const output = await createUniversalProfile();
      console.log("up address: ", output["LSP0ERC725Account"]["address"]);
      setUpAddress(output["LSP0ERC725Account"]["address"] as string);

      setPocData({ ...pocData, upAddress: output["LSP0ERC725Account"]["address"] as string });
      console.log("output: ", output);

      // await mainSigner?.sendTransaction({
      //   to: output["LSP0ERC725Account"]["address"] as string,
      //   value: ethers.utils.parseEther(`100`),
      // });
    } catch (error) {
      console.log("error: ", error);
    }
  };

  const onSetData: () => any = async (): Promise<any> => {
    // const mapKeyValue = createMapkey("LSP8MetadataAddress", "cool");

    const KEY_NAME = "chatRoom:<string>:<string>";
    // const KEY_NAME = "middleData:<string>";
    const mapKeyValue = ERC725.encodeKeyName(KEY_NAME, ["address1", "address2"]);
    // const mapKeyValueTest = ERC725.encodeKeyName("MyKeyName:<uint32>", ["4081242941"]);
    // console.log("mapKeyValueTest: ", mapKeyValueTest);

    console.log("mapKeyValue: ", mapKeyValue);

    const myMappedSchema = {
      name: KEY_NAME,
      key: mapKeyValue,
      keyType: "Mapping",
      // keyType: "Singleton",
      valueType: "string[]",
      valueContent: "String",
    };
    console.log("myMapCchema: ", myMappedSchema);

    const isMyDataExists = erc725?.options?.schemas.find((data) => data.name === "N:<string>");
    console.log("isMyDataExists: ", isMyDataExists);

    if (isMyDataExists === undefined) {
      // @ts-ignore
      erc725?.options.schemas.push(myMappedSchema);
    }

    console.log(erc725?.options.schemas);

    const OPERATION_CALL = 0;

    // const hashData = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(JSON.stringify(UP_EDIT_DATA)));
    // const lsp3ProfileIPFSUrl = "ipfs://QmYCQTe5r5ZeVTbtpZMZXSQP2NxXdgJFVZb61Dk3gFP5VX";

    // const encodedData = erc725.encodeData({
    //   // @ts-ignore
    //   keyName: "LSP3Profile",
    //   value: {
    //     hashFunction: "keccak256(utf8)",
    //     // hash our LSP3 metadata JSON file
    //     hash: hashData,
    //     url: lsp3ProfileIPFSUrl,
    //   },
    // });
    const mainSigner = myWalletSigner;

    // const encodedData = erc725?.encodeData({
    //   // @ts-ignore
    //   keyName: "String[]",
    //   value: ["awesome new thing"],
    // });

    const encodedData = erc725?.encodeData({
      // @ts-ignore
      keyName: KEY_NAME,
      dynamicKeyParts: ["address1", "address2"],
      value: ["{address:asdf,message:'hello man'},{address:asdfasdf,message:'hi how are you'}"],
    });

    console.log("encodedData: ", encodedData);

    // encode the setData payload
    const abiPayload = myUP.interface.encodeFunctionData("setData(bytes32[],bytes[])", [
      encodedData?.keys,
      encodedData?.values,
    ]);

    // const abiPayload = myUP.interface.encodeFunctionData("setData(bytes32,bytes)", [
    //   String(encodedData?.keys),
    //   String(encodedData?.values),
    // ]);

    console.log("abiPayload: ", abiPayload);

    const tx = await myKM.connect(mainSigner).execute(abiPayload, { gasLimit: 10000000 }); // <---- call the execute on key manager contract
    const rcpt = await tx.wait();
    console.log("rcpt: ", rcpt);

    // const result = await erc725?.fetchData("String[]");
    const result = await erc725?.getData({
      keyName: KEY_NAME,
      // keyName: mapKeyValue,
      dynamicKeyParts: ["address1", "address2"],
    });
    console.log("result: ", result);
  };

  const onGetData: () => any = async (): Promise<any> => {
    const result = await erc725?.fetchData("String[]");
    console.log("result: ", result);

    // const keyData = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("String"));
    const addressPermission = await erc725?.getData({
      keyName: "AddressPermissions:Permissions:<address>",
      dynamicKeyParts: account.address,
    });
    console.log(addressPermission?.value);

    const decodedPermission = erc725?.decodePermissions(addressPermission?.value as string);

    // we use JSON.stringify to display the permission in a readable format
    console.log(`decoded permission for ${account.address} = ` + JSON.stringify(decodedPermission, null, 2));
  };

  const onGrantPermission: () => any = async (): Promise<any> => {
    const { upAddress, vaultAddress }: { upAddress: string; vaultAddress: string } = pocData;
    // @ts-ignore
    // const erc725 = new ERC725(LSP6Schema);

    const OPERATION_CALL = 0;
    // const myWalletSigner = new ethers.Wallet(account.privateKey, provider); // <---- custom signer from EOA account
    // contracts
    const myUP = new ethers.Contract(upAddress, UniversalProfile.abi, myWalletSigner as Signer); // <---- create UP contract instance from address
    console.log("myUP: ", myUP);
    const ownerUP = await myUP?.owner(); // <---- get owner of UP contract
    console.log("ownerUP: ", ownerUP);
    const myKM = new ethers.Contract(ownerUP as string, KeyManager.abi, myWalletSigner as Signer); // <---- get key manager from UP contract
    console.log("myKM: ", myKM.address);

    // step 2 - setup the permissions of the beneficiary address
    const beneficiaryAddress = account.address; // EOA address of an exemplary person
    const beneficiaryPermissions = erc725.encodePermissions({
      ADDPERMISSIONS: true,
      CALL: false,
      CHANGEOWNER: true,
      CHANGEPERMISSIONS: true,
      DELEGATECALL: true,
      DEPLOY: true,
      SETDATA: true,
      SIGN: true,
      STATICCALL: true,
      SUPER_CALL: true,
      SUPER_DELEGATECALL: true,
      SUPER_SETDATA: true,
      SUPER_STATICCALL: true,
      SUPER_TRANSFERVALUE: true,
      TRANSFERVALUE: true,
    });

    console.log("beneficiaryPermissions: ", beneficiaryPermissions);

    // step 3.1 - encode the data key-value pairs of the permissions to be set
    const data = erc725.encodeData({
      // @ts-ignore
      keyName: "AddressPermissions:Permissions:<address>",
      dynamicKeyParts: beneficiaryAddress,
      value: beneficiaryPermissions,
    });

    console.log("data: ", data);

    // on set permission
    //   step 3.2 - encode the payload to be sent to the Key Manager contract
    const payload = myUP.interface.encodeFunctionData("setData(bytes32,bytes)", [data.keys[0], data.values[0]]);

    // step 4 - send the transaction via the Key Manager contract
    const tx = await myKM.connect(myWalletSigner as Signer).execute(payload, { gasLimit: 10000000 }); // <---- call the execute on key manager contract
    const rcpt = await tx.wait();
    console.log("rcpt: ", rcpt);

    // ALLOW ONLY STRING KEY

    console.log("existing permissions");
    const result = await myUP["getData(bytes32)"](data.keys[0]);
    console.log(
      `The beneficiary address ${beneficiaryAddress} has now the following permissions:`,
      erc725.decodePermissions(result as string)
    );

    console.log("data: ", data);
  };

  const onSignMsg: () => any = async (): Promise<any> => {
    const signMsgHash = await mainSigner?.signMessage("coool man");
    const mainAddress = await mainSigner?.getAddress();
    console.log("mainAddress: ", mainAddress);
    console.log("signMsg: ", signMsgHash);
    const isVerify = ethers.utils.verifyMessage("coool man", signMsgHash as string);
    console.log("isVerify: ", isVerify);
  };

  const onVault: () => any = async (): Promise<any> => {
    const { upAddress } = pocData;

    console.log("onVault: ");
    // 1. DEPLOY VAULT
    const vault = new Vault__factory(myWalletSigner as Signer);

    // 2. SET THE UP AS OWNER
    const deployedVault = await vault.deploy(upAddress as string);
    console.log("deployedVault: ", deployedVault);
    console.log("deployedVault: address ", deployedVault.address);
    const owner = await deployedVault.owner();
    console.log("owner: ", owner);

    const vaultAddress = deployedVault.address;
    setPocData({ ...pocData, vaultAddress });

    // @ts-ignore
    const myVault: Vault = new ethers.Contract(
      vaultAddress,
      Vault__factory.abi as ContractInterface,
      myWalletSigner as Signer
    );

    // // 3. set the call persmission to main account
    // const beneficiaryAddress = account.address; // EOA address of an exemplary person
    // const beneficiaryPermissions = erc725.encodePermissions({
    //   ADDPERMISSIONS: true,
    //   CALL: true,
    //   // CHANGEOWNER: true,
    //   CHANGEPERMISSIONS: true,
    //   // DELEGATECALL: true,
    //   // DEPLOY: true,
    //   SETDATA: true,
    //   // SIGN: true,
    //   // STATICCALL: true,
    //   // SUPER_CALL: true,
    //   // SUPER_DELEGATECALL: true,
    //   // SUPER_SETDATA: true,
    //   // SUPER_STATICCALL: true,
    //   // SUPER_TRANSFERVALUE: true,
    //   // TRANSFERVALUE: true,
    // });

    // const permissionData = erc725.encodeData({
    //   // @ts-ignore
    //   keyName: "AddressPermissions:Permissions:<address>",
    //   dynamicKeyParts: beneficiaryAddress,
    //   value: beneficiaryPermissions,
    // });

    // const payload = myUP.interface.encodeFunctionData("setData(bytes32,bytes)", [
    //   permissionData.keys[0],
    //   permissionData.values[0],
    // ]);

    // const tx = await myKM.connect(myWalletSigner as Signer).execute(payload, { gasLimit: 10000000 }); // <---- call the execute on key manager contract
    // const rcpt = await tx.wait();
    // console.log("rcpt: ", rcpt);

    // // check the allowed permissons
    // console.log("existing permissions");
    // const result = await myUP["getData(bytes32)"](permissionData.keys[0]);
    // console.log(
    //   `The beneficiary address ${beneficiaryAddress} has now the following permissions:`,
    //   erc725.decodePermissions(result as string)
    // );

    // 4. set values as only allowed address
  };

  const onTestVault: () => any = async (): Promise<any> => {
    const { vaultAddress, upAddress } = pocData;
    const otherPrivateKey = "0x27aefc884203baf65a4d055376d85020be603e3f9bef0d8f2843e975e1749a9a";
    const otherWalletAccount = new ethers.Wallet(otherPrivateKey, provider);
    console.log("otherWalletAccount: ", otherWalletAccount.address);

    /** ----------------------
     * set the call permission
     * ---------------------*/
    const beneficiaryAddress = otherWalletAccount.address; // EOA address of an exemplary person
    const beneficiaryPermissions = erc725?.encodePermissions({
      // ADDPERMISSIONS: true,
      CALL: true,
      // CHANGEOWNER: true,
      // CHANGEPERMISSIONS: true,
      // DELEGATECALL: true,
      // DEPLOY: true,
      // SETDATA: true,
      // SIGN: true,
      // STATICCALL: true,
      // SUPER_CALL: true,
      // SUPER_DELEGATECALL: true,
      // SUPER_SETDATA: true,
      // SUPER_STATICCALL: true,
      // SUPER_TRANSFERVALUE: true,
      // TRANSFERVALUE: true,
    });

    // step 3.1 - encode the data key-value pairs of the permissions to be set
    const data = erc725?.encodeData({
      // @ts-ignore
      keyName: "AddressPermissions:Permissions:<address>",
      dynamicKeyParts: beneficiaryAddress,
      value: beneficiaryPermissions,
    });

    // on set permission
    //   step 3.2 - encode the payload to be sent to the Key Manager contract
    const payload = myUP.interface.encodeFunctionData("setData(bytes32,bytes)", [data.keys[0], data.values[0]]);

    // step 4 - send the transaction via the Key Manager contract
    const tx4 = await myKM.connect(myWalletSigner).execute(payload, { gasLimit: 10000000 }); // <---- call the execute on key manager contract
    const rcpt4 = await tx4.wait();
    console.log("rcpt4: ", rcpt4);

    /** ----------------------
     * add allowed address
     * ---------------------*/
    const allowedAddressData = erc725?.encodeData({
      // @ts-ignore
      keyName: "AddressPermissions:AllowedAddresses:<address>",
      dynamicKeyParts: otherWalletAccount.address,
      value: [vaultAddress],
    });

    console.log("allowedAddressData: ", allowedAddressData);

    const allowedAddressDataPayload = myUP.interface.encodeFunctionData("setData(bytes32[],bytes[])", [
      allowedAddressData?.keys,
      allowedAddressData?.values,
    ]);

    const tx1 = await myKM.connect(myWalletSigner as Signer).execute(allowedAddressDataPayload, { gasLimit: 10000000 }); // <---- call the execute on key manager contract
    const rcpt1 = await tx1.wait();
    console.log("rcpt1: ", rcpt1);

    const result1 = await myUP["getData(bytes32)"](allowedAddressData?.keys[0]);
    console.log("result1: ", result1);

    /** ----------------------
     * create th vault instance
     * ---------------------*/
    // @ts-ignore
    const myVault: Vault = new ethers.Contract(
      vaultAddress as string,
      Vault__factory.abi as ContractInterface,
      otherWalletAccount as Signer
    );

    /** ----------------------
     * set the vault set data
     * ---------------------*/
    const otherSigner = otherWalletAccount;

    const encodedData = erc725?.encodeData({
      // @ts-ignore
      keyName: "String",
      value: "cool this is working i can do anything  man",
    });

    console.log("encodedData: ", encodedData);

    // encode the setData payload
    // @ts-ignore
    const setDataVaultPayload = myVault.interface.encodeFunctionData("setData(bytes32,bytes)", [
      encodedData?.keys[0],
      encodedData?.values[0],
    ]);

    // @ts-ignore
    const vaultExecutePayload = myVault.interface.encodeFunctionData("execute", [
      0,
      vaultAddress as string,
      0,
      setDataVaultPayload,
    ]);

    console.log("abiPayload: ", setDataVaultPayload);

    // const tx = await myKM.connect(otherSigner).execute(setDataVaultPayload, { gasLimit: 10000000 }); // <---- call the execute on key manager contract
    const tx = await myKM.connect(otherSigner).execute(vaultExecutePayload, { gasLimit: 10000000 }); // <---- call the execute on key manager contract
    const rcpt = await tx.wait();
    console.log("rcpt: ", rcpt);

    // @ts-ignore
    const vaultStringData = await myVault["getData(bytes32)"](encodedData.keys[0] as BytesLike);
    console.log("vaultStringData: ", vaultStringData);

    const vaultDecodedString = erc725?.decodeData({
      // @ts-ignore
      keyName: "String",

      value: vaultStringData,
    });

    console.log("vaultDecodedString: ", vaultDecodedString);

    // with setData permission only
    // const tx5 = await myKM.connect(otherSigner).execute(setDataVaultPayload, { gasLimit: 10000000 }); // <---- call the execute on key manager contract

    // const rcpt5 = await tx5.wait();
    // console.log("rcpt5: ", rcpt5);

    /** ----------------------
     * edit profile data
     * ---------------------*/

    // const hashData = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(JSON.stringify(UP_EDIT_DATA)));
    // const lsp3ProfileIPFSUrl = "ipfs://QmYCQTe5r5ZeVTbtpZMZXSQP2NxXdgJFVZb61Dk3gFP5VX";

    // const encodedDataProfile = erc725.encodeData({
    //   // @ts-ignore
    //   keyName: "LSP3Profile",
    //   value: {
    //     hashFunction: "keccak256(utf8)",
    //     // hash our LSP3 metadata JSON file
    //     hash: hashData,
    //     url: lsp3ProfileIPFSUrl,
    //   },
    // });

    // // encode the setData payload
    // // @ts-ignore
    // const abiPayloadProfile = myVault.interface.encodeFunctionData("setData(bytes32,bytes)", [
    //   encodedDataProfile.keys[0],
    //   encodedDataProfile.values[0],
    // ]);

    // const abiPayload = myUP.interface.encodeFunctionData("setData(bytes32,bytes)", [
    //   String(encodedData.keys),
    //   String(encodedData.values),
    // ]);

    // console.log("abiPayload: ", abiPayload);

    // const tx5 = await myKM.connect(otherSigner).execute(abiPayloadProfile, { gasLimit: 10000000 }); // <---- call the execute on key manager contract
    // const rcpt5 = await tx5.wait();
    // console.log("rcpt:5 profile data ", rcpt5);

    // const profileData = await erc725.fetchData(encodedDataProfile.keys[0]);
    // console.log("profileData: ", profileData);

    /** ----------------------
     * direct set data
     * ---------------------*/
    // set data
    // const mainSigner = otherWalletAccount;

    // const encodedData = erc725.encodeData({
    //   // @ts-ignore
    //   keyName: "String[]",
    //   value: ["awesome new thing"],
    // });

    // console.log("encodedData: ", encodedData);

    // // encode the setData payload
    // const abiPayload = myUP.interface.encodeFunctionData("setData(bytes32[],bytes[])", [
    //   encodedData.keys,
    //   encodedData.values,
    // ]);

    // // const abiPayload = myUP.interface.encodeFunctionData("setData(bytes32,bytes)", [
    // //   String(encodedData.keys),
    // //   String(encodedData.values),
    // // ]);

    // console.log("abiPayload: ", abiPayload);

    // const tx = await myKM.connect(mainSigner).execute(abiPayload, { gasLimit: 10000000 }); // <---- call the execute on key manager contract
    // const rcpt = await tx.wait();
    // console.log("rcpt: ", rcpt);

    // // await mainSigner?.sendTransaction({ to: otherWalletAccount.address, value: ethers.utils.parseEther(`100`) });

    // // grant permission for this new address

    // const beneficiaryAddress = otherWalletAccount.address; // EOA address of an exemplary person
    // const beneficiaryPermissions = erc725.encodePermissions({
    //   // ADDPERMISSIONS: true,
    //   CALL: true,
    //   // CHANGEOWNER: true,
    //   // CHANGEPERMISSIONS: true,
    //   // DELEGATECALL: true,
    //   // DEPLOY: true,
    //   SETDATA: true,
    //   // SIGN: true,
    //   // STATICCALL: true,
    //   // SUPER_CALL: true,
    //   // SUPER_DELEGATECALL: true,
    //   // SUPER_SETDATA: true,
    //   // SUPER_STATICCALL: true,
    //   // SUPER_TRANSFERVALUE: true,
    //   TRANSFERVALUE: true,
    // });

    // // step 3.1 - encode the data key-value pairs of the permissions to be set
    // const data = erc725.encodeData({
    //   // @ts-ignore
    //   keyName: "AddressPermissions:Permissions:<address>",
    //   dynamicKeyParts: beneficiaryAddress,
    //   value: beneficiaryPermissions,
    // });

    // // on set permission
    // //   step 3.2 - encode the payload to be sent to the Key Manager contract
    // const payload = myUP.interface.encodeFunctionData("setData(bytes32,bytes)", [data.keys[0], data.values[0]]);

    // // step 4 - send the transaction via the Key Manager contract
    // const tx = await myKM.connect(myWalletSigner).execute(payload, { gasLimit: 10000000 }); // <---- call the execute on key manager contract
    // const rcpt = await tx.wait();

    // const result = await myUP["getData(bytes32)"](data.keys[0]);
    // console.log(
    //   `The beneficiary address ${beneficiaryAddress} has now the following permissions:`,
    //   erc725.decodePermissions(result as string)
    // );
  };

  const onKeyPermission: () => any = async (): Promise<any> => {
    const otherPrivateKey = "0x27aefc884203baf65a4d055376d85020be603e3f9bef0d8f2843e975e1749a9a";
    const otherWalletAccount = new ethers.Wallet(otherPrivateKey, provider);
    console.log("otherWalletAccount: ", otherWalletAccount);
    console.log("onKeyPermission: ");
    const mainSigner = otherWalletAccount;

    // set the setData permission
    // step 2 - setup the permissions of the beneficiary address
    const beneficiaryAddress = otherWalletAccount.address; // EOA address of an exemplary person
    const beneficiaryPermissions = erc725.encodePermissions({
      // ADDPERMISSIONS: true,
      // CALL: false,
      // CHANGEOWNER: true,
      // CHANGEPERMISSIONS: true,
      // DELEGATECALL: true,
      // DEPLOY: true,
      SETDATA: true,
      // SIGN: true,
      // STATICCALL: true,
      // SUPER_CALL: true,
      // SUPER_DELEGATECALL: true,
      // SUPER_SETDATA: true,
      // SUPER_STATICCALL: true,
      // SUPER_TRANSFERVALUE: true,
      // TRANSFERVALUE: true,
    });

    // step 3.1 - encode the data key-value pairs of the permissions to be set
    const data = erc725?.encodeData({
      // @ts-ignore
      keyName: "AddressPermissions:Permissions:<address>",
      dynamicKeyParts: beneficiaryAddress,
      value: beneficiaryPermissions,
    });

    // on set permission
    //   step 3.2 - encode the payload to be sent to the Key Manager contract
    const payload = myUP.interface.encodeFunctionData("setData(bytes32,bytes)", [data.keys[0], data.values[0]]);

    // step 4 - send the transaction via the Key Manager contract
    const tx1 = await myKM.connect(myWalletSigner as Signer).execute(payload, { gasLimit: 10000000 }); // <---- call the execute on key manager contract
    const rcpt1 = await tx1.wait();
    console.log("rcpt: ", rcpt1);

    // set only String key permission
    const dataKeysEncoded = erc725?.encodeData({
      // @ts-ignore
      keyName: "AddressPermissions:AllowedERC725YKeys:<address>",
      dynamicKeyParts: otherWalletAccount.address,
      value: [ethers.utils.keccak256(ethers.utils.toUtf8Bytes("String")).slice(0, 10)],
    });

    // on set permission
    //   step 3.2 - encode the payload to be sent to the Key Manager contract
    const dataKeysEncodedPayload = myUP.interface.encodeFunctionData("setData(bytes32[],bytes[])", [
      dataKeysEncoded.keys,
      dataKeysEncoded.values,
    ]);

    // step 4 - send the transaction via the Key Manager contract
    const tx2 = await myKM.connect(myWalletSigner as Signer).execute(dataKeysEncodedPayload, { gasLimit: 10000000 }); // <---- call the execute on key manager contract
    const rcpt2 = await tx2.wait();
    console.log("rcpt: ", rcpt2);
    // it should not working
    // const encodedData = erc725.encodeData({
    //   // @ts-ignore
    //   keyName: "String[]",
    //   value: ["after permission change"],
    // });

    const encodedData = erc725?.encodeData({
      // @ts-ignore
      keyName: "String",
      value: "only string allowed updated !!!",
    });

    console.log("encodedData: ", encodedData);

    // encode the setData payload
    const abiPayload = myUP.interface.encodeFunctionData("setData(bytes32,bytes)", [
      encodedData.keys[0],
      encodedData.values[0],
    ]);

    console.log("abiPayload: ", abiPayload);

    const tx = await myKM.connect(otherWalletAccount).execute(abiPayload, { gasLimit: 10000000 }); // <---- call the execute on key manager contract
    const rcpt = await tx.wait();
    console.log("rcpt: ", rcpt);

    // // check permission
    // const addressPermission = await erc725.getData({
    //   keyName: "AddressPermissions:AllowedERC725YKeys:<address>",
    //   dynamicKeyParts: otherWalletAccount.address,
    // });
    // const decodedPermission = erc725.decodePermissions(addressPermission.value as string);
    // console.log("decodedPermission: ", decodedPermission);

    // check the value
    const stringData = await erc725.getData({
      keyName: "String",
    });

    console.log("stringData: ", stringData);
  };

  return (
    <>
      <div className="flex flex-col items-center justify-center">
        <button className="btn btn-primary" onClick={onCreateUP}>
          create up
        </button>

        <button className="m-2 btn btn-primary" onClick={onGrantPermission}>
          grant permission
        </button>

        <button className="m-2 btn btn-primary" onClick={onSetData}>
          setData
        </button>

        <button className="m-2 btn btn-primary" onClick={onGetData}>
          getData
        </button>

        <button className="m-2 btn btn-primary" onClick={onVault}>
          create Vault
        </button>

        <button className="m-2 btn btn-primary" onClick={onKeyPermission}>
          only String allowed
        </button>

        <button className="m-2 btn btn-primary" onClick={onTestVault}>
          on test vault
        </button>
      </div>
    </>
  );
}

export const getStaticProps: GetStaticProps = async (ctx) => {
  return {
    props: { data: "cool" },
  };
};
