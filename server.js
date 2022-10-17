const express = require("express");
const path = require("path");
const app = express();
const http = require("http");
const socketio = require("socket.io");
const PORT = 3000 || process.env.PORT;
const server = http.createServer(app);
const io = socketio(server);
const formatMessage = require("./utils/messages");
const {
  userJoin,
  getCurrentUser,
  getRoomUsers,
  userLeave,
} = require("./utils/user");

app.use(express.static(path.join(__dirname, "public")));
const botName = "ChatCord Bot";
//RUN when client connects
io.on("connection", (socket) => {
  socket.on("join", ({ username, room }) => {
    const user = userJoin(socket.id, username, room);
    socket.join(user.room);
    // Welcome current user
    socket.emit("message", formatMessage(botName, "Welcome to chat bot"));
    //Broadcast when a user connect
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatMessage(botName, `${user.username} connects to user chat`)
    );
    
    // send users and room info
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users:getRoomUsers(user.room)
    })
  });

  // Listen for Chat Message
  socket.on("chatMessage", (msg) => {
    const user = getCurrentUser(socket.id);
    io.emit("message", formatMessage(user.username, msg));
  });

  //Runs when a user disconnects
  socket.on("disconnect", () => {
    const user = userLeave(socket.id);
    if (user)
    {
      io.to(user.room).emit(
        "message",
        formatMessage(botName, `${user.username} has just left the chat`)
      );

      // send users and room info
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });
});

server.listen(PORT, () => {
  console.log(`server is up on PORT ${PORT}`);
});
