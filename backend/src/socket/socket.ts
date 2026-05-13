import { Server, Socket } from "socket.io";
import { Message } from "../model/meessage.model.ts";
import { Room } from "../model/room.model.ts";
import { Violation } from "../model/violation.model.ts";
import jwt from 'jsonwebtoken'

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

const users: Record<string, User[]> = {};
const pendingUsers: Record<string, User[]> = {};
const adminSockets: Record<string, string> = {};



// 🔥 SAFE ADD USER (NO DUPLICATE)
const addUser = (roomId: string, socket: Socket, user: any) => {
  if (!users[roomId]) users[roomId] = [];

  // remove old same user
  users[roomId] = users[roomId].filter(
    (u) => u.id !== user.id
  );

  users[roomId].push({
    socketId: socket.id,
    id: user.id,
    name: user.name,
    color: user.color,
  });
};

export const initSocket = (io: Server) => {

io.use((
   socket: Socket,
   next
) => {

   try {

      const token =
         socket.handshake.auth.token

      if (!token) {

         return next(
            new Error("Unauthorized")
         )

      }

      const decoded = jwt.verify(
         token,
         process.env.ACCESS_SECRET as string
      )

      socket.data.user = decoded

      next()

   } catch (error) {

      next(
         new Error("Invalid token")
      )

   }

})
  io.on("connection", (socket: Socket) => {

    // ================= JOIN =================
    socket.on("join", async ({ roomId,color }) => {

      const room = await Room.findOne({ roomId  });
      const user = socket.data.user as JwtPayload
      socket.data.roomId = roomId;
  

      if (!room || !room.createdBy) return;

      // ================= ADMIN =================
      if (
        room.createdBy.userId?.toString() === user.id?.toString()
      ) {
        socket.join(roomId);

        adminSockets[roomId] = socket.id;

        socket.emit("you-are-admin");

        // send pending users
        if (pendingUsers[roomId]) {
          pendingUsers[roomId].forEach((u) => {
            socket.emit("user-waiting", u);
          });
        }

        if (room.code) {
          socket.emit("code-update", room.code);
        }

        addUser(roomId, socket, user);

        io.to(roomId).emit("active-users", users[roomId]);

        console.log("👑 ADMIN JOINED:", user.name);
        return;
      }

      // ================= NORMAL USER =================
      if (!pendingUsers[roomId]) pendingUsers[roomId] = [];

      const alreadyPending = pendingUsers[roomId].find(
        (u) => u.id === user.id
      );

      if (!alreadyPending) {
        pendingUsers[roomId].push({
          socketId: socket.id,
          id: user.id,
          name: user.name,
          color: color,
        });
      }

      const adminSocketId = adminSockets[roomId];

      if (adminSocketId) {
        io.to(adminSocketId).emit("user-waiting", {
          socketId: socket.id,
          id: user.id,
          name: user.name,
          color: color,
        });
      }

      socket.emit("waiting-approval");
    });

    // ================= APPROVE =================
  socket.on(
  "approve-user",
  ({ socketId, roomId }) => {

    const user =
      socket.data.user as JwtPayload;

    // only admin can approve
    if (user.role !== "admin") {
      return;
    }

    io.to(socketId).emit(
      "approved",
      { roomId }
    );

  }
);

    // ================= REJECT =================
    socket.on("reject-user", ({ socketId, roomId }) => {
      const user=socket.data.user as JwtPayload
      if(user.role != "admin"){
        return
      }

      io.to(socketId).emit("rejected",{roomId});

    });

    // ================= APPROVED JOIN =================
   socket.on(
  "approved-join",
  ({ roomId, color }) => {

    const user =
      socket.data.user as JwtPayload;

    const pending =
      pendingUsers[roomId]?.find(
        (u) => u.id === user.id
      );

    if (!pending) return;

    pendingUsers[roomId] =
      pendingUsers[roomId].filter(
        (u) => u.id !== user.id
      );

    socket.join(roomId);

    addUser(roomId, socket, {
      ...user,
      color,
    });

    io.to(roomId).emit(
      "active-users",
      users[roomId]
    );

    io.to(roomId).emit(
      "user-joined",
      {
        message:
          `${user.name} joined the room`,
      }
    );

    console.log(
      "USER JOINED:",
      user.name
    );

  }
);

    // ================= CODE =================
    socket.on("code-change", async ({ roomId, code }) => {
      const user=socket.data.user as JwtPayload
      if(!user)return
      await Room.findOneAndUpdate(
        { roomId },
        { code },
        { upsert: true }
      );

      socket.to(roomId).emit("code-update", code);
    });

    // ================= CURSOR =================
    socket.on("cursor-move", ({ roomId, position, user }) => {
      socket.to(roomId).emit("cursor-update", {
        position,
        user: {
          ...user,
          socketId: socket.id,
        },
      });
    });

    // ================= CHAT =================
    socket.on("send-message", async ({ roomId, message, user }) => {
      const newMessage = await Message.create({
        roomId,
        message,
        user,
      });

      io.to(roomId).emit("receive-message", newMessage);
    });

    // ================= LOAD CHAT =================
    socket.on("load-messages", async (roomId: string) => {
      const messages = await Message.find({ roomId })
        .sort({ createdAt: -1 })
        .limit(50);

      socket.emit("previous-messages", messages.reverse());
    });

    socket.on("typing",(roomId,user)=>{
      socket.to(roomId).emit("user-typing",{
        name:user.name
      })
    })
    socket.on("stop-typing",(roomId,user)=>{
      socket.to(roomId).emit("user-stop-typing",{
        name:user.name
      })
    })

// ================= DISCONNECT =================
socket.on("disconnect", () => {
  console.log("🔥 disconnect fired");

  if (socket.data.hasLeft) return;

  const roomId = socket.data.roomId;
  const user = socket.data.user;

  if (!roomId) return;

  // remove from active users
  if (users[roomId]) {
    users[roomId] = users[roomId].filter(
      (u) => u.socketId !== socket.id
    );
  }

  // remove from pending users
  if (pendingUsers[roomId]) {
    pendingUsers[roomId] = pendingUsers[roomId].filter(
      (u) => u.socketId !== socket.id
    );
  }

  // ✅ notify ALL users
  io.to(roomId).emit("USER_LEFT", {
    username: user?.name || "Someone",
  });

  io.to(roomId).emit("active-users", users[roomId] || []);
});


// ================= LEAVE ROOM =================
socket.on("leave-room", (_, callback) => {
  console.log("🚪 manual leave");

  const roomId = socket.data.roomId;
  const user = socket.data.user as JwtPayload;

  if (!roomId) {
    callback && callback();
    return;
  }

  socket.data.hasLeft = true;

  if (users[roomId]) {
    users[roomId] = users[roomId].filter(
      (u) => u.socketId !== socket.id
    );
  }

  socket.leave(roomId);

  // ✅ notify ALL users
  io.to(roomId).emit("USER_LEFT", {
    username: user?.name || "Someone",
  });

  io.to(roomId).emit("active-users", users[roomId] || []);

  callback && callback();
});


// ================= TAB EVENTS (NO DB) =================
socket.on("tab-inactive", ({ roomId, user }) => {
  const adminSocketId = adminSockets[roomId];
  

  if (adminSocketId) {
    io.to(adminSocketId).emit("user-tab-inactive", {
      message: `${user.name} switched tab`,
      user,
    });
  }
});

socket.on("tab-active", ({ roomId, user }) => {
  const adminSocketId = adminSockets[roomId];

  if (adminSocketId) {
    io.to(adminSocketId).emit("user-tab-active", {
      message: `${user.name} is back`,
      user,
    });
  }
});

// ================= AI PROCTORING VIOLATIONS =================

// ================= AI PROCTORING VIOLATIONS =================

socket.on(
  "violation",
  async ({ roomId, type, username, userId }) => {

    try {

      console.log("⚠️ VIOLATION:", type);

      // SAVE TO DB
      const violation = await Violation.create({
        roomId,
        userId,
        username,
        type,
      });

      // FIND ADMIN
      const adminSocketId =
        adminSockets[roomId];

      // SEND REALTIME ALERT
      if (adminSocketId) {

        io.to(adminSocketId).emit(
          "violation-alert",
          violation
        );

      }

    } catch (error) {

      console.log(error);

    }

  }
);

// ==============================
// TRACK TIME SOCKET
// ==============================

socket.on(
  "track-time",
  async ({
    roomId,
    userId,
    username,
    type,
    duration,
  }) => {

    try {
       const user =
        socket.data.user as JwtPayload;

      const updateFields: any = {};

      // LOOKING LEFT
      if (type === "looking_left") {

        updateFields.$inc = {
          lookingLeftTime: duration,
        };

      }

      // LOOKING RIGHT
      else if (type === "looking_right") {

        updateFields.$inc = {
          lookingRightTime: duration,
        };

      }

      // HEAD MOVEMENT
      else if (type === "head_movement") {

        updateFields.$inc = {
          headMovementTime: duration,
        };

      }

      // MULTIPLE FACE
      else if (type === "multiple_faces") {

        updateFields.$inc = {
          multipleFaceTime: duration,
        };

      }

      // NO FACE
      else if (type === "no_face_detected") {

        updateFields.$inc = {
          noFaceTime: duration,
        };

      }

    
        await Violation.findOneAndUpdate(

          {
            roomId,
            userId,
          },

          {
            username,
            ...updateFields,
          },

          {
            upsert: true,
            returnDocument: "after",
          }

        );

      // ADMIN ALERT
      const adminSocketId =
        adminSockets[roomId];

      if (adminSocketId) {

        io.to(adminSocketId).emit(
          "violation-alert",
          {
    username,
    type,
  }
        );

      }

    } catch (error) {

      console.log(error);

    }

  }
);
 //video call
socket.on(
  "video-offer",
  ({ roomId, offer, type }) => {

    const user =
      socket.data.user as JwtPayload;

    console.log(
      "📥 Server forwarding video-offer",
      roomId,
      type
    );

    socket.to(roomId).emit(
      "video-offer",
      {
        offer,
        from: {
          id: user.id,
          name: user.name,
          role: user.role,
        },
        type,
      }
    );

  }
);

socket.on(
  "video-answer",
  ({ roomId, answer }) => {

    const user =
      socket.data.user as JwtPayload;

    socket.to(roomId).emit(
      "video-answer",
      {
        answer,
        from: {
          id: user.id,
          name: user.name,
        },
      }
    );

  }
);

socket.on(
  "video-ice-candidate",
  ({ roomId, candidate }) => {

    const user =
      socket.data.user as JwtPayload;

    socket.to(roomId).emit(
      "video-ice-candidate",
      {
        candidate,
        from: {
          id: user.id,
          name: user.name,
        },
      }
    );

  }
);

socket.on(
  "call-ended",
  ({ roomId }) => {

    const user =
      socket.data.user as JwtPayload;

    socket.to(roomId).emit(
      "call-ended",
      {
        user: {
          id: user.id,
          name: user.name,
        },
      }
    );

  }
);
  });
};