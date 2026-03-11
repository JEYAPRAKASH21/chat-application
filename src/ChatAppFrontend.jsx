import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Wifi,
  WifiOff,
  MessageSquare,
  Hash,
  Moon,
  Search,
  Phone,
  Video,
  MoreVertical,
  Smile,
  Paperclip,
} from "lucide-react";
import "./ChatAppFrontend.css";

const SAMPLE_CONTACTS = [
  { id: 1, name: "General Room", role: "Team chat", online: true, unread: 2, initials: "GR" },
  { id: 2, name: "DevOps Team", role: "Deployment discussion", online: true, unread: 0, initials: "DT" },
  { id: 3, name: "Backend Room", role: "Lambda + DynamoDB", online: false, unread: 0, initials: "BR" },
  { id: 4, name: "Frontend Room", role: "UI updates", online: true, unread: 5, initials: "FR" },
];

const SAMPLE_MESSAGES = [
  {
    id: 1,
    sender: "System",
    text: "Welcome to Cloud Chat. Connect your WebSocket backend to start real-time messaging.",
    time: "09:00 AM",
    own: false,
    status: "sent",
  },
  {
    id: 2,
    sender: "Arun",
    text: "UI looks clean. We can connect this with API Gateway WebSocket next.",
    time: "09:02 AM",
    own: false,
    status: "sent",
  },
  {
    id: 3,
    sender: "You",
    text: "Great. After frontend, I will connect Lambda and DynamoDB.",
    time: "09:05 AM",
    own: true,
    status: "delivered",
  },
];

function formatTime(date = new Date()) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function Avatar({ text, className = "" }) {
  return <div className={`avatar ${className}`}>{text}</div>;
}

function StatusBadge({ count }) {
  if (!count || count <= 0) return null;
  return <span className="badge">{count}</span>;
}

