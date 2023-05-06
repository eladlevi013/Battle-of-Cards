import mongoose from "mongoose";
const Schema = mongoose.Schema;

const accountSchema = new Schema({
    _id:mongoose.Schema.Types.ObjectId,
    username: String,
    score: {type: Number, default: 0},
    createdAt: {type: Date, default: Date.now}
})

export default mongoose.model('Account', accountSchema);