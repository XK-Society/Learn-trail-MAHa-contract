const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("TRAIL Token - Additional Tests", function () {
  let TRAIL;
  let trail;
  let owner;
  let addr1;
  let addr2;
  let spender;

  beforeEach(async function () {
    TRAIL = await ethers.getContractFactory("TRAIL");
    [owner, addr1, addr2, spender] = await ethers.getSigners();
    trail = await TRAIL.deploy(owner.address);
    await trail.waitForDeployment();
  });

  it("Should not allow non-owners to mint tokens", async function () {
    await expect(trail.connect(addr1).mint(addr2.address, 100))
      .to.be.revertedWithCustomError(trail, "OwnableUnauthorizedAccount")
      .withArgs(addr1.address);
  });

  it("Should allow locking and unlocking of tokens", async function () {
    await trail.mint(addr1.address, 100);
    const lockTime = Math.floor(Date.now() / 1000) + 3600; // Lock for 1 hour
    await trail.lockTokens(addr1.address, lockTime);
    await expect(trail.connect(addr1).transfer(addr2.address, 50))
      .to.be.revertedWith("Tokens are locked");
    
    // Fast forward time
    await ethers.provider.send("evm_increaseTime", [3601]);
    await ethers.provider.send("evm_mine");

    await expect(trail.connect(addr1).transfer(addr2.address, 50))
      .to.not.be.reverted;
  });

  it("Should allow adding and removing reward distributors", async function () {
    await trail.addRewardDistributor(addr1.address);
    expect(await trail.rewardDistributors(addr1.address)).to.be.true;

    await trail.removeRewardDistributor(addr1.address);
    expect(await trail.rewardDistributors(addr1.address)).to.be.false;
  });

  it("Should allow reward distributors to distribute rewards", async function () {
    await trail.addRewardDistributor(addr1.address);
    await trail.connect(addr1).distributeReward(addr2.address, 100);
    expect(await trail.balanceOf(addr2.address)).to.equal(100);
  });

  it("Should not allow non-distributors to distribute rewards", async function () {
    await expect(trail.connect(addr1).distributeReward(addr2.address, 100))
      .to.be.revertedWith("Not authorized to distribute rewards");
  });

  it("Should return correct nonces", async function() {
  const nonceBefore = await trail.nonces(owner.address);

  const name = await trail.name();
  const version = "1"; // Assuming version is "1", adjust if different
  const chainId = await ethers.provider.getNetwork().then(network => network.chainId);
  const verifyingContract = await trail.getAddress();

  const domain = {
    name: name,
    version: version,
    chainId: chainId,
    verifyingContract: verifyingContract
  };

  const types = {
    Permit: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "deadline", type: "uint256" }
    ]
  };

  const value = ethers.parseEther("100");
  
  // Get the latest block
  const latestBlock = await ethers.provider.getBlock('latest');
  const currentTimestamp = latestBlock.timestamp;
  
  // Set deadline to be 1 hour from the current block timestamp
  const deadline = currentTimestamp + 60 * 60;

  const message = {
    owner: owner.address,
    spender: spender.address,
    value: value,
    nonce: nonceBefore,
    deadline: deadline
  };

  const signature = await owner.signTypedData(domain, types, message);
  const sig = ethers.Signature.from(signature);

  // Increase time by 1 minute to ensure we're after the current block but before the deadline
  await ethers.provider.send("evm_increaseTime", [60]);
  await ethers.provider.send("evm_mine");

  await trail.permit(
    owner.address,
    spender.address,
    value,
    deadline,
    sig.v,
    sig.r,
    sig.s
  );

  const nonceAfter = await trail.nonces(owner.address);
  expect(nonceAfter).to.equal(nonceBefore + 1n);
});

  it("Should update votes when transferring tokens", async function() {
    await trail.delegate(owner.address);
    const initialSupply = await trail.totalSupply();
    await trail.transfer(addr1.address, 100);
    const votes = await trail.getVotes(owner.address);
    expect(votes).to.equal(initialSupply - 100n);
  });

  it("Should return correct nonces directly", async function() {
  const nonce = await trail.nonces(owner.address);
  expect(nonce).to.equal(0);
});



