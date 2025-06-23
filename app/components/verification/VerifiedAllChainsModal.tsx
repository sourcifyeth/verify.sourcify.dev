import React from "react";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import { Fragment } from "react";
import { IoCheckmarkDoneCircle, IoCheckmarkCircle, IoOpenOutline, IoClose } from "react-icons/io5";
import { useChains } from "../../contexts/ChainsContext";
import { getChainName } from "../../utils/chains";
import { getRepoLink } from "../../utils/verification";
import type { VerifiedContractMinimal } from "../../types/verification";

interface VerifiedAllChainsModalProps {
  isOpen: boolean;
  onClose: () => void;
  contracts: VerifiedContractMinimal[];
  address: string;
}

export default function VerifiedAllChainsModal({ isOpen, onClose, contracts, address }: VerifiedAllChainsModalProps) {
  const { chains } = useChains();

  const getMatchBadge = (matchType: string) => {
    if (matchType === "exact_match") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border bg-green-100 text-green-800 border-green-200">
          <IoCheckmarkDoneCircle className="w-4 h-4" />
          Exact Match
        </span>
      );
    } else if (matchType === "match") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border bg-green-100 text-green-800 border-green-200">
          <IoCheckmarkCircle className="w-4 h-4" />
          Match
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border bg-gray-100 text-gray-600 border-gray-200">
          <span className="w-4 h-4 text-gray-400">-</span>
          No Match
        </span>
      );
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-5xl transform overflow-hidden rounded-2xl bg-white p-8 text-left align-middle shadow-xl transition-all">
                <div className="flex justify-between items-center mb-6">
                  <DialogTitle className="text-base text-gray-900">
                    Verified Deployments for <div className="font-mono text-xl font-normal">{address}</div>
                  </DialogTitle>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 p-1 focus:outline-none focus:ring-2 focus:ring-cerulean-blue-500 rounded hover:cursor-pointer"
                  >
                    <IoClose className="w-6 h-6" />
                  </button>
                </div>

                <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-100 border-b border-gray-200">
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Chain</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Creation Match</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Runtime Match</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Verified At</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Match ID</th>
                          <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Source</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {contracts.map((contract) => (
                          <tr key={`${contract.chainId}-${contract.matchId}`} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm text-gray-900">
                              <div>
                                <div className="font-medium">{getChainName(chains, parseInt(contract.chainId))}</div>
                                <div className="text-gray-500 text-xs">Chain ID: {contract.chainId}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm">{getMatchBadge(contract.creationMatch)}</td>
                            <td className="px-6 py-4 text-sm">{getMatchBadge(contract.runtimeMatch)}</td>
                            <td className="px-6 py-4 text-sm text-gray-700">
                              {new Date(contract.verifiedAt).toISOString().split("T")[0]}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-700 font-mono">{contract.matchId}</td>
                            <td className="px-6 py-4 text-center">
                              <a
                                href={getRepoLink(contract.chainId, contract.address)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium text-white bg-cerulean-blue-500 hover:bg-cerulean-blue-600 focus:outline-none focus:ring-2 focus:ring-cerulean-blue-500 focus:ring-offset-2 transition-colors"
                              >
                                View in Repo
                                <IoOpenOutline className="w-4 h-4" />
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={onClose}
                    className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white bg-gray-500 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors hover:cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
