$(document).ready(function() {
    $('button.mode-switch').click(function() {
        $('body').toggleClass('dark');
    });

    $(".btn-close-right").click(function() {
        $(".right-side").removeClass("show");
        $(".expand-btn").addClass("show");
    });

    $(".expand-btn").click(function() {
        $(".right-side").addClass("show");
        $(this).removeClass("show");
    });
});


function updateScroll() {
    var element = document.getElementById("chat-area");
    element.scrollTop = element.scrollHeight;
}


let localstream
let configuration = [{
    iceServers: {
        "urls": ["stun:stun.l.google.com:19302",
            "stun:stun2.l.google.com:19302",
            "stun:stun1.l.google.com:19302"
        ]
    },
}]

function addmed() {
    navigator.getUserMedia({
        video: true,
        audio: true
    }, (stream) => {
        localstream = stream
        document.getElementById('local-video').srcObject = localstream
        addlc()
    }, (error) => {
        console.log(error)
    })
}

addmed()

let lc = new RTCPeerConnection(configuration)
let dc


lc.ontrack = e => {
    document.getElementById('remote-video').srcObject = e.streams[0]
}

function addlc() {
    localstream.getTracks().forEach(function(track) {
        lc.addTrack(track, localstream);
    });
}

usr = ""

function storeoffer(id, offer) {
    i = 0
    lc.onicecandidate = e => {
        i += 1
        if (i == 1) {
            answer(id, JSON.stringify(lc.localDescription))
        }
    }
    lc.ondatachannel = e => {
        lc.dc = e.channel
        lc.dc.onmessage = e => {
            mess = JSON.parse(e.data)
            if (mess.type == "message") {
                document.getElementById('chat-area').innerHTML += `
                <div class="message-wrapper">
                        <div class="message-content">
                            <div class="message">${mess.message}</div>
                        </div>
                    </div>
                `
                updateScroll()
            } else if (mess.type == "typing") {
                if (typeof interv != 'undefined') {
                    clearInterval(interv)
                }
                document.getElementById('typing').innerText = 'typing...'
                interv = setInterval(() => {
                    document.getElementById('typing').innerText = 'Stranger'
                }, 2000)
            }
        }
        lc.dc.onopen = e => {
            document.getElementById("chat-area").innerHTML = ""
            document.getElementById("typing").innerHTML = "Stranger Connected"
            document.getElementById('chat-input-area').innerHTML = `
            <div class="chat-typing-area">
                <input type="text" placeholder="Type your meesage..." class="chat-input" id="message" onkeyup="typing(event)">
                <button class="send-button" onclick="sendmessage()">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-send" viewBox="0 0 24 24">
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                    </svg>
                </button>
            </div>
            `
        }
        lc.dc.onclose = e => {
            document.getElementById("typing").innerHTML = "Connection closed!"
            endcall()
        }
    }
    lc.setRemoteDescription(JSON.parse(offer))
    lc.createAnswer().then(a => lc.setLocalDescription(a))
    usr = "rec"
}


function createoffer(id) {
    dc = lc.createDataChannel(`${id}`)
    dc.onmessage = e => {
        mess = JSON.parse(e.data)
        if (mess.type == "message") {
            document.getElementById('chat-area').innerHTML += `
        <div class="message-wrapper">
                <div class="message-content">
                    <div class="message">${mess.message}</div>
                </div>
            </div>
        `
            updateScroll()
        } else if (mess.type == "typing") {
            if (typeof interv != 'undefined') {
                clearInterval(interv)
            }
            document.getElementById('typing').innerText = 'typing...'
            interv = setInterval(() => {
                document.getElementById('typing').innerText = 'Stranger'
            }, 2000)
        }
    }
    dc.onopen = e => {
        document.getElementById("chat-area").innerHTML = ""
        document.getElementById("typing").innerHTML = "Stranger Connected"
        document.getElementById('chat-input-area').innerHTML = `
        <div class="chat-typing-area">
            <input type="text" placeholder="Type your meesage..." class="chat-input" id="message" onkeyup="typing(event)">
            <button class="send-button" onclick="sendmessage()">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-send" viewBox="0 0 24 24">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                </svg>
            </button>
        </div>
        `
    }
    dc.onclose = e => {
        document.getElementById("typing").innerHTML = "Connection closed!"
        endcall()
    }

    i = 0
    lc.onicecandidate = e => {
        i += 1
        if (i == 1) {
            create(id, JSON.stringify(lc.localDescription))
        }
    }

    lc.createOffer().then(o => lc.setLocalDescription(o))
    usr = "cre"
}

