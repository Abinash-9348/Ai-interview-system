import { isValiduser } from '../midileware/validator.ts';
import { rateLimit } from 'express-rate-limit';
import express from 'express'
import { createRoomController, getRoomController, joinRoomController, lockRoomController, unlockRoomController } from '../controllers/room.controller.ts'
const roomRouter=express.Router()
roomRouter.post("/create",isValiduser,createRoomController)
roomRouter.post("/join",joinRoomController)
roomRouter.get("/get/:roomId",getRoomController)
roomRouter.post("/locked" ,lockRoomController)
roomRouter.post("/unlocked",unlockRoomController)
roomRouter.get("/health",(_req,res)=>{
    console.log("health is ok")
    res.status(200).json({
        ok: true,
        route: "/room/health",
        message: "Room service is healthy"
    })
})

export default roomRouter

