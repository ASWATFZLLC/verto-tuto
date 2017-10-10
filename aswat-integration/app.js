let diallerInput = document.getElementById('diallerInput');
let currentCall = '';
let accessToken = '';
let position = {};
let queues = [];
let numbers = [];

// Aswat Integration

/**
 * The connectToAswat function will be used to connect the agent to the Ziwo instance,
 * then to connect to Freeswitch and opend the webRTC.

   We first connect to the Ziwo instance to retreive the access token
   Then, with the response of the auth/login call, we generate the access to the virtual position.
   Before connecting to Freeswitch, we get back the list of queues and numbers of Ziwo.
   With those, we will be able to link numbers to queues, etc.
   If everything is ok, we auto-connect the agent to the position, using /agents/autoLogin call.
   Then, if everything is ok, we connect to Freeswitch.
 */
function connectToAswat() {
  let hostname  = document.getElementById('hostname').value;
  if (!hostname) return alert('You should provide a hostname');

  let username = document.getElementById('username').value;
  let password = document.getElementById('usernamePassword').value

  // We get back the first part of the hostname who will be use to know which Ziwo API we are going to use.
  // Example: hostname == 'myInstance.aswat.co', then the API will be: https://myInstance-api.aswat.co
  let api = 'https://' + hostname.split('.')[0] + '-api.aswat.co';

  const params = {
    username: username,
    password: _encryptePassword()
  };

  // Ziwo has an encryption method to connect. This function encrypte the password
  // based on Ziwo encryption specs.
  function _encryptePassword() {
    const encryptedPass = CryptoJS.HmacSHA256(username + password, password);
    return CryptoJS.enc.Base64.stringify(encryptedPass);
  }

  // This function get back the list of queues of the Ziwo instance
  function _getQueues() {
    return $.ajax({
      url: api + '/agents/channels/calls/listQueues',
      beforeSend : function(xhr) { xhr.setRequestHeader('access_token', accessToken); },
      success: function(res) { queues = res.content; }
    });
  }

  // This function get back the list of numbers of the Ziwo instance
  function _getNumbers() {
    return $.ajax({
      url: api + '/agents/channels/calls/listNumbers',
      beforeSend : function(xhr) { xhr.setRequestHeader('access_token', accessToken); },
      success: function(res) { numbers = res.content; }
    });
  }

  // We first login the agent to the Ziwo instance to get back his profile and the access token
  $.post(api + '/auth/login', params, function(res) {
    if (res.result) {
      // Once we have the access token and the agent profile, we can store the access token for further uses,
      // and generate the virtual position credentials
      accessToken = res.content.access_token;
      position = {
        name: 'agent-' + res.content.ccLogin,
        password: CryptoJS.MD5(res.content.ccLogin + '' + res.content.ccPassword).toString(),
      };

      // We fetch back queues and numbers from the Ziwo instance, then we auto login the agent to his virtual postion
      Promise.all([_getQueues(), _getNumbers()]).then(function() {
        $.ajax({
          url: api + '/agents/autoLogin/' + position.name,
          type: 'PUT',
          beforeSend : function(xhr) { xhr.setRequestHeader('access_token', accessToken); },
          success: function(res) {
            // Once everything is ok, we connect to Freeswitch.
            connectToFreeswitch(position);
          },
          error: function(xhr, status, error) {
            alert('Something went wrong while trying to connect the position ! Error message: ' + error);
          }
        });
      })
    }
  }).fail(function (xhr, status, error) {
    alert('Something went wrong while trying to connect Ziwo Contact Center! Error message: ' + error);
  });
}

// Numbers are sometimes formatted with "" on the verto lib.
// We use this function to clean numbers from previous formatting
function _cleanNumber(number) {
  if (number[0] === '"') number = number.substring(1);
  if (number[number.length - 1] === '"') number = number.substring(0, number.length - 1);
  return number;
}

// This function get back the linked queue of a number
function _getLinkedQueue(calledNumber) {
  let number = numbers.find(number => number.did === calledNumber);

  return (number && number.linkType === 'queue') ? queues.find(queue => queue.name === number.linkData) : '';
}

// This functions is used to simplify the information of the current call and to retreive the linked queue
function _setInfos() {
  if (currentCall && !currentCall.ziwoInfo) {
    currentCall.ziwoInfo = {};
    currentCall.ziwoInfo.direction = currentCall.direction.name;
    if (currentCall.ziwoInfo.direction === 'inbound') {
      currentCall.ziwoInfo.callerID = _cleanNumber(currentCall.params['caller_id_number']);
      currentCall.ziwoInfo.calledNumber = _cleanNumber(currentCall.params['caller_id_name']);
      currentCall.ziwoInfo.relatedQueue = _getLinkedQueue(currentCall.ziwoInfo.calledNumber);
    }
    if (currentCall.ziwoInfo.direction === 'outbound') {
      currentCall.ziwoInfo.calledNumber = _cleanNumber(currentCall.params['destination_number']);
      currentCall.ziwoInfo.relatedQueue = _getLinkedQueue(currentCall.ziwoInfo.calledNumber);
    }
  }
}

