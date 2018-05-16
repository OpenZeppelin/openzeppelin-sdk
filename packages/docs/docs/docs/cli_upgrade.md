---
id: upgrade
title: upgrade
---

<div class="cli-command"><h2 class="cli-title">upgrade</h2><p class="cli-usage">Usage: <code>upgrade [alias] [address] --network &lt;network&gt; [options]</code></p><p>Upgrade a proxied contract to a new implementation.<br/>      Provide the [alias] name you used to register your contract. Provide [address] to choose which proxy to upgrade, otherwise all will be upgraded.<br/></p><dl><dt><span>Options:</span></dt><dd><div><code>--init [function]</code> Tell whether your new implementation has to be initialized or not. You can provide name of the initialization function. If none is given, &#x27;initialize&#x27; will be considered by default</div><div><code>--args &lt;arg1, arg2, ...&gt;</code> Provide initialization arguments for your contract if required</div><div><code>--all</code> Skip the alias option and set --all to upgrade all proxies in the application</div><div><code>-f, --from &lt;from&gt;</code> Set the transactions sender</div><div><code>-n, --network &lt;network&gt;</code> Provide a network to be used</div><div><code>--force</code> Force upgrading the proxy even if contracts have local modifications</div></dd></dl></div>
