# MCP Integration Assessment

## MailFlat email MCP

MailFlat provides agent-controlled inboxes: creating inboxes, receiving and reading messages, waiting for one-time codes, replying, and sending from a MailFlat-created inbox. It authenticates with a separate MailFlat account key and reports send acceptance separately from delivery.[1]

| Candidate use | Decision | Reason |
|---|---|---|
| Customer order notifications | Do not use | The live platform already uses its verified Mailjet sender; MailFlat sends from agent inboxes rather than the merchant sender. |
| Customer data or production mailboxes | Do not use | Its inbox API is intended for agent/testing mail and would add an unnecessary third-party processor to customer communications. |
| Development OTP and sign-up testing | Optional | Suitable only for isolated test accounts and fixture addresses, with a separately supplied MailFlat key. |

## Browser automation catalog

The supplied browser-automation catalog includes local and hosted options. The closest fit is the official Microsoft Playwright MCP, which works through structured accessibility snapshots.[2] The current environment already has browser automation available for public pages, while the historical limitation is an unavailable external Firefox runtime for signed-in validation. Adding another browser MCP does not solve that account/session prerequisite by itself.

No browser or email MCP is enabled by this assessment. Any future activation must be scoped to test data, configured with separate credentials, and must not submit orders, payments, or customer communications without explicit approval.

## References

[1] [MailFlat Agent API and MCP](https://mailflat.net/docs/api/agent-api)

[2] [Awesome MCP Servers: Browser Automation](https://github.com/punkpeye/awesome-mcp-servers#browser-automation)
