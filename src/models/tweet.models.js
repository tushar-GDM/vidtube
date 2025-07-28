import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const tweetSchema = new Schema({
    content: {
        type: String,
        required: true
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'Users'
    },
},
{
    timestamps: true
});
tweetSchema.plugin(mongooseAggregatePaginate);
export const Tweets = mongoose.model('Tweets',tweetSchema);