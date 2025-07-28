import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const likeSchema = new Schema({
    comment: {
        type: Schema.Types.ObjectId,
        ref: 'Comments'
    },
    video: {
        type: Schema.Types.ObjectId,
        ref: 'Videos'
    },
    likedBy: {
        type: Schema.Types.ObjectId,
        ref: 'Users'
    },
    tweet: {
        type: Schema.Types.ObjectId,
        ref: 'Tweets'
    },
},
{
    timestamps: true
});
likeSchema.plugin(mongooseAggregatePaginate);
export const Likes = mongoose.model('Likes',likeSchema);