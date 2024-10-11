# Learn Trail Base
### Based Sea Hackathon 2024
### ERC20 and Quiz contracts

###ERC 20 TRAIL Contract Verified : 
https://sepolia.basescan.org/address/0xD68fAd32Cf19d2f68A853A2aBCbFc8eBD9704E93
###QUIZ Contract Verified : 
https://sepolia.basescan.org/address/0x9F901376e91EC162B586059423afF5E0A2744FE2

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
```
Build contract:
```shell
npx hardhat compile
```

Deploy contract:
```shell
npx hardhat run scripts/deploy_quiz.js --network base_sepolia
npx hardhat run scripts/deploy_trail.js --network base_sepolia

```

Verify contract:
```shell
npx hardhat verify --network base_sepolia <contract_address> <public_key_address>
```

.env:
```shell
PRIVATE_KEY=Wallet_private_key
BASE_RPC_URL=Base_sepolia_rpc_url
BASESCAN_API_KEY=base_scan_api_key
```
