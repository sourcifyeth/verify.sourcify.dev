// Web Worker for bytecode diff calculation
importScripts('https://unpkg.com/diff@5.1.0/dist/diff.min.js');

// The diff library is available as global Diff or JsDiff
const diffLib = self.Diff || self.JsDiff;

function compareBytecodeDiff(onchain, recompiled, diffMode = "chars") {
  let diff;

  if (diffMode === "bytes") {
    // Convert to byte arrays - each byte is 2 hex characters
    const onchainBytes = [];
    for (let i = 0; i < onchain.length; i += 2) {
      onchainBytes.push(onchain.slice(i, i + 2));
    }

    const recompiledBytes = [];
    for (let i = 0; i < recompiled.length; i += 2) {
      recompiledBytes.push(recompiled.slice(i, i + 2));
    }

    // Diff the byte arrays
    const byteDiff = diffLib.diffArrays(onchainBytes, recompiledBytes);

    // Convert back to string format
    diff = byteDiff.map((part) => ({
      ...part,
      value: part.value.join(""),
    }));
  } else {
    // Character comparison
    diff = diffLib.diffChars(onchain, recompiled);
  }

  let addedCount = 0;
  let removedCount = 0;
  let hasChanges = false;

  const segments = diff.map((part) => {
    if (part.added) {
      addedCount += part.value.length;
      hasChanges = true;
    } else if (part.removed) {
      removedCount += part.value.length;
      hasChanges = true;
    }

    return {
      value: part.value,
      added: part.added,
      removed: part.removed,
    };
  });

  return {
    segments,
    hasChanges,
    addedCount,
    removedCount,
  };
}

self.onmessage = function(e) {
  const { onchain, recompiled, diffMode, id } = e.data;
  
  try {
    const result = compareBytecodeDiff(onchain, recompiled, diffMode);
    self.postMessage({ result, id });
  } catch (error) {
    self.postMessage({ error: error.message, id });
  }
};