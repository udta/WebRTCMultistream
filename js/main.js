/*
 *  Copyright (c) 2015 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */

'use strict';

//Localhost unsecure http connections are allowed
if (document.location.hostname !== "localhost") {
    //check if the user is using http vs. https & redirect to https if needed
    if (document.location.protocol != "https:"){
        $(document).html("This doesn't work well on http. Redirecting to https");
        console.log("redirecting to https");
        document.location.href = "https:" + document.location.href.substring(document.location.protocol.length);
    }
}

var getMediaButton = document.querySelector('button#GUM');
var getScreenButton = document.querySelector('button#GDM'); 
var connectButton = document.querySelector('button#connect');
var hangupButton = document.querySelector('button#hangup');
var detailButton = document.querySelector('button#detail');
var limitSelector = document.querySelector('select#frameRateLimit');

//init
getMediaButton.disable = false;
getScreenButton.disable = false; 
connectButton.disable = true;
hangupButton.disable = true;
detailButton.disable = true;
limitSelector.disable = false;

//GUM, RID, CST(firefox only)
var framerateLimitation = "GUM";
//var framerateLimitation = "RID";

if (adapter.browserDetails.browser != 'firefox') {
  //Remove the MediaTrackConstraints
  limitSelector.remove(4);
}

getMediaButton.onclick = getMedia;
getScreenButton.onclick = getScreen;
connectButton.onclick = createPeerConnection;
hangupButton.onclick = hangup;
detailButton.onclick = showDetails;
limitSelector.onchange = setLimitation;

var minWidthInput = document.querySelector('div#minWidth input');
var maxWidthInput = document.querySelector('div#maxWidth input');
var minHeightInput = document.querySelector('div#minHeight input');
var maxHeightInput = document.querySelector('div#maxHeight input');
var minFramerateInput = document.querySelector('div#minFramerate input');
var maxFramerateInput = document.querySelector('div#maxFramerate input');

minWidthInput.onmousedown = maxWidthInput.onmousedown =
    minHeightInput.onmousedown = maxHeightInput.onmousedown =
    minFramerateInput.onmousedown = maxFramerateInput.onmousedown = pressedButton;

minWidthInput.onmouseup = maxWidthInput.onmouseup =
    minHeightInput.onmouseup = maxHeightInput.onmouseup =
    minFramerateInput.onmouseup = maxFramerateInput.onmouseup = releasedButton;

minWidthInput.onmousemove = maxWidthInput.onmousemove =
    minHeightInput.onmousemove = maxHeightInput.onmousemove =
    minFramerateInput.onmousemove = maxFramerateInput.onmousemove = moveSlick;

minWidthInput.onclick = maxWidthInput.onclick =
    minHeightInput.onclick = maxHeightInput.onclick =
    minFramerateInput.onclick = maxFramerateInput.onclick = displayRangeValue;


var getUserMediaConstraintsDiv =
    document.querySelector('div#getUserMediaConstraints');
var bitrateDiv = document.querySelector('div#bitrate');
var peerDiv = document.querySelector('div#peer');
var senderStatsDiv = document.querySelector('div#senderStats');
var receiverStatsDiv = document.querySelector('div#receiverStats');
var txStatsDiv = document.querySelector('div#txStats');
var rxStatsDiv = document.querySelector('div#rxStats');

var localVideo = document.querySelector('div#localVideo video');
var localScreen = document.querySelector('div#localScreen video'); 
var remoteVideo = document.querySelectorAll('div#remoteVideo video');
var localVideoStatsDiv = document.querySelector('div#localVideo div');
var localScreenStatsDiv = document.querySelector('div#localScreen div'); 
var remoteVideoStatsDiv = document.querySelectorAll('div#remoteVideo div#resolution');

var localPeerConnection;
var remotePeerConnection;
var localStream = new Array();
var localScreenStream = new Array(); 
var bytesPrev;
var timestampPrev;

main();

function main() {
  displayGetUserMediaConstraints();
}

function hangup() {
  trace('Ending call');
  localPeerConnection.close();
  remotePeerConnection.close();
  localPeerConnection = null;
  remotePeerConnection = null;

  localStream.forEach(function(stream) {
      stream.getTracks().forEach(function(track) {
          track.stop();
         })
      });
  localStream = [];

  localScreenStream.forEach(function(stream) {
          stream.getTracks().forEach(function(track) {
                  track.stop();
              })
      });
  localScreenStream = [ ]; 

  hangupButton.disabled = true;
  detailButton.disabled = true;
  getMediaButton.disabled = false;

  location.reload(true);
}