export default function ChatAppFrontend() {
  const [username, setUsername] = useState("Prakash");
  const [roomName, setRoomName] = useState("General Room");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState(SAMPLE_MESSAGES);
  const [selectedRoom, setSelectedRoom] = useState(SAMPLE_CONTACTS[0]);
  const [isConnected, setIsConnected] = useState(false);
  const [wsUrl, setWsUrl] = useState("wss://your-api-id.execute-api.ap-south-1.amazonaws.com/dev");

  const socketRef = useRef(null);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  const filteredContacts = useMemo(() => {
    return SAMPLE_CONTACTS.filter((item) =>
      item.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  const connectWebSocket = () => {
    if (!wsUrl.trim()) return;

    try {
      if (socketRef.current) {
        socketRef.current.close();
      }

      const finalUrl = `${wsUrl}?username=${encodeURIComponent(username)}`;
      const socket = new WebSocket(finalUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        setIsConnected(true);

        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            sender: "System",
            text: `Connected successfully to ${roomName}`,
            time: formatTime(),
            own: false,
            status: "sent",
          },
        ]);
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          setMessages((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              sender: data.sender || "Unknown",
              text: data.message || event.data,
              time: formatTime(),
              own: false,
              status: "sent",
            },
          ]);
        } catch {
          setMessages((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              sender: "Server",
              text: event.data,
              time: formatTime(),
              own: false,
              status: "sent",
            },
          ]);
        }
      };

      socket.onclose = () => {
        setIsConnected(false);
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            sender: "System",
            text: "Disconnected from server.",
            time: formatTime(),
            own: false,
            status: "sent",
          },
        ]);
      };

      socket.onerror = () => {
        setIsConnected(false);
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            sender: "System",
            text: "WebSocket connection error.",
            time: formatTime(),
            own: false,
            status: "sent",
          },
        ]);
      };
    } catch (error) {
      console.error("WebSocket connection error:", error);
      setIsConnected(false);
    }
  };

  const disconnectWebSocket = () => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    setIsConnected(false);
  };

  const sendMessage = () => {
    if (!message.trim()) return;

    const text = message.trim();

    const payload = {
      action: "sendMessage",
      roomId: selectedRoom.name,
      sender: username,
      message: text,
    };

    const ownMessage = {
      id: crypto.randomUUID(),
      sender: "You",
      text,
      time: formatTime(),
      own: true,
      status: isConnected ? "sent" : "draft",
    };

    setMessages((prev) => [...prev, ownMessage]);

    if (socketRef.current && isConnected) {
      socketRef.current.send(JSON.stringify(payload));
    }

    setMessage("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "44px";
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleTextareaChange = (e) => {
    setMessage(e.target.value);

    if (textareaRef.current) {
      textareaRef.current.style.height = "44px";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  return (
    <div className="chat-page">
      <div className="chat-bg" />

      <div className="chat-layout">
        <aside className="sidebar">
          <div className="sidebar-header">
            <div>
              <p className="muted-text small">Workspace</p>
              <h1 className="title">Cloud Chat</h1>
            </div>
            <div className="icon-box">
              <Moon size={18} />
            </div>
          </div>

          <div className="profile-card">
            <div className="profile-top">
              <Avatar text={username.slice(0, 2).toUpperCase()} className="avatar-blue" />
              <div>
                <p className="profile-name">{username}</p>
                <p className="muted-text small">Frontend User</p>
              </div>
            </div>

            <div className="status-line">
              {isConnected ? (
                <>
                  <Wifi size={16} className="green" />
                  <span className="green">Connected</span>
                </>
              ) : (
                <>
                  <WifiOff size={16} className="red" />
                  <span className="red">Disconnected</span>
                </>
              )}
            </div>
          </div>

          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search rooms"
              className="input input-with-icon"
            />
          </div>

          <div className="rooms-list custom-scroll">
            {filteredContacts.map((room) => (
              <motion.button
                key={room.id}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => {
                  setSelectedRoom(room);
                  setRoomName(room.name);
                }}
                className={`room-card ${selectedRoom.id === room.id ? "room-card-active" : ""}`}
              >
                <div className="room-row">
                  <Avatar text={room.initials} />
                  <div className="room-info">
                    <div className="room-head">
                      <p className="room-name">{room.name}</p>
                      <StatusBadge count={room.unread} />
                    </div>
                    <p className="muted-text small ellipsis">{room.role}</p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </aside>

        <main className="main-panel">
          <section className="top-card">
            <div className="top-left">
              <Avatar text={selectedRoom.initials} className="avatar-large avatar-blue" />
              <div>
                <h2 className="room-title">{selectedRoom.name}</h2>
                <div className="room-subtitle">
                  <Hash size={15} />
                  <span>{selectedRoom.role}</span>
                </div>
              </div>
            </div>

            <div className="top-actions">
              <button className="secondary-btn">
                <Phone size={16} />
                <span>Call</span>
              </button>
              <button className="secondary-btn">
                <Video size={16} />
                <span>Meet</span>
              </button>
              <button className="icon-btn">
                <MoreVertical size={16} />
              </button>
            </div>
          </section>

          <div className="content-grid">
            <section className="settings-card">
              <div className="field-block">
                <p className="muted-text small label-gap">Your name</p>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input"
                  placeholder="Enter your name"
                />
              </div>

              <div className="field-block">
                <p className="muted-text small label-gap">Room name</p>
                <input
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className="input"
                  placeholder="Enter room name"
                />
              </div>

              <div className="field-block">
                <p className="muted-text small label-gap">WebSocket URL</p>
                <input
                  value={wsUrl}
                  onChange={(e) => setWsUrl(e.target.value)}
                  className="input"
                  placeholder="wss://your-api-id.execute-api.region.amazonaws.com/dev"
                />
              </div>

              <div className="button-grid">
                <button onClick={connectWebSocket} className="primary-btn">
                  <Wifi size={16} />
                  <span>Connect</span>
                </button>

                <button onClick={disconnectWebSocket} className="secondary-btn full-width">
                  <WifiOff size={16} />
                  <span>Disconnect</span>
                </button>
              </div>

              <div className="notes-card">
                <div className="notes-header">
                  <MessageSquare size={16} className="blue" />
                  <p className="notes-title">Project Notes</p>
                </div>

                <ul className="notes-list">
                  <li>Replace WebSocket URL after creating API Gateway.</li>
                  <li>
                    Keep route selection expression as <span>$request.body.action</span>.
                  </li>
                  <li>
                    Send messages with action = <span>sendMessage</span>.
                  </li>
                </ul>
              </div>
            </section>

            <section className="chat-card">
              <div className="chat-header">
                <div className="chat-live">
                  <div className={`live-dot ${isConnected ? "live-green" : "live-red"}`} />
                  <div>
                    <p className="chat-header-title">
                      {isConnected ? "Live connection active" : "Waiting for connection"}
                    </p>
                    <p className="muted-text small">Room: {roomName}</p>
                  </div>
                </div>

                <span className="messages-pill">{messages.length} messages</span>
              </div>

              <div className="messages-area custom-scroll">
                <div className="messages-stack">
                  <AnimatePresence initial={false}>
                    {messages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className={`message-row ${msg.own ? "message-right" : "message-left"}`}
                      >
                        <div className={`message-bubble ${msg.own ? "message-own" : "message-other"}`}>
                          <div className="message-meta">
                            <p className={`message-sender ${msg.own ? "message-sender-own" : ""}`}>
                              {msg.sender}
                            </p>
                            <p className={`message-time ${msg.own ? "message-time-own" : ""}`}>
                              {msg.time}
                            </p>
                          </div>
                          <p className="message-text">{msg.text}</p>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  <div ref={bottomRef} />
                </div>
              </div>

              <div className="composer-wrap">
                <div className="composer">
                  <button className="icon-btn muted-btn">
                    <Paperclip size={18} />
                  </button>

                  <div className="composer-input-wrap">
                    <textarea
                      ref={textareaRef}
                      value={message}
                      onChange={handleTextareaChange}
                      onKeyDown={handleKeyDown}
                      rows={1}
                      placeholder="Type your message here..."
                      className="composer-input"
                    />
                  </div>

                  <button className="icon-btn muted-btn">
                    <Smile size={18} />
                  </button>

                  <button onClick={sendMessage} className="primary-btn send-btn">
                    <Send size={16} />
                    <span>Send</span>
                  </button>
                </div>

                <p className="helper-text">Press Enter to send. Use Shift + Enter for new line.</p>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}