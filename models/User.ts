import { Schema, model, models } from "mongoose";
 
const UserSchema = new Schema(
  {
    email: {
      type: String,
      unique: [true, "Email already exists"],
      required: [true, "Email is required"],
    },
    name: {
      type: String,
      required: [true, "Username is required"],
    },
    role: {
        type: String,
        enum: ["user", "admin", "service_provider"],
        default: "user",
    },
    logintype: {
        type: String,
        required: true
    }
  },
  {
    timestamps: true,
  },
);
 
const User = models.User || model("User", UserSchema);
 
export default User;