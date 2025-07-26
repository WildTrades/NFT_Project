import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { toast } from 'react-toastify';
import Button from '../button';
import Message from '../message';
import { useTopScores, useSubmitScore, usePlayerBestScore, usePlayerRank } from '@/hooks/useLeaderboard';
import { shortenAddress, getEtherscanLink } from '@/utils';
import classNames from 'classnames';

export default function Leaderboard() {
  const { address, isConnected } = useAccount();
  const [score, setScore] = useState<string>('');
  const [gameName, setGameName] = useState<string>('');
  const { scores, isLoading: scoresLoading, refetch } = useTopScores(20);
  const { bestScore, refetch: refetchBestScore } = usePlayerBestScore(address);
  const { rank, refetch: refetchRank } = usePlayerRank(address);
  const { submitScore, isLoading: isSubmitting, isSuccess, error, hash } = useSubmitScore();

  useEffect(() => {
    if (isSuccess && hash) {
      toast.success(
        <Message
          title="Score Submitted!"
          message={
            <div>
              <p>Your score has been recorded on-chain</p>
              <p>
                <a className="text-blue" target="_blank" href={getEtherscanLink(hash, 'transaction')}>
                  View on Etherscan
                </a>
              </p>
            </div>
          }
        />
      );
      setScore('');
      setGameName('');
      refetch();
      refetchBestScore();
      refetchRank();
    }
  }, [isSuccess, hash, refetch, refetchBestScore, refetchRank]);

  useEffect(() => {
    if (error) {
      toast.error(<Message title="Submission Failed" message={error.message || 'Failed to submit score'} />);
    }
  }, [error]);

  const handleSubmit = async () => {
    if (!isConnected) {
      toast.error(<Message title="Wallet Not Connected" message="Please connect your wallet to submit a score" />);
      return;
    }

    const scoreNum = parseInt(score);
    if (isNaN(scoreNum) || scoreNum <= 0) {
      toast.error(<Message title="Invalid Score" message="Please enter a valid score greater than 0" />);
      return;
    }

    if (!gameName.trim()) {
      toast.error(<Message title="Game Name Required" message="Please enter a game name" />);
      return;
    }

    await submitScore(scoreNum, gameName.trim());
  };

  const getRankEmoji = (rank: number) => {
    if (rank === 0) return '🥇';
    if (rank === 1) return '🥈';
    if (rank === 2) return '🥉';
    return `#${rank + 1}`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-4xl font-bold">Game Leaderboard</h1>
        <p className="text-gray-400">Compete for the top spots on the blockchain!</p>
      </div>

      {/* Submit Score Section */}
      <div className="mb-8 rounded-lg border border-white/10 bg-white/5 p-6 backdrop-blur">
        <h2 className="mb-4 text-2xl font-semibold">Submit Your Score</h2>
        {!isConnected && (
          <p className="mb-4 text-sm text-orange">Please connect your wallet to submit a score</p>
        )}
        {isConnected && (
          <div className="mb-4">
            <p className="text-sm text-gray-400">
              Your Best Score: <span className="font-semibold text-white">{bestScore?.toString() || '0'}</span>
            </p>
            {rank !== undefined && rank < 100 && (
              <p className="text-sm text-gray-400">
                Your Rank: <span className="font-semibold text-white">#{rank + 1}</span>
              </p>
            )}
          </div>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium">Game Name</label>
            <input
              type="text"
              value={gameName}
              onChange={(e) => setGameName(e.target.value)}
              placeholder="Enter game name"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
              disabled={!isConnected || isSubmitting}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Score</label>
            <input
              type="number"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              placeholder="Enter your score"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
              disabled={!isConnected || isSubmitting}
              min="1"
            />
          </div>
        </div>
        <div className="mt-4">
          <Button
            onClick={handleSubmit}
            disabled={!isConnected || isSubmitting || !score || !gameName}
            loading={isSubmitting}
            type="gradient"
            size="large"
            className="w-full md:w-auto"
          >
            Submit Score
          </Button>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="rounded-lg border border-white/10 bg-white/5 p-6 backdrop-blur">
        <h2 className="mb-6 text-2xl font-semibold">Top Scores</h2>
        {scoresLoading ? (
          <div className="py-8 text-center text-gray-400">Loading leaderboard...</div>
        ) : scores.length === 0 ? (
          <div className="py-8 text-center text-gray-400">No scores yet. Be the first to submit!</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-4 py-3 text-left text-sm font-semibold">Rank</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Player</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Game</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Score</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {scores.map((entry, index) => {
                  const isCurrentUser = address && entry.player.toLowerCase() === address.toLowerCase();
                  const date = new Date(Number(entry.timestamp) * 1000);
                  return (
                    <tr
                      key={`${entry.player}-${index}`}
                      className={classNames('border-b border-white/5 hover:bg-white/5', {
                        'bg-blue-500/10': isCurrentUser,
                      })}
                    >
                      <td className="px-4 py-3 text-lg font-bold">{getRankEmoji(index)}</td>
                      <td className="px-4 py-3">
                        <a
                          href={getEtherscanLink(entry.player, 'address')}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue hover:underline"
                        >
                          {shortenAddress(entry.player)}
                          {isCurrentUser && <span className="ml-2 text-xs">(You)</span>}
                        </a>
                      </td>
                      <td className="px-4 py-3">{entry.gameName}</td>
                      <td className="px-4 py-3 text-right font-semibold">{entry.score.toString()}</td>
                      <td className="px-4 py-3 text-sm text-gray-400">
                        {date.toLocaleDateString()} {date.toLocaleTimeString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

