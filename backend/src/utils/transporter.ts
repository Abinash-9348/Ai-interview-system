
import nodemailer from "nodemailer"

export const sendEmail = async(
   email:string,
   subject:string,
   text:string
)=>{


   const transporter = nodemailer.createTransport({

      service:"gmail",

      auth:{
         user:process.env.MAIL_USER,
         pass:process.env.MAIL_PASS
      }
      

   })

   await transporter.sendMail({

      from:process.env.EMAIL,

      to:email,

      subject,

      text

   })

}