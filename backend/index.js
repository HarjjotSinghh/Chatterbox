// // Import dependencies
// const express = require('express');
// const http = require('http');
// const socketIO = require('socket.io');
// const cors = require('cors');
// const { io } = require('socket.io-client');

// // Create the app and server
// const app = express();
// app.use(cors({
//     origin: '*' // Allow only the client with entering the url of client
// }));
// const server = http.createServer(app);
// const sIO = socketIO(server);

// app.get("/", (req, res) => {
//     res.send("Server is running.");
// });

// // Handle new socket connections
// sIO.on('connection', (socket) => {

//     // Handle incoming audio stream
//     socket.on('audioStream', (audioData) => {
//         socket.broadcast.emit('audioStream', audioData);
//     });

//     socket.on('disconnect', () => {
//     });
// });

// // Start the server
// const port = process.env.PORT || 8000;
// server.listen(port, () => {
//     console.log(`Server running on port ${port}`);
// });

// let socket = io("http://localhost:8000", {
//     transports: ['websocket'],
//     upgrade: false
// });

// socket.on('connect', () => {
//   navigator.mediaDevices.getUserMedia({ audio: true, video: false })
//     .then((stream) => {
//         var madiaRecorder = new MediaRecorder(stream);
//         var audioChunks = [];

//         madiaRecorder.addEventListener("dataavailable", function (event) {
//             audioChunks.push(event.data);
//         });

//         madiaRecorder.addEventListener("stop", function () {
//             var audioBlob = new Blob(audioChunks);
//             audioChunks = [];
//             var fileReader = new FileReader();
//             fileReader.readAsDataURL(audioBlob);
//             fileReader.onloadend = function () {
//                 var base64String = fileReader.result;
//                 socket.emit("audioStream", base64String);
//             };

//             madiaRecorder.start();
//             setTimeout(function () {
//                 madiaRecorder.stop();
//             }, 1000);
//         });

//         madiaRecorder.start();
//         setTimeout(function () {
//             madiaRecorder.stop();
//         }, 1000);
//     })
//     .catch((error) => {
//         console.error('Error capturing audio.', error);
//     });
// });

// socket.on('audioStream', (audioData) => {
//     var newData = audioData.split(";");
//     newData[0] = "data:audio/ogg;";
//     newData = newData[0] + newData[1];

//     var audio = new Audio(newData);
//     if (!audio || document.hidden) {
//         return;
//     }
//     audio.play();
// });

const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const PORT = process.env.PORT || 3001;
const path = require('path');

let socketList = {};

// app.use(express.static(path.join(__dirname, 'public'))); // this will work for CRA build
app.use(express.static(path.join(__dirname, '../vite')));

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));

  app.get('/*', function (req, res) {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

// Route
app.get('/ping', (req, res) => {
  res
    .send({
      success: true,
    })
    .status(200);
});

// Socket
io.on('connection', (socket) => {
  console.log(`New User connected: ${socket.id}`);

  socket.on('disconnect', () => {
    socket.disconnect();
    console.log('User disconnected!');
  });

  socket.on('BE-check-user', ({ roomId, userName }) => {
    let error = false;
    console.log('BE-check-user', roomId, userName);
    io.sockets.in(roomId).clients((err, clients) => {
      clients.forEach((client) => {
        if (socketList[client] == userName) {
          error = true;
        }
      });
      socket.emit('FE-error-user-exist', { error });
    });
  });

  /**
   * Join Room
   */
  socket.on('BE-join-room', ({ roomId, userName }) => {
    // Socket Join RoomName
    console.log('BE-join-room', roomId, userName);
    socket.join(roomId);
    socketList[socket.id] = { userName, video: true, audio: true };

    // Set User List
    io.sockets.in(roomId).clients((err, clients) => {
      try {
        const users = [];
        clients.forEach((client) => {
          // Add User List
          users.push({ userId: client, info: socketList[client] });
        });
        socket.broadcast.to(roomId).emit('FE-user-join', users);
        // io.sockets.in(roomId).emit('FE-user-join', users);
      } catch (e) {
        io.sockets.in(roomId).emit('FE-error-user-exist', { err: true });
      }
    });
  });

  socket.on('BE-call-user', ({ userToCall, from, signal }) => {
    io.to(userToCall).emit('FE-receive-call', {
      signal,
      from,
      info: socketList[socket.id],
    });
  });

  socket.on('BE-accept-call', ({ signal, to }) => {
    io.to(to).emit('FE-call-accepted', {
      signal,
      answerId: socket.id,
    });
  });

  socket.on('BE-send-message', ({ roomId, msg, sender }) => {
    io.sockets.in(roomId).emit('FE-receive-message', { msg, sender });
  });

  socket.on('BE-leave-room', ({ roomId, leaver }) => {
    delete socketList[socket.id];
    socket.broadcast
      .to(roomId)
      .emit('FE-user-leave', { userId: socket.id, userName: [socket.id] });
    io.sockets.sockets[socket.id].leave(roomId);
  });

  socket.on('BE-toggle-camera-audio', ({ roomId, switchTarget }) => {
    if (switchTarget === 'video') {
      socketList[socket.id].video = !socketList[socket.id].video;
    } else {
      socketList[socket.id].audio = !socketList[socket.id].audio;
    }
    socket.broadcast
      .to(roomId)
      .emit('FE-toggle-camera', { userId: socket.id, switchTarget });
  });
});

http.listen(PORT, () => {
  console.log('Connected : 3001');
});