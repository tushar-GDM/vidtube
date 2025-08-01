import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const playlistSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    videos: [{
        type: Schema.Types.ObjectId,
        ref: 'Videos'
    }],
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'Users'
    }
},
{
    timestamps: true
});
playlistSchema.plugin(mongooseAggregatePaginate);
export const Playlist = mongoose.model('Playlist',playlistSchema);