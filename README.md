ASWAT | Verto Integration Documentation
---

This repository contain a basic example of a webRTC client using the mod verto from Freeswitch, with some code documentation.

This work is based on the javascript verto lib. https://evoluxbr.github.io/verto-docs/tut/installing-verto.html

You can use only the verto lib, or integrate it with Ziwo API to retreive datas from Ziwo.

This repository contain the two ways, a basic integration, and an integration with Aswat API.

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

#### Attended Transfer
The verto lib does not support Attended Transfer by default.

To implement Attended Transfer, you'll need to do two steps:

First, you'll need to override a part of verto lib's code.

The code to implement is as follow:
```
    $.verto.dialog.prototype.attendedTransfer = function(call) {
      // Change the sourceCall's callID (leg b) to
      // current(destination) call's callID (leg b).
      this.sendMethod('verto.modify', {
        action: 'replace',
        replaceCallID: call.params.callID,
      });
    };
```
Be sure to put this code _after_ having integrated verto-lib.

Then, you'll need to do code and do **manually** the differents steps of an attended tranfser, meaning:
- put on hold the current call
- make a new call to the person you want to speak before transfer
- then:
  - if the person agrees to take the call, make the attended transfer (see code bellow)
  - if the person does not want to take the call, hangup the new call and go back to the previous call


###### Example
Agent Smith is currently on call with customer X.

Agent Smith want's to transfer the call to Manager James.
Agent Smith go on the transfer view and place a new call to Manager James. When the call is starting, a new view is shown with two button on it: Attended Transfer and Hangup.


If Manager James agreed to take the call, Agent Smith click on the Attended Transfer button and the attended transfer is made.

If Manager James does not want to take the call, Agent Smith hangup the call with Manager James and the view goes back to the previous call with customer X.


###### How to do the attended transfer in the code ?
You first need to implement the code given above, then store the current call and make a new one.

And when you will want to actually transfer the current call to the new one, you'll just need to do:

```
  currentCall.attendedTransfer(newCall);
```

With the example given above, the code will look like:
```
  // sourceCall: call between Agent Smith and Customer X
  // destinationCall: call between Agent Smith and Manager James

  // on clicking on the attended transfer button:
  sourceCall.attendedTransfer(destinationCall);
```
