ASWAT | Verto Integration Documentation
---

This repository contain a basic example of a webRTC client using the mod verto from Freeswitch, with some code documentation.

This work is based on the javascript verto lib. https://evoluxbr.github.io/verto-docs/tut/installing-verto.html

You can use only the verto lib, or integrate it with Ziwo API to retreive datas from Ziwo.

This repository contain the two ways, a basic integration, and an integration with Aswat API.

Basic integration demo: link
Aswat integration demo: link

To avoid conflict for user, and for the simplicity of the documentation, no external libraries are used, expect the one required for the verto lib (jquery).

### Basic Integration | How to use?

The basic integration is based on the verto lib. All the documentation is available here: https://evoluxbr.github.io/verto-docs/tut/installing-verto.html

### Aswat Integration | How to use?

With the Aswat integration of the mod verto, you will be able to retreive more datas about calls, agents and queues.
In this example, we get back the related queue of the calls, if one exist.

If you want to run it locally, clone this repository, then enter the directory and run
`npm install`

Then, launch a local http server with the directory as root.

To connect to your Ziwo instance, you need to enter the hostname of your instance and the socket URL.

Example: if your ziwo instance is `https://myInstance.aswat.co`, then your hostname will be `myInstance.aswat.co` and your socket url will be `wss://myInstance.aswat.co:8082`.

You also need to have a valid agent account on your Ziwo instance. Use the `username/password` of the agent, then click the `Auto Connect` button.

By clicking `Auto Connect`, you will be directly connected to your Ziwo instance, on the virtual position of the Agent.

Please note that this demo is only a basic one intended to show how to integrate the Ziwo API, and it does not handle every features available on Ziwo Agent Client.

#### Ziwo API Functions
Here are the Ziwo API functions used in this demo.

###### Login
```
POST
url: 'https://yourInstance-api.aswat.co/auth/login'
data: {username: your@username.com, password: YOUR_ENCRYPTED_PASSWORD}
---
Response: Agent Profile
for more details, see: https://YOURINSTANCE-api.aswat.co/docs/#login
```

###### Get list of Queues
```
GET
url: 'https://yourInstance-api.aswat.co/agents/channels/calls/listQueues'
params: {access_token: YOUR_ACCESS_TOKEN}
---
Response: List of Ziwo Queues
```

###### Get list of Numbers
```
GET
url: 'https://yourInstance-api.aswat.co/agents/channels/calls/listNumbers'
params: {access_token: YOUR_ACCESS_TOKEN}
---
Response: List of Ziwo Numbers
```

###### Auto Login Agent to Virtual Position
This function auto log the Agent to his virtual Position.
The name of a virtual position is: agent-{AGENT_ID}.
For example, if the Agent has for ID 4242, the virtual position name will be: agent-4242.
```
PUT
url: 'https://yourInstance-api.aswat.co'/agents/autoLogin/' + positionName
params: {access_token: YOUR_ACCESS_TOKEN}
---
Response: List of Ziwo Numbers
```