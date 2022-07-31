import { ERC725 } from "@erc725/erc725.js";
import erc725schema from "@erc725/erc725.js/schemas/LSP3UniversalProfileMetadata.json";
import LSP6Schema from "@erc725/erc725.js/schemas/LSP6KeyManager.json";
import { LSPFactory } from "@lukso/lsp-factory.js";
import KeyManager from "@lukso/lsp-smart-contracts/artifacts/LSP6KeyManager.json";
import UniversalProfile from "@lukso/lsp-smart-contracts/artifacts/UniversalProfile.json";
import { ContractInterface, ethers, Signer } from "ethers";
import { useEffect, useState } from "react";
import { useNetwork, useProvider, useSigner } from "wagmi";

import account from "../contracts/account.json";
import { Vault, Vault__factory } from "../contracts/contract-types";

const UP_ADDRESS = "0x0165878A594ca255338adfa4d48449f69242Eb8F";
// const UP_ADDRESS = "0x2200f3241C4B32eADbF800c552Ae7686e5Bbf23f"; // main lukso address

const UP_EDIT_DATA = {
  LSP3Profile: {
    name: "LUKSO Profile - Getting Started",
    description:
      "Congratulation! You have successfully edited your profile, and completed step 2 of the Getting Started guide 😃",
  },
};

const IPFS_GATEWAY = "https://2eff.lukso.dev/ipfs/";

const config = { ipfsGateway: IPFS_GATEWAY };
// console.log("erc725schema: ", erc725schema);