function setLimitation() {
  this.disable = true;
  var index = this.selectedIndex;
  framerateLimitation = this.options[index].value;

  if (framerateLimitation == "CST") {
    minWidthInput.onchange = maxWidthInput.onchange =
        minHeightInput.onchange = maxHeightInput.onchange =
        minFramerateInput.onchange = maxFramerateInput.onchange = applyChange;
  } else {
    minWidthInput.onchange = maxWidthInput.onchange =
        minHeightInput.onchange = maxHeightInput.onchange =
        minFramerateInput.onchange = maxFramerateInput.onchange = null;
  }
  //Update the shown
  displayGetUserMediaConstraints();
  
  console.log("FrameRateLimitation mode is "+ this.options[index].text);
}

function showDetails() {

  if (this.innerText == 'Detail') {
    this.innerText = 'Lite';
    document.querySelector('#stats').style.display = "none";
    document.querySelector('#statistics').style.display = "";
  } else {
    this.innerText = 'Detail';
    document.querySelector('#stats').style.display = "";
    document.querySelector('#statistics').style.display = "none";
  }

}

function getMedia() {
  getMediaButton.disabled = true;
  if (localStream.length > 0) {
    localStream.forEach(function (stream) {
        stream.getTracks().forEach(function(track) {
                track.stop();
            })
    });
    var videoTracks = localStream.forEach(function(stream){
        stream.getVideoTracks();
        for (var i = 0; i !== videoTracks.length; ++i) {
          videoTracks[i].stop();
        }
    })
  }
  //var gum = navigator.webkitGetUserMedia || navigator.mediaDevices.getUserMedia;
  //gum(getUserMediaConstraints(0))
  navigator.mediaDevices.getUserMedia(getUserMediaConstraints(0))
  .then(gotStream)
  .catch(function(e) {
    var message = 'getUserMedia error: ' + e.name + '\n' +
        'PermissionDeniedError may mean invalid constraints.';
    alert(message);
    console.log(message);
    getMediaButton.disabled = false;
  });
}

function getScreen() {
  getScreenButton.disabled = true;
  if (localScreenStream.length > 0) {
    localScreenStream.forEach(function(stream) {
            stream.getTracks().forEach(function(track) {
                    track.stop();
                })
        });
    var videoTracks = localScreenStream.forEach(function(stream) {
            stream.getVideoTracks();
            for (var i = 0; i !== videoTracks.length; ++i) {
              videoTracks[i].stop();
            }
        })
  }
  navigator.mediaDevices.getDisplayMedia({audio:true, video:true})
  .then(gotScreenStream)
  .catch(function(e) {
      var message = 'getDisplayMedia error: ' + e.name + '\n' +
                    'PermissionDeniedError may mean invalid constraints.';
      //alert(message);
      console.log(message);
      getScreenButton.disabled = false;
  });
}

function gotStream(stream) {
  connectButton.disabled = false;

  console.log('GetUserMedia succeeded');
  var lastIndex = localStream.length;
  localStream.push(stream);
  //if (lastIndex == 0) {
    if (!adapter.browserShim.attachMediaStream) {
      localVideo.srcObject = stream;
    } else {
      adapter.browserShim.attachMediaStream(localVideo, stream);
    }
  //}

  //if ( lastIndex <= 1 && adapter.browserDetails.browser != 'firefox' ) {
  //  //Firefox did not support GUM against a camera with different constraints!
  //  navigator.mediaDevices.getUserMedia(getUserMediaConstraints(localStream.length))
  //  .then(gotStream)
  //  .catch(function(e) {
  //      var message = 'getUserMedia error: ' + e.name + '\n' +
  //          'PermissionDeniedError may mean invalid constraints.';
  //      alert(message);
  //      console.log(message);
  //  }); 
  //}
}

function gotScreenStream(stream) {
  connectButton.disabled = false;

  console.log('GetDisplayMedia succeeded');
  var lastIndex = localScreenStream.length;
  localScreenStream.push(stream);

    if (!adapter.browserShim.attachMediaStream) {
      localScreen.srcObject = stream;
    } else {
      adapter.browserShim.attachMediaStream(localScreen, stream);
    }
  
}