function storeanswer(answer) {
    lc.setRemoteDescription(JSON.parse(answer))
}

function sendmessage() {
    message = document.getElementById('message').value

    if (message.trim() != '') {
        message = message.replace(/</g, '&lt;').replace(/>/g, '&gt;')
        mess = {
            type: "message",
            message: message
        }
        document.getElementById('chat-area').innerHTML += `
        <div class="message-wrapper reverse">
            <div class="message-content">
                <div class="message">${message}</div>
            </div>
        </div>
        `
        updateScroll()
        if (usr == "cre") {
            dc.send(JSON.stringify(mess))
        } else if (usr == "rec") {
            lc.dc.send(JSON.stringify(mess))
        }
        document.getElementById('message').value = ''
    }

}

function typing(e) {
    var key = e.keyCode || e.which;
    if (key == 13) {
        sendmessage()
    }

    mess = {
        type: "typing",
    }
    if (usr == "cre") {
        dc.send(JSON.stringify(mess))
    } else if (usr == "rec") {
        lc.dc.send(JSON.stringify(mess))
    }
}


function create(id, offer) {
    url = "/create"
    data = { 'id': id, 'offer': offer }
    $.ajax({
        'type': 'post',
        'url': url,
        'data': JSON.stringify(data),
        'success': function(response) {
            if (response.status == "success") {
                justcheck(response.id)
            } else {
                endcall()
                check()
            }
        },
        'error': function(error) {
            console.log(error)
        }
    })
}

function check() {
    document.getElementById('actions').innerHTML = `
    <button class="video-action-button" id="mic" onclick="mic()">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-mic" viewBox="0 0 16 16">
            <path d="M3.5 6.5A.5.5 0 0 1 4 7v1a4 4 0 0 0 8 0V7a.5.5 0 0 1 1 0v1a5 5 0 0 1-4.5 4.975V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 .5-.5z"/>
            <path d="M10 8a2 2 0 1 1-4 0V3a2 2 0 1 1 4 0v5zM8 0a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V3a3 3 0 0 0-3-3z"/>
        </svg>
    </button>
    <button class="video-action-button" id="camera" onclick="camera()">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-camera-video" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M0 5a2 2 0 0 1 2-2h7.5a2 2 0 0 1 1.983 1.738l3.11-1.382A1 1 0 0 1 16 4.269v7.462a1 1 0 0 1-1.406.913l-3.111-1.382A2 2 0 0 1 9.5 13H2a2 2 0 0 1-2-2V5zm11.5 5.175 3.5 1.556V4.269l-3.5 1.556v4.35zM2 4a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h7.5a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1H2z"/>
        </svg>
    </button>
    <button class="video-action-button" style="width: 100px;" id="check" onclick="check()">
        Searching users...
    </button>
    `

    document.getElementById('remote-vid').innerHTML = `<video id="remote-video" autoplay></video>`
    url = "/check"
    $.get(url, function(response) {
        if (response.status == "success") {
            if (response.found == 'yes') {
                storeoffer(response.id, response.offer)
            } else {
                createoffer(response.id)
            }
        } else if (response.status == "fail") {
            endcall()
            check()
        }
    })
}