it("Should not allow transferring tokens when locked", async function() {
  await trail.mint(addr1.address, 100);
  console.log("Initial balance of addr1:", (await trail.balanceOf(addr1.address)).toString());
  console.log("Initial balance of addr2:", (await trail.balanceOf(addr2.address)).toString());

  const lockDuration = 3600; // 1 hour in seconds
  const lockTime = (await time.latest()) + lockDuration;
  await trail.lockTokens(addr1.address, lockTime);
  console.log("Tokens locked until:", lockTime);

  try {
    await trail.connect(addr1).transfer(addr2.address, 50);
    console.log("Transfer succeeded unexpectedly");
  } catch (error) {
    console.log("Transfer failed as expected with error:", error.message);
  }

  console.log("Final balance of addr1:", (await trail.balanceOf(addr1.address)).toString());
  console.log("Final balance of addr2:", (await trail.balanceOf(addr2.address)).toString());

  expect(await trail.balanceOf(addr1.address)).to.equal(100);
  expect(await trail.balanceOf(addr2.address)).to.equal(0);

  // Now let's advance time and try again
  await time.increase(lockDuration + 1);

  await trail.connect(addr1).transfer(addr2.address, 50);

  console.log("Balance of addr1 after lock period:", (await trail.balanceOf(addr1.address)).toString());
  console.log("Balance of addr2 after lock period:", (await trail.balanceOf(addr2.address)).toString());

  expect(await trail.balanceOf(addr1.address)).to.equal(50);
  expect(await trail.balanceOf(addr2.address)).to.equal(50);
});

it("Should not allow non-owners to add reward distributors", async function() {
  await expect(trail.connect(addr1).addRewardDistributor(addr2.address))
    .to.be.revertedWithCustomError(trail, "OwnableUnauthorizedAccount")
    .withArgs(addr1.address);
});

it("Should handle edge cases in token locking", async function() {
  await trail.mint(addr1.address, 100);
  const currentTime = await time.latest();
  
  // Lock tokens
  await trail.lockTokens(addr1.address, currentTime + 3600);
  
  // Try to transfer tokens while locked
  await expect(trail.connect(addr1).transfer(addr2.address, 50))
    .to.be.revertedWith("Tokens are locked");
  
  // Advance time past the lock period
  await time.increase(3601);
  
  // Transfer should now succeed
  await expect(trail.connect(addr1).transfer(addr2.address, 50))
    .to.not.be.reverted;
});

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

it("Should handle edge cases in reward distribution", async function() {
  await trail.addRewardDistributor(addr1.address);
  
  // Distribute 0 tokens (this might not be restricted in your implementation)
  await trail.connect(addr1).distributeReward(addr2.address, 0);
  expect(await trail.balanceOf(addr2.address)).to.equal(0);
  
  // Attempt to distribute to zero address (should be rejected)
  await expect(trail.connect(addr1).distributeReward(ZERO_ADDRESS, 100))
    .to.be.revertedWithCustomError(trail, "ERC20InvalidReceiver")
    .withArgs(ZERO_ADDRESS);

  // Attempt to distribute more tokens than the distributor has
  const distributorBalance = await trail.balanceOf(addr1.address);
  await expect(trail.connect(addr1).distributeReward(addr2.address, distributorBalance.add(1)))
    .to.be.revertedWith("ERC20: transfer amount exceeds balance");
});

it("Should handle voting delegation edge cases", async function() {
  // Self-delegation
  await trail.delegate(owner.address);
  expect(await trail.delegates(owner.address)).to.equal(owner.address);
  
  // Delegate to another address
  await trail.delegate(addr1.address);
  expect(await trail.delegates(owner.address)).to.equal(addr1.address);

  // Delegate to zero address (this might be allowed in your implementation)
  await trail.delegate(ZERO_ADDRESS);
  expect(await trail.delegates(owner.address)).to.equal(ZERO_ADDRESS);

  // Check voting power after delegation
  const mintAmount = ethers.utils.parseEther("100");
  await trail.mint(owner.address, mintAmount);
  expect(await trail.getVotes(addr1.address)).to.equal(0);
  expect(await trail.getVotes(owner.address)).to.equal(mintAmount);
});

});