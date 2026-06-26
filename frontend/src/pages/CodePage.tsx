import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import Editor from "../components/Editor";
import { initsocket } from "../socket";
import { ACTION } from "../Action";
import { Socket } from "socket.io-client";
import toast from "react-hot-toast";
import CallModal from "../components/callModal";
import { FileUp } from "lucide-react";
import JDUploadModal from "../components/JDUploadModal";

import {
  Play,
  ChevronDown,
  Check,
  Terminal,
  Copy,
  Share2,
  Send,
  CheckCircle2,
  LogOut,
  Lock,
} from "lucide-react";

type UserType = {
  socketId?: string;
  id?: string;
  name: string;
  color: string;
};

type MessageType = {
  roomId?: string;
  message: string;
  user: {
    name: string;
    color: string;
  };
  temp?: boolean;
};

const LANGUAGES = [
  { id: "javascript", label: "JavaScript", icon: "JS", color: "#f7df1e" },
  { id: "typescript", label: "TypeScript", icon: "TS", color: "#3178c6" },
  { id: "python", label: "Python", icon: "PY", color: "#3776ab" },
  { id: "java", label: "Java", icon: "JV", color: "#f8981d" },
  { id: "cpp", label: "C++", icon: "C++", color: "#00599c" },
  { id: "c", label: "C", icon: "C", color: "#A8B9CC" },
  { id: "csharp", label: "C#", icon: "C#", color: "#239120" },
  { id: "go", label: "Go", icon: "GO", color: "#00ADD8" },
  { id: "rust", label: "Rust", icon: "RS", color: "#DEA584" },
  { id: "kotlin", label: "Kotlin", icon: "KT", color: "#7F52FF" },
  { id: "swift", label: "Swift", icon: "SW", color: "#FA7343" },
  { id: "php", label: "PHP", icon: "PHP", color: "#777BB4" },
  { id: "ruby", label: "Ruby", icon: "RB", color: "#CC342D" },
  { id: "scala", label: "Scala", icon: "SC", color: "#DC322F" },
  { id: "dart", label: "Dart", icon: "DT", color: "#0175C2" },
  { id: "r", label: "R", icon: "R", color: "#276DC3" },
  { id: "matlab", label: "MATLAB", icon: "ML", color: "#E16737" },
  { id: "sql", label: "SQL", icon: "SQL", color: "#4479A1" },
  { id: "bash", label: "Bash", icon: "SH", color: "#4eaa25" },
  { id: "perl", label: "Perl", icon: "PL", color: "#39457E" },
  { id: "haskell", label: "Haskell", icon: "HS", color: "#5D4F85" },
  { id: "html", label: "HTML/CSS", icon: "HTML", color: "#E34F26" },
];
export default function CodePage() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isCollab = location.state?.joined === true;
  const dropdownRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const hasJoined = useRef(false);

  const incomingLanguage = location.state?.language || "javascript";
  const displayName =
    location.state?.name || localStorage.getItem("display_name") || "Guest";
  const username =
    location.state?.name || localStorage.getItem("display_name") || "Guest";
  const userId =
    location.state?.userId || localStorage.getItem("user_id") || "guest-id";

  const [language, setLanguage] = useState(incomingLanguage);
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<MessageType[]>([]);
  const isRemoteUpdate = useRef(false);
  const [cursors, setCursors] = useState<any[]>([]);
  const [user, setUser] = useState<UserType[]>([]);
  // const chatEndRef = useRef<HTMLDivElement | null>(null);
  const isLeaving = useRef(false);
  const isSocketInit = useRef(false);
  const editorRef = useRef<any>(null);
  const lastStateRef = useRef(document.visibilityState);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [waitingUsers, setWaitingUsers] = useState<User[]>([]);
  const [isWaiting, setIsWaiting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [interview, setInterview] = useState<any>(null);
  const [activeCallType, setActiveCallType] = useState<
    "audio" | "video" | null
  >(null);
  const [incomingCall, setIncomingCall] = useState<{
    offer: any;
    from: string;
    type: "audio" | "video";
  } | null>(null);
  const [pendingIceCandidates, setPendingIceCandidates] = useState<any[]>([]);
  const [isJDModalOpen, setIsJDModalOpen] = useState(false);

  useEffect(() => {
    const handleCall = () => {
      console.log("📞 start call event triggered");
      setActiveCallType("video"); // Default to video when opening via sidebar/nav
    };

    window.addEventListener("start-call", handleCall);

    return () => {
      window.removeEventListener("start-call", handleCall);
    };
  }, []);

  // ================= SOCKET =================
  type User = {
    socketId: string;
    name: string;
    color: string;
  };
  // useEffect(() => {
  //   const fetchStatus = async () => {
  //     try {
  //       const res = await fetch(
  //         `https://cloude-backend.onrender.com/room/status?roomId=${roomId}`
  //       );
  //       const data = await res.json();

  //       if (res.ok) {
  //         setIsLocked(data.locked);
  //       }
  //     } catch (err) {
  //       console.error("Failed to fetch lock status");
  //     }
  //   };

  //   fetchStatus();
  // }, [roomId]);
  useEffect(() => {
    if (!roomId) return;

    const socket = initsocket();
    socketRef.current = socket;

    const onConnect = () => {
      console.log("✅ Socket Connected");
      socket.emit(ACTION.JOIN, { roomId, color: "#ff4d4f" });
    };

    const onAdminStatus = () => {
      console.log("👑 I AM ADMIN");
      setIsAdmin(true);
    };

    const onActiveUsers = (clients: UserType[]) => {
      console.log("ACTIVE USERS:", clients);
      setUser(clients);
    };

    const onWaitingApproval = () => {
      setIsWaiting(true);
    };

    const onApproved = ({ roomId }: { roomId: string }) => {
      console.log("✅ APPROVED BY ADMIN");
      setIsWaiting(false);
      socket.emit(ACTION.APPROVED_JOIN, { roomId, color: "#ff4d4f" });
    };

    const onRejected = () => {
      setIsWaiting(false);
      toast.error("Rejected by admin ❌");
      navigate("/");
    };

    const onUserWaiting = (user: User) => {
      console.log("🔥 USER WAITING:", user);
      setWaitingUsers((prev) => {
        const exists = prev.find((u) => u.id === user.id);
        if (exists) return prev;
        return [...prev, user];
      });
    };

    const onUserJoined = ({ message }: { message: string }) => {
      toast.success(message);
    };

    const onCodeUpdate = (code: string) => {
      setCode(code);
    };

    const onReceiveMessage = (newMessage: MessageType) => {
      if (newMessage.user.name === displayName) return;
      setMessages((prev) => [...prev, newMessage]);
    };

    const onUserLeft = ({ username }: { username: string }) => {
      toast.success(`${username} left`);
      setCursors((prev) => prev.filter((c) => c.name !== username));
    };

    const onTabInactive = ({ message }: { message: string }) => {
      toast(message, { icon: "⚠️" });
    };

    const onTabActive = ({ message }: { message: string }) => {
      toast.success(message);
    };

    const onViolationAlert = (data: any) => {
      const messages: Record<string, string> = {
        looking_left: "Looking Left",
        looking_right: "Looking Right",
        head_movement: "Head Movement",
        no_face_detected: "No Face",
        tab_switch: "Tab Switched",
        multiple_faces: "Multiple Faces",
        looked_away: "Looked Away",
      };
      toast.error(`${data.username} → ${messages[data.type] || data.type}`);
    };

    const onCursorUpdate = ({ position, user }: any) => {
      if (user.socketId === socket.id) return;
      setCursors((prev) => {
        const filtered = prev.filter((c) => c.socketId !== user.socketId);
        return [
          ...filtered,
          {
            top: position.top,
            left: position.left,
            height: position.height,
            name: user?.name || "User",
            color: user?.color || "#fff",
            socketId: user.socketId,
          },
        ];
      });
    };

    const onVideoOffer = ({ offer, from, type }: any) => {
      console.log(`📥 Incoming ${type} offer from:`, from.name);
      setIncomingCall({ offer, from: from.socketId, type }); // Save socketId as from
      setPendingIceCandidates([]);
      setActiveCallType(type);
    };

    // Attach listeners
    socket.on("connect", onConnect);
    socket.on("you-are-admin", onAdminStatus);
    socket.on(ACTION.ACTIVE_USER, onActiveUsers);
    socket.on("waiting-approval", onWaitingApproval);
    socket.on(ACTION.APPROVED, onApproved);
    socket.on(ACTION.REJECTED, onRejected);
    socket.on(ACTION.USER_WAITING, onUserWaiting);
    socket.on("user-joined", onUserJoined);
    socket.on("code-update", onCodeUpdate);
    socket.on("receive-message", onReceiveMessage);
    socket.on("USER_LEFT", onUserLeft);
    socket.on("user-tab-inactive", onTabInactive);
    socket.on("user-tab-active", onTabActive);
    socket.on("violation-alert", onViolationAlert);
    socket.on("cursor-update", onCursorUpdate);
    socket.on("video-offer", onVideoOffer);

    if (socket.connected) onConnect();

    // Tab visibility handling
    const handleVisibilityChange = () => {
      if (!socket.connected) return;
      if (document.visibilityState === lastStateRef.current) return;
      lastStateRef.current = document.visibilityState;

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        socket.emit(
          document.visibilityState === "hidden" ? "tab-inactive" : "tab-active",
          { roomId },
        );
      }, 100);
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      // Remove listeners
      socket.off("connect", onConnect);
      socket.off("you-are-admin", onAdminStatus);
      socket.off(ACTION.ACTIVE_USER, onActiveUsers);
      socket.off("waiting-approval", onWaitingApproval);
      socket.off(ACTION.APPROVED, onApproved);
      socket.off(ACTION.REJECTED, onRejected);
      socket.off(ACTION.USER_WAITING, onUserWaiting);
      socket.off("user-joined", onUserJoined);
      socket.off("code-update", onCodeUpdate);
      socket.off("receive-message", onReceiveMessage);
      socket.off("USER_LEFT", onUserLeft);
      socket.off("user-tab-inactive", onTabInactive);
      socket.off("user-tab-active", onTabActive);
      socket.off("violation-alert", onViolationAlert);
      socket.off("cursor-update", onCursorUpdate);
      socket.off("video-offer", onVideoOffer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [roomId]);
  // ================= CODE CHANGE =================
  const handleCodeChange = (value: string) => {
    setCode(value);

    socketRef.current?.emit("code-change", {
      roomId,
      code: value,
    });
  };

  // ================= CURSOR SEND =================
  const handleMovecoursor = (pos) => {
    if (!pos) return;

    socketRef.current?.emit("cursor-move", {
      roomId,
      position: {
        top: pos.top,
        left: pos.left,
        height: pos.height,
      },
      // user: {
      //   name: username,
      //   color: "#ff4d4f",
      // },
    });
  };

  const handleLeaveRoom = () => {
    const socket = socketRef.current;
    if (!socket) {
      navigate("/");
      return;
    }

    isLeaving.current = true;

    socket.emit("leave-room", {}, () => {
      socket.disconnect();
      socketRef.current = null;

      // reset UI
      setUser([]);
      setCursors([]);
      setMessages([]);
      setCode("");

      navigate("/");
    });
  };

  /// Redirect to join page
  //  const handleShare = async () => {
  //   const link = `${window.location.origin}/?room=${roomId}`;

  //   try {
  //     if (navigator.share) {
  //       await navigator.share({
  //         title: "Join Room",
  //         text: "Join Abinash coding room 🚀",
  //         url: link,
  //       });
  //     } else {
  //       await navigator.clipboard.writeText(link);
  //       setCopied(true);
  //       setTimeout(() => setCopied(false), 2000);
  //       alert("Link copied! You can paste it anywhere.");
  //     }
  //   } catch (error) {
  //     console.log("Share cancelled or failed", error);
  //   }
  // };

  const handleShare = async () => {
    const link = `${window.location.origin}/register?room=${roomId}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Join Room",
          text: "Join Abinash coding room 🚀",
          url: link,
        });
      } else {
        await navigator.clipboard.writeText(link);

        setCopied(true);

        setTimeout(() => setCopied(false), 2000);

        alert("Link copied! You can paste it anywhere.");
      }
    } catch (error) {
      console.log("Share cancelled or failed", error);
    }
  };
  const sendMessage = () => {
    if (!chatInput.trim()) return;

    const msgData = {
      roomId,

      message: chatInput,

      // local ui only
      user: {
        name: displayName,
        color: "#ff4d4f",
      },
    };

    // optimistic ui
    setMessages((prev) => [...prev, msgData]);

    // secure backend emit
    socketRef.current?.emit("send-message", {
      roomId,
      message: chatInput,
    });

    setChatInput("");
  };
  // const handleLockRoom = async () => {
  //   try {
  //     const response = await fetch("https://cloude-backend.onrender.com/room/locked", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ roomId }),
  //     });

  //     const result = await response.json();

  //     if (response.ok) {
  //       toast.success("Room has been locked successfully!");

  //     } else {
  //       toast.error(result.message || "Failed to lock the room");
  //     }
  //   } catch (error) {
  //     toast.error("Server connection error");
  //   }
  // };

  const handleLockRoom = async () => {
    try {
      const endpoint = isLocked
        ? "https://ai-interview-system-5gbg.onrender.com/room/unlocked"
        : "https://ai-interview-system-5gbg.onrender.com/room/locked";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId }),
      });

      const result = await response.json();

      if (response.ok) {
        setIsLocked(!isLocked);

        toast.success(
          isLocked
            ? "Room unlocked successfully!"
            : "Room locked successfully!",
        );
      } else {
        toast.error(result.message || "Failed to update room state");
      }
    } catch (error) {
      toast.error("Server connection error");
    }
  };
  const isLanguageLocked = !!location.state?.language;
  const [theme, setTheme] = useState("vs-dark");
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "vs-dark" ? "light" : "vs-dark"));
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);
  const compileAndRun = async () => {
    setIsLoading(true);
    setOutput("Running code...");
    try {
      const response = await fetch("https://ai-interview-system-5gbg.onrender.com/code/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, code, language, input: "" }),
      });
      const result = await response.json();
      if (result.success) {
        setOutput(
          result.data.output ||
            result.data.error ||
            `Status: ${result.data.status}`,
        );
      } else {
        setOutput("Execution Failed");
      }
    } catch (error) {
      setOutput("Could not connect to backend");
    }
    setIsLoading(false);
  };

  const getStarterCode = (lang: string) => {
    switch (lang) {
      case "javascript":
        return `console.log("Hello World");`;
      case "python":
        return `print("Hello World")`;
      case "cpp":
        return `#include <iostream>\nusing namespace std;\n\nint main() {\n  cout << "Hello World";\n  return 0;\n}`;
      case "java":
        return `public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello World");\n  }\n}`;
      default:
        return `// Start coding in ${lang}...`;
    }
  };

  useEffect(() => {
    setCode(getStarterCode(language));
  }, [language]);

  const selectedLangData = LANGUAGES.find((l) => l.id === language);

  return (
    <div className="pt-24 px-6 min-h-screen bg-[#050505] text-white">
      {isWaiting && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[999] backdrop-blur-sm">
          <div className="bg-[#111] p-8 rounded-2xl text-center shadow-2xl border border-white/10 w-[320px]">
            <div className="w-12 h-12 border-4 border-[#00ff88] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>

            <h2 className="text-lg font-bold text-white">
              Waiting for approval
            </h2>

            <p className="text-gray-400 text-sm mt-2">
              Admin will allow you soon...
            </p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* HEADER AREA */}
        {/* HEADER AREA */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 bg-white/5 p-5 rounded-2xl border border-white/10 shadow-2xl">
          <div className="flex items-center gap-6">
            {/* Exit Action */}
            <button
              onClick={handleLeaveRoom}
              className="group flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl transition-all text-red-500 text-sm font-bold"
            >
              <LogOut
                size={18}
                className="group-hover:-translate-x-1 transition-transform"
              />
              Leave
            </button>

            <div className="hidden md:block w-[1px] h-8 bg-white/10" />

            {/* Room Details */}
            <div>
              <h1 className="text-lg font-bold flex items-center gap-2">
                <span className="text-white/40 font-medium">Room:</span>
                <span className="text-[#00ff88] font-mono tracking-tight">
                  {roomId}
                </span>
              </h1>
              <p className="text-[10px] text-white/40 uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                <div
                  className={`w-1.5 h-1.5 rounded-full ${isCollab ? "bg-[#00ff88] animate-pulse" : "bg-white/20"}`}
                />
                {isCollab ? "Live Session" : "Solo Mode"}
              </p>

              <div className="inline-flex items-center gap-2 mt-1.5 py-1 px-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full shadow-inner">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ff88] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00ff88]"></span>
                </span>
                <span className="text-[10px] font-bold text-white/60 tracking-widest uppercase">
                  {isCollab ? username : "Guest"}
                </span>
              </div>
            </div>
          </div>



         

          {/* COLLABORATORS & ACTIONS */}
          <div className="flex items-center gap-5 w-full md:w-auto bg-black/20 p-2 rounded-2xl border border-white/5">
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 hover:border-[#00ff88]/50 rounded-xl transition-all text-sm font-bold text-white/70 hover:text-white"
            >
              {theme === "vs-dark" ? "🌙 Dark" : "☀️ Light"}
            </button>
 {isAdmin && (
  <>
    <button
      onClick={() => setIsJDModalOpen(true)}
      className="flex items-center gap-2 px-4 py-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 hover:bg-cyan-400/20 text-cyan-400 text-sm font-bold transition-all"
    >
      <FileUp size={16} />
      JD Upload
    </button>

    <JDUploadModal
      isOpen={isJDModalOpen}
      onClose={() => setIsJDModalOpen(false)}
      onUploadSuccess={(jdData) => {
        setInterview(jdData);
        if (jdData?._id) {
          localStorage.setItem(`interview_id_${roomId}`, jdData._id);
        }
      }}
    />
  </>
)}
            {/* Dynamic Avatars (Replaced Person Icon) */}
            {user.length > 0 && (
              <div className="flex items-center gap-2 pl-2">
                <span className="text-[10px] font-black uppercase text-white/20 tracking-tighter mr-1">
                  Users
                </span>

                <div className="flex -space-x-2.5">
                  {user
                    .filter((u) => u.name && u.name !== "Guest")
                    .map((u, i) => {
                      const initials = u.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase();

                      return (
                        <motion.div
                          key={u.socketId || i}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          whileHover={{ y: -4, zIndex: 50 }}
                          title={u.name}
                          className="relative h-10 w-10 rounded-full border-2 border-[#0a0a0a] flex items-center justify-center text-xs font-black shadow-xl cursor-pointer transition-all"
                          style={{
                            backgroundColor: u.color,
                            color: "#000",
                            boxShadow: `0 0 15px ${u.color}33`,
                          }}
                        >
                          {initials}

                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#00ff88] border-2 border-[#0a0a0a] rounded-full" />
                        </motion.div>
                      );
                    })}
                </div>
              </div>
            )}
            <div className="w-[1px] h-6 bg-white/10" />
            {/* Lockroom Action */}
            {isAdmin && (
              <button
                onClick={handleLockRoom}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all text-sm font-bold ${
                  isLocked
                    ? "bg-red-500/10 border-red-500/30 text-red-400"
                    : "bg-white/5 border-white/10 text-white/70 hover:text-white hover:border-[#00ff88]/50"
                }`}
              >
                <Lock
                  size={16}
                  className={isLocked ? "text-red-400" : "text-[#00ff88]"}
                />
                {isLocked ? "Unlock Room" : "Lock Room"}
              </button>
            )}
            {/* Share/Invite Action */}
            {isAdmin && (
              <button
                onClick={handleShare}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all text-sm font-bold ${
                  copied
                    ? "bg-[#00ff88]/20 border-[#00ff88] text-[#00ff88]"
                    : "bg-white/10 border-white/10 hover:bg-white/20 text-white"
                }`}
              >
                {copied ? <CheckCircle2 size={16} /> : <Share2 size={16} />}
                {copied ? "Copied" : "Invite"}
              </button>
            )}
          </div>
        </div>

        {isAdmin && (
          <div className="fixed right-6 bottom-6 bg-[#111] p-4 rounded-2xl shadow-2xl border border-white/10 w-[280px] z-50">
            <h3 className="text-sm font-bold mb-3 text-white">
              Pending Requests
            </h3>

            {waitingUsers.length === 0 && (
              <p className="text-gray-500 text-xs">No users waiting</p>
            )}

            {waitingUsers.map((u) => (
              <div
                key={u.socketId}
                className="flex items-center justify-between mb-2 bg-[#1a1a1a] p-2 rounded-lg"
              >
                <span className="text-sm text-white">{u.name}</span>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      socketRef.current?.emit("approve-user", {
                        socketId: u.socketId,
                        roomId,
                      });

                      setWaitingUsers((prev) =>
                        prev.filter((user) => user.socketId !== u.socketId),
                      );
                    }}
                    className="bg-[#00ff88] text-black px-2 py-1 rounded text-xs hover:bg-[#00cc6e]"
                  >
                    ✓
                  </button>

                  <button
                    onClick={() => {
                      socketRef.current?.emit("reject-user", {
                        socketId: u.socketId,
                        roomId,
                      });

                      setWaitingUsers((prev) =>
                        prev.filter((user) => user.socketId !== u.socketId),
                      );
                    }}
                    className="bg-red-500 px-2 py-1 rounded text-xs hover:bg-red-600"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* EDITOR SECTION */}
          <div className="lg:col-span-8">
            <div className="bg-[#111] p-3 rounded-t-xl flex justify-between items-center border-b border-white/5">
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() =>
                    !isLanguageLocked && setIsDropdownOpen(!isDropdownOpen)
                  }
                  className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-all
  ${
    isLanguageLocked
      ? "bg-white/5 border-white/5 text-white/40 cursor-not-allowed"
      : "bg-white/5 border-white/10 hover:border-[#00ff88]/50"
  }
`}
                >
                  <span style={{ color: selectedLangData?.color }}>
                    {selectedLangData?.icon}
                  </span>
                  {selectedLangData?.label}
                  <ChevronDown size={14} />
                </button>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute top-12 left-0 w-48 bg-[#1a1a1a] border border-white/10 rounded-xl z-50 shadow-2xl overflow-hidden"
                    >
                      {LANGUAGES.map((lang) => (
                        <button
                          key={lang.id}
                          disabled={isLanguageLocked}
                          onClick={() => {
                            if (isLanguageLocked) return;

                            setLanguage(lang.id);
                            setIsDropdownOpen(false);
                          }}
                          className="flex justify-between w-full px-4 py-3 hover:bg-[#00ff88]/10 text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {lang.label}
                          {language === lang.id && (
                            <Check size={14} className="text-[#00ff88]" />
                          )}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {/* Play Button */}
              <div className="flex items-center gap-2">
                {/* Play Button */}
                <button
                  onClick={compileAndRun}
                  disabled={isLoading}
                  title="Run Code"
                  className={`p-2.5 rounded-lg flex items-center justify-center transition-all shadow-lg ${
                    isLoading
                      ? "bg-white/10 text-white/40 cursor-not-allowed"
                      : "bg-[#00ff88] text-black hover:bg-[#00cc6e] hover:shadow-[0_0_15px_rgba(0,255,136,0.4)] active:scale-95"
                  }`}
                >
                  {isLoading ? (
                    <div className="w-[18px] h-[18px] border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  ) : (
                    <Play size={18} fill="currentColor" />
                  )}
                </button>

                {/* Copy Button */}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(code);
                    toast.success("Code copied!");
                  }}
                  className="p-2.5 hover:bg-white/10 rounded-lg text-white/60 hover:text-[#00ff88] transition-all active:scale-95"
                  title="Copy Code"
                >
                  <Copy size={18} />
                </button>
              </div>
            </div>

            <div className="relative h-full">
              <Editor
                value={code}
                language={language}
                theme={theme}
                onChange={(val: string) => handleCodeChange(val || "")}
                onCursorMove={handleMovecoursor}
                editorRef={editorRef}
              />
              {isCollab &&
                cursors.map((c) => {
                  if (c.socketId === socketRef.current?.id) return null;

                  return (
                    <div
                      key={c.socketId}
                      style={{
                        position: "absolute",
                        top: c.top,
                        left: c.left,
                        pointerEvents: "none",
                        zIndex: 100,
                        transition: "all 0.1s linear",
                      }}
                    >
                      {/* cursor */}
                      <div
                        style={{
                          width: "2px",
                          height: c.height,
                          background: c.color,
                        }}
                      />

                      {/* name */}
                      <div
                        style={{
                          position: "absolute",
                          top: -20,
                          left: 0,
                          background: c.color,
                          color: "#fff",
                          fontSize: "11px",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {c.name}
                      </div>
                    </div>
                  );
                })}
            </div>

            {activeCallType && socketRef.current && (() => {
              const socket = socketRef.current;
              const roomIdVal = roomId!;
              const interviewId = interview?._id || localStorage.getItem(`interview_id_${roomId}`);
              const username = displayName;
              const initialIceCandidates = pendingIceCandidates;
              const preSelectedType = activeCallType;
              const handleCloseModal = () => {
                setActiveCallType(null);
                setIncomingCall(null);
                setPendingIceCandidates([]);
              };

              console.log(
                "FINAL INTERVIEW ID:",
                interviewId
              );

              return (
                <CallModal
                  socket={socket}
                  roomId={roomIdVal}
                  interviewId={interviewId || undefined}
                  userId={userId}
                  username={username}
                  incomingCall={incomingCall}
                  initialIceCandidates={initialIceCandidates}
                  preSelectedType={preSelectedType}
                  onClose={handleCloseModal}
                />
              );
            })()}
            {/* <button
              onClick={compileAndRun}
              disabled={isLoading}
              className={`w-full mt-4 py-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all shadow-lg ${
                isLoading
                  ? "bg-white/10 text-white/40 cursor-not-allowed"
                  : "bg-[#00ff88] text-black hover:bg-[#00cc6e] hover:scale-[1.01]"
              }`}
            >
              <Play size={18} fill="currentColor" />
              {isLoading ? "Executing..." : "Run Code"}
            </button> */}
          </div>

          {/* SIDEBAR SECTION */}
          <div className="lg:col-span-4 space-y-6">
            {/* CONSOLE */}
            <div className="bg-[#111] p-5 rounded-2xl h-[250px] flex flex-col border border-white/5">
              <h3 className="mb-3 flex gap-2 items-center text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
                <Terminal size={14} /> Console Output
              </h3>
              <div className="flex-1 overflow-auto bg-black/20 rounded-lg p-3 font-mono text-sm text-white/80 whitespace-pre-wrap border border-white/5">
                {output || "System ready. Hit 'Run Code' to see output."}
              </div>
            </div>

            {/* CHAT */}
            {isCollab && (
              <div className="bg-[#111] p-5 rounded-2xl h-[400px] flex flex-col border border-white/5 shadow-xl">
                <h3 className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
                  Live Chat
                </h3>
                <div
                  ref={chatContainerRef}
                  className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar"
                >
                  {messages.map((msg, i) => {
                    const isMe = msg.user?.name === displayName;

                    return (
                      <div
                        key={i}
                        className={`flex flex-col ${
                          isMe ? "items-end" : "items-start"
                        }`}
                      >
                        <span className="text-[#00ff88] text-[9px] font-bold uppercase mb-1 opacity-60">
                          {msg.user?.name}
                        </span>

                        <div
                          className={`max-w-[80%] p-2 rounded-xl text-sm border ${
                            isMe
                              ? "bg-[#00ff88]/10 border-[#00ff88]/20 text-white"
                              : "bg-white/5 border-white/5 text-white/80"
                          }`}
                        >
                          {msg.message}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-2 mt-4 bg-black/40 p-1.5 rounded-xl border border-white/10 focus-within:border-[#00ff88]/50 transition-all">
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 bg-transparent px-2 py-1.5 rounded text-sm focus:outline-none"
                  />
                  <button
                    onClick={sendMessage}
                    className="bg-[#00ff88] text-black p-2 rounded-lg hover:bg-[#00cc6e] transition-colors"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
