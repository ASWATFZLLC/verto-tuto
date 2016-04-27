var vertoHandle;
var vertoCallbacks;
var currentCall;
var position  = '';
var password  = '';
var hostname  = '';
var socketUrl = '';
var number    = '';

// init for testing
document.getElementById('hostname').value  = 'ziworedirect.aswat.co';
document.getElementById('socketUrl').value = 'wss://ziworedirect.aswat.co:8082';
document.getElementById('position').value  = 'anasrtc';
document.getElementById('password').value  = '123Jitsi';
connectToFS();

function connectToFS() {
  hostname  = document.getElementById('hostname').value;
  socketUrl = document.getElementById('socketUrl').value;
  position  = document.getElementById('position').value;
  password  = document.getElementById('password').value;

  function bootstrap(status) {
    vertoHandle = new jQuery.verto({
      login: position + '@' + hostname,
      passwd: password,
      socketUrl: socketUrl,
      ringFile: 'ringtone.mp3',
      tag: 'webcam',
      deviceParams: {
        useMic: true,
        useSpeak: true
      },
      iceServers: true
    }, vertoCallbacks);
  }

  if (hostname && socketUrl && position && password) {
    $.verto.init({}, bootstrap);
  } else alert('You should provide all the connexion infos.');
}

function sendDTMF(number) {
  if (!currentCall) {
    console.debug('There is no call to send DTMF.');
    return false;
  }

  currentCall.dtmf(number);
}

function makeCall() {
  if (currentCall) {
    alert('You are already in a call');
    return;
  }

  number = document.getElementById('dialedNumber').value;
  if (number) {
    currentCall = vertoHandle.newCall({
      destination_number: number,
      caller_id_name: "",
      caller_id_number: "",
      outgoingBandwidth: "default",
      incomingBandwidth: "default",
      useStereo: true,
      useMic: true,
      useSpeak: true,
      dedEnc: false,
      audioParams: {
          googAutoGainControl: false,
          googNoiseSuppression: false,
          googHighpassFilter: false
      },
      userVariables: {
        avatar: "",
        email: "test@test.com"
      }
    });
  } else alert('You need to provide a number');
  console.log('&&&&&&&_______----_______&&&&&&&');
}

function hangupCall() {
  if (currentCall) currentCall.hangup();
  console.log('&&&&&&&_______----_______&&&&&&&');
};

function mute() {
  if (currentCall) currentCall.mute("off");
};

function unmute() {
  if (currentCall) currentCall.mute("on");
};

function muteUnmute() {
  if (currentCall) currentCall.mute("toggle");
};

function transfer() {
  var destinationNumber = document.getElementById('transfering').value;

  if (destinationNumber) {
    currentCall.transfer(destinationNumber);
  }
};

function hold() {
  if (currentCall) currentCall.hold();
};

function unhold() {
  if (currentCall) currentCall.unhold();
};

vertoCallbacks = {
  onWSLogin: onWSLogin,
  onWSClose: onWSClose,
  onDialogState: onDialogState
};

function onWSLogin(verto, success) {
  console.log('onWSLogin', success);
  if (!success) alert('Wrong connexion infos');
  console.log('&&&&&&&_______----_______&&&&&&&');
}

function onWSClose(verto, success) {
  console.log('onWSClose', success);
  console.log('&&&&&&&_______----_______&&&&&&&');
}

function answerCall() {
  currentCall.answer({
    useStereo: true,
    useCamera: false,
    useVideo: false,
    useMic: true,
    callee_id_name: '',
    callee_id_number: ''
  });
}

function onDialogState(d) {
  console.log('onDialogState d: ', d);
  if (!currentCall) currentCall = d;
  switch (d.state.name) {
    case "ringing":
      // incomingCall(d.params.caller_id_number);
      document.getElementById('is-ringing').style.display = 'block';
      console.log('is ringing');
      break;
    case "trying":
      console.debug('Calling:', d.cidString());
      // data.callState = 'trying';
      break;
    case "early":
      console.debug('Talking to:', d.cidString());
      // data.callState = 'active';
      // calling();
      break;
    case "active":
      console.debug('Talking to:', d.cidString());
      // data.callState = 'active';
      // callActive(d.lastState.name, d.params);
      break;
    case "hangup":
      console.debug('Call ended with cause: ' + d.cause);
      // data.callState = 'hangup';
      break;
    case "destroy":
      console.debug('Destroying: ' + d.cause);
      if (currentCall) currentCall = null;
      // if (d.params.screenShare) {
      //   cleanShareCall(that);
      // } else {
      //   stopConference();
      //   if (!that.reloaded) {
      //     cleanCall();
      //   }
      // }
      break;
    default:
      console.warn('Got a not implemented state:', d);
      break;
  }
}

window.onbeforeunload = function(event)
{
  console.log('i hannnnnngup bbb');
  hangupCall();
  // return confirm("Confirm refresh");
};
