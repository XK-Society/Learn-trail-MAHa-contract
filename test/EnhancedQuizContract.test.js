const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EnhancedQuizContract", function () {
  let TRAIL;
  let trail;
  let EnhancedQuizContract;
  let quizContract;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    TRAIL = await ethers.getContractFactory("TRAIL");
    trail = await TRAIL.deploy(owner.address);
    await trail.waitForDeployment();

    EnhancedQuizContract = await ethers.getContractFactory("EnhancedQuizContract");
    quizContract = await EnhancedQuizContract.deploy(await trail.getAddress(), owner.address);
    await quizContract.waitForDeployment();

    // Add quiz contract as a reward distributor
    await trail.addRewardDistributor(await quizContract.getAddress());
  });

  it("Should set the correct owner", async function () {
    expect(await quizContract.owner()).to.equal(owner.address);
  });

  it("Should allow owner to add a quiz", async function () {
    await quizContract.addOrUpdateQuiz(1, 100, 70, 3600);
    const quiz = await quizContract.quizzes(1);
    expect(quiz.baseReward).to.equal(100);
    expect(quiz.passingScore).to.equal(70);
    expect(quiz.cooldownPeriod).to.equal(3600);
  });

  it("Should allow users to complete a quiz and receive rewards", async function () {
    await quizContract.addOrUpdateQuiz(1, 100, 70, 0); // No cooldown for testing
    await quizContract.connect(addr1).completeQuiz(1, 80);
    
    const attempt = await quizContract.getUserQuizAttempt(addr1.address, 1);
    expect(attempt.completed).to.be.true;
    expect(attempt.score).to.equal(80);

    // Check if reward was distributed
    expect(await trail.balanceOf(addr1.address)).to.be.above(0);
  });

  it("Should not allow quiz completion during cooldown period", async function () {
    await quizContract.addOrUpdateQuiz(1, 100, 70, 3600); // 1 hour cooldown
    await quizContract.connect(addr1).completeQuiz(1, 80);
    
    await expect(quizContract.connect(addr1).completeQuiz(1, 90))
      .to.be.revertedWith("Cooldown period not over");
  });

  it("Should update quiz version when modified", async function () {
    await quizContract.addOrUpdateQuiz(1, 100, 70, 3600);
    await quizContract.addOrUpdateQuiz(1, 150, 75, 7200);
    
    const quiz = await quizContract.quizzes(1);
    expect(quiz.version).to.equal(2);
    expect(quiz.baseReward).to.equal(150);
    expect(quiz.passingScore).to.equal(75);
    expect(quiz.cooldownPeriod).to.equal(7200);
  });

  it("Should not allow non-owners to add or update quizzes", async function () {
  await expect(quizContract.connect(addr1).addOrUpdateQuiz(1, 100, 70, 3600))
    .to.be.revertedWithCustomError(quizContract, "OwnableUnauthorizedAccount")
    .withArgs(addr1.address);
});

  it("Should not allow completion of non-existent quizzes", async function () {
    await expect(quizContract.connect(addr1).completeQuiz(999, 80))
      .to.be.revertedWith("Quiz does not exist");
  });

  it("Should not reward users for failing quizzes", async function () {
    await quizContract.addOrUpdateQuiz(1, 100, 70, 0);
    await quizContract.connect(addr1).completeQuiz(1, 60); // Failing score
    expect(await trail.balanceOf(addr1.address)).to.equal(0);
  });

  it("Should reward users for exactly passing quizzes", async function () {
  await quizContract.addOrUpdateQuiz(1, 100, 70, 0);
  await quizContract.connect(addr1).completeQuiz(1, 70); // Exactly passing score
  expect(await trail.balanceOf(addr1.address)).to.be.above(0);
});
});