
import "./Lobby.css";
// import React, { useState, useCallback,useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { useSocket } from "../context/SocketProvider";

// const LobbyScreen = () => {
//   const [email, setEmail] = useState("");
//   const [room, setRoom] = useState("");

//   const socket = useSocket();

//   const navigate = useNavigate();

//   const handleSubmitForm = useCallback(
//     (e) => {
//       e.preventDefault();
//     socket.emit("room:join", { email, room });
//     console.log(email,room);
    
//     },
//     [email, room,socket]
//   );

// const handleJoinRoom = useCallback(
//     (data) => {
//       const { room } = data;
//       navigate(`/room/${room}`);
//     },
//     [navigate]
//   );

//   useEffect(() => {
//     socket.on("room:join", handleJoinRoom);

//     return () => {
//       socket.off("room:join", handleJoinRoom);
//     };
//   }, [socket, handleJoinRoom]);

//   return (
//     <div>
//       <h1>Lobby</h1>
//       <form onSubmit={handleSubmitForm}>
//         <label htmlFor="email">Email ID</label>
//         <input
//           type="email"
//           id="email"
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//         />
//         <br />
//         <label htmlFor="room">Room Number</label>
//         <input
//           type="text"
//           id="room"
//           value={room}
//           onChange={(e) => setRoom(e.target.value)}
//         />
//         <br />
//         <button>Join</button>
//       </form>
//     </div>
//   );
// };

// export default LobbyScreen;



import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketProvider";

const LobbyScreen = () => {
  const [email, setEmail] = useState("");
  const [room, setRoom] = useState("");

  const socket = useSocket();
  const navigate = useNavigate();

  const handleSubmitForm = useCallback(
    (e) => {
      e.preventDefault();
      socket.emit("room:join", { email, room });
      console.log(email, room);
    },
    [email, room, socket]
  );

  const handleJoinRoom = useCallback(
    (data) => {
      const { room } = data;
      navigate(`/room/${room}`);
    },
    [navigate]
  );

  useEffect(() => {
    socket.on("room:join", handleJoinRoom);

    return () => {
      socket.off("room:join", handleJoinRoom);
    };
  }, [socket, handleJoinRoom]);

  // 🎨 CSS inside the same file
  const styles = {
    container: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      background: "linear-gradient(to right, #91caf8ff, #d3e7f5ff)",
      fontFamily: "Arial, sans-serif",
    },
    formBox: {
      background: "#fff",
      padding: "30px",
      borderRadius: "12px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
      width: "300px",
      textAlign: "center",
    },
    heading: {
      marginBottom: "20px",
      fontSize: "24px",
      fontWeight: "bold",
      color: "#333",
    },
    label: {
      display: "block",
      textAlign: "left",
      marginBottom: "6px",
      fontWeight: "500",
      color: "#555",
    },
    input: {
      width: "100%",
      padding: "10px",
      marginBottom: "15px",
      borderRadius: "6px",
      border: "1px solid #ccc",
      outline: "none",
      fontSize: "14px",
    },
    button: {
      width: "100%",
      padding: "10px",
      backgroundColor: "#4261eaff",
      color: "#fff",
      fontWeight: "bold",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      transition: "0.3s",
    },
    buttonHover: {
      backgroundColor: "#0e22d1ff",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.formBox}>
        <h1 style={styles.heading}>Lobby</h1>
        <form onSubmit={handleSubmitForm}>
          <label htmlFor="email" style={styles.label}>Email ID</label>
          <input
            type="email"
            id="email"
            value={email}
            style={styles.input}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label htmlFor="room" style={styles.label}>Room Number</label>
          <input
            type="text"
            id="room"
            value={room}
            style={styles.input}
            onChange={(e) => setRoom(e.target.value)}
          />

          <button style={styles.button}>Join</button>
        </form>
      </div>
    </div>
  );
};

export default LobbyScreen;