function getUserMediaConstraints(index) {
  var constraints = {};
  constraints.audio = index > 0 ? false : true;
  constraints.video = {};
  
  var f = Math.pow(2, index);

  if ( (adapter.browserDetails.browser === 'safari' 
       && adapter.browserDetails.isWebRTCPluginInstalled === false)
      || adapter.browserDetails.browser === 'edge' ) {
    //Safari 11 seems did not support min and max ...

    if (minWidthInput.value !== '0') {
      constraints.video.width = { };
      constraints.video.width.ideal = minWidthInput.value / f;
    }
    if (maxWidthInput.value !== '0') {
      constraints.video.width = constraints.video.width || { };
      constraints.video.width.exact = maxWidthInput.value / f;
    }
    if (minHeightInput.value !== '0') {
      constraints.video.height = { };
      constraints.video.height.ideal = minHeightInput.value / f;
    }
    if (maxHeightInput.value !== '0') {
      constraints.video.height = constraints.video.height || { };
      constraints.video.height.exact = maxHeightInput.value / f;
    }

    if (framerateLimitation == "GUM") {
      if (minFramerateInput.value !== '0') {
        constraints.video.frameRate = constraints.video.frameRate || { };
        constraints.video.frameRate.ideal = minFramerateInput.value;
      }
      if (maxFramerateInput.value !== '0') {
        constraints.video.frameRate = constraints.video.frameRate || { };
        constraints.video.frameRate.exact = maxFramerateInput.value;
      }
    }

  } else {

    if (minWidthInput.value !== '0') {
      constraints.video.width = { };
      constraints.video.width.min = minWidthInput.value / f;
    }
    if (maxWidthInput.value !== '0') {
      constraints.video.width = constraints.video.width || { };
      constraints.video.width.ideal = maxWidthInput.value / f;
      constraints.video.width.max = maxWidthInput.value / f;
    }
    if (minHeightInput.value !== '0') {
      constraints.video.height = { };
      constraints.video.height.min = minHeightInput.value / f;
    }
    if (maxHeightInput.value !== '0') {
      constraints.video.height = constraints.video.height || { };
      constraints.video.height.ideal = maxHeightInput.value / f;
      constraints.video.height.max = maxHeightInput.value / f;
    }

    if (framerateLimitation == "GUM") {
      if (minFramerateInput.value !== '0') {
        constraints.video.frameRate = constraints.video.frameRate || { };
        constraints.video.frameRate.min = minFramerateInput.value;
      }
      if (maxFramerateInput.value !== '0') {
        constraints.video.frameRate = constraints.video.frameRate || { };
        constraints.video.frameRate.max = maxFramerateInput.value;
      }
    }
  }
  return constraints;
}

function displayGetUserMediaConstraints() {
  var constraints = getUserMediaConstraints(0);
  console.log('getUserMedia constraints', constraints);
  getUserMediaConstraintsDiv.textContent =
      JSON.stringify(constraints, null, '    ');
}

