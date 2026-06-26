import fs from 'fs'
import openai from './openai.ts'


export const transcribeAudio =async(filepath:string)=>{
const transcription =await openai.audio.transcriptions.create({
    file:fs.createReadStream(
        filepath
    ),
    model:"whisper-1"
})
  return transcription.text;
}