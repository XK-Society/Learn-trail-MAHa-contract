// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./TRAIL.sol"; // Import the TRAIL token contract

contract EnhancedQuizContract is Ownable, ReentrancyGuard {
    TRAIL public trailToken;
    
    struct Quiz {
        uint256 id;
        uint256 baseReward;
        uint16 passingScore;
        uint32 cooldownPeriod;
        uint32 version;
    }
    
    struct UserQuizAttempt {
        bool completed;
        uint16 score;
        uint32 lastAttemptTime;
        uint32 attemptedVersion;
    }
    
    mapping(uint256 => Quiz) public quizzes;
    mapping(address => mapping(uint256 => UserQuizAttempt)) public userAttempts;
    
    event QuizCompleted(address user, uint256 quizId, uint16 score, uint256 reward);
    event QuizUpdated(uint256 quizId, uint32 newVersion);
    
    constructor(address _trailToken, address initialOwner) Ownable(initialOwner) {
        trailToken = TRAIL(_trailToken);
    }
    
    function addOrUpdateQuiz(
        uint256 _id, 
        uint256 _baseReward, 
        uint16 _passingScore, 
        uint32 _cooldownPeriod
    ) external onlyOwner {
        Quiz storage quiz = quizzes[_id];
        if (quiz.id == 0) {
            quiz.id = _id;
            quiz.version = 1;
        } else {
            quiz.version++;
            emit QuizUpdated(_id, quiz.version);
        }
        quiz.baseReward = _baseReward;
        quiz.passingScore = _passingScore;
        quiz.cooldownPeriod = _cooldownPeriod;
    }
    
    function completeQuiz(uint256 _quizId, uint16 _score) external nonReentrant {
        Quiz storage quiz = quizzes[_quizId];
        require(quiz.id != 0, "Quiz does not exist");
        
        UserQuizAttempt storage attempt = userAttempts[msg.sender][_quizId];
        require(block.timestamp >= attempt.lastAttemptTime + quiz.cooldownPeriod, "Cooldown period not over");
        
        attempt.completed = true;
        attempt.score = _score;
        attempt.lastAttemptTime = uint32(block.timestamp);
        attempt.attemptedVersion = quiz.version;
        
        if (_score >= quiz.passingScore) {
            uint256 reward = calculateReward(quiz, _score);
            trailToken.distributeReward(msg.sender, reward);
            emit QuizCompleted(msg.sender, _quizId, _score, reward);
        }
    }
    
    function calculateReward(Quiz memory _quiz, uint16 _score) internal pure returns (uint256) {
        uint256 scoreFactor = uint256(_score) * 100 / uint256(_quiz.passingScore);
        return _quiz.baseReward * scoreFactor / 100;
    }
    
    function getUserQuizAttempt(address _user, uint256 _quizId) external view returns (
        bool completed, 
        uint16 score, 
        uint32 lastAttemptTime, 
        uint32 attemptedVersion
    ) {
        UserQuizAttempt memory attempt = userAttempts[_user][_quizId];
        return (attempt.completed, attempt.score, attempt.lastAttemptTime, attempt.attemptedVersion);
    }
}