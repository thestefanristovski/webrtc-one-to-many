var socket = io();

window.onload = () => {
    document.getElementById('my-button').onclick = () => {
        init();
    }
}


//const OGpeer;


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
    socket.emit('joined');
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

function createPeerUpdate() {
    const peer = new RTCPeerConnection({
        iceServers: [
            {
                urls: "stun:stun.stunprotocol.org"
            }
        ]
    });
    peer.ontrack = onNewTrack;
    peer.onnegotiationneeded = () => handleNegotiationNeededEventUpdate(peer);

    return peer;
}

function onNewTrack(e) {
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

async function handleNegotiationNeededEventUpdate(peer) {

    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    const payload = {
        sdp: peer.localDescription
    };

    const { data } = await axios.post('/bothUpdate', payload);
    const desc = new RTCSessionDescription(data.sdp);
    peer.setRemoteDescription(desc).catch(e => console.log(e));
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


function handleTrackEvent(e) {
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

};

function callMe(e) {
    console.log(e);
}

socket.on('renegotiation', (indexCon) => {
    console.log("timeout start for" + indexCon);
    console.log(indexCon);
    //maybe add a timeout to process addition
    setTimeout(function(){ 
        const peer = createPeerUpdate();
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
    console.log('disconnect from ' + indexCon);
    if(indexCon == 0) {
        console.log('children');
        console.log(videoGrid.children);
        primaryVideo.removeChild(primaryVideo.lastChild);
        console.log(videoGrid.children);
        if(secondaryVideo.lastChild != null) {
            primaryVideo.append(secondaryVideo.lastChild);
            console.log(videoGrid.children);
            //secondaryVideo.removeChild(secondaryVideo.lastChild);
            console.log(videoGrid.children);
            if(videoGrid.children[2] != null) {
                secondaryVideo.append(videoGrid.children[2]);
                //videoGrid.removeChild(videoGrid.children[2]);
            } else {
                second = false;
            }
        } else {
            first = false;
        }
    } else if (indexCon == 1) {
        secondaryVideo.removeChild(secondaryVideo.lastChild)
        if(videoGrid.children[2] != null) {
            console.log("trying to append and remove")
            console.log(videoGrid.children[2]);
            secondaryVideo.append(videoGrid.children[2]);
            //THIS LINE PROBLEMATIC
            //videoGrid.removeChild(videoGrid.children[2]);
        } else {
            second = false;
        }
    } else {
        videoGrid.removeChild(videoGrid.children[indexCon]);
    }
    sndl.currentTime=0;
    sndl.play();
});

//IMPORTANT
//https://stackoverflow.com/questions/38279635/webrtc-remotevideo-stream-not-working