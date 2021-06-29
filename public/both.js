var socket = io();

window.onload = () => {
    document.getElementById('my-button').onclick = () => {
        init();
    }
}

function success() {};
function failure(e) { console.log(e); };

const videoGrid = document.getElementById('video-grid');
const primaryVideo = document.getElementById('first');
const secondaryVideo = document.getElementById('second');
let first = false;
let second = false;

var snd = new Audio("join.mp3");
var sndl = new Audio("leave.mp3");

var streams = [];


async function init() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    document.getElementById("video").srcObject = stream;
    const peer = createPeer();
    peer.addTransceiver("video");
    peer.addTransceiver("video");
    peer.addTransceiver("video");
    peer.addTransceiver("video");
    peer.addTransceiver("video");
    peer.addTransceiver("video");
    peer.addTransceiver("video");
    peer.addTransceiver("video");
    stream.getTracks().forEach(track => peer.addTrack(track, stream));
    userId = stream.id;
    socket.emit('joined', stream.id);
}


function createPeer() {
    const peer = new RTCPeerConnection({
        iceServers: [
            {
                urls: "stun:stun.stunprotocol.org"
            }
        ]
    });
    peer.ontrack = onNewTrack;
    peer.onnegotiationneeded = () => handleNegotiationNeededEvent(peer);

    return peer;
}

function createPeerUpdate(streamId) {
    const peer = new RTCPeerConnection({
        iceServers: [
            {
                urls: "stun:stun.stunprotocol.org"
            }
        ]
    });
    peer.ontrack = onNewTrack;
    peer.onnegotiationneeded = () => handleNegotiationNeededEventUpdate(peer, streamId);

    return peer;
}

function onNewTrack(e) {

    if(!streams.includes(e.streams[0].id)) {
        streams.push(e.streams[0].id);

        const video = document.createElement('video');
        console.log(e);
        video.srcObject = e.streams[0];

        video.addEventListener('loadedmetadata', () => {
            video.play()
        })

        if(!first) {
            first = true;
            primaryVideo.append(video);
        } else if (!second) {
            second = true;
            secondaryVideo.append(video);
        } else {
            videoGrid.append(video);
        }
    }
}

async function handleNegotiationNeededEvent(peer) {

    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    const payload = {
        sdp: peer.localDescription
    };

    const { data } = await axios.post('/both', payload);
    const desc = new RTCSessionDescription(data.sdp);
    peer.setRemoteDescription(desc).catch(e => console.log(e));
}

async function handleNegotiationNeededEventUpdate(peer, streamId) {

    console.log("handle Update for: " + streamId);
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    const payload = {
        sdp: peer.localDescription,
        stream: streamId
    };

    const { data } = await axios.post('/bothUpdate', payload);
    const desc = new RTCSessionDescription(data.sdp);
    peer.setRemoteDescription(desc).catch(e => console.log(e));
}

function handleTrackEvent(e) {

    if(!streams.includes(e.streams[0].id)) {
        console.log("IM IN");
        streams.push(e.streams[0].id);
        const container = document.createElement('div')
        container.className = 'video-div';
        const video = document.createElement('video');
        console.log(e);
        video.srcObject = e.streams[0];
    
        video.addEventListener('loadedmetadata', () => {
            video.play()
        })
    
        if(!first) {
            first = true;
            container.append(video);
            primaryVideo.append(container);
        } else if (!second) {
            second = true;
            container.append(video);
            secondaryVideo.append(container);
        } else {
            container.append(video);
            videoGrid.append(container);
        }
    }

    /*
    var isAdded = false;
    if(e.streams[0].id == primaryVideo.lastChild.srcObject.id) {
        isAdded = true;
    } else if (e.streams[0].id == secondaryVideo.lastChild.srcObject.id) {
        isAdded = true; 
    } else {
        for (let i = 2; i < videoGrid.children.length; i++) {
            if (videoGrid.children[i].srcObject.id == e.streams[0].id) {
                isAdded = true;
            }
        }
    }
    */

    
};

function callMe(e) {
    console.log(e);
}

socket.on('renegotiation', (streamId) => {
    //maybe add a timeout to process addition
    setTimeout(function(){ 
        const peer = createPeerUpdate(streamId);
        peer.addTransceiver("video");
        peer.addTransceiver("video");
        peer.addTransceiver("video");
        peer.addTransceiver("video");
        peer.addTransceiver("video");
        peer.addTransceiver("video");
        peer.addTransceiver("video");
        peer.addTransceiver("video"); 
        console.log('timeout done');
    }, 1000);
    snd.currentTime=0;
    snd.play();
});  

socket.on('left', (indexCon) => {
    console.log('disconnect from stream Id: ' + indexCon);
    
    if(indexCon == primaryVideo.lastChild.srcObject.id) {
        primaryVideo.removeChild(primaryVideo.lastChild);
        if(secondaryVideo.lastChild != null) {
            primaryVideo.append(secondaryVideo.lastChild);
            //secondaryVideo.removeChild(secondaryVideo.lastChild);
            if(videoGrid.children[2] != null) {
                secondaryVideo.append(videoGrid.children[2]);
                //videoGrid.removeChild(videoGrid.children[2]);
            } else {
                second = false;
            }
        } else {
            first = false;
        }
    } else if (indexCon == secondaryVideo.lastChild.srcObject.id) {
        secondaryVideo.removeChild(secondaryVideo.lastChild)
        if(videoGrid.children[2] != null) {
            secondaryVideo.append(videoGrid.children[2]);
            //videoGrid.removeChild(videoGrid.children[2]);
        } else {
            second = false;
        }
    } else {
        for (let i = 2; i < videoGrid.children.length; i++) {
            if (videoGrid.children[i].srcObject.id == indexCon) {
                videoGrid.removeChild(videoGrid.children[i]);
            }
        }
    }
    
    sndl.currentTime=0;
    sndl.play();
});

//IMPORTANT
//https://stackoverflow.com/questions/38279635/webrtc-remotevideo-stream-not-working