function createPeerConnection() {
  connectButton.disabled = true;
  detailButton.disabled = false;
  hangupButton.disabled = false;

  bytesPrev = 0;
  timestampPrev = 0;
  localPeerConnection = new RTCPeerConnection(null);
  remotePeerConnection = new RTCPeerConnection(null);
  if (adapter.browserDetails.browser != 'firefox') {
    localStream.forEach(function(stream) {
        localPeerConnection.addStream(stream);
    })

    localScreenStream.forEach(function(stream) {
            localPeerConnection.addStream(stream);
        })

  } else {
    localPeerConnection.addTrack(localStream[0].getAudioTracks()[0], localStream[0]);
    localPeerConnection.addTrack(localStream[0].getVideoTracks()[0], localStream[0]);
    localPeerConnection.addTrack(localScreenStream[0].getVideoTracks()[0], localScreenStream[0]); 
    //var sender = localPeerConnection.getSenders()[1];
    //console.log(sender);
    //var parameters = sender.getParameters();
    //console.log(parameters);
    //sender.setParameters({encodings: [{ rid: "720P", active: true, priority: "high", maxBitrate: 400000 },
    //                                  { rid: "480P", active: true, priority: "medium", maxBitrate: 200000 },
    //                                  { rid: "320P", active: true, priority: "low", maxBitrate: 100000 } ]
    //                     });
  }
  console.log('localPeerConnection creating offer');
  localPeerConnection.onnegotiationeeded = function() {
    console.log('Negotiation needed - localPeerConnection');
  };
  remotePeerConnection.onnegotiationeeded = function() {
    console.log('Negotiation needed - remotePeerConnection');
  };
  localPeerConnection.onicecandidate = function(e) {
    console.log('Candidate localPeerConnection');
    if (e.candidate) {
      remotePeerConnection.addIceCandidate(
        new RTCIceCandidate(e.candidate)
      ).then(
        onAddIceCandidateSuccess,
        onAddIceCandidateError
      );
    }
  };
  remotePeerConnection.onicecandidate = function(e) {
    console.log('Candidate remotePeerConnection');
    if (e.candidate) {
      var newCandidate = new RTCIceCandidate(e.candidate);
      localPeerConnection.addIceCandidate(
        newCandidate
      ).then(
        onAddIceCandidateSuccess,
        onAddIceCandidateError
      );
    }
  };
  remotePeerConnection.onaddstream = function(e) {
    console.log('remotePeerConnection got stream');

    for (var i = 0; i !== remoteVideo.length; ++i) {
      if (!remoteVideo[i].srcObject) {
        console.log('Attach Stream !!!!!!!!!!!!!!!!!!!!!!!!!!');

        if (!adapter.browserShim.attachMediaStream) {
          remoteVideo[i].srcObject = e.stream;
        } else {
          adapter.browserShim.attachMediaStream(remoteVideo[i], e.stream);
        }
        break;
      }
    }
      
  };
  localPeerConnection.createOffer().then(
    function(desc) {
      console.log('localPeerConnection offering');
      if (framerateLimitation == 'RID') {
         desc = framerateLimitationWithRid(desc, "offer");
      } else if (framerateLimitation == 'VP8') {
         desc = framerateLimitationVP8(desc, undefined);
      } else if (framerateLimitation == 'H264'){
         desc = framerateLimitationH264(desc, undefined);
      }
      localPeerConnection.setLocalDescription(desc);
      remotePeerConnection.setRemoteDescription(desc);

      //if (adapter.browserDetails.browser === 'firefox') {
      //
      //  var receiver = remotePeerConnection.getReceivers()[1];
      //  console.log(receiver);
      //  var parameters = receiver.getParameters();
      //  console.log(parameters);
      //  receiver.setParameters( { encodings: [ { rid: "720P", active: true, priority: "high", maxBitrate: 400000 },
      //    { rid: "480P", active: true, priority: "medium", maxBitrate: 200000 },
      //    { rid: "320P", active: true, priority: "low", maxBitrate: 100000 } ]
      //  });
      //}
      remotePeerConnection.createAnswer().then(
        function(desc2) {
          console.log('remotePeerConnection answering');
          if (framerateLimitation == 'RID') {
             desc2 = framerateLimitationWithRid(desc2, "answer");
          } else if (framerateLimitation == 'VP8') {
            desc2 = framerateLimitationVP8(desc2, undefined);
          } else if (framerateLimitation == 'H264'){
            desc2 = framerateLimitationH264(desc2, undefined);
          }
          remotePeerConnection.setLocalDescription(desc2);
          localPeerConnection.setRemoteDescription(desc2);
        },
        function(err) {
          console.log(err);
        }
      );
    },
    function(err) {
      console.log(err);
    }
  );
}

function onAddIceCandidateSuccess() {
  trace('AddIceCandidate success.');
}

function onAddIceCandidateError(error) {
  trace('Failed to add Ice Candidate: ' + error.toString());
}

