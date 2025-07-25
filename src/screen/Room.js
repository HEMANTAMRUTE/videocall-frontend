// Room.js (with AssemblyAI integration)
import React, { useEffect, useCallback, useState, useRef } from "react";
import { useSocket } from "../context/SocketProvider";
import peer from "../service/Peer";

const ASSEMBLY_API_KEY = "0ff558c76ad14ab087192c8d37f13fa5"; // replace this with your actual key

const Room = () => {
  
  const socket = useSocket();
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [myStream, setMyStream] = useState();
  const [remoteStream, setRemoteStream] = useState();
  const [combinedRecorder, setCombinedRecorder] = useState(null);
  const [combinedChunks, setCombinedChunks] = useState([]);

  const myVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const handleUserJoined = useCallback(({ email, id }) => {
    console.log(`Email ${email} joined room`);
    setRemoteSocketId(id);
  }, []);

  const sendStreams = useCallback(() => {
    if (myStream) {
      myStream.getTracks().forEach((track) => {
        peer.peer.addTrack(track, myStream);
      });
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
    await peer.setRemoteDescription(offer);
    const ans = await peer.getAnswer();
    socket.emit("call:accepted", { to: from, ans });
    sendStreams();
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

  const handleNegoNeedIncomming = useCallback(async ({ from, offer }) => {
    const ans = await peer.getAnswer(offer);
    socket.emit("peer:nego:done", { to: from, ans });
  }, [socket]);

  const handleNegoNeedFinal = useCallback(async ({ ans }) => {
    await peer.setLocalDescription(ans);
  }, []);

  useEffect(() => {
    peer.peer.addEventListener("negotiationneeded", handleNegoNeeded);
    return () => {
      peer.peer.removeEventListener("negotiationneeded", handleNegoNeeded);
    };
  }, [handleNegoNeeded]);

  useEffect(() => {
    peer.peer.addEventListener("track", (ev) => {
      const remoteStream = ev.streams[0];
      console.log("🎧 GOT TRACKS!!", remoteStream);
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
  }, [socket, handleUserJoined, handleIncommingCall, handleCallAccepted, handleNegoNeedIncomming, handleNegoNeedFinal]);

  const logAudioTracks = () => {
    const localTracks = myStream?.getAudioTracks() || [];
    const remoteTracks = remoteStream?.getAudioTracks() || [];
    console.log("🎧 Local Audio Tracks:", localTracks);
    console.log("🎧 Remote Audio Tracks:", remoteTracks);
    localTracks.forEach((track) => console.log("📌 Local track - enabled:", track.enabled, "| readyState:", track.readyState));
    remoteTracks.forEach((track) => console.log("📌 Remote track - enabled:", track.enabled, "| readyState:", track.readyState));
  };

  const uploadToAssemblyAI = async (blob) => {
    const response = await fetch("https://api.assemblyai.com/v2/upload", {
      method: "POST",
      headers: { authorization: ASSEMBLY_API_KEY },
      body: blob,
    });
    const data = await response.json();
    return data.upload_url;
  };

  const startTranscription = async (uploadUrl) => {
    const response = await fetch("https://api.assemblyai.com/v2/transcript", {
      method: "POST",
      headers: {
        authorization: ASSEMBLY_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ audio_url: uploadUrl }),
    });
    const data = await response.json();
    return data.id;
  };

  const pollTranscription = async (transcriptId) => {
    const pollingEndpoint = `https://api.assemblyai.com/v2/transcript/${transcriptId}`;
    while (true) {
      const res = await fetch(pollingEndpoint, {
        headers: { authorization: ASSEMBLY_API_KEY },
      });
      const data = await res.json();
      if (data.status === "completed") {
        alert("📝 Transcription:\n" + data.text);
        console.log("Transcription:", data.text);
        return data.text;
      } else if (data.status === "error") {
        throw new Error(data.error);
      }
      await new Promise((r) => setTimeout(r, 3000));
    }
  };

 const transcribeAudio = async (audioBlob) => {
  const formData = new FormData();
  formData.append("file", audioBlob, "recording.webm");

  try {
    const response = await fetch("http://127.0.0.1:8000/transcribe", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    alert("📝 Transcription:\n" + data.text);
    console.log("Transcription:", data.text);
  } catch (err) {
    console.error("Whisper transcription failed:", err);
  }
};

  const startFullRecording = () => {
    if (myStream && remoteStream) {
      logAudioTracks();
      const combinedStream = new MediaStream([
        ...myStream.getAudioTracks(),
        ...remoteStream.getAudioTracks(),
      ]);

      const recorder = new MediaRecorder(combinedStream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) setCombinedChunks((prev) => [...prev, e.data]);
      };

      recorder.onstop = async () => {
        if (combinedChunks.length === 0) return console.warn("❗ No audio recorded.");
        const audioBlob = new Blob(combinedChunks, { type: "audio/webm" });
        const url = URL.createObjectURL(audioBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "full_session_audio.webm";
        a.click();
        setCombinedChunks([]);
        console.log("💾 Download complete.");
        await transcribeAudio(audioBlob);
      };

      recorder.start();
      setCombinedRecorder(recorder);
      console.log("🎙 FULL SESSION RECORDING STARTED!");
    }
  };

  const stopFullRecording = () => {
    if (combinedRecorder) {
      combinedRecorder.stop();
      console.log("💾 FULL SESSION RECORDING STOPPED!");
    }
  };

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
          <video ref={myVideoRef} autoPlay playsInline muted controls width="300" height="200" style={{ backgroundColor: "black" }} />
        </>
      )}
      <h2>Remote Stream</h2>
      <video ref={remoteVideoRef} autoPlay playsInline muted={false} controls width="300" height="200" style={{ backgroundColor: "black" }} />
    </div>
  );
};

export default Room;
