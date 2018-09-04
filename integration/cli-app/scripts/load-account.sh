TARGET_ACCOUNT="0x4da710efab33a9986b35e5c1de7e97f7e0704c18"
geth attach "http://localhost:9955" --exec "web3.eth.sendTransaction({from: web3.eth.accounts[0], to: '$TARGET_ACCOUNT', value: 1000e18 })"
sleep 1
echo "Account $TARGET_ACCOUNT funded"