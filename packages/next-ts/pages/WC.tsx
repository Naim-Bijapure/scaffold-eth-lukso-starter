// import { useAccount, useProvider, usePrepareSendTransaction } from "wagmi";

import { ethers } from "ethers";
import { useAccount, useConnect, useSendTransaction, usePrepareSendTransaction } from "wagmi";

export default function PocPage(): JSX.Element {
  //   const provider = useProvider();

  const { connector: activeConnector, isConnected } = useAccount();
  const { connect, connectors, error, pendingConnector } = useConnect();
  const { config } = usePrepareSendTransaction({
    request: {
      to: "0x0fAb64624733a7020D332203568754EB1a37DB89",
      value: ethers.utils.parseEther("0.003157721893117429").toString(),
      data: "0x",
    },
  });
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const { data, isLoading, isSuccess, sendTransaction } = useSendTransaction(config);
  console.log("data: ", data);

  const onWCtest: () => any = async (): Promise<any> => {
    //     const connector = data?.connector;
    //     console.log("connector: ", connector);
    const tx = {
      from: "0xbc28Ea04101F03aA7a94C1379bc3AB32E65e62d3", // Required
      to: "0x89D24A7b4cCB1b6fAA2625Fe562bDd9A23260359", // Required (for non contract deployments)
      data: "0x", // Required
      gasPrice: "0x02540be400", // Optional
      gas: "0x9c40", // Optional
      value: "0x00", // Optional
      nonce: "0x0114", // Optional
    };

    console.log("activeConnector: ", activeConnector);
    const connector = activeConnector;
    // provider.sent
    // @ts-ignore
    connector
      .sendTransaction(tx)
      .then((result) => {
        // Returns transaction id (hash)
        console.log(result);
      })
      .catch((error) => {
        // Error returned when rejected
        console.error(error);
      });
  };

  return (
    <>
      <div className="flex flex-col items-center justify-center">
        <button className="m-2 btn btn-primary" onClick={onWCtest}>
          WC test
        </button>

        <button disabled={!sendTransaction} onClick={() => sendTransaction?.()}>
          Send Transaction
        </button>
        {isLoading && <div>Check Wallet</div>}
        {isSuccess && <div>Transaction: {JSON.stringify(data)}</div>}
      </div>
    </>
  );
}
