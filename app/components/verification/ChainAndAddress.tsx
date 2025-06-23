import { useState, useEffect } from "react";
import { isAddress } from "@ethersproject/address";
import ChainSelect from "../ChainSelect";
import type { Chain } from "../../types/chains";

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

  useEffect(() => {
    if (!contractAddress) {
      setAddressError("");
      onValidationChange?.(false);
      return;
    }

    if (isAddress(contractAddress)) {
      setAddressError("");
      onValidationChange?.(true);
    } else {
      setAddressError("Please enter a valid Ethereum address");
      onValidationChange?.(false);
    }
  }, [contractAddress, onValidationChange]);

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContractAddress(e.target.value);
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
      </div>

      <div>
        <label htmlFor="chain" className="block text-base font-semibold text-gray-900 mb-2">
          Chain
        </label>
        <ChainSelect value={selectedChainId} handleChainIdChange={onChainIdChange} chains={chains} className="w-full" />
      </div>
    </>
  );
}
