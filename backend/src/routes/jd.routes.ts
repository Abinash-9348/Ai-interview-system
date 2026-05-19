import express from "express";

import { upload } from "../utils/upload.ts";

import { uploadJD } from "../controllers/jd.controller.ts";

import { isValiduser } from "../midileware/validator.ts";

const Jdrouter = express.Router();

Jdrouter.post(
  "/upload",

  isValiduser,

  upload.single("jd"),

  uploadJD
);

export default Jdrouter;