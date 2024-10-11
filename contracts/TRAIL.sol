// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";

contract TRAIL is ERC20, Ownable, ERC20Permit, ERC20Votes {
    mapping(address => uint256) private _lockedUntil;
    mapping(address => bool) public rewardDistributors;

    constructor(address initialOwner)
        ERC20("TRAIL", "TRL")
        Ownable(initialOwner)
        ERC20Permit("TRAIL")
    {
        _mint(msg.sender, 100000000 * 10 ** decimals());
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function burn(uint256 amount) public {
        _burn(msg.sender, amount);
    }

    function lockTokens(address account, uint256 unlockTime) public onlyOwner {
        _lockedUntil[account] = unlockTime;
    }

    function addRewardDistributor(address distributor) public onlyOwner {
        rewardDistributors[distributor] = true;
    }

    function removeRewardDistributor(address distributor) public onlyOwner {
        rewardDistributors[distributor] = false;
    }

    function distributeReward(address to, uint256 amount) public {
        require(rewardDistributors[msg.sender], "Not authorized to distribute rewards");
        _mint(to, amount);
    }

    // The following functions are overrides required by Solidity.

    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Votes)
    {
        super._update(from, to, value);
        if (from != address(0)) {
            require(block.timestamp >= _lockedUntil[from], "Tokens are locked");
        }
    }

    function nonces(address owner)
        public
        view
        override(ERC20Permit, Nonces)
        returns (uint256)
    {
        return super.nonces(owner);
    }
}