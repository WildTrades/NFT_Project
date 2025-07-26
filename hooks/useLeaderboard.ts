import { useMemo, useState, useEffect } from 'react';
import { Address, useContractRead, useNetwork, usePublicClient, useWalletClient } from 'wagmi';
import { useContract } from './useContract';
import { leaderboardABI } from '../abis';
import { LEADERBOARD_ADDRESS } from '../constants/addresses';
import { useWaitForTransaction } from 'wagmi';

export interface ScoreEntry {
  player: Address;
  score: bigint;
  timestamp: bigint;
  gameName: string;
}

export function useLeaderboardContract() {
  return useContract(LEADERBOARD_ADDRESS, leaderboardABI);
}

export function useTopScores(count: number = 10) {
  const contract = useLeaderboardContract();
  const { data, isLoading, error, refetch } = useContractRead({
    address: LEADERBOARD_ADDRESS,
    abi: leaderboardABI,
    functionName: 'getTopScores',
    args: [BigInt(count)],
    enabled: !!contract,
  });

  const scores = useMemo(() => {
    if (!data) return [];
    return data as ScoreEntry[];
  }, [data]);

  return {
    scores,
    isLoading,
    error,
    refetch,
  };
}

export function usePlayerBestScore(playerAddress?: Address) {
  const { data, isLoading, error, refetch } = useContractRead({
    address: LEADERBOARD_ADDRESS,
    abi: leaderboardABI,
    functionName: 'getPlayerBestScore',
    args: playerAddress ? [playerAddress] : undefined,
    enabled: !!playerAddress,
  });

  return {
    bestScore: data as bigint | undefined,
    isLoading,
    error,
    refetch,
  };
}

export function usePlayerRank(playerAddress?: Address) {
  const { data, isLoading, error, refetch } = useContractRead({
    address: LEADERBOARD_ADDRESS,
    abi: leaderboardABI,
    functionName: 'getPlayerRank',
    args: playerAddress ? [playerAddress] : undefined,
    enabled: !!playerAddress,
  });

  return {
    rank: data !== undefined ? Number(data) : undefined,
    isLoading,
    error,
    refetch,
  };
}

export function useTopScoresCount() {
  const { data, isLoading, error } = useContractRead({
    address: LEADERBOARD_ADDRESS,
    abi: leaderboardABI,
    functionName: 'getTopScoresCount',
  });

  return {
    count: data !== undefined ? Number(data) : 0,
    isLoading,
    error,
  };
}

export function useSubmitScore() {
  const contract = useLeaderboardContract();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hash, setHash] = useState<`0x${string}` | undefined>(undefined);

  const { isLoading: isWaiting, isSuccess } = useWaitForTransaction({
    hash,
    enabled: !!hash,
  });

  const submitScore = async (score: number, gameName: string) => {
    if (!contract) {
      setError(new Error('Contract not available'));
      return;
    }

    setIsLoading(true);
    setError(null);
    setHash(undefined);

    try {
      // @ts-ignore
      const txHash = await contract.write.submitScore([BigInt(score), gameName]);
      setHash(txHash as `0x${string}`);
    } catch (err: any) {
      setError(err);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isSuccess) {
      setIsLoading(false);
    }
  }, [isSuccess]);

  return {
    submitScore,
    isLoading: isLoading || isWaiting,
    isSuccess,
    error,
    hash,
  };
}

