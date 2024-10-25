// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./TRAIL.sol";

contract EnhancedQuizContract is Ownable, ReentrancyGuard {
    TRAIL public immutable trailToken;
    
    struct Quiz {
        uint256 id;
        uint256 baseReward;
        uint16 passingScore;
        uint32 cooldownPeriod;
        uint32 version;
    }
    
    struct UserQuizAttempt {
        uint16 score;
        uint32 lastAttemptTime;
        uint32 attemptedVersion;
        bool completed;
    }
    
    mapping(uint256 => Quiz) public quizzes;
    mapping(address => mapping(uint256 => UserQuizAttempt)) public userAttempts;
    
    event QuizCompleted(address indexed user, uint256 indexed quizId, uint16 score, uint256 reward);
    event QuizUpdated(uint256 indexed quizId, uint32 newVersion);
    
    error QuizDoesNotExist();
    error CooldownPeriodNotOver();
    error InvalidScore();
    
    constructor(address _trailToken, address initialOwner) Ownable(initialOwner) {
        trailToken = TRAIL(_trailToken);
    }
    
    function addOrUpdateQuiz(
        uint256 _id, 
        uint256 _baseReward, 
        uint16 _passingScore, 
        uint32 _cooldownPeriod
    ) external onlyOwner {
        if (_passingScore == 0 || _passingScore > 100) revert InvalidScore();
        
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
        if (_score > 100) revert InvalidScore();
        
        Quiz storage quiz = quizzes[_quizId];
        if (quiz.id == 0) revert QuizDoesNotExist();
        
        UserQuizAttempt storage attempt = userAttempts[msg.sender][_quizId];
        if (block.timestamp < attempt.lastAttemptTime + quiz.cooldownPeriod) {
            revert CooldownPeriodNotOver();
        }
        
        attempt.score = _score;
        attempt.lastAttemptTime = uint32(block.timestamp);
        attempt.attemptedVersion = quiz.version;
        attempt.completed = true;
        
        if (_score >= quiz.passingScore) {
            uint256 reward = calculateReward(quiz, _score);
            trailToken.distributeReward(msg.sender, reward);
            emit QuizCompleted(msg.sender, _quizId, _score, reward);
        }
    }
    
    function calculateReward(Quiz memory _quiz, uint16 _score) internal pure returns (uint256) {
        // Base reward multiplied by score percentage
        return (_quiz.baseReward * _score) / 100;
    }
    
    function getUserQuizAttempt(address _user, uint256 _quizId) external view returns (
        bool completed, 
        uint16 score, 
        uint32 lastAttemptTime, 
        uint32 attemptedVersion
    ) {
        UserQuizAttempt memory attempt = userAttempts[_user][_quizId];
        return (
            attempt.completed,
            attempt.score,
            attempt.lastAttemptTime,
            attempt.attemptedVersion
        );
    }

    function getQuizDetails(uint256 _quizId) external view returns (
        uint256 id,
        uint256 baseReward,
        uint16 passingScore,
        uint32 cooldownPeriod,
        uint32 version
    ) {
        Quiz memory quiz = quizzes[_quizId];
        return (
            quiz.id,
            quiz.baseReward,
            quiz.passingScore,
            quiz.cooldownPeriod,
            quiz.version
        );
    }

    function isQuizCompleted(address _user, uint256 _quizId) external view returns (bool) {
        return userAttempts[_user][_quizId].completed;
    }
}