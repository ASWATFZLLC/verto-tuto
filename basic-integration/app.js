let diallerInput = document.getElementById('diallerInput');
let currentCall = '';

/**
  This function will execute the _bootstrap function to connect to the Verto server
  and log in with specified credentials and configurations.
  To see the full documentation, go to: http://evoluxbr.github.io/verto-docs/tut/initializing-verto.html
**/
function connectToFreeswitch() {
  hostname  = document.getElementById('hostname').value;
  socketURL = document.getElementById('socketURL').value;
  position  = document.getElementById('position').value;
  password  = document.getElementById('password').value;

  function _bootstrap(status) {
    vertoHandle = new jQuery.verto({
      login: position + '@' + hostname,
      passwd: password,
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

  if (hostname && socketURL && position && password) $.verto.init({}, _bootstrap);
  else alert('You need to provide the full configuration settings.');
}

// Verto Events
function onWSLogin(verto, success) {
  if (!success) alert('Wrong connexion infos');
  else {
    document.getElementById('positionStatus').innerHTML = 'Connected to position ' + document.getElementById('position').value;
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
      break;
    case 'trying':
      document.getElementById('callStatus').innerHTML = 'Call is in Trying state';
      document.getElementById('dialler').style.borderColor = 'lightblue';
      document.getElementById('dialler').style.backgroundColor = 'rgba(0,100,255,0.05';
      break;
    case 'early':
      document.getElementById('callStatus').innerHTML = 'Is Calling ' + currentCall.params.destination_number;
      break;
    case 'active':
      diallerInput.value = '';
      document.getElementById('callStatus').innerHTML = 'In a Call';
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

