/* eslint-disable @typescript-eslint/explicit-function-return-type */

import { ERC725 } from "@erc725/erc725.js";
import LSP10ReceivedVaults from "@erc725/erc725.js/schemas/LSP10ReceivedVaults.json";
import erc725schema from "@erc725/erc725.js/schemas/LSP3UniversalProfileMetadata.json";
import LSP6Schema from "@erc725/erc725.js/schemas/LSP6KeyManager.json";
import LSP9Vault from "@erc725/erc725.js/schemas/LSP9Vault.json";
import { LSPFactory } from "@lukso/lsp-factory.js";
import KeyManager from "@lukso/lsp-smart-contracts/artifacts/LSP6KeyManager.json";
import UniversalProfile from "@lukso/lsp-smart-contracts/artifacts/UniversalProfile.json";
import { ContractInterface, ethers, Signer } from "ethers";
import { useEffect, useState } from "react";
import { useNetwork, useProvider, useSigner } from "wagmi";

import account from "../contracts/account.json";
import { Vault, Vault__factory } from "../contracts/contract-types";
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

const KEY_NAME = "chat:<string>:<string>";
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

const chatSchema = {
  name: "chat:<string>:<string>",
  key: "0x",
  keyType: "Mapping",
  valueType: "string[]",
  valueContent: "String",
};

erc725schema.push(myString);
erc725schema.push(myStringArr);
erc725schema.push(chatSchema);

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