// Display statistics
setInterval(function() {
  if (remotePeerConnection && remotePeerConnection.getRemoteStreams()[0]) {
    remotePeerConnection.getStats(null, function(results) {
      var statsString = dumpStats(results);
      var tinyString  = tinyStats(results);
      receiverStatsDiv.innerHTML = '<h2>Receiver stats</h2>' + statsString;
      rxStatsDiv.innerHTML = '<h2>Receiver mainly stats</h2>' + tinyString;
      // calculate video bitrate
      Object.keys(results).forEach(function(result) {
        var report = results[result];
        var now = report.timestamp;

        var bitrate;
        if (report.type === 'inboundrtp' && report.mediaType === 'video') {
          // firefox calculates the bitrate for us
          // https://bugzilla.mozilla.org/show_bug.cgi?id=951496
          bitrate = Math.floor(report.bitrateMean / 1024);
        } else if (report.type === 'ssrc' && report.bytesReceived &&
             report.googFrameHeightReceived) {
          // chrome does not so we need to do it ourselves
          var bytes = report.bytesReceived;
          if (timestampPrev) {
            bitrate = 8 * (bytes - bytesPrev) / (now - timestampPrev);
            bitrate = Math.floor(bitrate);
          }
          bytesPrev = bytes;
          timestampPrev = now;
        }
        if (bitrate) {
          bitrate += ' kbits/sec';
          bitrateDiv.innerHTML = '<strong>Bitrate:</strong> ' + bitrate;
        }
      });

      // figure out the peer's ip
      var activeCandidatePair = null;
      var remoteCandidate = null;

      // search for the candidate pair
      Object.keys(results).forEach(function(result) {
        var report = results[result];
        if (report.type === 'candidatepair' && report.selected ||
            report.type === 'googCandidatePair' &&
            report.googActiveConnection === 'true') {
          activeCandidatePair = report;
        }
      });
      if (activeCandidatePair && activeCandidatePair.remoteCandidateId) {
        Object.keys(results).forEach(function(result) {
          var report = results[result];
          if (report.type === 'remotecandidate' &&
              report.id === activeCandidatePair.remoteCandidateId) {
            remoteCandidate = report;
          }
        });
      }
      if (remoteCandidate && remoteCandidate.ipAddress &&
          remoteCandidate.portNumber) {
        peerDiv.innerHTML = '<strong>Connected to:</strong> ' +
            remoteCandidate.ipAddress +
            ':' + remoteCandidate.portNumber;
      }
    }, function(err) {
      console.log(err);
    });
    localPeerConnection.getStats(null, function(results) {
      var statsString = dumpStats(results);
      var tinyString  = tinyStats(results);
      senderStatsDiv.innerHTML = '<h2>Sender stats</h2>' + statsString;
      txStatsDiv.innerHTML = '<h2>Sender mainly stats</h2>' + tinyString;
    }, function(err) {
      console.log(err);
    });
  } else {
    ;
    //console.log('Not connected yet');
  }
  // Collect some stats from the video tags.
  if (localVideo.videoWidth) {
    localVideoStatsDiv.innerHTML = '<strong>Video dimensions:</strong> ' +
      localVideo.videoWidth + 'x' + localVideo.videoHeight + 'px';
  }

  if (localScreen.videoWidth) {
    localScreenStatsDiv.innerHTML = '<strong>Video dimensions:</strong> ' +
       localScreen.videoWidth + 'x' + localScreen.videoHeight + 'px';
  }

  if (remoteVideo.length > 0) {
    for (var index = 0; index < remoteVideo.length; index += 1) {
      if (remoteVideo[index].videoWidth) {
        remoteVideoStatsDiv[index].innerHTML = '<strong>Video dimensions:</strong> ' +
           remoteVideo[index].videoWidth + 'x' + remoteVideo[index].videoHeight + 'px';
      }
    }
  }
}, 1000);

// Dumping a stats variable as a string.
// might be named toString?
function dumpStats(results) {
  var statsString = '';
  Object.keys(results).forEach(function(key, index) {
    var res = results[key];
    statsString += '<h3>Report ';
    statsString += index;
    statsString += '</h3>\n';
    statsString += 'time ' + res.timestamp + '<br>\n';
    statsString += 'type ' + res.type + '<br>\n';
    Object.keys(res).forEach(function(k) {
      if (k !== 'timestamp' && k !== 'type') {
        statsString += k + ': ' + res[k] + '<br>\n';
      }
    });
  });
  return statsString;
}

