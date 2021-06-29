const express = require('express');
const https = require('http');
const app = express();
const fs = require('fs');
//require('jsdom-global')()
//const { createCanvas, loadImage } = require('canvas')

//var crel = require('crel');
//var videoproc = require('videoproc');

const options = {
    //key: fs.readFileSync('server.key'),
    //cert: fs.readFileSync('server.cert')
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

        /*
        var video = document.createElement('video');
        var image = document.createElement('img');
        image.srcObject = e.streams[0];

        var canvas = createCanvas(video.videoWidth, video.videoHeight)
        var ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0);
        */
       /*
       e.streams[0].getTracks().forEach((track) => {
            var imageCapture = new ImageCapture(track);
            imageCapture.takePhoto().then(function (blob) {
                console.log("took photo" + blob);
            });
       })*/

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

    const isElement = (element) => element.id == body.stream;

    index = senderStream.findIndex(isElement);
    senderStream[index].getTracks().forEach(track => {
        try{
            peer.addTrack(track, senderStream[index]); 
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
    socket.on('joined', (streamId) => {
        console.log('a user connected with stream id: ' + streamId);
        connectionEl = {
            socket: socket,
            id: streamId
        };
        connections.push(connectionEl);
        socket.broadcast.emit('renegotiation', streamId);
    });
    socket.on('disconnect', () => {
        //find socket in connections and extract stream id
        const isSocket = (element) => element.socket == socket;
        socketIndex = connections.findIndex(isSocket);
        socketStreamId = connections[socketIndex].id;

        //find stream in senderStream
        const isStream = (element) => element.id == socketStreamId;
        streamIndex = senderStream.findIndex(isStream);

        io.emit('left', socketStreamId);
        senderStream.splice(streamIndex, 1);
        connections.splice(socketIndex, 1);
    });
});

server.listen(5000, () => console.log('server started'));
//server.listen(3001, () => console.log('server started'));