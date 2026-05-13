import dotenv from 'dotenv'
dotenv.config()
import express from "express";
import http from "http";
import { Server } from "socket.io";
import { db_connect } from "./config/db.ts";
import { initSocket } from "./socket/socket.ts";
import { roomRouter } from "./routes/room.routes.ts";
import cors from 'cors'
import { codeexecuteRouter } from "./routes/codeexcute.routes.ts";
import { limiter } from "./utils/ratelimit.ts";
import { userRouter } from "./routes/user.routes.ts";
import cookieParser from "cookie-parser"


const app = express();

app.use(cors({
  origin: "*",
  methods: ["GET", "POST"]
}));
app.use(express.json())
app.use(cookieParser())


app.get("/", (_req, res) => {
  res.status(200).json({
    ok: true,
    message: "Backend is running",
    health: "/room/health"
  });
});
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin:"https://code-editor-abinash.vercel.app ,http://localhost:5173 ",
    methods: ["GET", "POST"],
    credentials: true
  }
});



// DB connect
db_connect();


initSocket(io);

app.use("/room",roomRouter)
app.use("/code",codeexecuteRouter)
app.use("/user",userRouter)

server.listen(process.env.PORT, () => {
  console.log(`Server running on ${process.env.PORT}`);
});
