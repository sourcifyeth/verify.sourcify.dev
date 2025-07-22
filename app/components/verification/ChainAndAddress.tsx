import { useState, useEffect } from "react";
import { isAddress } from "ethers";
import ChainSelect from "../ChainSelect";
import VerifiedAllChainsModal from "./VerifiedAllChainsModal";
import { fetchVerifiedAllChains, fetchVerifiedContract, getRepoLink, shortenAddress } from "../../utils/verification";
import type { Chain } from "../../types/chains";
import type { VerifiedContractMinimal } from "../../types/verification";
import { getChainName } from "~/utils/chains";
import { IoCheckmarkCircle, IoOpenOutline } from "react-icons/io5";
import MatchBadge from "./MatchBadge";
import { useServerConfig } from "../../contexts/ServerConfigContext";

interface ChainAndAddressProps {
  selectedChainId: string;
  contractAddress: string;
  onChainIdChange: (value: string) => void;
  onContractAddressChange: (value: string) => void;
  chains: Chain[];
  onValidationChange?: (isValid: boolean) => void;
}

export default function ChainAndAddress({
  selectedChainId,
  contractAddress,
  onChainIdChange,
  onContractAddressChange,
  chains,
  onValidationChange,
}: ChainAndAddressProps) {
  const { serverUrl } = useServerConfig();
  const [addressError, setAddressError] = useState("");
  const [verifiedContracts, setVerifiedContracts] = useState<VerifiedContractMinimal[]>([]);
  const [currentChainContract, setCurrentChainContract] = useState<VerifiedContractMinimal | null>(null);
  const [isLoadingAllChains, setIsLoadingAllChains] = useState(false);
  const [isLoadingCurrentChain, setIsLoadingCurrentChain] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleFetchAllChains = async (address: string) => {
    setIsLoadingAllChains(true);
    try {
      const contracts = await fetchVerifiedAllChains(serverUrl, address);
      setVerifiedContracts(contracts);
    } catch (error) {
      console.error("Error fetching all chains verification data:", error);
      setVerifiedContracts([]);
    } finally {
      setIsLoadingAllChains(false);
    }
  };

  const handleFetchCurrentChain = async (address: string, chainId: string) => {
    if (!chainId) return;

    setIsLoadingCurrentChain(true);
    try {
      const contract = await fetchVerifiedContract(serverUrl, chainId, address);
      setCurrentChainContract(contract);
    } catch (error) {
      console.error("Error fetching current chain verification data:", error);
      setCurrentChainContract(null);
    } finally {
      setIsLoadingCurrentChain(false);
    }
  };

  const handleFetchVerificationData = async (address: string, chainId: string) => {
    // Start both requests independently
    handleFetchAllChains(address);
    handleFetchCurrentChain(address, chainId);
  };

  useEffect(() => {
    if (!contractAddress) {
      setAddressError("");
      setVerifiedContracts([]);
      setCurrentChainContract(null);
      onValidationChange?.(false);
      return;
    }

    if (isAddress(contractAddress)) {
      setAddressError("");
      onValidationChange?.(true);
      // Fetch verification data for this address
      handleFetchVerificationData(contractAddress, selectedChainId);
    } else {
      setAddressError("Please enter a valid Ethereum address");
      setVerifiedContracts([]);
      setCurrentChainContract(null);
      onValidationChange?.(false);
    }
  }, [contractAddress, selectedChainId, serverUrl, onValidationChange]);

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onContractAddressChange(e.target.value);
  };

  const getChainNames = (contracts: VerifiedContractMinimal[]) => {
    return contracts
      .map((contract) => getChainName(chains, parseInt(contract.chainId)))
      .slice(0, 3) // Show max 3 chain names
      .join(", ");
  };

  const currentChainName = getChainName(chains, parseInt(selectedChainId));

  return (
    <>
      <div>
        <label htmlFor="chain" className="block text-base font-semibold text-gray-900 mb-2">
          Chain
        </label>
        <ChainSelect value={selectedChainId} handleChainIdChange={onChainIdChange} chains={chains} className="w-full" />
      </div>

      <div>
        <label htmlFor="contractAddress" className="block text-base font-semibold text-gray-900 mb-2">
          Contract Address
        </label>
        <input
          type="text"
          id="contractAddress"
          name="contractAddress"
          value={contractAddress}
          onChange={handleAddressChange}
          placeholder="0x..."
          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cerulean-blue-500 focus:border-cerulean-blue-500 ${
            addressError ? "border-red-500" : "border-gray-300"
          }`}
        />
        {addressError && <p className="mt-1 text-sm text-red-600">{addressError}</p>}

        {/* Show loading state for current chain */}
        {isLoadingCurrentChain && (
          <p className="mt-1 text-sm text-gray-500">Checking verification status on {currentChainName}...</p>
        )}

        {/* Show current chain verification status */}
        {!isLoadingCurrentChain && contractAddress && isAddress(contractAddress) && selectedChainId && (
          <div className="mt-2">
            {currentChainContract ? (
              <div className="p-2 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center gap-2">
                  <MatchBadge match={currentChainContract.match as "match" | "exact_match" | null} small />
                  <p className="text-sm text-green-800">
                    <span className="font-medium">{shortenAddress(contractAddress)}</span> is already verified on{" "}
                    <span className="font-medium">{currentChainName}</span>{" "}
                    <span>({currentChainContract.chainId})</span>
                    <a
                      href={getRepoLink(currentChainContract.chainId, currentChainContract.address)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-sm text-green-600 hover:text-green-800 font-medium underline"
                    >
                      <IoOpenOutline className="w-4 h-4 inline mr-0.5 mb-0.5" />
                      View Contract
                    </a>
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-1 text-sm text-gray-500">
                {shortenAddress(contractAddress)} not verified yet on {currentChainName} ({selectedChainId})
              </p>
            )}
          </div>
        )}

        {/* Show loading state for all chains */}
        {isLoadingAllChains ? (
          <p className="mt-1 text-sm text-gray-500">Checking verification status on other chains...</p>
        ) : verifiedContracts.length > 0 ? (
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center gap-2">
              <IoCheckmarkCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <p className="text-sm text-blue-800">
                <span className="font-medium">All chains: {shortenAddress(contractAddress)}</span> is verified on{" "}
                <span className="font-medium">{verifiedContracts.length}</span> chain
                {verifiedContracts.length > 1 ? "s" : ""}: <span className="">{getChainNames(verifiedContracts)}</span>
                {verifiedContracts.length > 3 && " and more..."}{" "}
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium underline"
                >
                  See all
                </button>
              </p>
            </div>
          </div>
        ) : (
          isAddress(contractAddress) && (
            <p className="mt-1 text-sm text-gray-500">
              {shortenAddress(contractAddress)} not verified yet on any other chain
            </p>
          )
        )}
      </div>

      <VerifiedAllChainsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        contracts={verifiedContracts}
        address={contractAddress}
      />
    </>
  );
}
