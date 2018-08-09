---
id: version-1.0.0-upgrade
title: upgrade
original_id: upgrade
---

<div class="cli-command"><h2 class="cli-title">upgrade</h2><p class="cli-usage">Usage: <code>upgrade [alias] [address] --network &lt;network&gt; [options]</code></p><p>upgrade contract to a new logic. Provide the [alias] you added your contract with, or use --all flag to upgrade all. If no [address] is provided, all instances of that contract class will be upgraded<br/></p><dl><dt><span>Options:</span></dt><dd><div><code>--init [function]</code> call function after upgrading contract. If no name is given, &#x27;initialize&#x27; will be used</div><div><code>--args &lt;arg1, arg2, ...&gt;</code> provide initialization arguments for your contract if required</div><div><code>--all</code> upgrade all contracts in the application</div><div><code>-f, --from &lt;from&gt;</code> specify transaction sender address</div><div><code>-n, --network &lt;network&gt;</code> network to be used</div><div><code>--force</code> force creation even if contracts have local modifications</div></dd></dl></div>