export default function User_1(): JSX.Element {
  const [upAddress, setUpAddress] = useState<string>("");
  const [myUP, setMyUP] = useState<any>();
  const [myVault, setMyVault] = useState<any>();
  const [myKM, setMyKM] = useState<any>();
  const [myWalletSigner, setMyWalletSigner] = useState<any>();
  const [EOAWallet, setEOAWallet] = useState<any>();
  const [erc725, setErc725] = useState<any>();

  const [user2Address, setUser2Address] = useState<string>("");
  const [user2UP, setUser2UP] = useState<string>("");
  const [user2Vault, setUser2Vault] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [toggleLoad, setToggleLoad] = useState<boolean>(false);
  const [messagesData, setMessagesData] = useState<any[]>([]);

  const [user1Data, setUser1Data] = useLocalStorage("user1", {});
  const [commonUPandVault, setCommonUPandVault] = useLocalStorage("commonUPandVault", {});

  const provider = useProvider();
  const { chain: activeChain } = useNetwork();

  const { data: mainSigner } = useSigner();

  const RPC_ENDPOINT: string = activeChain?.rpcUrls ? activeChain?.rpcUrls.default : "";
  const CHAIN_ID: number = activeChain?.id ? activeChain?.id : 0;

  useEffect(() => {
    if (user1Data.upAddress) {
      setUpAddress(user1Data?.upAddress as string);
    }

    if (user1Data.privateKey) {
      //       setUpAddress(user1Data?.upAddress as string);

      const wallet = new ethers.Wallet(user1Data.privateKey as string, provider);
      setEOAWallet(wallet);
    }

    setUser2Address("0x62236FE14a5B6E6aeC12a744BD12877130Ac75a3");
    // setUser2UP("0x57ad9f2Dc0E5c8dd30bB63eEEBBB06F14ca713EF");
  }, [user1Data]);

  const loadMessages: () => any = async (): Promise<any> => {
    console.log("loadMessages: called ");
    // console.log("myVault: ", myVault);
    if (myVault) {
      const user1Addr = user1Data?.address;
      const user2Addr = user2Address;

      const dynamicKey = ERC725.encodeKeyName(KEY_NAME, [user1Addr, user2Addr]);
      console.log("dynamicKey: ", dynamicKey);

      const vaultChatDataBefore = await myVault["getData(bytes32)"](dynamicKey);

      const vaultDecodedStringBefore = erc725?.decodeData({
        // @ts-ignore
        keyName: KEY_NAME,
        dynamicKeyParts: [user1Addr, user2Addr],
        value: vaultChatDataBefore,
      });

      const oldValues = vaultDecodedStringBefore.value !== null ? vaultDecodedStringBefore.value : [];
      // console.log("load messages oldValues: ", oldValues);
      const messages: any[] = [];
      if (Array.isArray(oldValues)) {
        oldValues.map((msg: string) => messages.push(JSON.parse(msg)));
      }

      console.log("messages: ", messages);
      setMessagesData(messages);
    }
  };

  const loadAccounts = async (): Promise<any> => {
    // const { upAddress } = user1Data;
    const { upAddress, vaultAddress } = commonUPandVault;
    if (EOAWallet && upAddress) {
      console.log("upAddress: ", upAddress);
      console.log("EOAWallet: ", EOAWallet);

      // const myWalletSigner = new ethers.Wallet(account.privateKey, provider); // <---- custom signer from EOA account
      const myWalletSigner = EOAWallet; // <---- custom signer from EOA account

      // @ts-ignore
      // const erc725 = new ERC725([...erc725schema, ...LSP6Schema], upAddress, window.ethereum, config);

      const erc725 = new ERC725(
        // @ts-ignore
        [...erc725schema, ...LSP6Schema, ...LSP10ReceivedVaults, ...LSP9Vault],
        // UP_ADDRESS,
        upAddress,
        window.ethereum,
        config
      );

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

      // @ts-ignore
      const myVault: Vault = new ethers.Contract(
        vaultAddress as string,
        Vault__factory.abi as ContractInterface,
        myWalletSigner as Signer
      );

      setMyVault(myVault);

      myVault.on("DataChanged", (dataKey) => {
        console.log("myVault: data changed ", dataKey);

        setToggleLoad((pre) => !pre);
      });
    }
  };

  useEffect(() => {
    if (mainSigner !== null) {
      void loadAccounts();
    }
  }, [mainSigner]);

  useEffect(() => {
    if (myVault) {
      void loadMessages();
    }
  }, [myVault, toggleLoad]);

  const onCreateAccount: () => any = async (): Promise<void> => {
    const account = ethers.Wallet.createRandom();
    const data = { privateKey: account.privateKey, address: account.address };

    setUser1Data({ ...data });
    await mainSigner?.sendTransaction({ to: data?.address, value: ethers.utils.parseEther(`100`) });
  };

  const onCreateUP = async (): Promise<any> => {
    console.log("onCreateUP: triggered ");
    console.log("user1Data: ", user1Data);
    try {
      const wallet = new ethers.Wallet(user1Data?.privateKey as string);

      const customProvider = wallet.provider;

      /** ----------------------
       *
       *TO CREATE UP
       * ---------------------*/
      const lspFactory = new LSPFactory(RPC_ENDPOINT, {
        deployKey: user1Data.privateKey,
        chainId: CHAIN_ID,
      });

      // @ts-ignore
      async function createUniversalProfile(): any {
        const deployedContracts = await lspFactory.UniversalProfile.deploy({
          controllerAddresses: [user1Data.address as string], // our EOA that will be controlling the UP
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
      console.log("output: ", output);

      setUpAddress(output["LSP0ERC725Account"]["address"] as string);

      setUser1Data({ ...user1Data, upAddress: output["LSP0ERC725Account"]["address"] });
    } catch (error) {
      console.log("error: ", error);
    }
  };

  const onGrantMsg: () => any = async (): Promise<any> => {
    /** ----------------------
     * on grant permission for user 1
     * ---------------------*/

    const { upAddress, vaultAddress } = commonUPandVault;
    console.log("commonUPandVault: ", commonUPandVault);

    const commonERC725 = new ERC725(
      // @ts-ignore
      [...erc725schema, ...LSP6Schema, ...LSP10ReceivedVaults, ...LSP9Vault],
      // UP_ADDRESS,
      upAddress,
      window.ethereum,
      config
    );

    const commonSigner = new ethers.Wallet(account.privateKey, provider); // <---- custom signer from EOA account
    // contracts
    const commonUP = new ethers.Contract(upAddress as string, UniversalProfile.abi, commonSigner); // <---- create UP contract instance from address
    console.log("commonUP: address ", commonUP.address);

    const ownerUP = await commonUP?.owner(); // <---- get owner of UP contract
    const commonKM = new ethers.Contract(ownerUP as string, KeyManager.abi, commonSigner); // <---- get key manager from UP contract
    console.log("commonKM: address  ", commonKM.address);

    /** ----------------------
     * set the call permission
     * ---------------------*/
    const beneficiaryAddress = user1Data?.address; // EOA address of an exemplary person
    const beneficiaryPermissions = commonERC725?.encodePermissions({
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
    const data = commonERC725?.encodeData({
      // @ts-ignore
      keyName: "AddressPermissions:Permissions:<address>",
      dynamicKeyParts: beneficiaryAddress,
      value: beneficiaryPermissions,
    });

    console.log("data: ", data);

    // on set permission
    //   step 3.2 - encode the payload to be sent to the Key Manager contract
    const payload = commonUP.interface.encodeFunctionData("setData(bytes32,bytes)", [data.keys[0], data.values[0]]);
    console.log("payload: ", payload);

    // step 4 - send the transaction via the Key Manager contract
    const tx = await commonKM.connect(commonSigner).execute(payload, { gasLimit: 10000000 }); // <---- call the execute on key manager contract
    const rcpt = await tx.wait();
    console.log("rcpt: ", rcpt);
    console.log("------------- CALL PERMISSION GRANTED-------------------");

    /** ----------------------
     * add allowed address
     * ---------------------*/
    const allowedAddressData = commonERC725?.encodeData({
      // @ts-ignore
      keyName: "AddressPermissions:AllowedAddresses:<address>",
      dynamicKeyParts: user1Data?.address,
      value: [vaultAddress],
    });

    console.log("allowedAddressData: ", allowedAddressData);

    const allowedAddressDataPayload = commonUP.interface.encodeFunctionData("setData(bytes32[],bytes[])", [
      allowedAddressData?.keys,
      allowedAddressData?.values,
    ]);

    const tx1 = await commonKM
      .connect(commonSigner as Signer)
      .execute(allowedAddressDataPayload, { gasLimit: 10000000 }); // <---- call the execute on key manager contract
    const rcpt1 = await tx1.wait();
    console.log("rcpt1: ", rcpt1);

    const result1 = await commonUP["getData(bytes32)"](allowedAddressData?.keys[0]);
    console.log("result1: ", result1);
  };

  const onSendMessage: () => any = async (): Promise<any> => {
    const { vaultAddress } = commonUPandVault;
    // const myWalletSigner = myWalletSigner;

    // @ts-ignore
    const myVault: Vault = new ethers.Contract(
      vaultAddress as string,
      Vault__factory.abi as ContractInterface,
      myWalletSigner as Signer
    );

    // const encodedData = erc725?.encodeData({
    //   // @ts-ignore
    //   keyName: "String",
    //   value: "cool msg with vault",
    // });

    const user1Addr = user1Data?.address;
    const user2Addr = user2Address;

    const dynamicKey = ERC725.encodeKeyName(KEY_NAME, [user1Addr, user2Addr]);
    console.log("dynamicKey: ", dynamicKey);

    const vaultChatDataBefore = await myVault["getData(bytes32)"](dynamicKey);

    const vaultDecodedStringBefore = erc725?.decodeData({
      // @ts-ignore
      keyName: KEY_NAME,
      dynamicKeyParts: [user1Addr, user2Addr],
      value: vaultChatDataBefore,
    });

    console.log("vaultDecodedStringBefore: ", vaultDecodedStringBefore);

    const oldValues = vaultDecodedStringBefore.value !== null ? vaultDecodedStringBefore.value : [];

    const msgData = {
      address: user1Addr,
      message,
    };

    // console.log("msgData: ", msgData);

    const encodedData = erc725?.encodeData({
      // @ts-ignore
      keyName: KEY_NAME,
      dynamicKeyParts: [user1Addr, user2Addr],
      // value: [...oldValues, `{user:'asdfasdf',msg:'hello naim add before' }`],
      value: [...oldValues, JSON.stringify(msgData)],
    });

    // console.log("encodedData: ", encodedData);

    // array values
    // @ts-ignore
    const setDataVaultPayload = myVault.interface.encodeFunctionData("setData(bytes32[],bytes[])", [
      encodedData?.keys,
      encodedData?.values,
    ]);

    // @ts-ignore
    const vaultExecutePayload = myVault.interface.encodeFunctionData("execute", [
      0,
      vaultAddress as string,
      0,
      setDataVaultPayload,
    ]);

    // console.log("abiPayload: ", setDataVaultPayload);

    // const tx = await myKM.connect(otherSigner).execute(setDataVaultPayload, { gasLimit: 10000000 }); // <---- call the execute on key manager contract
    const tx = await myKM.connect(myWalletSigner).execute(vaultExecutePayload, { gasLimit: 10000000 }); // <---- call the execute on key manager contract
    const rcpt = await tx.wait();
    // console.log("rcpt: ", rcpt);

    // @ts-ignore
    const vaultChatData = await myVault["getData(bytes32)"](dynamicKey);
    // console.log("vaultStringData: ", vaultChatData);

    const vaultDecodedString = erc725?.decodeData({
      // @ts-ignore
      keyName: KEY_NAME,
      dynamicKeyParts: [user1Addr, user2Addr],
      value: vaultChatData,
    });

    console.log("vaultDecodedString: ", vaultDecodedString);

    setMessage("");
  };

  const onGetMessages: () => any = async (): Promise<any> => {
    // @ts-ignore
    const erc725 = new ERC725([...erc725schema, ...LSP6Schema], user2UP, window.ethereum, config);
    const result = await erc725.fetchData("String");
    console.log("result: ", result);

    const result1 = await erc725.getData("AddressPermissions[]");
    console.log(result1);
  };

  const onCommonUPandVault: () => any = async (): Promise<any> => {
    console.log("onCreateUP: started ");

    const commonSigner = new ethers.Wallet(account.privateKey, provider); // <---- custom signer from EOA account

    /** ----------------------
     *
     *TO CREATE UP
     * ---------------------*/
    const lspFactory = new LSPFactory(RPC_ENDPOINT, {
      deployKey: account.privateKey,
      chainId: CHAIN_ID,
    });

    // @ts-ignore
    async function createUniversalProfile(): any {
      const deployedContracts = await lspFactory.UniversalProfile.deploy({
        // controllerAddresses: [mainAddress as string], // our EOA that will be controlling the UP
        controllerAddresses: [account.address], // our EOA that will be controlling the UP
        lsp3Profile: {
          name: "this is main common profile",
          description: "a common profile",
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
    // console.log("output: ", output);

    const upAddress = output["LSP0ERC725Account"]["address"] as string;
    // create a common up
    // setCommonUPandVault({ ...commonUPandVault, upAddress });

    // 1. DEPLOY VAULT
    const vault = new Vault__factory(commonSigner as Signer);

    // 2. SET THE UP AS OWNER
    const deployedVault = await vault.deploy(upAddress);
    const owner = await deployedVault.owner();

    const vaultAddress = deployedVault.address;
    setCommonUPandVault({ ...commonUPandVault, vaultAddress, upAddress });

    console.log("upAddress: ", upAddress);
    console.log("vaultAddress: ", vaultAddress);
  };

  return (
    <>
      <div className="flex flex-col items-center justify-center">
        <button className="m-2 btn btn-primary" onClick={onCommonUPandVault}>
          create common UP and Vault
        </button>

        <div className="m-2">
          common up address: <span className="p-1 rounded-lg bg-base-300">{commonUPandVault?.upAddress}</span>
        </div>

        <div>
          common vault address: <span className="p-1 rounded-lg bg-base-300">{commonUPandVault?.vaultAddress}</span>
        </div>

        <button className="m-2 btn btn-primary" onClick={onCreateAccount}>
          create account
        </button>

        <div>
          user 1 EOA address: <span className="p-1 rounded-lg bg-base-300">{user1Data?.address}</span>
        </div>

        {/* <button className="m-2 btn btn-primary" onClick={onCreateUP}>
          create UP
        </button> */}

        {/* <div>
          current up address: <span className="p-1 rounded-lg bg-base-300">{upAddress}</span>
        </div> */}

        <button className="mt-2 btn btn-primary" onClick={onGrantMsg}>
          grant vault permission to message
        </button>

        <div className="m-2">
          <div className="form-control">
            <span className=" label label-text">user 2 address</span>
            <input
              type="text"
              className=" input input-primary"
              placeholder="user 2 address"
              onChange={(event) => {
                setUser2Address(event.target.value);
              }}
              value={user2Address}
            />

            {/* <span className="label label-text">user UP Address</span> */}
            {/* <input
              type="text"
              className="mt-2 input input-primary"
              placeholder="user 2 UP address"
              onChange={(event) => {
                setUser2UP(event.target.value);
              }}
              value={user2UP}
            /> */}

            {/* <span className="label label-text">user Vault Address</span>
            <input
              type="text"
              className="mt-2 input input-primary"
              placeholder="user 2 Vault address"
              onChange={(event) => {
                setUser2Vault(event.target.value);
              }}
              value={user2Vault}
            /> */}

            <input
              type="text"
              className="mt-2 input input-primary"
              placeholder="send msg to user 2"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button className="mt-2 btn btn-primary" onClick={onSendMessage}>
              send
            </button>

            {/* <button className="mt-2 btn btn-primary" onClick={onGetMessages}>
              test
            </button> */}
          </div>
        </div>
        <div>
          <div>messages</div>
          <div className="flex flex-col items-center justify-center w-full shadow-md border-2">
            {messagesData.length &&
              messagesData.map((data) => {
                return (
                  <>
                    <div
                      className={`
                    p-1 m-2 text-xs text-gray-500 
                    ${data.address === user1Data?.address ? "hidden" : "self-start"}
                    `}>
                      {data.address}
                    </div>
                    <div
                      className={`${
                        data.address === user1Data?.address ? "self-end " : "self-start "
                      } p-1 m-1 rounded-lg bg-base-300`}>
                      {data.message}
                    </div>
                  </>
                );
              })}
          </div>
        </div>
      </div>
    </>
  );
}
