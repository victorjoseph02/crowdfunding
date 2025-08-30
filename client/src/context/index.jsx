// D:\crowdfunding\client\src\context\index.jsx

import React, {
  useContext,
  createContext,
  useState,
  useEffect,
  useRef,
} from "react";

import { useAddress, useMetamask, useSDK } from "@thirdweb-dev/react";
import { ethers } from "ethers";

import { contractABI } from "../constants/contractABI";

const StateContext = createContext();

export const StateContextProvider = ({ children }) => {
  const address = useAddress();
  const connect = useMetamask();
  const sdk = useSDK();

  const contractAddress = "0x9fbff9d6448e34965347d352302b5bb042a40b1f";

  const [contract, setContract] = useState(null);
  const [contractLoading, setContractLoading] = useState(true);
  const [contractError, setContractError] = useState(null);
  const [isContractReady, setIsContractReady] = useState(false);

  const hasFetchedCampaignsRef = useRef(false);

  useEffect(() => {
    const loadEthersContract = async () => {
      if (!sdk) {
        console.log("SDK not available yet.");
        setContractLoading(true);
        setContract(null);
        setIsContractReady(false);
        return;
      }

      try {
        setContractLoading(true);
        setContractError(null);

        console.log("Attempting to get provider and signer from SDK...");
        const provider = sdk.getProvider();
        const signer = sdk.getSigner();

        console.log("Signer obtained from SDK:", signer);

        console.log("Attempting to get contract via ethers.Contract...");
        const contractInstance = new ethers.Contract(
          contractAddress,
          contractABI,
          signer || provider
        );

        setContract(contractInstance);
        setContractLoading(false);

        console.log("Ethers Contract Loaded Successfully:", contractInstance);
        console.log("Ethers Contract Address:", contractInstance.address);
        console.log(
          "Ethers Contract has createCampaign function:",
          !!contractInstance.createCampaign
        );
        console.log(
          "Ethers Contract has getCampaigns function:",
          !!contractInstance.getCampaigns
        );
        console.log("Ethers Contract Signer is present:", !!signer);

        if (signer && address) {
          setIsContractReady(true);
          console.log("Contract is now READY for write operations.");
        } else {
          setIsContractReady(false);
          console.log("Contract is NOT yet ready. Missing: ", {
            signer: !signer,
            address: !address,
          });
        }
      } catch (err) {
        console.error("Error manually loading Ethers contract:", err);
        setContractError(err);
        setContractLoading(false);
        setContract(null);
        setIsContractReady(false);
      }
    };

    loadEthersContract();
  }, [sdk, contractAddress, JSON.stringify(contractABI), address]);

  useEffect(() => {
    const fetchAndLogCampaigns = async () => {
      if (
        contract &&
        !contractLoading &&
        !contractError &&
        !hasFetchedCampaignsRef.current
      ) {
        console.log("Contract is loaded, attempting to fetch campaigns...");
        const campaignsData = await getCampaigns();
        console.log(
          "Fetched Campaigns:",
          campaignsData
        );
        hasFetchedCampaignsRef.current = true;
      } else if (
        !contractLoading &&
        !contract &&
        !hasFetchedCampaignsRef.current
      ) {
        console.warn(
          "Cannot fetch campaigns yet. Contract not available or still loading."
        );
      }
    };
    fetchAndLogCampaigns();
  }, [contract, contractLoading, contractError]);

  const publishCampaign = async (form) => {
    try {
      console.log("publishCampaign called. Current address:", address);
      console.log("Contract object status (from state):", contract);
      console.log("isContractReady state:", isContractReady);

      if (!address) {
        console.error(
          "Wallet not connected. Please connect your wallet first."
        );
        await connect();
        return;
      }

      if (!isContractReady) {
        console.warn(
          "Contract instance is not yet ready for write operations. Please wait or ensure wallet is connected and on correct network."
        );
        return;
      }

      if (!contract || !contract.signer || contract.signer.isSigner === false) {
        console.error(
          "Critical: Contract or signer is missing right before transaction attempt, even though isContractReady was true. This indicates a timing issue."
        );
        return;
      }

      const parsedTarget = form.target;
      const deadlineInSeconds = Math.floor(
        new Date(form.deadline).getTime() / 1000
      );

      console.log("Arguments prepared for createCampaign:", {
        owner: address,
        title: form.title,
        description: form.description,
        target: parsedTarget.toString(),
        deadline: deadlineInSeconds,
        image: form.image,
      });

      if (deadlineInSeconds <= Math.floor(Date.now() / 1000)) {
        console.error(
          "Campaign deadline is in the past or present. Please select a future date."
        );
        throw new Error("Deadline must be in the future.");
      }

      const transaction = await contract.createCampaign(
        address,
        form.title,
        form.description,
        parsedTarget,
        deadlineInSeconds,
        form.image
      );

      console.log(
        "Transaction sent, waiting for confirmation...",
        transaction.hash
      );
      const receipt = await transaction.wait();

      console.log("contract call success", receipt);
    } catch (error) {
      console.log("contract call failure", error);
      console.error("Detailed Contract Call Error:", error);
    }
  };

  const getCampaigns = async () => {
    try {
      if (!contract) {
        console.error("Contract object not available to get campaigns.");
        return [];
      }
      const rawCampaigns = await contract.getCampaigns();

      const parsedCampaigns = rawCampaigns.map((campaign, i) => ({
        owner: campaign.owner,
        title: campaign.title,
        description: campaign.description,
        target: ethers.utils.formatEther(campaign.target.toString()),
        deadline: campaign.deadline.toNumber() * 1000,
        amountCollected: ethers.utils.formatEther(
          campaign.amountCollected.toString()
        ),
        image: campaign.image,
        donators: campaign.donators,
        donations: campaign.donations.map((donation) =>
          ethers.utils.formatEther(donation.toString())
        ),
        id: i,
      }));

      return parsedCampaigns;
    } catch (error) {
      console.error("Failed to retrieve campaigns:", error);
      return [];
    }
  };

  const getUserCampaigns = async () => {
    const allCampaigns = await getCampaigns();

    const filteredCampaigns = allCampaigns.filter(
      (campaign) => campaign.owner === address
    );

    return filteredCampaigns;
  };

  return (
    <StateContext.Provider
      value={{
        address,
        contract,
        connect,
        createCampaign: publishCampaign,
        getCampaigns,
        contractLoading,
        contractError,
        isContractReady,
        getUserCampaigns
      }}
    >
      {children}
    </StateContext.Provider>
  );
};

export const useStateContext = () => useContext(StateContext);
