import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config(); // Load environment variables from .env file
// Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
});

const uploadOnCloudinary = async (localFilePath) => {
    try {

        if(!localFilePath) return null; // Return null if no file path is provided

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: 'auto'
        });
        fs.unlinkSync(localFilePath); // Delete the local file after upload
        return response; // Return the response from Cloudinary

    } catch (error) {

        fs.unlinkSync(localFilePath); // Delete the local file if upload fails
        throw new Error(`Cloudinary upload failed: ${error.message}`);

    }
}

const deleteFromCloudinary = async (publicId) => {
    try {
        if (!publicId) return null; // Return null if no public ID is provided

        const response = await cloudinary.uploader.destroy(publicId);
        return response; // Return the response from Cloudinary

    } catch (error) {
        throw new Error(`Cloudinary delete failed: ${error.message}`);
    }
}
export {uploadOnCloudinary, deleteFromCloudinary};