<div align="center">
  # Paganini
  
  **AI Video Intelligence Platform**

  An advanced SaaS application that uses Google's Gemini 2.5 Flash to automatically extract insights, timestamps, and semantic meaning from any Video or Instagram Reel.
  
  [Architecture](#architecture) • [Features](#features) • [Tech Stack](#tech-stack)

</div>

---

## What is Paganini?

Have you ever watched a 45-minute YouTube tutorial just to find a 20-second clip? Or received an Instagram Reel from a friend in a foreign language, and wished you could instantly translate it line-by-line? 

**Paganini** solves this. It's a full-stack, AI-powered media analyzer. You can upload a raw video file, paste a YouTube link, or drop in an Instagram Reel. Paganini's background workers will securely download the media, stream it to AWS S3, and feed it into Google's Gemini Vision model. It then generates a dedicated workspace where you can literally *chat* with your video, ask it questions, translate it, and extract structured data instantly.

I built Paganini because dealing with long videos can be tedious. I wanted a fast, seamless way to extract information from media without sitting through the whole thing.

---

## Features

- **Intelligent Media Processing:** Drop in an `.mp4` video, or simply paste a YouTube or Instagram Reel link. Paganini automatically handles the extraction and routes the media through the correct AI pipeline.
- **"Bypass-RAM" Media Streaming:** Instagram Reels are scraped and streamed directly to the disk/S3 in chunks, meaning the Node.js backend never crashes due to RAM limits, even on heavy video files.
- **Asynchronous Job Queues:** Uses **BullMQ + Redis** to handle long-running AI tasks. Since Gemini video processing can take upwards of 60 seconds, jobs are processed in the background while the React frontend seamlessly polls for the `completed` status.
- **Direct-to-S3 Uploads:** Heavy client uploads never touch the Node backend. The server generates secure presigned AWS S3 URLs, and the React client uploads directly to the cloud.
- **Interactive Chat Vault:** Analyzed videos are stored in your personal Vault. You can revisit them anytime and use the Gemini-powered chat UI to ask semantic questions about the video's content.
- **Google OAuth:** Secure, one-click authentication.

---

## Architecture

Paganini is designed for scale and resilience. 

1. **Frontend (React/Vite):** Handles direct S3 uploads and polls the backend for job status to prevent HTTP timeouts.
2. **Main API Server (Express):** Handles Auth, generates S3 signatures, and acts as the producer, pushing AI jobs to the Redis queue.
3. **Background Worker (BullMQ):** Consumes jobs from Redis. It downloads requested Instagram/YouTube links, pushes the media to AWS S3, registers the file with Google GenAI, and waits for Gemini's processing state to become `ACTIVE`.
4. **Database (MongoDB):** Persists user profiles, job states, and historical AI conversations.

---

## Tech Stack

### Frontend
- **Framework:** React 19 + Vite
- **Styling:** Tailwind CSS v4 + Framer Motion (for buttery smooth micro-animations)
- **UI Components:** Shadcn UI, Radix, Lucide Icons
- **State Management:** Zustand
- **Media Player:** React Player
- **Routing:** React Router DOM v7

### Backend
- **Server:** Node.js, Express.js (v5)
- **Database:** MongoDB (Mongoose)
- **Message Broker / Queue:** BullMQ + Self-hosted Redis (IORedis)
- **Cloud Storage:** AWS S3 (AWS SDK v3)
- **AI Integration:** Google GenAI SDK (Gemini 2.5 Flash)
- **Authentication:** JWT + Google Auth Library

---

## Running Locally

Want to spin this up on your machine? Here's how.

### Prerequisites
- Node.js (v18+)
- Redis Server (Running locally on `127.0.0.1:6379`)
- MongoDB URI
- AWS S3 Credentials
- Google Gemini API Key
- RapidAPI Key (for Instagram scraping)

### Installation

1. **Clone the repo**
   ```bash
   git clone https://github.com/yourusername/paganini.git
   cd paganini
   ```

2. **Setup the Backend**
   ```bash
   cd server
   npm install
   ```
   Create a `.env` file in the `server` directory and add your keys (see `.env.example`).
   Run the backend and background workers:
   ```bash
   npm run dev
   ```

3. **Setup the Frontend**
   ```bash
   cd ../client
   npm install
   ```
   Create a `.env` file in the `client` directory for your Vite environment variables.
   Start the React app:
   ```bash
   npm run dev
   ```

---

## Technical Takeaways

The biggest challenge here was dealing with network timeouts. You can't just keep an HTTP request open for a minute while an AI watches a video, because the browser will drop the connection. Moving the heavy lifting to a background queue (BullMQ + Redis) fixed this and made the app way more stable. 

I also had to deal with third-party APIs (like Instagram scraping) randomly hanging or returning weird payloads, which was a good lesson in setting strict timeouts and failing gracefully.
