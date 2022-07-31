import { ERC725 } from "@erc725/erc725.js";
import erc725schema from "@erc725/erc725.js/schemas/LSP3UniversalProfileMetadata.json";
import LSP6Schema from "@erc725/erc725.js/schemas/LSP6KeyManager.json";
import { LSPFactory } from "@lukso/lsp-factory.js";
import KeyManager from "@lukso/lsp-smart-contracts/artifacts/LSP6KeyManager.json";
import UniversalProfile from "@lukso/lsp-smart-contracts/artifacts/UniversalProfile.json";
import { ethers, Signer } from "ethers";
import { useEffect, useState } from "react";
import { useNetwork, useProvider, useSigner } from "wagmi";

import useLocalStorage from "../hooks/useLocalStorage";

const UP_ADDRESS = "0x0355B7B8cb128fA5692729Ab3AAa199C1753f726";
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
//

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

    return encoded;
  } catch (error) {}
};

const decode = (erc725_customEncode, key: string, val: any): any => {
  try {
    const decoded = erc725_customEncode.decodeData([{ keyName: key, value: val }]);
    return decoded;
  } catch (error) {}
};

export default function User_2(): JSX.Element {
  const [upAddress, setUpAddress] = useState<string>("");
  const [myUP, setMyUP] = useState<any>();
  const [myKM, setMyKM] = useState<any>();
  const [myWalletSigner, setMyWalletSigner] = useState<any>();
  const [EOAWallet, setEOAWallet] = useState<any>();
  const [erc725, setErc725] = useState<any>();

  const [user1Address, setUser1Address] = useState<string>("");
  const [user1UP, setUser1UP] = useState<string>("");

  const [user2Data, setUser2Data] = useLocalStorage("user2", {});

  const provider = useProvider();
  const { activeChain } = useNetwork();

  const { data: mainSigner } = useSigner();

  const RPC_ENDPOINT: string = activeChain?.rpcUrls ? activeChain?.rpcUrls.default : "";
  const CHAIN_ID: number = activeChain?.id ? activeChain?.id : 0;

  useEffect(() => {
    if (user2Data.upAddress) {
      setUpAddress(user2Data?.upAddress as string);
    }

    if (user2Data.privateKey) {
      //       setUpAddress(user1Data?.upAddress as string);

      const wallet = new ethers.Wallet(user2Data.privateKey as string, provider);
      setEOAWallet(wallet);
    }

    setUser1Address("0x1d94d05Ff79a238B0fd1dcB50c1FE9af036410cd");
    setUser1UP("0x8bBC732dAE3c8bDeba60a7Dd5BD158D833fFAA0E");
  }, [user2Data]);

  const loadAccounts = async (): Promise<any> => {
    if (EOAWallet) {
      const { upAddress } = user2Data;
      console.log("upAddress: ", upAddress);
      console.log("EOAWallet: ", EOAWallet);

      // const myWalletSigner = new ethers.Wallet(account.privateKey, provider); // <---- custom signer from EOA account
      const myWalletSigner = EOAWallet; // <---- custom signer from EOA account

      // @ts-ignore
      const erc725 = new ERC725([...erc725schema, ...LSP6Schema], upAddress, window.ethereum, config);

      // contracts
      const myUP = new ethers.Contract(upAddress as string, UniversalProfile.abi, myWalletSigner as Signer); // <---- create UP contract instance from address
      console.log("myUP: ", myUP);

      const ownerUP = await myUP?.owner(); // <---- get owner of UP contract

      const myKM = new ethers.Contract(ownerUP as string, KeyManager.abi, myWalletSigner as Signer); // <---- get key manager from UP contract

      setMyWalletSigner(myWalletSigner);

      setErc725(erc725);

      setMyUP(myUP);
      setMyKM(myKM);

      // myUP.on("DataChanged", async (dataKey): Promise<any> => {
      //
      //   const keyData = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("String[]"));
      //
      //   const data = await erc725.getData(String(dataKey).slice(0, 34));
      //
      // });
    }
  };

  useEffect(() => {
    if (mainSigner !== null) {
      void loadAccounts();
    }
  }, [mainSigner]);

  const onCreateAccount: () => any = async (): Promise<void> => {
    const account = ethers.Wallet.createRandom();
    const data = { privateKey: account.privateKey, address: account.address };

    setUser2Data({ ...data });
    await mainSigner?.sendTransaction({ to: data?.address, value: ethers.utils.parseEther(`100`) });
  };

  const onCreateUP = async (): any => {
    try {
      const wallet = new ethers.Wallet(user2Data?.privateKey as string);

      const customProvider = wallet.provider;

      /** ----------------------
       *
       *TO CREATE UP
       * ---------------------*/
      const lspFactory = new LSPFactory(RPC_ENDPOINT, {
        deployKey: user2Data.privateKey,
        chainId: CHAIN_ID,
      });

      // @ts-ignore
      async function createUniversalProfile(): any {
        const deployedContracts = await lspFactory.UniversalProfile.deploy({
          controllerAddresses: [user2Data.address as string], // our EOA that will be controlling the UP
          lsp3Profile: {
            name: "user 1 profile",
            description: "this is user 1's cool profile ",
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

        return deployedContracts;
      }
      const output = await createUniversalProfile();

      setUpAddress(output["LSP0ERC725Account"]["address"] as string);

      setUser2Data({ ...user2Data, upAddress: output["LSP0ERC725Account"]["address"] });
    } catch (error) {}
  };

  const onGrantMsg: () => any = async (): Promise<any> => {
    //     const myWalletSigner = new ethers.Wallet(account.privateKey, provider); // <---- custom signer from EOA account
    // contracts
    //     const myUP = new ethers.Contract(UP_ADDRESS, UniversalProfile.abi, EOAWallet as Signer); // <---- create UP contract instance from address

    //     const ownerUP = await myUP?.owner(); // <---- get owner of UP contract

    //     const myKM = new ethers.Contract(ownerUP as string, KeyManager.abi, EOAWallet as Signer); // <---- get key manager from UP contract

    // step 2 - setup the permissions of the beneficiary address
    const beneficiaryAddress = user1Address; // EOA address of an exemplary person
    const beneficiaryPermissions = erc725.encodePermissions({
      ADDPERMISSIONS: true,
      CALL: true,
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

    // step 3.1 - encode the data key-value pairs of the permissions to be set
    const data = erc725.encodeData({
      // @ts-ignore
      keyName: "AddressPermissions:Permissions:<address>",
      dynamicKeyParts: beneficiaryAddress,
      value: beneficiaryPermissions,
    });

    // on set permission
    //   step 3.2 - encode the payload to be sent to the Key Manager contract
    const payload = myUP.interface.encodeFunctionData("setData(bytes32,bytes)", [data.keys[0], data.values[0]]);

    // step 4 - send the transaction via the Key Manager contract
    const tx = await myKM.connect(myWalletSigner).execute(payload, { gasLimit: 10000000 }); // <---- call the execute on key manager contract
    const rcpt = await tx.wait();

    const result = await myUP["getData(bytes32)"](data.keys[0]);
    console.log(
      `The beneficiary address ${beneficiaryAddress} has now the following permissions:`,
      erc725.decodePermissions(result as string)
    );
  };

  const onSendMessage: () => any = async (): Promise<any> => {
    const encodedData = erc725.encodeData({
      // @ts-ignore
      keyName: "String",
      value: "cool msg from user2",
    });

    console.log("encodedData: ", encodedData);

    const user2UPContract = new ethers.Contract(user1UP, UniversalProfile.abi, EOAWallet as Signer); // <---- create UP contract instance from address
    console.log("user2UPContract: ", user2UPContract);

    //     // encode the setData payload
    //     const abiPayload = myUP.interface.encodeFunctionData("setData(bytes32[],bytes[])", [
    //       encodedData.keys,
    //       encodedData.values,
    //     ]);

    const abiPayload = myUP.interface.encodeFunctionData("setData(bytes32,bytes)", [
      String(encodedData.keys),
      String(encodedData.values),
    ]);

    console.log("abiPayload: ", abiPayload);

    const tx = await myKM.connect(EOAWallet).execute(abiPayload, { gasLimit: 10000000 }); // <---- call the execute on key manager contract
    const rcpt = await tx.wait();
    console.log("rcpt: ", rcpt);
  };

  const onGetMessages: () => any = async (): Promise<any> => {
    // @ts-ignore
    const erc725 = new ERC725([...erc725schema, ...LSP6Schema], user1UP, window.ethereum, config);
    const result = await erc725.fetchData("String");
    console.log("result: ", result);
  };

  return (
    <>
      <div className="flex flex-col items-center justify-center">
        <button className="btn btn-primary" onClick={onCreateAccount}>
          create account
        </button>

        <div>
          user 2 EOA address: <span className="p-1 rounded-lg bg-base-300">{user2Data?.address}</span>
        </div>

        <button className="m-2 btn btn-primary" onClick={onCreateUP}>
          create UP
        </button>

        <div>
          current up address: <span className="p-1 rounded-lg bg-base-300">{upAddress}</span>
        </div>

        <div className="m-2">
          <div className="form-control">
            <input
              type="text"
              className=" input input-primary"
              placeholder="user 1 address"
              onChange={(event) => {
                setUser1Address(event.target.value);
              }}
              value={user1Address}
            />
            <input
              type="text"
              className="mt-2 input input-primary"
              placeholder="user 1 up address"
              onChange={(event) => {
                setUser1UP(event.target.value);
              }}
              value={user1UP}
            />

            <button className="mt-2 btn btn-primary" onClick={onGrantMsg}>
              grant permission to message
            </button>

            <input type="text" className="mt-2 input input-primary" placeholder="send msg to user 1" />
            <button className="mt-2 btn btn-primary" onClick={onSendMessage}>
              send
            </button>

            <button className="mt-2 btn btn-primary" onClick={onGetMessages}>
              test
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
