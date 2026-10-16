# Launch list and later Omnisend connection

The website's opt-in now persists to the Site's first-party D1 `launch_subscribers` table. It saves only email, selected product interest, consent copy/version, creation timestamp and a hashed removal token. Raw email and token are not logged or stored in the browser. The separate `signup_limits` table holds an hourly hashed network identifier, attempt count and expiration. Database provisioning/migrations happen at deployment, never during requests.

Omnisend remains disconnected. There is no API key in the frontend and no email is sent on submission. When ready, approve the business/contact privacy notice, set up the Omnisend audience and double-opt-in/unsubscribe process, then integrate against the current official API using server-only credentials. Import only consented records and retain their consent evidence. Do not interpret the list as proof of email ownership; email verification must be handled by the email provider before campaigns.

Test duplicate handling, provider failures, confirmation, unsubscribe, data deletion and any retention rules before sending the first launch message. Preserve the current failure behavior: the interface must acknowledge a signup only after it is actually saved. Do not add promotional amounts or discount promises without approval.