function tinyStats(results) {
  var statsString = '';
  var framerate = 'NaN';
  var bytes = 'NaN';
  var packets = 'NaN';

  Object.keys(results).forEach(function(key, index) {
    var res = results[key];

    if (adapter.browserDetails.browser == "firefox") {
      if (key.match(/outbound_rtp_video_[\d.]+/)) {
          Object.keys(res).forEach(function(k) {
                  //Local video sent
                    if (k == 'framerateMean') {
                      framerate = Math.round(res[k]);
                    } else if (k == 'bytesSent'){
                      bytes = res[k];
                    } else if (k == 'packetsSent') {
                      packets = res[k];
                    }
          });
      } else if (key.match(/inbound_rtp_video_[\d.]+/)) {
          Object.keys(res).forEach(function(k) {
                  //Local video received
                    if (k == 'framerateMean') {
                      framerate = Math.round(res[k]);
                    } else if (k == 'bytesReceived'){
                      bytes = res[k];
                    } else if (k == 'packetsReceived') {
                      packets = res[k];
                    }
          });
      }
    } else {
         if (res.type == 'ssrc' && res['googFrameHeightReceived'] != undefined ) {
            Object.keys(res).forEach(function(k) {
              //Local video received
                    if (k == 'googFrameRateReceived') {
                      framerate = res[k];
                    } else if (k == 'bytesReceived'){
                      bytes = res[k];
                    } else if (k == 'packetsReceived') {
                      packets = res[k];
                    }
            });
          } else if (res.type == 'ssrc' && res['googFrameHeightSent'] != undefined) {
            Object.keys(res).forEach(function(k) {
              //Local video sent
                if (k == 'googFrameRateSent') {
                      framerate = res[k];
                    } else if (k == 'bytesSent'){
                      bytes = res[k];
                    } else if (k == 'packetsSent') {
                      packets = res[k];
                    }
            });
          }
    }
  });
  statsString += 'FrameRate: '+framerate+'<br>\n';
  statsString += 'Bytes: '+bytes+'<br>\n';
  statsString += 'Packets: '+packets+'<br>\n';

  return statsString;
}


function pressedButton(e) {
  this.pressed = true;
}

function releasedButton(e) {
  this.pressed = false;
}

function moveSlick(e){
  if (this.pressed == true) {
    displayRangeValue(e);
  }
}

// Utility to show the value of a range in a sibling span element
function displayRangeValue(e) {
    var span = e.target.parentElement.querySelector('span');
    span.textContent = e.target.value;
    displayGetUserMediaConstraints();
}

//Limitation with rid. see: https://tools.ietf.org/pdf/draft-ietf-mmusic-rid-07.pdf
function framerateLimitationWithRid(description, mode) {
  var descWithRid = description;
  var direct_1 = "send";
  var direct_2 = "recv";

  if (mode == "offer") {
    //Keep original send or recv
    ;
  } else {
    //Need to reverse send as recv.
    direct_1 = "recv";
    direct_2 = "send";
  }

  if (adapter.browserDetails.browser == 'firefox') {
    if (maxFramerateInput.value !== '0') {
     if (mode == "offer") {
        descWithRid.sdp = description.sdp.replace(/a=mid:sdparta_1\r\n/g, 'a=mid:sdparta_1\r\na=rid:1 '+direct_1+
                                                  ' max-fps='+maxFramerateInput.value+';max-br=512000\r\na=rid:2 '+
                                                  direct_2+' max-fps='+maxFramerateInput.value+';max-br=512000\r\na=simulcast: '+direct_1+' rid=1 '+direct_2+' rid=2\r\n');
     } else {
        //Firefox require the media sendrecv must match with the rid send / recv.
        descWithRid.sdp = description.sdp.replace(/a=mid:sdparta_1\r\n/g, 'a=mid:sdparta_1\r\na=rid:1 '+direct_1+
                                                  ' max-fps='+maxFramerateInput.value+';max-br=512000\r\na=simulcast: '+direct_1+' rid=1\r\n');
     }
    }
  } else {
    if (maxFramerateInput.value !== '0') {
      descWithRid.sdp = description.sdp.replace(/a=mid:video\r\n/g, 'a=mid:video\r\na=rid:1 '+direct_1+
                                                ' max-fps='+maxFramerateInput.value+';max-br=512000\r\na=rid:2 '+
                                                direct_2+' max-fps='+maxFramerateInput.value+';max-br=512000\r\na=simulcast: '+direct_1+' rid=1 '+direct_2+' rid=2\r\n');
    }
  }
  console.log("The new "+mode+" description: ");
  console.log(descWithRid.sdp);

  return descWithRid;
}

//Apply constraints change, for Firfox only
function applyChange() {

  var constraints = {};
  if (minWidthInput.value !== '0') {
    constraints.width = {};
    constraints.width.min = minWidthInput.value;
  }
  if (maxWidthInput.value !== '0') {
    constraints.width = constraints.width || {};
    constraints.width.max = maxWidthInput.value;
  }
  if (minHeightInput.value !== '0') {
    constraints.height = {};
    constraints.height.min = minHeightInput.value;
  }
  if (maxHeightInput.value !== '0') {
    constraints.height = constraints.height || {};
    constraints.height.max = maxHeightInput.value;
  }

  if (minFramerateInput.value !== '0') {
    constraints.frameRate = constraints.frameRate || {};
    constraints.frameRate.min = minFramerateInput.value;
  }
  if (maxFramerateInput.value !== '0') {
    constraints.frameRate = constraints.frameRate || {};
    constraints.frameRate.max = maxFramerateInput.value;
  }
  
  if (localStream.length > 0) {
    console.log("Apply MediaTrackConstraints: "+ constraints);
    localStream[0].getVideoTracks()[0].applyConstraints(constraints);
  }

}

