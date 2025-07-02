export interface StoredVerificationJob {
  verificationId: string;
  isJobCompleted: boolean;
  jobStartTime: string;
  jobFinishTime?: string;
  submittedAt: string; // When the job was submitted from this browser
  contract?: {
    chainId: string;
    address: string;
    runtimeMatch?: "match" | "exact_match" | null;
    creationMatch?: "match" | "exact_match" | null;
    verifiedAt?: string;
    matchId?: string;
  };
}

const STORAGE_KEY = 'sourcify_verification_jobs';

export const getStoredJobs = (): StoredVerificationJob[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading stored jobs:', error);
    return [];
  }
};

export const saveJob = (job: StoredVerificationJob): void => {
  try {
    const jobs = getStoredJobs();
    const existingIndex = jobs.findIndex(j => j.verificationId === job.verificationId);
    
    if (existingIndex >= 0) {
      jobs[existingIndex] = job;
    } else {
      jobs.unshift(job); // Add to beginning for reverse chronological order
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
  } catch (error) {
    console.error('Error saving job:', error);
  }
};

export const updateJobStatus = (verificationId: string, jobData: any): void => {
  try {
    const jobs = getStoredJobs();
    const jobIndex = jobs.findIndex(j => j.verificationId === verificationId);
    
    if (jobIndex >= 0) {
      jobs[jobIndex] = {
        ...jobs[jobIndex],
        isJobCompleted: jobData.isJobCompleted,
        jobFinishTime: jobData.jobFinishTime,
        contract: jobData.contract ? {
          chainId: jobData.contract.chainId,
          address: jobData.contract.address,
          runtimeMatch: jobData.contract.runtimeMatch,
          creationMatch: jobData.contract.creationMatch,
          verifiedAt: jobData.contract.verifiedAt,
          matchId: jobData.contract.matchId,
        } : undefined,
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
    }
  } catch (error) {
    console.error('Error updating job status:', error);
  }
};

export const getPendingJobs = (): StoredVerificationJob[] => {
  return getStoredJobs().filter(job => !job.isJobCompleted);
};

export const getRecentJobs = (limit: number = 5): StoredVerificationJob[] => {
  return getStoredJobs()
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
    .slice(0, limit);
};

export const clearAllJobs = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing all jobs:', error);
  }
};

