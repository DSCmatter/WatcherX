# WatcherX 

Description: A skeleton based around a video-sharing platform which enables users to upload, process, and share videos efficiently.

> [!NOTE]
> Frontend is done solely for authentication purposes, full use of web-client is not performed...yet.

![Architecture](./archi.png)

## Detailed description: 

### Video Upload and Processing Workflow

#### Uploading a Video to Cloud Storage Bucket

1.1. Only authenticated users are allowed to upload videos using web-client.

1.2. web-client makes a request to Cloud Functions (as a REST API).

1.3. The Cloud Functions interact with Cloud Storage to generate a signed URL, which allows the authenticated user to upload a video to a raw video bucket.

#### After Uploading the Video

2.1. This triggers a message sent to Pub/Sub (a message queue), which pushes the message to a Cloud Run service.

2.2. The Cloud Run service acts as a video processing worker, using ffmpeg to transcode the uploaded video to 360p (to reduce memory and payload load).

2.3. After processing, the video is uploaded to Cloud Storage in a `/processed-videos` directory.

2.4. The processed videos can be accessed by any user directly from Cloud Storage.

2.5. The Cloud Run service writes metadata (such as the processing status) to Firestore for tracking and accessibility.


Main Functions:
```
    GenerateUploadUrl 
    video-processing-service
```
