import { Response } from "express";
import pdf from "pdf-parse-fixed";
import { JD } from "../model/jd.model.ts";
import { uploadToCloudinary } from "../utils/cloudinary.ts";
import { AuthRequest } from "../types/express.ts";


 
// export const uploadJD = async (req: AuthRequest, res: Response) => {
//   try {
//     // check recruiter
//     if (!req.user || req.user.role !== "recruiter") {
//       return res.status(403).json({
//         success: false,
//         message: "Only recruiter can upload JD",
//       });
//     }

//     // check file  
//     if (!req.file) {
//       return res.status(400).json({
//         success: false,
//         message: "PDF file required",
//       });
//     }

//     // parse pdf
//     const parsedPdf = await pdf(req.file.buffer);

//     // upload pdf to cloudinary
//     const cloudinaryResult = await uploadToCloudinary(req.file.buffer);

//     // save in db
//     const jd = await JD.create({
//       recruiterId: req.user.id,
//       title: req.file.originalname,
//       pdfUrl: cloudinaryResult.secure_url,
//       rawText: parsedPdf.text,
//       status: "draft",
//     });

//     // response
//     res.status(201).json({
//       success: true,
//       message: "JD uploaded successfully",
//       data: jd,
//     });

//   } catch (error: any) {
//     console.log(error);

//     res.status(500).json({
//       success: false, 
//       message: "Something went wrong",
//       error: error.message,
//     });
//   }
// };

export const uploadJD = async (
  req: AuthRequest,
  res: Response
) => {

  try {

    // CHECK RECRUITER

    if (
      !req.user ||
      req.user.role !== "recruiter"
    ) {

      return res.status(403).json({

        success: false,

        message:
          "Only recruiter can upload JD",

      });

    }

    // CHECK FILE

    if (!req.file) {

      return res.status(400).json({

        success: false,

        message: "PDF file required",

      });

    }

    // SAFE PDF PARSE

    let parsedPdf;

    try {

      parsedPdf = await pdf(
        req.file.buffer
      );

    } catch (error) {

      return res.status(400).json({

        success: false,

        message:
          "Invalid or corrupted PDF",

      });

    }

    // CHECK EMPTY TEXT

    if (!parsedPdf.text.trim()) {

      return res.status(400).json({

        success: false,

        message:
          "No readable text found in PDF",

      });

    }

    // UPLOAD CLOUDINARY

    const cloudinaryResult =
      await uploadToCloudinary(
        req.file.buffer
      );

    // SAVE DATABASE

    const jd = await JD.create({

      recruiterId: req.user.id,

      title:
        req.file.originalname,

      pdfUrl:
        cloudinaryResult.secure_url,

      rawText:
        parsedPdf.text,

      status: "draft",

    });

    
    // RESPONSE

    return res.status(201).json({

      success: true,

      message:
        "JD uploaded successfully",

      data: jd,
     
    });

  } catch (error: any) {

    console.log(error);

    return res.status(500).json({

      success: false,

      message:
        "Something went wrong",

      error: error.message,

    });

  }

};