const myString = {
  name: "String",
  key: "0x7ff6a077f248416948843f592327444c45801847787632efa8e679f72a85215f",
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

const encode = (erc725Obj, key: string, val: any): any => {
  try {
    const encoded = erc725Obj.encodeData([{ keyName: key, value: val }]);
    console.log("encoded: ", encoded);
    return encoded;
  } catch (error) {
    console.log("error: ", error);
  }
};

const decode = (erc725_customEncode, key: string, val: any): any => {
  try {
    const decoded = erc725_customEncode.decodeData([{ keyName: key, value: val }]);
    return decoded;
  } catch (error) {
    console.log("error: ", error);
  }
};

export default function PocPage(): JSX.Element {
  const [upAddress, setUpAddress] = useState<string>("");
  const [myUP, setMyUP] = useState<any>();
  const [myKM, setMyKM] = useState<any>();
  const [myWalletSigner, setMyWalletSigner] = useState<any>();
  const [erc725, setErc725] = useState<any>();

  const provider = useProvider();
  const { activeChain } = useNetwork();

  const { data: mainSigner } = useSigner();

  const RPC_ENDPOINT: string = activeChain?.rpcUrls ? activeChain?.rpcUrls.default : "";
  const CHAIN_ID: number = activeChain?.id ? activeChain?.id : 0;

  const loadAccounts = async (): Promise<any> => {
    const myWalletSigner = new ethers.Wallet(account.privateKey, provider); // <---- custom signer from EOA account
    // const myWalletSigner = provider; // <---- custom signer from EOA account

    // @ts-ignore
    const erc725 = new ERC725([...erc725schema, ...LSP6Schema], UP_ADDRESS, window.ethereum, config);

    // contracts
    const myUP = new ethers.Contract(UP_ADDRESS, UniversalProfile.abi, myWalletSigner); // <---- create UP contract instance from address

    console.log("myUP: ", myUP.provider);

    const ownerUP = await myUP?.owner(); // <---- get owner of UP contract
    console.log("ownerUP: ", ownerUP);
    const myKM = new ethers.Contract(ownerUP as string, KeyManager.abi, myWalletSigner); // <---- get key manager from UP contract
    console.log("myKM: ", myKM.address);

    setMyWalletSigner(myWalletSigner);

    setErc725(erc725);

    setMyUP(myUP);
    setMyKM(myKM);

    // myUP.on("DataChanged", async (dataKey): Promise<any> => {
    //   console.log("dataKey: ", dataKey);
    //   const keyData = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("String[]"));
    //   console.log('keyData: ', keyData);
    //   const data = await erc725.getData(String(dataKey).slice(0, 34));
    //   console.log("data: ", data);
    // });
  };

  useEffect(() => {
    if (mainSigner !== null) {
      void loadAccounts();
    }
  }, [mainSigner]);

  const onCreateUP = async (): any => {
    try {
      console.log("onCreateUP: started ");

      /** ----------------------
       *
       *TO CREATE UP
       * ---------------------*/
      // const lspFactory = new LSPFactory(RPC_ENDPOINT, {
      //   deployKey: account.privateKey,
      //   chainId: CHAIN_ID,
      // });

      // @ts-ignore
      const lspFactory = new LSPFactory(provider, {
        // deployKey: account.privateKey,
        chainId: CHAIN_ID,
      });

      const mainAddress = await mainSigner?.getAddress();

      // @ts-ignore
      async function createUniversalProfile(): any {
        const deployedContracts = await lspFactory.UniversalProfile.deploy({
          controllerAddresses: [mainAddress as string], // our EOA that will be controlling the UP
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
      console.log("output: ", output);
    } catch (error) {
      console.log("error: ", error);
    }
  };

  const onSetData: () => any = async (): Promise<any> => {
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

    const encodedData = erc725.encodeData({
      // @ts-ignore
      keyName: "String[]",
      value: ["awesome new thing"],
    });

    console.log("encodedData: ", encodedData);

    // encode the setData payload
    const abiPayload = myUP.interface.encodeFunctionData("setData(bytes32[],bytes[])", [
      encodedData.keys,
      encodedData.values,
    ]);

    // const abiPayload = myUP.interface.encodeFunctionData("setData(bytes32,bytes)", [
    //   String(encodedData.keys),
    //   String(encodedData.values),
    // ]);

    console.log("abiPayload: ", abiPayload);

    const tx = await myKM.connect(mainSigner).execute(abiPayload, { gasLimit: 10000000 }); // <---- call the execute on key manager contract
    const rcpt = await tx.wait();
    console.log("rcpt: ", rcpt);

    // const result = await erc725.fetchData("LSP4TokenName");
    // console.log("result: ", result);
  };

  const onGetData: () => any = async (): Promise<any> => {
    const result = await erc725.fetchData("String[]");
    console.log("result: ", result);

    // const keyData = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("String"));
    const addressPermission = await erc725.getData({
      keyName: "AddressPermissions:Permissions:<address>",
      dynamicKeyParts: account.address,
    });
    console.log(addressPermission.value);

    const decodedPermission = erc725.decodePermissions(addressPermission.value as string);

    // we use JSON.stringify to display the permission in a readable format
    console.log(`decoded permission for ${account.address} = ` + JSON.stringify(decodedPermission, null, 2));
  };

  const onGrantPermission: () => any = async (): Promise<any> => {
    // @ts-ignore
    // const erc725 = new ERC725(LSP6Schema);

    const OPERATION_CALL = 0;
    // const myWalletSigner = new ethers.Wallet(account.privateKey, provider); // <---- custom signer from EOA account
    // contracts
    const myUP = new ethers.Contract(UP_ADDRESS, UniversalProfile.abi, myWalletSigner as Signer); // <---- create UP contract instance from address
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
    const tx = await myKM.connect(mainSigner as Signer).execute(payload, { gasLimit: 10000000 }); // <---- call the execute on key manager contract
    const rcpt = await tx.wait();
    console.log("rcpt: ", rcpt);

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
    console.log("onVault: ");

    const address = await mainSigner?.getAddress();
    const vault = new Vault__factory(myWalletSigner as Signer);

    const deployedVault = await vault.deploy(UP_ADDRESS);
    console.log("deployedVault: ", deployedVault.address);
    const owner = await deployedVault.owner();
    console.log("owner: ", owner);

    const vaultAddress = owner;

    // @ts-ignore
    const erc725 = new ERC725([...erc725schema, ...LSP6Schema], vaultAddress, myWalletSigner.provider, config);

    // @ts-ignore
    const myVault: Vault = new ethers.Contract(
      vaultAddress as string,
      Vault__factory.abi as ContractInterface,
      myWalletSigner as Signer
    );
    console.log("myVault: ", myVault);

    const encodedData = erc725.encodeData({
      // @ts-ignore
      keyName: "String",
      value: "awesome new thing",
    });

    console.log("encodedData: ", encodedData);

    // encode the setData payload
    // const abiPayload = myUP.interface.encodeFunctionData("setData(bytes32[],bytes[])", [
    //   encodedData.keys,
    //   encodedData.values,
    // ]);
    const key = ethers.utils.formatBytes32String("myKey");
    const value = ethers.utils.toUtf8Bytes("yo man");
    console.log("key: ", key);
    console.log("value: ", value);
    //@ts-ignore
    const payload = await myVault.interface.encodeFunctionData("setData(bytes32,bytes)", [key, value]);

    const tx = await myVault.connect(myWalletSigner).execute(0, vaultAddress, 0, payload, {
      gasLimit: 10000000,
    });

    console.log("tx: ", tx);
    const rcpt = await tx.wait();
    console.log("rcpt: ", rcpt);

    // const result = await myVault["getData(bytes32)"](key);
    // console.log("result: ", result);
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
          Vault
        </button>
      </div>
    </>
  );
}
