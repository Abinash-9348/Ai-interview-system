import { useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, User, Volume2 } from "lucide-react";
import toast from "react-hot-toast";

interface Props {
  onClose: () => void;
  socket: Socket;
  roomId: string;
  userId: string;
  incomingCall: { offer: any; from: string; type: "audio" | "video" } | null;
  initialIceCandidates: any[];
  preSelectedType: "audio" | "video";
}

type CallStatus = "idle" | "calling" | "incoming" | "connected" | "ended";

export default function CallModal({ onClose, socket, roomId, userId, incomingCall, initialIceCandidates, preSelectedType }: Props) {
  // ✅ Single source of truth for the call mode
  const [callType, setCallType] = useState<"audio" | "video">(incomingCall?.type || preSelectedType);
  const [status, setStatus] = useState<CallStatus>(incomingCall ? "incoming" : "idle");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const pendingCandidates = useRef<RTCIceCandidateInit[]>(initialIceCandidates || []);

  // ✅ Force-Sync mode whenever incomingCall changes (Receiver Side)
  useEffect(() => {
    if (incomingCall?.type) {
      console.log("🔄 Receiver: Syncing mode to", incomingCall.type);
      setCallType(incomingCall.type);
    }
  }, [incomingCall?.type]);

  // ✅ Hardware Isolation: Stop camera if in Audio mode
  useEffect(() => {
    if (callType === "audio" && streamRef.current) {
      streamRef.current.getVideoTracks().forEach(track => {
        console.log("🛑 Mode is Audio: Explicitly stopping video hardware");
        track.stop();
      });
    }
  }, [callType]);

  // Global cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      if (peerRef.current) {
        peerRef.current.close();
      }
    };
  }, []);

  const createPeer = (mode: "audio" | "video") => {
    console.log(`🛠️ Creating PeerConnection for ${mode} call`);
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }],
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("video-ice-candidate", { roomId, candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      console.log(`🎥 Received remote track for ${mode} call`);
      if (mode === "video" && remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      } else if (mode === "audio") {
        const audio = new Audio();
        audio.srcObject = event.streams[0];
        audio.play().catch(e => console.error("Audio play failed", e));
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") setStatus("connected");
      else if (["disconnected", "failed"].includes(pc.connectionState)) handleEndCall();
    };

    peerRef.current = pc;
    return pc;
  };

  const getMedia = async (mode: "audio" | "video") => {
    console.log(`📡 Requesting Media | Mode: ${mode.toUpperCase()}`);
    
    // 🔥 STRICT CONSTRAINTS: Force video to false for audio mode
    const constraints = { 
      video: mode === "video" ? { width: 1280, height: 720 } : false, 
      audio: true 
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // Only attach to local video ref if in video mode
      if (mode === "video" && localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      return stream;
    } catch (err) {
      console.error("❌ Media error:", err);
      toast.error("Media access denied");
      return null;
    }
  };

  const startCall = async (mode: "audio" | "video") => {
    console.log("🚀 STARTING CALL:", mode);
    setCallType(mode);
    setStatus("calling");
    
    const stream = await getMedia(mode);
    if (!stream) return;

    const pc = createPeer(mode);
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    
    console.log(`📤 Sending video-offer with type: ${mode}`);
    socket.emit("video-offer", { roomId, offer, from: userId, type: mode });
  };

  const acceptCall = async () => {
    if (!incomingCall) return;
    const mode = incomingCall.type;
    console.log("✅ ACCEPTING CALL:", mode);
    
    setCallType(mode);
    setStatus("calling");
    
    const stream = await getMedia(mode);
    if (!stream) return;

    const pc = createPeer(mode);
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
    
    pendingCandidates.current.forEach((candidate) => {
      pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(e => console.error(e));
    });
    pendingCandidates.current = [];

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    
    console.log(`📤 Sending answer for ${mode} call`);
    socket.emit("video-answer", { roomId, answer });
  };

  const handleEndCall = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }
    setStatus("ended");
    socket.emit("call-ended", { roomId });
    setTimeout(onClose, 1000);
  };

  useEffect(() => {
    if (!socket) return;

    const handleAnswer = async ({ answer }: any) => {
      if (peerRef.current) {
        await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        pendingCandidates.current.forEach((c) => peerRef.current?.addIceCandidate(new RTCIceCandidate(c)));
        pendingCandidates.current = [];
      }
    };

    const handleIceCandidate = async ({ candidate }: any) => {
      if (peerRef.current?.remoteDescription) {
        await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } else {
        pendingCandidates.current.push(candidate);
      }
    };

    socket.on("video-answer", handleAnswer);
    socket.on("video-ice-candidate", handleIceCandidate);
    socket.on("call-ended", handleEndCall);

    return () => {
      socket.off("video-answer", handleAnswer);
      socket.off("video-ice-candidate", handleIceCandidate);
      socket.off("call-ended", handleEndCall);
    };
  }, [socket]);

  const toggleMute = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (streamRef.current && callType === "video") {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 z-[100] backdrop-blur-md flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
          className="bg-[#0f0f0f] border border-white/10 rounded-3xl w-full max-w-5xl h-full max-h-[700px] flex flex-col overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-[#00ff88] animate-pulse" />
              <span className="text-sm font-bold tracking-wider text-white/70 uppercase">
                {status === "connected" ? `${callType.toUpperCase()} CALL LIVE` : "Secure Connection"}
              </span>
            </div>
            <button onClick={handleEndCall} className="text-white/40 hover:text-white p-2">✕</button>
          </div>

          <div className="flex-1 relative bg-[#050505] flex items-center justify-center overflow-hidden">
            {status === "idle" && (
              <div className="flex flex-col items-center gap-8 text-center p-8">
                <div className="w-24 h-24 rounded-full bg-[#00ff88]/10 flex items-center justify-center border border-[#00ff88]/20">
                  <Video className="w-10 h-10 text-[#00ff88]" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">Connect with Team</h2>
                  <p className="text-white/40">Select call mode to begin session.</p>
                </div>
                <div className="flex flex-col md:flex-row gap-4">
                  <button onClick={() => startCall("audio")} className="bg-white/5 text-white border border-white/10 px-8 py-4 rounded-2xl font-bold hover:bg-white/10 flex items-center gap-3">
                    <Mic className="w-6 h-6 text-[#00ff88]" /> Audio Call
                  </button>
                  <button onClick={() => startCall("video")} className="bg-[#00ff88] text-black px-10 py-4 rounded-2xl font-bold hover:bg-[#00cc6e] flex items-center gap-3">
                    <Video className="w-6 h-6" /> Video Call
                  </button>
                </div>
              </div>
            )}

            {status === "incoming" && (
              <div className="flex flex-col items-center gap-8 text-center p-8">
                <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="w-24 h-24 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                  {incomingCall?.type === "video" ? <Video className="w-10 h-10 text-blue-500" /> : <Mic className="w-10 h-10 text-blue-500" />}
                </motion.div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">Incoming {incomingCall?.type} Call</h2>
                  <p className="text-white/40">{incomingCall?.from} is calling you...</p>
                </div>
                <div className="flex gap-4">
                  <button onClick={onClose} className="bg-red-500/10 text-red-500 px-8 py-4 rounded-2xl font-bold hover:bg-red-500/20 border border-red-500/20">Decline</button>
                  <button onClick={acceptCall} className="bg-[#00ff88] text-black px-10 py-4 rounded-2xl font-bold hover:bg-[#00cc6e] flex items-center gap-3"><Phone className="w-6 h-6" /> Accept</button>
                </div>
              </div>
            )}

            {(status === "calling" || status === "connected") && (
              <div className="w-full h-full flex items-center justify-center">
                {/* ✅ VIDEO UI */}
                {callType === "video" && (
                  <div className="w-full h-full flex flex-col md:flex-row gap-4 p-4">
                    <div className="flex-1 relative rounded-2xl bg-black border border-white/5 overflow-hidden shadow-2xl">
                      <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                      {status === "calling" && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
                          <div className="w-10 h-10 border-4 border-[#00ff88] border-t-transparent rounded-full animate-spin mb-4" />
                          <p className="text-[#00ff88] font-bold uppercase text-[10px] tracking-widest">Connecting Video...</p>
                        </div>
                      )}
                    </div>
                    <div className="w-full md:w-1/3 aspect-video md:aspect-auto md:h-full relative rounded-2xl bg-black border border-white/5 overflow-hidden shadow-xl">
                      <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover mirror-mode" />
                      {isVideoOff && <div className="absolute inset-0 bg-[#111] flex items-center justify-center"><VideoOff className="w-12 h-12 text-white/20" /></div>}
                    </div>
                  </div>
                )}

                {/* ✅ AUDIO UI */}
                {callType === "audio" && (
                  <div className="flex flex-col items-center gap-8">
                    <motion.div animate={status === "connected" ? { scale: [1, 1.05, 1], rotate: [0, 1, -1, 0] } : {}} transition={{ repeat: Infinity, duration: 3 }} className="w-48 h-48 rounded-full bg-[#00ff88]/5 flex items-center justify-center border border-[#00ff88]/10 relative">
                      <div className="absolute inset-0 rounded-full border-2 border-[#00ff88]/20 animate-ping opacity-20" />
                      <div className="w-32 h-32 rounded-full bg-[#00ff88]/10 flex items-center justify-center border border-[#00ff88]/20"><Volume2 className="w-16 h-16 text-[#00ff88]" /></div>
                    </motion.div>
                    <div className="text-center">
                      <h2 className="text-3xl font-bold mb-2">{status === "connected" ? "Voice Active" : "Establishing Line..."}</h2>
                      <p className="text-white/40 tracking-widest uppercase text-sm font-bold">Secure Audio Channel</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {status === "ended" && (
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center"><PhoneOff className="w-8 h-8 text-red-500" /></div>
                <h2 className="text-xl font-bold">Call Ended</h2>
              </div>
            )}
          </div>

          {(status === "calling" || status === "connected") && (
            <div className="p-6 border-t border-white/5 bg-white/5 flex justify-center items-center gap-6">
              <button onClick={toggleMute} className={`p-4 rounded-full border transition-all ${isMuted ? "bg-red-500/20 border-red-500/40 text-red-500" : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"}`}>{isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}</button>
              <button onClick={handleEndCall} className="p-5 rounded-full bg-red-600 text-white hover:bg-red-700 transition-all hover:scale-110 shadow-lg shadow-red-600/20"><PhoneOff className="w-8 h-8" /></button>
              {callType === "video" && (
                <button onClick={toggleVideo} className={`p-4 rounded-full border transition-all ${isVideoOff ? "bg-red-500/20 border-red-500/40 text-red-500" : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"}`}>{isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}</button>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
      <style>{`.mirror-mode { transform: scaleX(-1); }`}</style>
    </AnimatePresence>
  );
}
