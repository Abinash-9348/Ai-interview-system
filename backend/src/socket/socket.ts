import { Server, Socket } from "socket.io";
import { Message } from "../model/meessage.model.ts";
import { Room } from "../model/room.model.ts";

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
  io.on("connection", (socket: Socket) => {

    // ================= JOIN =================
    socket.on("join", async ({ roomId, user }) => {
      console.log("🔥 JOIN EVENT HIT", roomId, user);

      const room = await Room.findOne({ roomId });

      socket.data.roomId = roomId;
      socket.data.user = user; 

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
          color: user.color,
        });
      }

      const adminSocketId = adminSockets[roomId];

      if (adminSocketId) {
        io.to(adminSocketId).emit("user-waiting", {
          socketId: socket.id,
          id: user.id,
          name: user.name,
          color: user.color,
        });
      }

      socket.emit("waiting-approval");
    });

    // ================= APPROVE =================
    socket.on("approve-user", ({ socketId, roomId }) => {
      io.to(socketId).emit("approved", { roomId });
    });

    // ================= REJECT =================
    socket.on("reject-user", ({ socketId, roomId }) => {
      io.to(socketId).emit("rejected");

      if (pendingUsers[roomId]) {
        pendingUsers[roomId] = pendingUsers[roomId].filter(
          (u) => u.socketId !== socketId
        );
      }
    });

    // ================= APPROVED JOIN =================
    socket.on("approved-join", ({ roomId, user }) => {
      const pending = pendingUsers[roomId]?.find(
        (u) => u.id === user.id
      );

      if (!pending) return;

      pendingUsers[roomId] = pendingUsers[roomId].filter(
        (u) => u.id !== user.id
      );

      socket.join(roomId);

      addUser(roomId, socket, user);

      io.to(roomId).emit("active-users", users[roomId]);

      io.to(roomId).emit("user-joined", {
        message: `${user.name} joined the room`,
      });

      console.log("✅ USER JOINED:", user.name);
    });

    // ================= CODE =================
    socket.on("code-change", async ({ roomId, code }) => {
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
  const user = socket.data.user;

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
socket.on("violation", ({ roomId, type, username }) => {

   console.log("⚠️ VIOLATION:", type);

   const adminSocketId = adminSockets[roomId];

   if(adminSocketId){

      io.to(adminSocketId).emit(
         "violation-alert",
         {
            roomId,
            type,
            username
         }
      );

   }

});
 //video call
   socket.on("video-offer", ({ roomId, offer, from, type }) => {
      console.log("📥 Server forwarding video-offer", roomId, type);
      socket.to(roomId).emit("video-offer", { offer, from, type });
   });

   socket.on("video-answer", ({ roomId, answer }) => {
      socket.to(roomId).emit("video-answer", { answer });
   });

   socket.on("video-ice-candidate", ({ roomId, candidate }) => {
      socket.to(roomId).emit("video-ice-candidate", { candidate });
   });

   socket.on("call-ended", ({ roomId }) => {
      socket.to(roomId).emit("call-ended");
   });
   
  });
};