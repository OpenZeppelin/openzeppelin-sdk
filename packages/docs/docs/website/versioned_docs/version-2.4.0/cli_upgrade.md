---
id: version-2.4.0-cli_upgrade
title: upgrade
original_id: cli_upgrade
---

<div class="cli-command"><h2 class="cli-title">upgrade</h2><p class="cli-usage">Usage: <code>upgrade [alias-or-address] --network &lt;network&gt; [options]</code></p><p>upgrade contract to a new logic. Provide the [alias] or [package]/[alias] you added your contract with, its [address], or use --all flag to upgrade all contracts in your project.<br/></p><dl><dt><span>Options:</span></dt><dd><div><code>--init [function]</code> call function after upgrading contract. If no name is given, &#x27;initialize&#x27; will be used</div><div><code>--args &lt;arg1, arg2, ...&gt;</code> provide initialization arguments for your contract if required</div><div><code>--all</code> upgrade all contracts in the application</div><div><code>--force</code> force creation even if contracts have local modifications</div><div><code>-n, --network &lt;network&gt;</code> network to be used</div><div><code>-f, --from &lt;from&gt;</code> specify transaction sender address</div><div><code>--timeout &lt;timeout&gt;</code> timeout in seconds for each blockchain transaction (defaults to 600s)</div><div><code>--skip-compile</code> skips contract compilation</div><div><code>--no-interactive</code> force to run the command in non-interactive mode</div></dd></dl></div>
