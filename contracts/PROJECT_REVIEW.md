# Smart Contract Review — `GameLeaderboard.sol`

## TL;DR

This contract is clean and easy to understand, and it’s great for a demo leaderboard.

If you’re aiming for a real competitive leaderboard, though, the current design is too easy to cheat and too easy to spam, and some choices (like sorting + storing game names on-chain) will get expensive over time.

## What I reviewed

- `contracts/GameLeaderboard.sol`

## What’s good

- Simple API: `submitScore`, `getTopScores`, `getPlayerRank`, `getPlayerBestScore` are straightforward.
- Safe-by-default math: Solidity `^0.8` has built-in overflow checks.
- Bounded list: `MAX_TOP_SCORES = 100` keeps `topScores` from growing forever.

## Key issues / risks (prioritized)

### Critical (design / integrity)

- No score verification (anyone can submit any score)  
  Right now a user can just submit `999999999` and “win”. If that’s the intent (demo), cool. If not, you’ll need a verification story, for example:
  - a server signs score claims (common + practical),
  - an attestation/oracle model,
  - ZK / verifiable computation (powerful, more complex),
  - or the game logic itself lives on-chain and produces the score.

### High (gas / DoS / data correctness)

- On-chain storage of unbounded `string gameName`  
  Every submission stores a dynamic string in contract storage. Someone can spam large game names and make state (and costs) grow.
  - Recommendation: store a compact identifier on-chain (`bytes32 gameId` / `uint64 gameId`) and keep the display name off-chain.

- Bubble sort on every qualifying insert is O(n²)  
  `_sortTopScores()` does a nested-loop sort. With 100 entries it’s “fine-ish”, but it’s still wasted gas and makes `submitScore` more expensive than necessary.
  - Recommendation: insert the new item in the correct spot (O(n)) since only one element changes; or use a heap/indexed approach if you want to go further.

- Duplicate entries per player in `topScores`  
  A player can appear multiple times in the top list. That leads to weird outcomes:
  - `getPlayerRank()` returns the first match (not necessarily “best” or “latest”).
  - one wallet can crowd out the leaderboard with multiple entries.
  - Recommendation: enforce one entry per player in `topScores` (e.g., `mapping(address => uint256 indexPlusOne)` so you can update in place).

### Medium (functionality / maintenance)

- `LeaderboardUpdated` event is declared but never emitted  
  Only `ScoreSubmitted` is emitted today.
  - Recommendation: emit `LeaderboardUpdated(player, rank)` whenever the top list changes (optionally only when the rank actually changes).

- `resetLeaderboard()` does not reset `playerBestScores`  
  `resetLeaderboard()` clears `topScores`, but `playerBestScores` keeps old values forever. That might be what you want, but it’s worth calling out because it can surprise people.
  - Recommendation: if you want “seasons”, use a `seasonId` approach (scores keyed by season) instead of trying to clear mappings.

- Owner pattern is minimal  
  There is no ownership transfer or renounce pattern.
  - Recommendation: use OpenZeppelin `Ownable` (or implement `transferOwnership` + events).



