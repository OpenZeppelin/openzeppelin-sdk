---
id: create
title: create
---

<div class="cli-command"><h2 class="cli-title">create</h2><p class="cli-usage">Usage: <code>create &lt;alias&gt; --network &lt;network&gt; [options]</code></p><p>Creates a new proxy for the specified implementation.<br/>      Provide the &lt;alias&gt; name you used to register your contract.<br/></p><dl><dt><span>Options:</span></dt><dd><div><code>--init [function]</code> Tell whether your contract has to be initialized or not. You can provide name of the initialization function. If none is given, &#x27;initialize&#x27; will be considered by default</div><div><code>--args &lt;arg1, arg2, ...&gt;</code> Provide initialization arguments for your contract if required</div><div><code>-f, --from &lt;from&gt;</code> Set the transactions sender</div><div><code>-n, --network &lt;network&gt;</code> Provide a network to be used</div><div><code>--force</code> Force creation of the proxy even if contracts have local modifications</div></dd></dl></div>