/**
  This function will execute the _bootstrap function to connect to the Verto server
  and log in with specified credentials and configurations.
  To see the full documentation, go to: http://evoluxbr.github.io/verto-docs/tut/initializing-verto.html
**/
function connectToFreeswitch(position) {
  let hostname  = document.getElementById('hostname').value;
  let socketURL = document.getElementById('socketURL').value;

  function _bootstrap(status) {
    vertoHandle = new jQuery.verto({
      login: position.name + '@' + hostname,
      passwd: position.password,
      socketUrl: socketURL,
      ringFile: 'ringtone.mp3',
      tag: 'positionDevice',
      deviceParams: {
        useMic: true,
        useSpeak: true
      },
      iceServers: true
    },
    /**
      Almost everything that happens in Verto fires an event.
      onWSLogin will be fired on login
      onWSClose will be fired when closing the socket
      onDialogState is used to handle incoming and outgoind calls
    **/
    {
      onWSLogin: onWSLogin,
      onWSClose: onWSClose,
      onDialogState: onDialogState
    });
  }

  if (hostname && socketURL) $.verto.init({}, _bootstrap);
  else alert('You need to provide the full configuration settings.');
}

// Verto Events
function onWSLogin(verto, success) {
  if (!success) alert('Wrong connexion infos');
  else {
    document.getElementById('positionStatus').innerHTML = 'Connected to position ' + position.name;
    document.getElementById('dialler').style.borderColor = 'green';
    document.getElementById('dialler').style.backgroundColor = 'rgba(0,255,0,0.05)';
  }
}

function onWSClose(verto, success) {
  if (!success) alert('Something went wrong while closing the socket.')
}

function onDialogState(d) {
  if (!currentCall) currentCall = d;

  switch (d.state.name) {
    case 'ringing':
      document.getElementById('callStatus').innerHTML = 'Receiving a Call from ' + currentCall.params.caller_id_number;
      document.getElementById('dialler').style.borderColor = 'lightblue';
      document.getElementById('dialler').style.backgroundColor = 'rgba(0,100,255,0.05)';
      _setInfos();
      break;
    case 'trying':
      document.getElementById('callStatus').innerHTML = 'Call is in Trying state';
      document.getElementById('dialler').style.borderColor = 'lightblue';
      document.getElementById('dialler').style.backgroundColor = 'rgba(0,100,255,0.05';
      break;
    case 'requesting':
      _setInfos();
      break;
    case 'early':
      document.getElementById('callStatus').innerHTML = 'Is Calling ' + currentCall.params.destination_number;
      _setInfos();
      break;
    case 'active':
      diallerInput.value = '';
      _setInfos();
      let text = '';

      if (currentCall.ziwoInfo.direction === 'inbound') text = 'In an incoming call from ' + currentCall.ziwoInfo.callerID;
      else text = 'In an outbound call with number: ' + currentCall.ziwoInfo.calledNumber;

      if (currentCall.ziwoInfo.relatedQueue) {
        text += '<br> number: ' + currentCall.ziwoInfo.calledNumber + ' | queue: ' + currentCall.ziwoInfo.relatedQueue.name;
      }

      document.getElementById('callStatus').innerHTML = text;
      document.getElementById('dialler').style.borderColor = 'red';
      document.getElementById('dialler').style.backgroundColor = 'rgba(255,0,0,0.05)';
      break;
    case 'hangup':
      document.getElementById('callStatus').innerHTML = 'Call has hang up';
      break;
    case 'destroy':
      document.getElementById('callStatus').innerHTML = 'Not in a Call';
      if (currentCall) {
        currentCall = null;
        document.getElementById('dialler').style.borderColor = 'green';
        document.getElementById('dialler').style.backgroundColor = 'rgba(0,255,0,0.05)';
        diallerInput.value = '';
      }
      break;
    default:
      console.warn('Got a not implemented state:', d);
      break;
  }
}

// Dialler Actions
function dial(number) {
  diallerInput.value += number;
  if (currentCall) currentCall.dtmf(number);
}

// Call Actions
function makeCall() {
  if (currentCall) return alert('You are already in a call');

  if (diallerInput.value) {
    currentCall = vertoHandle.newCall({
      destination_number: diallerInput.value,
      caller_id_name: '',
      caller_id_number: '',
      outgoingBandwidth: 'default',
      incomingBandwidth: 'default',
      useStereo: true,
      useMic: true,
      useSpeak: true,
      dedEnc: false,
      audioParams: {
          googAutoGainControl: false,
          googNoiseSuppression: false,
          googHighpassFilter: false
      }
    });
  } else alert('You need to provide a number');
}

function answerCall() {
  if (!currentCall) return alert('There is no incoming call');
  if (currentCall.state.name === 'active') return alert('You are currently in a call');

  currentCall.answer({
    useStereo: true,
    useCamera: false,
    useVideo: false,
    useMic: true,
    callee_id_name: '',
    callee_id_number: ''
  });
}

function hangupCall() {
  if (!currentCall) return alert('You are not in a call');
  currentCall.hangup();
  diallerInput.value = '';
}

function mute() {
  if (!currentCall) return alert('You are not in a call');
  currentCall.setMute('off');
}

function unmute() {
  if (!currentCall) return alert('You are not in a call');
  currentCall.setMute('on');
}

function transfer() {
  if (!currentCall) return alert('You are not in a call');
  if (!diallerInput.value) return alert('You should provide a number for tranfer');

  currentCall.transfer(diallerInput.value);
}

function hold() {
  if (!currentCall) return alert('You are not in a call');
  currentCall.hold();
}

function unhold() {
  if (!currentCall) return alert('You are not in a call');
  currentCall.unhold();
};