//Limitation for VP8 with max-fr 
function framerateLimitationVP8(description, payload) {
  var descVP8 = description;

  //Get the right payload type of VP8
  var payload = descVP8.sdp.match(/a=rtpmap:([0-9]*) VP8\/90000/)[1];

  var fs;
  if (minHeightInput.value > 0 && minWidthInput.value > 0) {
    fs = parseInt(minHeightInput.value * minWidthInput.value / 256);
  } else {
    fs = parseInt( 640 * 480 / 256 );
  }

  if (adapter.browserDetails.browser == 'firefox') {
    if (maxFramerateInput.value !== '0') {
      var org = "a=fmtp:"+payload+" max-fs=12288;max-fr=60\r\n";
      var chg = "a=fmtp:"+payload+" max-fs="+fs+";max-fr="+maxFramerateInput.value+"\r\n";

      descVP8.sdp = description.sdp.replace(org, chg);
    }
  } else {
    if (maxFramerateInput.value !== '0') {
      var org = "a=rtpmap:"+payload+" VP8\/90000\r\n";
      var chg = "a=rtpmap:"+payload+" VP8\/90000\r\na=fmtp:"+payload+" max-fs="+fs+";max-fr="+maxFramerateInput.value+"\r\n";

      descVP8.sdp = description.sdp.replace(org, chg);
    }
  }
  console.log("The new VP8 description: ");
  console.log(descVP8.sdp);

  return descVP8;
}

//Limitation for H264 with max-mbps 
function framerateLimitationH264(description, payload) {
  var descH264 = description;

  //Get the right payload type of H264
  var payload = descH264.sdp.match(/a=rtpmap:([0-9]*) H264\/90000/)[1];
  var mLine  = descH264.sdp.match(/m=video [0-9]* [A-Z\/]* [0-9 ]*/)[0];
  var payloads = descH264.sdp.match(/m=video [0-9]* [A-Z\/]* ([0-9 ]*)/)[1].split(' ');
  var finalCodecList = payload;
  payloads.forEach( function (_payload) { if ( _payload != payload ) { finalCodecList += " " + _payload; } } );
  var newMLine = mLine.match(/m=video [0-9]* [A-Z\/]* /)[0] + finalCodecList;

  //make sure the first video codec is H264
  description.sdp = description.sdp.replace(mLine, newMLine);

  var fs;
  if (minHeightInput.value > 0 && minWidthInput.value > 0) {
    fs = parseInt(minHeightInput.value * minWidthInput.value / 256);
  } else {
    fs = parseInt( 640 * 480 / 256 );
  }

  var mbps = maxFramerateInput.value * fs;
  
  
  if (adapter.browserDetails.browser == 'firefox') {

    //set max-mbps as frameRate * maxWidth * maxHeight  ; max-fs as maxWidth * maxHeight / 16
    if (maxFramerateInput.value !== '0') {
      var org = "a=fmtp:"+payload+" profile-level-id=42e01f;level-asymmetry-allowed=1;packetization-mode=1\r\n";
      var chg = "a=fmtp:"+payload+" profile-level-id=42e01f;level-asymmetry-allowed=1;packetization-mode=1;max-mbps="+mbps+";max-fs="+fs+"\r\n";
      descH264.sdp = description.sdp.replace(org, chg);
    }
  } else {

    //set max-mbps as frameRate * maxWidth * maxHeight  ; max-fs as maxWidth * maxHeight / 16
    if (maxFramerateInput.value !== '0') {
      var org = "a=fmtp:"+payload+" level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f\r\n";
      var chg = "a=fmtp:"+payload+" level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f;max-mbps="+mbps+";max-fs="+fs+"\r\n";
      descH264.sdp = description.sdp.replace(org, chg);
    }
  }
  console.log("The new H264 description: ");
  console.log(descH264.sdp);

  return descH264;
}



