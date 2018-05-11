# Use `zos` to fund development and auditing of zOS Kernel releases with your ZEP tokens

To fund development of a zOS Kernel standard library release, you can vouch your ZEP tokens to that specific release. This will give a small payout to the release developer and incentivize further auditing and development of the code.

To vouch for the release you're using in your app, run:
```
zos vouch <release_address> <zep_amount_in_units> --from <zep_holding_address>
```
If you want to stop supporting this release, run:
```
zos unvouch <release_address> <zep_amount_in_units> --from <address_that_vouched>
```