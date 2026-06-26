import express from
"express";

import upload from "../utils/uploadaudio.ts";

import { transcribeAudio } from "../utils/transcribe.ts";

const transcriberouter =
  express.Router();

transcriberouter.post(

  "/transcribe",

  upload.single("audio"),

  async (req, res) => {

    try {

      const file =
        req.file;

      if (!file) {

        return res
          .status(400)
          .json({
            message:
              "No file uploaded",
          });
      }

      const transcript =
        await transcribeAudio(
          file.path
        );

      res.json({
        transcript,
      });

    } catch (error) {

      console.log(error);

      res.status(500).json({
        message:
          "Transcription failed",
      });
    }
  }
);

export default transcriberouter;