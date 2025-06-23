import { useState, useEffect } from "react";
import { isAddress } from "@ethersproject/address";
import ChainSelect from "../ChainSelect";
import VerifiedAllChainsModal from "./VerifiedAllChainsModal";
import { fetchVerifiedAllChains, shortenAddress } from "../../utils/verification";
import type { Chain } from "../../types/chains";
import type { VerifiedContractMinimal } from "../../types/verification";
import { getChainName } from "~/utils/chains";
import { IoCheckmarkCircle } from "react-icons/io5";

interface ChainAndAddressProps {
  selectedChainId: string;
  onChainIdChange: (value: string) => void;
  chains: Chain[];
  onValidationChange?: (isValid: boolean) => void;
}

export default function ChainAndAddress({
  selectedChainId,
  onChainIdChange,
  chains,
  onValidationChange,
}: ChainAndAddressProps) {
  const [contractAddress, setContractAddress] = useState("");
  const [addressError, setAddressError] = useState("");
  const [verifiedContracts, setVerifiedContracts] = useState<VerifiedContractMinimal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleFetchVerifiedAllChains = async (address: string) => {
    setIsLoading(true);
    try {
      const contracts = await fetchVerifiedAllChains(address);
      setVerifiedContracts(contracts);
    } catch (error) {
      console.error("Error fetching verified contracts:", error);
      setVerifiedContracts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!contractAddress) {
      setAddressError("");
      setVerifiedContracts([]);
      onValidationChange?.(false);
      return;
    }

    if (isAddress(contractAddress)) {
      setAddressError("");
      onValidationChange?.(true);
      // Fetch verified contracts for this address
      handleFetchVerifiedAllChains(contractAddress);
    } else {
      setAddressError("Please enter a valid Ethereum address");
      setVerifiedContracts([]);
      onValidationChange?.(false);
    }
  }, [contractAddress, onValidationChange]);

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContractAddress(e.target.value);
  };

  const getChainNames = (contracts: VerifiedContractMinimal[]) => {
    return contracts
      .map((contract) => getChainName(chains, parseInt(contract.chainId)))
      .slice(0, 3) // Show max 3 chain names
      .join(", ");
  };

  return (
    <>
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

        {isLoading && <p className="mt-1 text-sm text-gray-500">Checking for existing verifications...</p>}

        {verifiedContracts.length > 0 && !isLoading && (
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center gap-2">
              <IoCheckmarkCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-800">
                <span className="font-medium">{shortenAddress(contractAddress)}</span> is already verified on{" "}
                <span className="font-medium">{verifiedContracts.length}</span> chain
                {verifiedContracts.length > 1 ? "s" : ""}: <span className="">{getChainNames(verifiedContracts)}</span>
                {verifiedContracts.length > 3 && " and more..."}{" "}
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium underline hover:cursor-pointer"
                >
                  See more details
                </button>
              </p>
            </div>
          </div>
        )}
      </div>

      <div>
        <label htmlFor="chain" className="block text-base font-semibold text-gray-900 mb-2">
          Chain
        </label>
        <ChainSelect value={selectedChainId} handleChainIdChange={onChainIdChange} chains={chains} className="w-full" />
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
