import { Server, Socket } from "socket.io";
import mongoose from "mongoose";
import { Message } from "../model/meessage.model.ts";
import { Room } from "../model/room.model.ts";
import { Violation } from "../model/violation.model.ts";
import jwt from 'jsonwebtoken'
import cookie from 'cookie';
import { InterviewResult } from "../model/interview.result.ts";
import { Interview } from "../model/interview.model.ts";
import { evaluateAnswerInBackground, runFinalEvaluationInBackground } from "../utils/backgroundEvaluator.ts";


interface JwtPayload {
   id:string
   name:string
   role:string
}

type User = {
  socketId: string;
  id: string;
  name: string;
  color: string;
};

// State storage
const users: Record<string, User[]> = {};
const pendingUsers: Record<string, User[]> = {};

// Helper to remove user from all rooms
const removeUserFromAll = (socketId: string) => {
  for (const roomId in users) {
    users[roomId] = users[roomId].filter(u => u.socketId !== socketId);
  }
  for (const roomId in pendingUsers) {
    pendingUsers[roomId] = pendingUsers[roomId].filter(u => u.socketId !== socketId);
  }
};

export const initSocket = (io: Server) => {
  io.use((socket: Socket, next) => {
    try {
      const cookies = cookie.parse(socket.handshake.headers.cookie || "");
      const token = cookies.accesstoken;

      if (!token) {
        return next(new Error("Unauthorized"));
      }

      const decoded = jwt.verify(token, process.env.ACCESS_SECRET as string) as JwtPayload;
      socket.data.user = decoded;
      next();
    } catch (error) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket: Socket) => {
//  socket.onAny((event) => {

//       console.log(
//         "EVENT:",
//         event
//       );
//     });
    socket.on("join", async ({ roomId, color }) => {
      const room = await Room.findOne({ roomId });
      const user = socket.data.user as JwtPayload;
      socket.data.roomId = roomId;

      if (!room) return;

      const isAdmin = room.createdBy?.userId?.toString() === user.id?.toString();

      if (isAdmin) {
        socket.join(roomId);
        socket.emit("you-are-admin");

        // Send pending users to admin
        if (pendingUsers[roomId]) {
          pendingUsers[roomId].forEach((u) => {
            socket.emit("user-waiting", u);
          });
        }

        if (room.code) {
          socket.emit("code-update", room.code);
        }

        // Add to active users
        if (!users[roomId]) users[roomId] = [];
        users[roomId] = users[roomId].filter(u => u.id !== user.id);
        users[roomId].push({
          socketId: socket.id,
          id: user.id,
          name: user.name,
          color: color || "#ff4d4f",
        });

        io.to(roomId).emit("active-users", users[roomId]);
       
      } else {
        // Candidate logic
        
        // Auto-approve if they already have an active interview session in this room
        const activeInterview = await Interview.findOne({
          roomId,
          candidateId: user.id,
          status: "started"
        });

        if (activeInterview) {
          console.log(`👤 Auto-approving reconnecting candidate ${user.name} in room ${roomId}`);
          socket.join(roomId);
          socket.emit("approved", { roomId });
          
          if (!users[roomId]) users[roomId] = [];
          users[roomId] = users[roomId].filter(u => u.id !== user.id);
          users[roomId].push({
            socketId: socket.id,
            id: user.id,
            name: user.name,
            color: color || "#3178c6",
          });
          io.to(roomId).emit("active-users", users[roomId]);
          return;
        }

        if (!pendingUsers[roomId]) pendingUsers[roomId] = [];
        
        // Prevent duplicate pending entries for same user
        pendingUsers[roomId] = pendingUsers[roomId].filter(u => u.id !== user.id);
        
        const candidate = {
          socketId: socket.id,
          id: user.id,
          name: user.name,
          color: color || "#3178c6",
        };
        
        pendingUsers[roomId].push(candidate);
        
        // Notify room (admins will listen)
        io.to(roomId).emit("user-waiting", candidate);
        socket.emit("waiting-approval");
  
      }
    });

    socket.on("approve-user", async ({ socketId, roomId }) => {
      const admin = socket.data.user as JwtPayload;
      const room = await Room.findOne({ roomId });
      
      if (room?.createdBy?.userId?.toString() !== admin.id?.toString()) {
        return; // Only admin can approve
      }


      io.to(socketId).emit("approved", { roomId });
    });

    socket.on("reject-user", async ({ socketId, roomId }) => {
      const admin = socket.data.user as JwtPayload;
      const room = await Room.findOne({ roomId });

      if (room?.createdBy?.userId?.toString() !== admin.id?.toString()) {
        return;
      }

      io.to(socketId).emit("rejected", { roomId });
      
      if (pendingUsers[roomId]) {
        pendingUsers[roomId] = pendingUsers[roomId].filter(u => u.socketId !== socketId);
      }
    });

    socket.on("approved-join", async ({ roomId, color }) => {
      const user = socket.data.user as JwtPayload;
      
      // Move from pending to active
      if (pendingUsers[roomId]) {
        pendingUsers[roomId] = pendingUsers[roomId].filter(u => u.id !== user.id);
      }

      socket.join(roomId);
      
      if (!users[roomId]) users[roomId] = [];
      users[roomId] = users[roomId].filter(u => u.id !== user.id);
      users[roomId].push({
        socketId: socket.id,
        id: user.id,
        name: user.name,
        color: color || "#ff4d4f",
      });

      io.to(roomId).emit("active-users", users[roomId]);
      io.to(roomId).emit("user-joined", {
        message: `${user.name} joined the room`,
      });
      console.log("👤 USER JOINED:", user.name);
    });

    socket.on("code-change", async ({ roomId, code }) => {
      await Room.findOneAndUpdate({ roomId }, { code });
      socket.to(roomId).emit("code-update", code);
    });

    socket.on("cursor-move", ({ roomId, position }) => {
      const user = socket.data.user as JwtPayload;
      socket.to(roomId).emit("cursor-update", {
        position,
        user: {
          id: user.id,
          name: user.name,
          socketId: socket.id,
        },
      });
    });

    socket.on("send-message", async ({ roomId, message }) => {
      const user = socket.data.user as JwtPayload;
      const newMessage = await Message.create({
        roomId,
        message,
        user: {
          name: user.name,
          color: "#ff4d4f", // Should ideally be retrieved from active users
        },
      });

      io.to(roomId).emit("receive-message", newMessage);
    });

    socket.on("load-messages", async (roomId: string) => {
      const messages = await Message.find({ roomId })
        .sort({ createdAt: -1 })
        .limit(50);
      socket.emit("previous-messages", messages.reverse());
    });

    socket.on("typing", (roomId) => {
      const user = socket.data.user as JwtPayload;
      socket.to(roomId).emit("user-typing", { name: user.name });
    });

    socket.on("stop-typing", (roomId) => {
      const user = socket.data.user as JwtPayload;
      socket.to(roomId).emit("user-stop-typing", { name: user.name });
    });

    // WebRTC Signaling (Targeted)
    socket.on("video-offer", ({ roomId, offer, type, toSocketId }) => {
      const user = socket.data.user as JwtPayload;
      const payload = {
        offer,
        from: {
          id: user.id,
          name: user.name,
          role: user.role,
          socketId: socket.id,
        },
        type,
      };

      if (toSocketId) {
        io.to(toSocketId).emit("video-offer", payload);
      } else {
        socket.to(roomId).emit("video-offer", payload);
      }
    });

    socket.on("video-answer", ({ answer, toSocketId }) => {
      const user = socket.data.user as JwtPayload;
      io.to(toSocketId).emit("video-answer", {
        answer,
        from: { id: user.id, name: user.name, socketId: socket.id },
      });
    });

    socket.on("video-ice-candidate", ({ candidate, toSocketId }) => {
      const user = socket.data.user as JwtPayload;
      io.to(toSocketId).emit("video-ice-candidate", {
        candidate,
        from: { id: user.id, name: user.name, socketId: socket.id },
      });
    });

    socket.on("call-ended", ({ roomId, toSocketId }) => {
      const user = socket.data.user as JwtPayload;
      const payload = { user: { id: user.id, name: user.name } };
      if (toSocketId) {
        io.to(toSocketId).emit("call-ended", payload);
      } else {
        socket.to(roomId).emit("call-ended", payload);
      }
    });

    // Proctoring & Tab events
socket.on(
  "tab-inactive",
  ({ roomId }) => {

    const user =
      socket.data.user as JwtPayload;

    io.to(roomId).emit(
      "user-tab-inactive",
      {
        message:
          `${user.name} switched tab`,
        user,
      }
    );
  }
);

socket.on(
  "tab-active",
  ({ roomId }) => {

    const user =
      socket.data.user as JwtPayload;

    io.to(roomId).emit(
      "user-tab-active",
      {
        message:
          `${user.name} is back`,
        user,
      }
    );
  }
);

    socket.on("violation", async ({ roomId, type }) => {
      const user = socket.data.user as JwtPayload;
      try {
        const violation = await Violation.create({
          roomId,
          userId: user.id,
          username: user.name,
          type,
        });
        socket.to(roomId).emit("violation-alert", violation);
      } catch (error) {
        console.error("Violation save error:", error);
      }
    });

    socket.on("track-time", async ({ roomId, type, duration }) => {
      const user = socket.data.user as JwtPayload;
      try {
        const updateFields: any = {};
        const fieldMap: Record<string, string> = {
          looking_left: "lookingLeftTime",
          looking_right: "lookingRightTime",
          head_movement: "headMovementTime",
          multiple_faces: "multipleFaceTime",
          no_face_detected: "noFaceTime",
        };

        if (fieldMap[type]) {
          updateFields.$inc = { [fieldMap[type]]: duration  || 1};
        }

        await Violation.findOneAndUpdate(
          { roomId, userId: user.id },
          { username: user.name, ...updateFields },
          { upsert: true }
        );

        socket.to(roomId).emit("violation-alert", { username: user.name, type });
      } catch (error) {
        console.error("Track time error:", error);
      }
    });

    const handleDisconnect = () => {
      const roomId = socket.data.roomId;
      const user = socket.data.user as JwtPayload;

      if (!roomId) return;

      removeUserFromAll(socket.id);

      io.to(roomId).emit("USER_LEFT", { username: user?.name || "Someone" });
      io.to(roomId).emit("active-users", users[roomId] || []);
      console.log("🔥 Disconnected:", socket.id);
    };

    socket.on("leave-room", (_, callback) => {
      handleDisconnect();
      socket.leave(socket.data.roomId);
      if (callback) callback();
    });

     socket.on(
          "start-interview",
          (data) => {

            console.log(
              "Interview Started"
            );

            io.emit(
              "start-interview",
              data
            );
          }
        );
        socket.on(
  "end-interview",
  async (data) => {
    const user = socket.data.user as JwtPayload;

    io.emit(
      "end-interview",
      data
    );

    // SILENT BACKGROUND FINAL EVALUATION
    if (data.roomId && user?.id) {
      runFinalEvaluationInBackground(data.roomId, user.id);
    }
  }
);

socket.on(
  "candidate-answer",

  async ({
    roomId,
    interviewId,
    question,
    answer,
    timeTaken,
    wordCount,
  }) => {

    console.log(`[SOCKET] 📥 candidate-answer received for roomId: "${roomId}", interviewId: "${interviewId}"`);
    try {
      const user = socket.data.user as JwtPayload;
      if (!user || !user.id) {
        console.error("[SOCKET] ❌ Unauthorized: socket.data.user is missing or does not have an ID");
        return;
      }

      const isValidObjectId = (id: any) => id && mongoose.Types.ObjectId.isValid(id);

      // FIND RESULT BY interviewId OR roomId + candidateId
      let result = null;
      if (isValidObjectId(interviewId)) {
        console.log(`[SOCKET] 🔍 Looking up InterviewResult by interviewId: "${interviewId}"`);
        result = await InterviewResult.findOne({ interviewId });
      }

      if (!result && roomId) {
        const queryObj: any = { roomId };
        if (isValidObjectId(user.id)) {
          queryObj.candidateId = user.id;
        }
        console.log(`[SOCKET] 🔍 Looking up InterviewResult by roomId: "${roomId}" and candidateId: "${user.id}"`);
        result = await InterviewResult.findOne(queryObj);
      }

      // CHECK AND CREATE
      if (!result) {
        console.log("[SOCKET] 🆕 InterviewResult not found in DB. Creating a new document...");
        let finalCandidateId = user.id;

        // Try to fetch candidateId from Interview if available
        if (isValidObjectId(interviewId)) {
          const interview = await Interview.findById(interviewId);
          if (interview) {
            finalCandidateId = interview.candidateId?.toString() || user.id;
            console.log(`[SOCKET] ℹ️ Fetched candidateId from associated Interview: "${finalCandidateId}"`);
          }
        }

        const createPayload: any = {
          candidateId: finalCandidateId,
          roomId,
          answers: [],
        };

        if (isValidObjectId(interviewId)) {
          createPayload.interviewId = interviewId;
        }

        result = await InterviewResult.create(createPayload);
        console.log(`[SOCKET] 💾 Successfully created new InterviewResult document: ${result._id}`);
      } else {
        console.log(`[SOCKET] ℹ️ Found existing InterviewResult: ${result._id}`);
      }

      // Upsert answer to avoid duplicates of the same question
      const existingAnswerIndex = result.answers.findIndex(
        (a: any) => a.question === question
      );

      const wordCountVal = wordCount !== undefined ? wordCount : (answer ? answer.trim().split(/\s+/).filter(Boolean).length : 0);
      const timeTakenVal = timeTaken !== undefined ? timeTaken : 0;

      if (existingAnswerIndex !== -1) {
        result.answers[existingAnswerIndex].answer = answer;
        result.answers[existingAnswerIndex].wordCount = wordCountVal;
        result.answers[existingAnswerIndex].timeTaken = timeTakenVal;
        console.log(`[SOCKET] 📝 Updated existing answer for question: "${question.substring(0, 40)}..."`);
      } else {
        result.answers.push({
          question,
          answer,
          technicalScore: 0,
          communicationScore: 0,
          confidenceScore: 0,
          accuracyScore: 0,
          clarityScore: 0,
          feedback: "",
          correctAnswer: "",
          timeTaken: timeTakenVal,
          wordCount: wordCountVal,
        });
        console.log(`[SOCKET] ➕ Added new answer for question: "${question.substring(0, 40)}..."`);
      }

      // SAVE
      await result.save();
      console.log(`[SOCKET] ✅ Candidate Answer Saved successfully in DB for room: ${roomId}`);

      // SILENT BACKGROUND EVALUATION — fire and forget
      evaluateAnswerInBackground(result._id.toString(), question, answer);

    } catch (error) {
      console.error("❌ Error in candidate-answer socket handler:", error);
    }
  }
);
    socket.on("disconnect", () => {
      handleDisconnect();
    });
  });
};