function answer(id, answer) {
    url = "/answer"
    data = { 'id': id, 'answer': answer }
    $.ajax({
        'type': 'post',
        'url': url,
        'data': JSON.stringify(data),
        'success': function(response) {
            if (response.status == "fail") {
                endcall()
                check()
            } else {
                document.getElementById('actions').innerHTML = `
                <button class="video-action-button" id="mic" onclick="mic()">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-mic" viewBox="0 0 16 16">
                        <path d="M3.5 6.5A.5.5 0 0 1 4 7v1a4 4 0 0 0 8 0V7a.5.5 0 0 1 1 0v1a5 5 0 0 1-4.5 4.975V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 .5-.5z"/>
                        <path d="M10 8a2 2 0 1 1-4 0V3a2 2 0 1 1 4 0v5zM8 0a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V3a3 3 0 0 0-3-3z"/>
                    </svg>
                </button>
                <button class="video-action-button" id="camera" onclick="camera()">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-camera-video" viewBox="0 0 16 16">
                        <path fill-rule="evenodd" d="M0 5a2 2 0 0 1 2-2h7.5a2 2 0 0 1 1.983 1.738l3.11-1.382A1 1 0 0 1 16 4.269v7.462a1 1 0 0 1-1.406.913l-3.111-1.382A2 2 0 0 1 9.5 13H2a2 2 0 0 1-2-2V5zm11.5 5.175 3.5 1.556V4.269l-3.5 1.556v4.35zM2 4a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h7.5a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1H2z"/>
                    </svg>
                </button>
                <button class="video-action-button" id="endcall" onclick="endcall()">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-telephone-x" viewBox="0 0 16 16">
                        <path d="M3.654 1.328a.678.678 0 0 0-1.015-.063L1.605 2.3c-.483.484-.661 1.169-.45 1.77a17.568 17.568 0 0 0 4.168 6.608 17.569 17.569 0 0 0 6.608 4.168c.601.211 1.286.033 1.77-.45l1.034-1.034a.678.678 0 0 0-.063-1.015l-2.307-1.794a.678.678 0 0 0-.58-.122l-2.19.547a1.745 1.745 0 0 1-1.657-.459L5.482 8.062a1.745 1.745 0 0 1-.46-1.657l.548-2.19a.678.678 0 0 0-.122-.58L3.654 1.328zM1.884.511a1.745 1.745 0 0 1 2.612.163L6.29 2.98c.329.423.445.974.315 1.494l-.547 2.19a.678.678 0 0 0 .178.643l2.457 2.457a.678.678 0 0 0 .644.178l2.189-.547a1.745 1.745 0 0 1 1.494.315l2.306 1.794c.829.645.905 1.87.163 2.611l-1.034 1.034c-.74.74-1.846 1.065-2.877.702a18.634 18.634 0 0 1-7.01-4.42 18.634 18.634 0 0 1-4.42-7.009c-.362-1.03-.037-2.137.703-2.877L1.885.511z"/>
                        <path fill-rule="evenodd" d="M11.146 1.646a.5.5 0 0 1 .708 0L13 2.793l1.146-1.147a.5.5 0 0 1 .708.708L13.707 3.5l1.147 1.146a.5.5 0 0 1-.708.708L13 4.207l-1.146 1.147a.5.5 0 0 1-.708-.708L12.293 3.5l-1.147-1.146a.5.5 0 0 1 0-.708z"/>
                    </svg>
                </button>
                `
            }
        },
        'error': function(error) {
            console.log(error)
        }
    })
}

