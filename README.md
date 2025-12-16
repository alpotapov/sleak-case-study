# My Notes

## User Stories
- [x] As a user I want to receive an invite with a magic link via an email
- [x] As a visiton I want to login using magic link
- [x] As a visitor I want to be redirected to login view
- [x] As a user I want to see an "upload audio" widget (file input and a button)
- [x] As a user I want to click the button to upload audio file
- [x] As a user I want to see a list of conversations
	- [x] Workflow states: TRANSCRIBING, GENERATING_FEEDBACK, COMPLETED
- [x] As a user I want to click on a list item and see the detail view
- [x] As a user I want to refresh the page and see the transcription once it is available
	- [x] Set up a webhook to receive transcription result from fal ai
	- [x] Send request to fal.ai for transcription
	- [x] Make the file_ready_scanner and transcription_worker execute using cron
- [x] As a user I want to refresh the page and see the feedback once it is available
- [ ] As a user I want to click the delete button to remove all data associated with the feedback workflow


---

# Sleak Full-Stack Case Study

## Your Task

> Build a web app (Next.js & Supabase) where users can upload an audio recording of a sales conversation (e.g., MP3 format) and receive basic AI-generated feedback on what they could improve based on the transcript.

### Core Features

- [ ] Simple user auth using Supabase Auth
- [ ] User can upload their own conversation recordings (audio files)
- [ ] User can view all their own conversations (table view)
- [ ] User can modify & delete their own conversations
- [ ] Conversation Detail View showing AI-generated feedback analyzing the transcript (e.g., what could have been said better, communication improvements, etc.)

### Optional Features

- [ ] Realtime updates of the upload and analysis status
- [ ] Add a `README.md`
- [ ] Record a max. 3 min `Showcase Video` of your final result (Loom, Screen Studio, etc.)

### Tech Stack

- Use [Next.js](https://nextjs.org/docs) as a Frontend and Backend
- Use [Supabase](https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs) as the DB, File Storage and Auth Provider
- Use Azure OpenAI GPT-4.1 (see email for API Key)

### Recommendations

- Use [Langchain JS](https://docs.langchain.com/oss/javascript/langchain/structured-output) to get structured output from the AI
- Use [server-side fetching](https://nextjs.org/docs/app/getting-started/fetching-data) and [Server Actions](https://nextjs.org/docs/app/getting-started/updating-data) instead of API Route handlers to preserve type safety
- Show and follow best practices like using a [Data Access Layer](https://nextjs.org/docs/app/guides/data-security#data-access-layer)
- You'll need to transcribe the audio first (e.g., using Deepgram) before analyzing the transcript

### Timeframe

- You have 7 days to work on the Coding-Challenge
- Please allocate max. 6 hours working time for it ⏱️

## Hints

- Focus on a product-obsessed (high-UX) experience
- Write documented, modular, high-quality and performant code
- You can use all available libraries, AI Coding Tools, etc. out there
- Write code, commits and PRs as you would in your daily work (we want to see how you work)
- It's completely **ok** to not finish all features - just show us what you can build in that short time

## Getting Started

First, clone this repo and install all dependencies _(hint: use pnpm instead of npm)_

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

Create a new [Supabase Project](https://supabase.com/dashboard)

Add all required env vars in `.env.local`

Create your own GitHub repo

For all major features, create a PR and merge them into `main`

Happy Coding! 🚀
