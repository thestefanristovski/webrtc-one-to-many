const express = require('express');
const https = require('https');
const app = express();
const fs = require('fs');

const options = {
    key: fs.readFileSync('server.key'),
    cert: fs.readFileSync('server.cert')
};

const server = https.createServer(options, app);
const { Server } = require("socket.io");
const io = new Server(server);

const bodyParser = require('body-parser');
const webrtc = require("wrtc");



let senderStream = [];

let connections = [];

app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post("/consumer", async ({ body }, res) => {
    const peer = new webrtc.RTCPeerConnection({
        iceServers: [
            {
                urls: "stun:stun.stunprotocol.org"
            }
        ]
    });
    const desc = new webrtc.RTCSessionDescription(body.sdp);
    await peer.setRemoteDescription(desc);
    //senderStream.forEach(stream => {
    //    stream.getTracks().forEach(track => peer.addTrack(track, senderStream));
    //});

    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    const payload = {
        sdp: peer.localDescription
    }

    res.json(payload);
});

app.post('/broadcast', async ({ body }, res) => {
    const peer = new webrtc.RTCPeerConnection({
        iceServers: [
            {
                urls: "stun:stun.stunprotocol.org"
            }
        ]
    });
    peer.ontrack = (e) => handleTrackEvent(e, peer);
    const desc = new webrtc.RTCSessionDescription(body.sdp);
    await peer.setRemoteDescription(desc);
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    const payload = {
        sdp: peer.localDescription
    }


    res.json(payload);
});

app.post('/both', async ({body}, res) => {
    const peer = new webrtc.RTCPeerConnection({
        iceServers: [
            {
                urls: "stun:stun.stunprotocol.org"
            }
        ]
    });
    //handle on track (broadcast)
    peer.ontrack = (e) => handleTrackEvent(e, peer);
    //end
    const desc = new webrtc.RTCSessionDescription(body.sdp);
    await peer.setRemoteDescription(desc);
    //add tracks for peer
    let done = false;

    senderStream.forEach(stream => {
        if(stream != undefined) {
            stream.getTracks().forEach(track => {
                try{
                    peer.addTrack(track, stream);
                } catch (e) {
                    console.log(e);
                }
            });
        }
    });

    //end (consumer)
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    const payload = {
        sdp: peer.localDescription
    }

    res.json(payload);
});


function handleTrackEvent(e, peer) {
    if(e.streams[0]!= undefined) {
        senderStream.push(e.streams[0]);
    }
};

app.post('/bothUpdate', async ({body}, res) => {
    const peer = new webrtc.RTCPeerConnection({
        iceServers: [
            {
                urls: "stun:stun.stunprotocol.org"
            }
        ]
    });
    const desc = new webrtc.RTCSessionDescription(body.sdp);
    await peer.setRemoteDescription(desc);
    //add tracks for peer
    let done = false;

    senderStream[senderStream.length-1].getTracks().forEach(track => {
        try{
            peer.addTrack(track, senderStream[senderStream.length-1]);
        } catch (e) {
            console.log(e);
        }
    });

    //end (consumer)
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    const payload = {
        sdp: peer.localDescription
    }

    res.json(payload);
});

io.on('connection', (socket) => {
    console.log("user opened");
    connections.push(socket);
    socket.on('joined', () => {
        console.log('a user connected');
        console.log(connections.lastIndexOf(socket));
        socket.broadcast.emit('renegotiation', connections.lastIndexOf(socket));
    });
    socket.on('disconnect', () => {
        io.emit('left', connections.lastIndexOf(socket));
        senderStream.splice(connections.lastIndexOf(socket), 1);
        connections.splice(connections.lastIndexOf(socket), 1);
    });
});

server.listen(3001, () => console.log('server started'));