function justcheck(id) {
    document.getElementById('actions').innerHTML = `
    <button class="video-action-button" id="mic" onclick="mic()">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-mic" viewBox="0 0 16 16">
            <path d="M3.5 6.5A.5.5 0 0 1 4 7v1a4 4 0 0 0 8 0V7a.5.5 0 0 1 1 0v1a5 5 0 0 1-4.5 4.975V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 .5-.5z"/>
            <path d="M10 8a2 2 0 1 1-4 0V3a2 2 0 1 1 4 0v5zM8 0a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V3a3 3 0 0 0-3-3z"/>
        </svg>
    </button>
    <button class="video-action-button" id="camera" onclick="camera()">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-camera-video" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M0 5a2 2 0 0 1 2-2h7.5a2 2 0 0 1 1.983 1.738l3.11-1.382A1 1 0 0 1 16 4.269v7.462a1 1 0 0 1-1.406.913l-3.111-1.382A2 2 0 0 1 9.5 13H2a2 2 0 0 1-2-2V5zm11.5 5.175 3.5 1.556V4.269l-3.5 1.556v4.35zM2 4a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h7.5a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1H2z"/>
        </svg>
    </button>
    <button class="video-action-button" style="width: 100px;" id="check" onclick="check()">
        Searching users...
    </button>
    `
    url = `/check_answer-${id}`
    $.get(url, function(response) {
        if (response.status == "success") {
            if (response.found == "yes") {
                document.getElementById('actions').innerHTML = `
                <button class="video-action-button" id="mic" onclick="mic()">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-mic" viewBox="0 0 16 16">
                        <path d="M3.5 6.5A.5.5 0 0 1 4 7v1a4 4 0 0 0 8 0V7a.5.5 0 0 1 1 0v1a5 5 0 0 1-4.5 4.975V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 .5-.5z"/>
                        <path d="M10 8a2 2 0 1 1-4 0V3a2 2 0 1 1 4 0v5zM8 0a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V3a3 3 0 0 0-3-3z"/>
                    </svg>
                </button>
                <button class="video-action-button" id="camera" onclick="camera()">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-camera-video" viewBox="0 0 16 16">
                        <path fill-rule="evenodd" d="M0 5a2 2 0 0 1 2-2h7.5a2 2 0 0 1 1.983 1.738l3.11-1.382A1 1 0 0 1 16 4.269v7.462a1 1 0 0 1-1.406.913l-3.111-1.382A2 2 0 0 1 9.5 13H2a2 2 0 0 1-2-2V5zm11.5 5.175 3.5 1.556V4.269l-3.5 1.556v4.35zM2 4a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h7.5a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1H2z"/>
                    </svg>
                </button>
                <button class="video-action-button" id="endcall" onclick="endcall()">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-telephone-x" viewBox="0 0 16 16">
                        <path d="M3.654 1.328a.678.678 0 0 0-1.015-.063L1.605 2.3c-.483.484-.661 1.169-.45 1.77a17.568 17.568 0 0 0 4.168 6.608 17.569 17.569 0 0 0 6.608 4.168c.601.211 1.286.033 1.77-.45l1.034-1.034a.678.678 0 0 0-.063-1.015l-2.307-1.794a.678.678 0 0 0-.58-.122l-2.19.547a1.745 1.745 0 0 1-1.657-.459L5.482 8.062a1.745 1.745 0 0 1-.46-1.657l.548-2.19a.678.678 0 0 0-.122-.58L3.654 1.328zM1.884.511a1.745 1.745 0 0 1 2.612.163L6.29 2.98c.329.423.445.974.315 1.494l-.547 2.19a.678.678 0 0 0 .178.643l2.457 2.457a.678.678 0 0 0 .644.178l2.189-.547a1.745 1.745 0 0 1 1.494.315l2.306 1.794c.829.645.905 1.87.163 2.611l-1.034 1.034c-.74.74-1.846 1.065-2.877.702a18.634 18.634 0 0 1-7.01-4.42 18.634 18.634 0 0 1-4.42-7.009c-.362-1.03-.037-2.137.703-2.877L1.885.511z"/>
                        <path fill-rule="evenodd" d="M11.146 1.646a.5.5 0 0 1 .708 0L13 2.793l1.146-1.147a.5.5 0 0 1 .708.708L13.707 3.5l1.147 1.146a.5.5 0 0 1-.708.708L13 4.207l-1.146 1.147a.5.5 0 0 1-.708-.708L12.293 3.5l-1.147-1.146a.5.5 0 0 1 0-.708z"/>
                    </svg>
                </button>
                `
                storeanswer(response.answer)
            } else if (response.found == "no") {
                setTimeout(() => {
                    justcheck(id)
                }, 1000)
            }
        } else {
            endcall()
            check()
        }
    })
}

