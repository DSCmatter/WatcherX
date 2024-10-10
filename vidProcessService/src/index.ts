import express from "express";
import { convertVideo, deleteProcessedVideo, deleteRawVideo, downloadRawVideo, setupDirectories, uploadProcessedVideo } from "./storage";

setupDirectories();

const app = express();
app.use(express.json());

app.post("/process-video", async (req, res) => {
    // Get the bucket and filename from the Cloud Pub/Sub message
    let data;
    try {
        const message = Buffer.from(req.body.message.data, 'base64').toString('utf8');
        data = JSON.parse(message);
        if (!data.name) {
            throw new Error('Invalid message payload received.');
        }
    } catch (error) {
        console.log(error);
        return res.status(400).send('Bad Request: missing filename.');
    }

    const inputFileName = data.name;
    const outputFileName = `processed-${inputFileName}`;

    // Download the raw video from Cloud Storage 
    await downloadRawVideo(inputFileName);
    try {
        // Convert the video to 360p
        await convertVideo(inputFileName, outputFileName);

        // Upload the processed video to Cloud Storage
        await uploadProcessedVideo(outputFileName);

        // Cleanup: delete raw and processed video from local storage (if desired)
        await deleteRawVideo(inputFileName);
        await deleteProcessedVideo(outputFileName);

        // Send success response
        return res.status(200).send('Processing finished successfully');
    } catch (err) {
        console.error("Error during video processing:", err);

        // Attempt to delete raw video and processed video if they exist
        await deleteRawVideo(inputFileName);

        try {
            await deleteProcessedVideo(outputFileName);
        } catch (deleteError) {
            // If processed video does not exist or deletion fails, just log the error
            console.log("Processed video deletion failed:", deleteError);
        }

        return res.status(500).send('Internal Server Error: video processing failed.');
    }
});



const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(
        `Video processing service listening at http://localhost:${port}`);
});