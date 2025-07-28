import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const subscriptionSchema = new Schema({
    subscriber: {
        type: Schema.Types.ObjectId,
        ref: 'Users'
    },
    channel: {
        type: Schema.Types.ObjectId,
        ref: 'Users'
    },
},
{
    timestamps: true
});
subscriptionSchema.plugin(mongooseAggregatePaginate);
export const Comments = mongoose.model('Comments',subscriptionSchema);