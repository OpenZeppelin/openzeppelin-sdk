---
id: cli_call
title: call
---

<div class="cli-command"><h2 class="cli-title">call</h2><p class="cli-usage">Usage: <code>call --to &lt;to&gt; --method &lt;method&gt; [options]</code></p><p>call a method of the specified contract instance. Provide the [address], method to call and its arguments if needed<br/></p><dl><dt><span>Options:</span></dt><dd><div><code>--to &lt;to&gt;</code> address of the contract that will receive the call</div><div><code>--method &lt;method&gt;</code> name of the method to execute in the contract</div><div><code>--args &lt;arg1, arg2, ...&gt;</code> arguments to the method to execute</div><div><code>-n, --network &lt;network&gt;</code> network to be used</div><div><code>-f, --from &lt;from&gt;</code> specify transaction sender address</div><div><code>--timeout &lt;timeout&gt;</code> timeout in seconds for each blockchain transaction (defaults to 600s)</div><div><code>--no-interactive</code> force to run the command in non-interactive mode</div></dd></dl></div>
