import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
    },
    username: {
        type: String,
        required: true,
        index: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    posts: {
        type: Array,
        default: [],
    },
    date: {
        type: Date,
        default: Date.now,
    },
});
const User = mongoose.model("user-login", userSchema);

const postSchema = {
    title: String,
    body: String,
};
const Post = mongoose.model("Post", postSchema);

export default User;
export { Post };