audio = true

function mic() {
    audio = !audio
    localstream.getAudioTracks()[0].enabled = audio
    if (audio) {
        document.getElementById('mic').innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-mic" viewBox="0 0 16 16">
            <path d="M3.5 6.5A.5.5 0 0 1 4 7v1a4 4 0 0 0 8 0V7a.5.5 0 0 1 1 0v1a5 5 0 0 1-4.5 4.975V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 .5-.5z"/>
            <path d="M10 8a2 2 0 1 1-4 0V3a2 2 0 1 1 4 0v5zM8 0a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V3a3 3 0 0 0-3-3z"/>
        </svg>
        `
    } else {
        document.getElementById('mic').innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-mic-mute" viewBox="0 0 16 16">
            <path d="M13 8c0 .564-.094 1.107-.266 1.613l-.814-.814A4.02 4.02 0 0 0 12 8V7a.5.5 0 0 1 1 0v1zm-5 4c.818 0 1.578-.245 2.212-.667l.718.719a4.973 4.973 0 0 1-2.43.923V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 1 0v1a4 4 0 0 0 4 4zm3-9v4.879l-1-1V3a2 2 0 0 0-3.997-.118l-.845-.845A3.001 3.001 0 0 1 11 3z"/>
            <path d="m9.486 10.607-.748-.748A2 2 0 0 1 6 8v-.878l-1-1V8a3 3 0 0 0 4.486 2.607zm-7.84-9.253 12 12 .708-.708-12-12-.708.708z"/>
        </svg>
        `
    }
}

video = true

function camera() {
    video = !video
    localstream.getVideoTracks()[0].enabled = video
    if (video) {
        document.getElementById('camera').innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-camera-video" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M0 5a2 2 0 0 1 2-2h7.5a2 2 0 0 1 1.983 1.738l3.11-1.382A1 1 0 0 1 16 4.269v7.462a1 1 0 0 1-1.406.913l-3.111-1.382A2 2 0 0 1 9.5 13H2a2 2 0 0 1-2-2V5zm11.5 5.175 3.5 1.556V4.269l-3.5 1.556v4.35zM2 4a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h7.5a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1H2z"/>
        </svg>
        `
    } else {
        document.getElementById('camera').innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-camera-video-off" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M10.961 12.365a1.99 1.99 0 0 0 .522-1.103l3.11 1.382A1 1 0 0 0 16 11.731V4.269a1 1 0 0 0-1.406-.913l-3.111 1.382A2 2 0 0 0 9.5 3H4.272l.714 1H9.5a1 1 0 0 1 1 1v6a1 1 0 0 1-.144.518l.605.847zM1.428 4.18A.999.999 0 0 0 1 5v6a1 1 0 0 0 1 1h5.014l.714 1H2a2 2 0 0 1-2-2V5c0-.675.334-1.272.847-1.634l.58.814zM15 11.73l-3.5-1.555v-4.35L15 4.269v7.462zm-4.407 3.56-10-14 .814-.58 10 14-.814.58z"/>
        </svg>
        `
    }
}

function endcall() {
    lc.close()
    endd()
}

function endd() {
    addmed()
    lc = new RTCPeerConnection(configuration)
    lc.ontrack = e => {
        document.getElementById('remote-video').srcObject = e.streams[0]
    }

    usr = ""
    video = true
    audio = true
    document.getElementById('actions').innerHTML = `
    <button class="video-action-button" id="check" onclick="check()">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-arrow-clockwise" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
            <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
        </svg>
    </button>
    `

    document.getElementById('chat-input-area').innerHTML = ``
}