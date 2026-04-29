import { Request,Response } from "express";
import { createRoomServices , getRoomService, joinRoomServices, lockedRoom, unlockroom } from "../services/room.services.ts";

export const createRoomController = async (req: Request, res: Response) => {
  try {
    const data= req.body;
    const room = await createRoomServices(data);

    return res.status(201).json({
      success: true,
      message: "Room created successfully",
      room
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Room creation failed"
    });
  }
};

export  const joinRoomController = async(req:Request,res:Response) =>{
    try {
        console.log("hello")
        const {roomId}=req.body
        console.log(req.body)
        const room=await joinRoomServices(roomId)
        return res.status(200).json({
      success: true,
      room
    });
    } catch (error:any) {
            console.error("JOIN ROOM ERROR ❌:", error);
         return res.status(400).json({
      success: false,
      message: error.message
    });
  }
    }

export const getRoomController = async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params as { roomId: string };

    const room = await getRoomService(roomId);

    return res.status(200).json({
      success: true,
      room
    });

  } catch (error: any) {
    return res.status(404).json({
      success: false,
      message: error.message
    });
  }
};

export const lockRoomController = async (req: Request, res: Response) => {
  try {
    const { roomId } = req.body;

    const room = await lockedRoom(roomId);

    return res.status(200).json({
      success: true,
      message:"room is locked now",
      room
    });

  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};


export const unlockRoomController = async (req: Request, res: Response) => {
  try {
    const { roomId } = req.body;

    const room = await unlockroom(roomId);

    return res.status(200).json({
      success: true,
      message:"room is unlocked now",
      room
    });

  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};