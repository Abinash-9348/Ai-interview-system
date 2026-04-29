// src/controllers/execution.controller.ts

import { Request, Response } from "express";
import { executeCodeService } from "../services/execute.code.ts";

export const executeCodeController = async (req: Request, res: Response) => {
  try {
    const result = await executeCodeService(req.body);

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};