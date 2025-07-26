// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title GameLeaderboard
 * @dev A simple on-chain leaderboard contract for game scores
 * Players can submit scores and view top players
 */
contract GameLeaderboard {
    struct ScoreEntry {
        address player;
        uint256 score;
        uint256 timestamp;
        string gameName;
    }

    // Mapping from player address to their best score
    mapping(address => uint256) public playerBestScores;
    
    // Array of top scores (sorted by score descending)
    ScoreEntry[] public topScores;
    
    // Maximum number of top scores to keep
    uint256 public constant MAX_TOP_SCORES = 100;
    
    // Owner address
    address public owner;
    
    // Events
    event ScoreSubmitted(address indexed player, uint256 score, string gameName, uint256 timestamp);
    event LeaderboardUpdated(address indexed player, uint256 newRank);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    /**
     * @dev Submit a new score
     * @param score The score achieved
     * @param gameName Name of the game
     */
    function submitScore(uint256 score, string memory gameName) external {
        require(score > 0, "Score must be greater than 0");
        require(bytes(gameName).length > 0, "Game name cannot be empty");
        
        address player = msg.sender;
        
        // Update player's best score if this is higher
        if (score > playerBestScores[player]) {
            playerBestScores[player] = score;
        }
        
        // Add to top scores if it qualifies
        _addToTopScores(player, score, gameName);
        
        emit ScoreSubmitted(player, score, gameName, block.timestamp);
    }
    
    /**
     * @dev Internal function to add score to top scores list
     */
    function _addToTopScores(address player, uint256 score, string memory gameName) internal {
        ScoreEntry memory newEntry = ScoreEntry({
            player: player,
            score: score,
            timestamp: block.timestamp,
            gameName: gameName
        });
        
        // If list is not full, just add it
        if (topScores.length < MAX_TOP_SCORES) {
            topScores.push(newEntry);
            _sortTopScores();
            return;
        }
        
        // If list is full, check if score qualifies
        if (score > topScores[topScores.length - 1].score) {
            // Replace the lowest score
            topScores[topScores.length - 1] = newEntry;
            _sortTopScores();
        }
    }
    
    /**
     * @dev Sort top scores in descending order (bubble sort for simplicity)
     */
    function _sortTopScores() internal {
        uint256 n = topScores.length;
        for (uint256 i = 0; i < n - 1; i++) {
            for (uint256 j = 0; j < n - i - 1; j++) {
                if (topScores[j].score < topScores[j + 1].score) {
                    ScoreEntry memory temp = topScores[j];
                    topScores[j] = topScores[j + 1];
                    topScores[j + 1] = temp;
                }
            }
        }
    }
    
    /**
     * @dev Get top N scores
     * @param count Number of top scores to retrieve
     * @return Array of ScoreEntry structs
     */
    function getTopScores(uint256 count) external view returns (ScoreEntry[] memory) {
        uint256 length = topScores.length < count ? topScores.length : count;
        ScoreEntry[] memory result = new ScoreEntry[](length);
        
        for (uint256 i = 0; i < length; i++) {
            result[i] = topScores[i];
        }
        
        return result;
    }
    
    /**
     * @dev Get total number of top scores
     */
    function getTopScoresCount() external view returns (uint256) {
        return topScores.length;
    }
    
    /**
     * @dev Get player's rank (0-indexed, returns MAX_TOP_SCORES if not in top list)
     */
    function getPlayerRank(address player) external view returns (uint256) {
        for (uint256 i = 0; i < topScores.length; i++) {
            if (topScores[i].player == player) {
                return i;
            }
        }
        return MAX_TOP_SCORES;
    }
    
    /**
     * @dev Get player's best score
     */
    function getPlayerBestScore(address player) external view returns (uint256) {
        return playerBestScores[player];
    }
    
    /**
     * @dev Owner function to reset leaderboard (for testing/maintenance)
     */
    function resetLeaderboard() external onlyOwner {
        delete topScores;
    }
}

