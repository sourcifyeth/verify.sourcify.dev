import ChainSelect from "../ChainSelect";
import type { Chain } from "../../types/chains";

interface VerificationFormProps {
  selectedChainId: string;
  onChainIdChange: (value: string) => void;
  chains: Chain[];
}

export default function VerificationForm({ selectedChainId, onChainIdChange, chains }: VerificationFormProps) {
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
          placeholder="0x..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cerulean-blue-500 focus:border-cerulean-blue-500"
        />
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
