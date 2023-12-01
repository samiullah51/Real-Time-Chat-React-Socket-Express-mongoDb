import React, { useState, useEffect } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:3001");

function App() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [editMessage, setEditMessage] = useState({ id: null, newText: "" });

  useEffect(() => {
    // Fetch all messages when the component mounts
    fetchMessages();

    // Listen for new messages from the server
    socket.on("receive_message", (data) => {
      setMessages([...messages, data]);
    });

    // Listen for deleted messages from the server
    socket.on("delete_message", (data) => {
      setMessages(messages.filter((msg) => msg._id !== data.id));
    });

    // Listen for edited messages from the server
    socket.on("edit_message", (data) => {
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg._id === data._id ? { ...msg, text: data.text } : msg
        )
      );
    });

    return () => {
      socket.off("receive_message");
      socket.off("delete_message");
      socket.off("edit_message");
    };
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const response = await fetch("http://localhost:3001/api/get_messages");
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const sendMessage = async () => {
    try {
      await fetch("http://localhost:3001/api/send_message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: message }),
      });

      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const deleteMessage = async (id) => {
    try {
      await fetch(`http://localhost:3001/api/delete_message/${id}`, {
        method: "DELETE",
      });

      // Broadcast delete message event to the server
      socket.emit("delete_message", { id });
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  const startEditing = (id, text) => {
    setEditMessage({ id, newText: text });
  };

  const cancelEditing = () => {
    setEditMessage({ id: null, newText: "" });
  };

  const editMessageText = async () => {
    try {
      await fetch(`http://localhost:3001/api/edit_message/${editMessage.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ newText: editMessage.newText }),
      });

      // Broadcast edit message event to the server
      socket.emit("edit_message", {
        id: editMessage.id,
        newText: editMessage.newText,
      });

      setEditMessage({ id: null, newText: "" });
    } catch (error) {
      console.error("Error editing message:", error);
    }
  };

  return (
    <div>
      <div>
        {messages.map((msg) => (
          <div key={msg._id}>
            {msg.text}{" "}
            <button onClick={() => deleteMessage(msg._id)}>Delete</button>{" "}
            <button onClick={() => startEditing(msg._id, msg.text)}>
              Edit
            </button>
          </div>
        ))}
      </div>
      {editMessage.id !== null ? (
        <div>
          <input
            type="text"
            value={editMessage.newText}
            onChange={(e) =>
              setEditMessage({ ...editMessage, newText: e.target.value })
            }
          />
          <button onClick={editMessageText}>Save</button>
          <button onClick={cancelEditing}>Cancel</button>
        </div>
      ) : (
        <div>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button onClick={sendMessage}>Send</button>
        </div>
      )}
    </div>
  );
}

export default App;
