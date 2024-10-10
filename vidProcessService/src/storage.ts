// 1. Google cloud storage interactions 
// 2. Local file interactions 

import { Storage } from "@google-cloud/storage";
import fs from 'fs';
import ffmpeg from "fluent-ffmpeg";
import { resolve } from "path";

const storage = new Storage();

const rawVideoBucketName = "dscmatter-raw-videos";
const processedVideoBucketName = "dscmatter-processed-videos";

const localRawVideoPath = "./raw-videos";
const localProcessedVideoPath = "./processed-videos";

// Creates the local directories for raw and processed videos. 

export function setupDirectories() {
    ensureDirectoryExistence(localRawVideoPath);
    ensureDirectoryExistence(localProcessedVideoPath);
}

/**
 * @param rawVideoName - The name of the file to convert from {@link localRawVideoPath}.
 * @param processedVideoName - The name of the file to convert to {@link localRawVideoPath}.
 * @returns A promise that resolves when the video has been converted.
 */

export function convertVideo(rawVideoName: string, processedVideoName: string) {
    return new Promise<void>((resolve, reject) => {
        ffmpeg(`${localRawVideoPath}/${rawVideoName}`)
        .outputOptions("-vf", "scale = -1:360") //scale to 360p
        .on("end", () => {

            console.log("Video processing finished succesfully.")
            resolve();
        })
        .on("error", (err: Error) => {
            console.log(`An error occurred: ${err.message}`);
            reject(err);
        })

        .save(`${localProcessedVideoPath}/${processedVideoName}`); 
    });
}

// File system operations 
// 1. Download raw video 

/**
 * @param fileName - The name of the file to download from the 
 * {@link rawVideoBucketName} bucket into the {@link localRawVideoPath} folder.
 * @returns A promise that resolved when the file has been downloaded.
 */

export async function downloadRawVideo(fileName: string) {
    storage.bucket(rawVideoBucketName)
        .file(fileName)
        .download({ destination: `${localRawVideoPath}/${fileName}`});
    
    console.log(
        `gs://${rawVideoBucketName}/${fileName} download to ${localRawVideoPath}/${fileName}.`
    )
}

// 2. Upload processed videos from local 

/**
 * @param fileName - The name of the file to upload from the 
 * {@link localProcessedVideoPath} folder into the {@link processedVideoBucketName}.
 * @returns A promise that resolved when the file has been uploaded.
 */

export async function uploadProcessedVideo(fileName: string) {
    const bucket = storage.bucket(processedVideoBucketName);

    bucket.upload(`${localProcessedVideoPath}/${fileName}`, {
        destination: fileName
    });
    console.log(
        `${localProcessedVideoPath}/${fileName} uploaded to gs://${processedVideoBucketName}/${fileName}.`
    );

    await bucket.file(fileName).makePublic();
}

/**
 * 
 * @param fileName - The name of the file to delete from the 
 * {@link localRawVideoPath} folder. 
 * @returns A promise that resolved when the file has been deleted.
 */

export function deleteRawVideo(fileName: string) {
    return deleteFile(`${localRawVideoPath}/${fileName}`);
}

/**
 * 
 * @param fileName - The name of the file to delete from the 
 * {@link localProcessedVideoPath} folder. 
 * @returns  A promise that resolves when the file has been deleted.
 */

export function deleteProcessedVideo(fileName: string) {
    return deleteFile(`${localProcessedVideoPath}/${fileName}`);
}
/**
 * @param filePath - The path of the file to delete 
 * @returns A promise that resolves when the file has been deleted.
 */

function deleteFile(filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        if (fs.existsSync(filePath)) {
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.log(`Failed to delete file at ${filePath}`, err);
                    reject(err);
                } else {
                    console.log(`File delete at ${filePath}.`);
                    resolve();
                }
            })
        } else {
            console.log(`File not found at ${filePath}, skipping the delete.`);
            resolve();
        }
    })
}

/**
 * Ensures a directory exists, creating it if necessary.
 * @param {string} dirPath - The directory path to check.
 */

function ensureDirectoryExistence(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, {recursive: true}); // recursive: true enables creating nested directory
        console.log(`Directory created at ${dirPath}`);
    }
}