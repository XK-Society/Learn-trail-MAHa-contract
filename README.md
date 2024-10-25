# Learn Trail Base
### Based Sea Hackathon 2024

### ERC 20 TRAIL Contract Verified
https://sepolia.basescan.org/address/0xD68fAd32Cf19d2f68A853A2aBCbFc8eBD9704E93
### QUIZ Contract Verified
https://sepolia.basescan.org/address/0x2aC931290e52Dc533A1ab8B073A4a50638445f5d

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
npx hardhat verify --network base_sepolia 0x2aC931290e52Dc533A1ab8B073A4a50638445f5d 0xD68fAd32Cf19d2f68A853A2aBCbFc8eBD9704E93  0x1AB67c4ac117F3c850D5A93784B7701Cc5816387
```

.env:
```shell
PRIVATE_KEY=Wallet_private_key
BASE_RPC_URL=Base_sepolia_rpc_url
BASESCAN_API_KEY=base_scan_api_key
```
