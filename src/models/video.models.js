import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videosSchema = new Schema({
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'Users'
    },
    videoFile: {
        type: String,
        required: true
    },
    thumbnail: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    duration: {
        type: Number,
        required: true
    },
    views: {
        type: Number,
        default: 0
    },
    isPublished: {
        type: Boolean,
        default: true
    }
},
{
    timestamps: true
});
videosSchema.plugin(mongooseAggregatePaginate);
export const Videos = mongoose.model('Videos',videosSchema);