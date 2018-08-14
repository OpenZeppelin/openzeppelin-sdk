---
id: version-1.4.0-cli_session
title: session
original_id: cli_session
---

<div class="cli-command"><h2 class="cli-title">session</h2><p class="cli-usage">Usage: <code>session [options]</code></p><p>by providing network options, commands like create, freeze, push, status and update will use them unless overridden. Use --close to undo.<br/></p><dl><dt><span>Options:</span></dt><dd><div><code>--expires &lt;expires&gt;</code> expiration of the session in seconds (defaults to 900, 15 minutes)</div><div><code>--close</code> closes the current session, removing all network options set</div><div><code>-n, --network &lt;network&gt;</code> network to be used</div><div><code>-f, --from &lt;from&gt;</code> specify transaction sender address</div><div><code>--timeout &lt;timeout&gt;</code> timeout in seconds for each blockchain transaction (defaults to 600s)</div></dd></dl></div>
