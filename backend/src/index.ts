import dotenv from 'dotenv'
dotenv.config()

import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import cookieParser from "cookie-parser";

import { db_connect } from "./config/db.ts";
import { initSocket } from "./socket/socket.ts";
import  roomRouter  from './routes/room.routes.ts';
import { codeexecuteRouter } from "./routes/codeexcute.routes.ts";
import { userRouter } from "./routes/user.routes.ts";
import Jdrouter from './routes/jd.routes.ts';
import { generateQuestionRouter } from './routes/genereteQuestion.routes.ts';
import { evaluteAnswerRouter } from './routes/evalute.routes.ts';

const app = express();

// ================= CORS =================
app.use(
  cors({

    origin: [
      "http://localhost:5173",
      "https://code-editor-abinash.vercel.app"
    ],

    credentials: true,

    methods: ["GET", "POST"]

  })
);

app.use(express.json());

app.use(cookieParser());

app.get("/", (_req, res) => {

  res.status(200).json({
    ok: true,
    message: "Backend is running",
    health: "/room/health"
  });

});

const server =
   http.createServer(app);

// ================= SOCKET =================
const io = new Server(server, {

  cors: {

    origin: [
      "http://localhost:5173",
      "https://code-editor-abinash.vercel.app"
    ],

    methods: ["GET", "POST"],

    credentials: true

  }

});

// ================= DB =================
db_connect();

// ================= SOCKET INIT =================
initSocket(io);

// ================= ROUTES =================
app.use("/room", roomRouter);

app.use("/code", codeexecuteRouter);

app.use("/user", userRouter);

app.use("/jd", Jdrouter)

app.use("/question",generateQuestionRouter)

app.use("/answer", evaluteAnswerRouter)
// ================= SERVER =================
server.listen(process.env.PORT, () => {

  console.log(
    `Server running on ${process.env.PORT}`
  );

});