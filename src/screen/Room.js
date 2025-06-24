import React, { useEffect, useCallback, useState, useRef } from "react";
import { useSocket } from "../context/SocketProvider";
import peer from "../service/Peer";

const Room = () => {
  const socket = useSocket();
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [myStream, setMyStream] = useState();
  const [remoteStream, setRemoteStream] = useState();
  const [combinedRecorder, setCombinedRecorder] = useState(null);
  const [combinedChunks, setCombinedChunks] = useState([]);

  const myVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const logAudioTracks = () => {
    const localTracks = myStream?.getAudioTracks() || [];
    const remoteTracks = remoteStream?.getAudioTracks() || [];

    console.log("🎧 Local Audio Tracks:", localTracks);
    console.log("🎧 Remote Audio Tracks:", remoteTracks);

    localTracks.forEach((track) => {
      console.log("📌 Local track -> ReadyState:", track.readyState, "| Enabled:", track.enabled);
    });
    remoteTracks.forEach((track) => {
      console.log("📌 Remote track -> ReadyState:", track.readyState, "| Enabled:", track.enabled);
    });
  };

  const startFullRecording = () => {
    const localTracks = myStream?.getAudioTracks() || [];
    const remoteTracks = remoteStream?.getAudioTracks() || [];

    if (localTracks.length === 0 || remoteTracks.length === 0) {
      console.warn("❗ Cannot start recording - missing audio tracks.");
      logAudioTracks();
      return;
    }

    logAudioTracks(); // show audio track info in console before recording

    const combinedStream = new MediaStream([...localTracks, ...remoteTracks]);
    const recorder = new MediaRecorder(combinedStream, { mimeType: "audio/webm" });

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        setCombinedChunks((prev) => [...prev, e.data]);
      }
    };

    recorder.onstop = () => {
      if (combinedChunks.length === 0) {
        console.warn("❗ No audio data recorded. Were the microphones active?");
        return;
      }

      const audioBlob = new Blob(combinedChunks, { type: "audio/webm" });
      const url = URL.createObjectURL(audioBlob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "full_session_audio.webm";
      a.click();

      setCombinedChunks([]);
      console.log("💾 Audio recording downloaded.");
    };

    recorder.start();
    setCombinedRecorder(recorder);
    console.log("🎙 FULL SESSION RECORDING STARTED!");
  };

  const stopFullRecording = () => {
    if (combinedRecorder) {
      combinedRecorder.stop();
      console.log("💾 FULL SESSION RECORDING STOPPED!");
    }
  };

  const handleUserJoined = useCallback(({ email, id }) => {
    console.log(`Email ${email} joined room`);
    setRemoteSocketId(id);
  }, []);

  const sendStreams = useCallback(() => {
    if (!peer._tracksAdded && myStream) {
      for (const track of myStream.getTracks()) {
        peer.peer.addTrack(track, myStream);
      }
      peer._tracksAdded = true;
      console.log("✅ Sent tracks to peer");
    }
  }, [myStream]);

  const handleCallUser = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    setMyStream(stream);

    const offer = await peer.getOffer();
    socket.emit("user:call", { to: remoteSocketId, offer });
  }, [remoteSocketId, socket]);

  const handleIncommingCall = useCallback(async ({ from, offer }) => {
    setRemoteSocketId(from);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    setMyStream(stream);

    console.log("Incoming Call:", from, offer);
    const ans = await peer.getAnswer(offer);
    socket.emit("call:accepted", { to: from, ans });

    setTimeout(() => sendStreams(), 0);
  }, [socket, sendStreams]);

  const handleCallAccepted = useCallback(({ from, ans }) => {
    peer.setLocalDescription(ans);
    console.log("Call Accepted!");
    sendStreams();
  }, [sendStreams]);

  const handleNegoNeeded = useCallback(async () => {
    const offer = await peer.getOffer();
    socket.emit("peer:nego:needed", { offer, to: remoteSocketId });
  }, [remoteSocketId, socket]);

  useEffect(() => {
    peer.peer.addEventListener("negotiationneeded", handleNegoNeeded);
    return () => peer.peer.removeEventListener("negotiationneeded", handleNegoNeeded);
  }, [handleNegoNeeded]);

  const handleNegoNeedIncomming = useCallback(async ({ from, offer }) => {
    const ans = await peer.getAnswer(offer);
    socket.emit("peer:nego:done", { to: from, ans });
  }, [socket]);

  const handleNegoNeedFinal = useCallback(async ({ ans }) => {
    await peer.setLocalDescription(ans);
  }, []);

  useEffect(() => {
    peer.peer.addEventListener("track", (ev) => {
      const remoteStream = ev.streams[0];
      console.log("GOT TRACKS!!", remoteStream);
      setRemoteStream(remoteStream);
    });
  }, []);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      console.log("✅ remoteVideoRef attached stream:", remoteVideoRef.current.srcObject);
    }
  }, [remoteStream]);

  useEffect(() => {
    if (myVideoRef.current && myStream) {
      myVideoRef.current.srcObject = myStream;
      console.log("✅ myVideoRef attached stream:", myVideoRef.current.srcObject);
    }
  }, [myStream]);

  useEffect(() => {
    socket.on("user:joined", handleUserJoined);
    socket.on("incomming:call", handleIncommingCall);
    socket.on("call:accepted", handleCallAccepted);
    socket.on("peer:nego:needed", handleNegoNeedIncomming);
    socket.on("peer:nego:final", handleNegoNeedFinal);

    return () => {
      socket.off("user:joined", handleUserJoined);
      socket.off("incomming:call", handleIncommingCall);
      socket.off("call:accepted", handleCallAccepted);
      socket.off("peer:nego:needed", handleNegoNeedIncomming);
      socket.off("peer:nego:final", handleNegoNeedFinal);
    };
  }, [
    socket,
    handleUserJoined,
    handleIncommingCall,
    handleCallAccepted,
    handleNegoNeedIncomming,
    handleNegoNeedFinal,
  ]);

  return (
    <div>
      <h1>Room Page</h1>
      <h4>{remoteSocketId ? "Connected" : "No one in room"}</h4>

      {myStream && <button onClick={sendStreams}>Send Stream</button>}
      {remoteSocketId && <button onClick={handleCallUser}>CALL</button>}
      {myStream && remoteStream && (
        <>
          <button onClick={startFullRecording}>🎙 Start Full Session Recording</button>
          <button onClick={stopFullRecording}>💾 Stop & Download Full Audio</button>
        </>
      )}

      {myStream && (
        <>
          <h2>My Stream</h2>
          <video
            ref={myVideoRef}
            autoPlay
            playsInline
            muted
            controls
            width="300"
            height="200"
            style={{ backgroundColor: "black" }}
          />
        </>
      )}

      <h2>Remote Stream</h2>
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        muted={false}
        controls
        width="300"
        height="200"
        style={{ backgroundColor: "black" }}
      />
    </div>
  );
};

export default Room;
