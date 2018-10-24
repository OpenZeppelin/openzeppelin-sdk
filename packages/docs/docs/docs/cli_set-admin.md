---
id: cli_set-admin
title: set-admin
---

<div class="cli-command"><h2 class="cli-title">set-admin</h2><p class="cli-usage">Usage: <code>set-admin [alias-or-address] [new-admin-address] --network &lt;network&gt; [options]</code></p><p>change upgradeability admin of a contract instance. Provide the [alias] or [package]/[alias] of the contract to change the ownership of all its instances, or its [address] to change a single one. Note that if you transfer to an incorrect address, you may irreversibly lose control over upgrading your contract.<br/></p><dl><dt><span>Options:</span></dt><dd><div><code>-y, --yes</code> accept transferring admin rights (required)</div><div><code>-n, --network &lt;network&gt;</code> network to be used</div><div><code>-f, --from &lt;from&gt;</code> specify transaction sender address</div><div><code>--timeout &lt;timeout&gt;</code> timeout in seconds for each blockchain transaction (defaults to 600s)</div></dd></dl></div>
