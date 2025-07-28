import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentSchema = new Schema({
    content: {
        type: String,
        ref: 'Comments'
    },
    video: {
        type: Schema.Types.ObjectId,
        ref: 'Videos'
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'Users'
    },
},
{
    timestamps: true
});
commentSchema.plugin(mongooseAggregatePaginate);
export const Comments = mongoose.model('Comments',commentSchema);