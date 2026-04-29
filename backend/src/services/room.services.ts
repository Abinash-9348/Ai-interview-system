import { Room } from "../model/room.model.ts";
import { v4 as uuidv4 } from "uuid";

export async function createRoomServices(data: any) {
  const {language,user}=data
  let roomId = uuidv4().slice(0, 6);
  let exists = await Room.findOne({ roomId });

  while (exists) {
    roomId = uuidv4().slice(0, 6);
    exists = await Room.findOne({ roomId });
  }

  const room = await Room.create({
    roomId,
    language:language,
    code: "",
    isLocked: false,
    createdBy: {
      name: user.name,
      userId: user.id
    }
  });

  return room;
}

export async function joinRoomServices (roomid:string){
    const isExistroom=await Room.findOne({roomId:roomid})
    if(!isExistroom){
        throw new Error("room id not found")
    }
    if(isExistroom.isLocked){
        throw new Error("room is locked")
    }
    return isExistroom
}

export async function getRoomService (roomId: string) {
  const room = await Room.findOne({ roomId });

  if (!room) {
    throw new Error("Room not found");
  }

  return room;
};
export async function lockedRoom(roomId:string){
    const existRoom = await Room.findOne({roomId})
    if(!existRoom){
        throw new Error("roon id not found")
    }
    existRoom.isLocked=true
   await existRoom.save()
    return existRoom
}
export async function unlockroom(roomId: string) {
  const room = await Room.findOne({ roomId });

  if (!room) {
    throw new Error("room id not found");
  }

  room.isLocked = false;
  await room.save();

  return room;
}