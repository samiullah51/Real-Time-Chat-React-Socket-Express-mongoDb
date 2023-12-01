const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");

app.use(cors());
app.use(express.json());
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// MongoDB connection setup
mongoose.connect(
  "mongodb+srv://developerjs:WebDev0!a@cluster0.m7zxglh.mongodb.net/test?retryWrites=true&w=majority",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);
const messageSchema = new mongoose.Schema({
  text: String,
});

const Message = mongoose.model("Message", messageSchema);
// API endpoint to send a message
app.post("/api/send_message", async (req, res) => {
  const { text } = req.body;

  // Save message to MongoDB
  const message = new Message({ text });
  await message.save();

  // Broadcast the message to all connected clients
  io.emit("receive_message", { text });

  res.status(200).send({ success: true, message: "Message sent successfully" });
});

// API endpoint to retrieve all messages
app.get("/api/get_messages", async (req, res) => {
  try {
    const messages = await Message.find();
    res.status(200).send(messages);
  } catch (error) {
    res
      .status(500)
      .send({ success: false, message: "Error retrieving messages" });
  }
});

// API endpoint to delete a message
app.delete("/api/delete_message/:id", async (req, res) => {
  const messageId = req.params.id;

  try {
    // Delete the message from MongoDB
    await Message.findByIdAndDelete(messageId);

    // Broadcast the deleted message ID to all connected clients
    io.emit("delete_message", { id: messageId });

    res
      .status(200)
      .send({ success: true, message: "Message deleted successfully" });
  } catch (error) {
    res.status(500).send({ success: false, message: "Error deleting message" });
  }
});
app.put("/api/edit_message/:id", async (req, res) => {
  const messageId = req.params.id;
  const { newText } = req.body;

  try {
    // Update the message in MongoDB
    const updatedMessage = await Message.findByIdAndUpdate(
      messageId,
      { text: newText },
      { new: true }
    );

    // Broadcast the updated message to all connected clients
    io.emit("edit_message", updatedMessage);

    res
      .status(200)
      .send({ success: true, message: "Message edited successfully" });
  } catch (error) {
    res.status(500).send({ success: false, message: "Error editing message" });
  }
});

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  // Listen for edit message events
  socket.on("edit_message", async (data) => {
    try {
      // Update the message in MongoDB
      const updatedMessage = await Message.findByIdAndUpdate(
        data.id,
        { text: data.newText },
        { new: true }
      );

      // Broadcast the updated message to all connected clients
      io.emit("edit_message", updatedMessage);
    } catch (error) {
      console.error("Error editing message:", error);
    }
  });
});

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  // Listen for delete message events
  socket.on("delete_message", async (data) => {
    try {
      // Delete the message from MongoDB
      await Message.findByIdAndDelete(data.id);
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  });
});

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);
});

server.listen(3001, () => {
  console.log("SERVER IS RUNNING");
});
