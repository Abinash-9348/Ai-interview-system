import { User } from "../model/users.model.ts"
import bcrypt from 'bcryptjs'


export const registerUser = async(name:string,email:string,password:string)=>{
    const user = await User.findOne({email:email});
    if(user){
        throw new Error("Email already exist ");
    }
    const hashpasword = await bcrypt.hash(password,10);
    const createUser = await User.create({name,email,password:hashpasword});
    return createUser;
}
