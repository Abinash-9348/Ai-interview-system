// gemini

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Socket } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Phone, PhoneOff, Video, VideoOff, Mic, MicOff, 
  Volume2, Minimize2, Maximize2, X 
} from "lucide-react";
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
  // ✅ ORIGINAL LOGIC PRESERVED
  const [callType, setCallType] = useState<"audio" | "video">(incomingCall?.type || preSelectedType);
  const [status, setStatus] = useState<CallStatus>(incomingCall ? "incoming" : "idle");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  
  // ✅ NEW MINIMIZE STATE
  const [isMinimized, setIsMinimized] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const pendingCandidates = useRef<RTCIceCandidateInit[]>(initialIceCandidates || []);

  // Force-Sync mode (Receiver Side)
  useEffect(() => {
    if (incomingCall?.type) {
      setCallType(incomingCall.type);
    }
  }, [incomingCall?.type]);

  // Hardware Isolation
  useEffect(() => {
    if (callType === "audio" && streamRef.current) {
      streamRef.current.getVideoTracks().forEach(track => track.stop());
    }
  }, [callType]);

  // Global cleanup
  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (peerRef.current) peerRef.current.close();
    };
  }, []);

  const createPeer = (mode: "audio" | "video") => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }],
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) socket.emit("video-ice-candidate", { roomId, candidate: event.candidate });
    };

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
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
    const constraints = { 
      video: mode === "video" ? { width: 1280, height: 720 } : false, 
      audio: true 
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (mode === "video" && localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (err) {
      toast.error("Media access denied");
      return null;
    }
  };

  const startCall = async (mode: "audio" | "video") => {
    setCallType(mode);
    setStatus("calling");
    const stream = await getMedia(mode);
    if (!stream) return;
    const pc = createPeer(mode);
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit("video-offer", { roomId, offer, from: userId, type: mode });
  };

  const acceptCall = async () => {
    if (!incomingCall) return;
    const mode = incomingCall.type;
    setCallType(mode);
    setStatus("calling");
    const stream = await getMedia(mode);
    const pc = createPeer(mode);
    if (stream) stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
    pendingCandidates.current.forEach((c) => pc.addIceCandidate(new RTCIceCandidate(c)));
    pendingCandidates.current = [];
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
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
    socket.on("video-answer", async ({ answer }) => {
      if (peerRef.current) await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
    });
    socket.on("video-ice-candidate", async ({ candidate }) => {
      if (peerRef.current?.remoteDescription) await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      else pendingCandidates.current.push(candidate);
    });
    socket.on("call-ended", handleEndCall);
    return () => {
      socket.off("video-answer");
      socket.off("video-ice-candidate");
      socket.off("call-ended");
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

  // --- RENDERING MODAL VIA PORTAL ---

  return createPortal(
    <AnimatePresence>
      <motion.div
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`fixed z-[100] transition-all duration-500 ease-in-out ${
          isMinimized 
            ? "bottom-6 left-6 w-80 h-52 pointer-events-none" 
            : "inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
        }`}
      >
        <motion.div
          layout
          className={`bg-[#0f0f0f] border border-white/10 rounded-3xl overflow-hidden shadow-2xl pointer-events-auto flex flex-col transition-all duration-500 ${
            isMinimized ? "w-full h-full" : "w-full max-w-5xl h-full max-h-[700px]"
          }`}
        >
          {/* Header */}
          <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-[#00ff88] animate-pulse" />
              {!isMinimized && (
                <span className="text-sm font-bold tracking-wider text-white/70 uppercase">
                  {status === "connected" ? `${callType.toUpperCase()} CALL LIVE` : "Secure Connection"}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsMinimized(!isMinimized)} 
                className="text-white/40 hover:text-white p-2 transition-colors"
              >
                {isMinimized ? <Maximize2 size={20} /> : <Minimize2 size={20} />}
              </button>
              <button onClick={handleEndCall} className="text-white/40 hover:text-white p-2">
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 relative bg-[#050505] flex items-center justify-center overflow-hidden">
            {/* Idle State (Only visible when Maximize) */}
            {status === "idle" && !isMinimized && (
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
                    <Mic className="w-6 h-6 text-[#00ff88]" /> Audio
                  </button>
                  <button onClick={() => startCall("video")} className="bg-[#00ff88] text-black px-10 py-4 rounded-2xl font-bold hover:bg-[#00cc6e] flex items-center gap-3">
                    <Video className="w-6 h-6" /> Video
                  </button>
                </div>
              </div>
            )}

            {/* Incoming Call State */}
            {status === "incoming" && (
              <div className="flex flex-col items-center gap-6 text-center p-4">
                <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                  {incomingCall?.type === "video" ? <Video className="w-8 h-8 text-blue-500" /> : <Mic className="w-8 h-8 text-blue-500" />}
                </motion.div>
                {!isMinimized && (
                  <div>
                    <h2 className="text-xl font-bold">Incoming Call</h2>
                    <p className="text-white/40">{incomingCall?.from} is calling...</p>
                  </div>
                )}
                <div className="flex gap-4">
                  <button onClick={onClose} className="p-4 bg-red-500/10 text-red-500 rounded-full hover:bg-red-500/20"><X /></button>
                  <button onClick={acceptCall} className="p-4 bg-[#00ff88] text-black rounded-full hover:bg-[#00cc6e]"><Phone /></button>
                </div>
              </div>
            )}

            {/* Active Call UI */}
            {(status === "calling" || status === "connected") && (
              <div className="w-full h-full relative">
                {callType === "video" ? (
                  <div className="w-full h-full flex flex-col md:flex-row gap-4 p-4">
                    <div className="flex-1 relative rounded-2xl bg-black border border-white/5 overflow-hidden">
                      <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                      {status === "calling" && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60">
                          <div className="w-8 h-8 border-4 border-[#00ff88] border-t-transparent rounded-full animate-spin mb-2" />
                          <p className="text-[#00ff88] text-[10px] uppercase font-bold tracking-widest">Connecting...</p>
                        </div>
                      )}
                    </div>
                    {/* Hide local video and layout when minimized to save space */}
                    {!isMinimized && (
                      <div className="w-full md:w-1/3 aspect-video md:aspect-auto md:h-full relative rounded-2xl bg-black border border-white/5 overflow-hidden">
                        <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
                        {isVideoOff && <div className="absolute inset-0 bg-[#111] flex items-center justify-center"><VideoOff className="w-10 h-10 text-white/20" /></div>}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-4">
                    <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 3 }} className={`${isMinimized ? 'w-16 h-16' : 'w-32 h-32'} rounded-full bg-[#00ff88]/10 flex items-center justify-center border border-[#00ff88]/20`}>
                      <Volume2 className={`${isMinimized ? 'w-8 h-8' : 'w-12 h-12'} text-[#00ff88]`} />
                    </motion.div>
                    {!isMinimized && <p className="text-white/40 tracking-widest uppercase text-[10px] font-bold">Secure Audio Line</p>}
                  </div>
                )}
              </div>
            )}

            {/* Ended State */}
            {status === "ended" && (
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center"><PhoneOff className="w-8 h-8 text-red-500" /></div>
                <h2 className="text-xl font-bold">Call Ended</h2>
              </div>
            )}
          </div>

          {/* Footer Controls - Hidden when Minimized */}
          {!isMinimized && (status === "calling" || status === "connected") && (
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
    </AnimatePresence>,
    document.body
  );
}