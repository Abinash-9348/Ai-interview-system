import { rateLimit } from 'express-rate-limit';
import express from 'express'
import { createRoomController, getRoomController, joinRoomController, lockRoomController, unlockRoomController } from '../controllers/room.controller.ts'

export const roomRouter=express.Router()
roomRouter.post("/create",createRoomController)
roomRouter.post("/join",joinRoomController)
roomRouter.get("/get/:roomId",getRoomController)
roomRouter.post("/locked" , rateLimit,lockRoomController)
roomRouter.post("/unlocked",rateLimit,unlockRoomController)
roomRouter.get("/health",(_req,res)=>{
    console.log("health is ok")
    res.status(200).json({
        ok: true,
        route: "/room/health",
        message: "Room service is healthy"
    })
})

