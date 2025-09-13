# MicroPlastics Pulse Project

## 1. Overview

The MicroPlastics Pulse Project is a web application designed to aggregate, process, and display the latest news and research related to microplastics. It aims to provide users with a curated feed of articles, enhanced with AI-generated summaries and illustrative images, to highlight the pervasiveness and impact of microplastics on health and the environment.

## 2. How It Works (High-Level Flow)

The project operates through a combination of automated fetching, AI processing, and manual administrative controls:

1.  **Article Aggregation:**
    *   The backend periodically (or through manual trigger) fetches articles from the web using the Google Custom Search API based on a predefined list of specialized search queries.

2.  **AI Content Enhancement:**
    *   For each new article identified:
        *   An **AI-generated summary** is created using OpenAI's GPT-3.5-turbo model to provide a concise overview.
        *   An **AI-generated illustrative image** is created using OpenAI's DALL-E 3 model to visually represent the article's theme. The image prompt is designed to produce realistic, editorial-style photos without text or overly dramatic expressions.

3.  **Storage:**
    *   Generated images are uploaded to and stored in **Vercel Blob storage**.
    *   Article metadata (URL, title, original snippet), AI-generated summaries, and the URLs to the AI-generated images (stored in Vercel Blob) are saved in a **Supabase (PostgreSQL) database**.

4.  **Content Delivery:**
    *   The **frontend application** fetches the processed articles from the backend API and displays them in a user-friendly news feed.

5.  **Administration:**
    *   An **admin panel** provides tools for content management, including manual article submission, triggering news fetch cycles, batch updating stories (e.g., to generate missing images), and regenerating specific images.

## 3. Key Features

*   **Automated News Aggregation:** Regularly scans for new articles based on defined search terms.
*   **AI-Generated Summaries:** Provides concise summaries of articles using GPT-3.5-turbo.
*   **AI-Generated Images:** Creates unique, relevant images for articles using DALL-E 3.
*   **Advanced Admin Dashboard:** A secure area for project administrators with comprehensive management tools:
    *   **Manual Article Submission:** Add specific URLs for immediate processing
    *   **Manual News Fetch:** Trigger individual search queries with real-time progress tracking
    *   **Full Automation Suite:** **NEW** - Run complete daily automation (Google + Email + Twitter) instantly
    *   **Database Integrity Checker:** **NEW** - Scan for duplicate URLs with detailed statistics and cleanup guidance
    *   **Batch AI Updates:** Process articles missing AI images with batch controls
    *   **Image Regeneration:** Regenerate AI images for specific articles by UUID
    *   **Real-time Status Updates:** Live progress tracking with success/error states and timestamps
*   **Public News Feed:** Displays the curated and AI-enhanced articles to users.
*   **Research Library:** Advanced document search and viewing system with:
    *   **PDF Document Upload:** Upload and store research documents (PDFs) with automatic text extraction
    *   **Semantic Search:** Search through document content with AI-powered relevance scoring
    *   **Document Filtering:** Filter search results by specific documents
    *   **Precise Navigation:** Click "View Document" to navigate directly to the exact page and text position
    *   **Whole Word Matching:** Intelligent search that matches complete words only (e.g., "national" won't match "international")
    *   **Snippet Display:** Shows relevant text snippets with highlighted search terms
*   **Secure Image Storage:** Utilizes Vercel Blob for reliable image hosting.
*   **Robust Database:** Employs Supabase (PostgreSQL) for structured data storage.

## 4. Project Structure

The project is organized into two main repositories, typically managed within a parent project directory:

1.  **`microplastics-pulse-frontend`**
    *   **Description:** Contains the frontend application built with React (using TypeScript and Vite).
    *   **Responsibilities:** User interface, presenting the news feed, admin dashboard interactions, and communication with the backend API.

2.  **`microplastics-pulse-backend`**
    *   **Description:** Contains the backend API built with Node.js and Express.js, deployed on Railway with automated daily scheduling.
    *   **Responsibilities:** Automated daily tasks (Google fetch, email processing, Twitter posting), AI processing (summaries, images), database management (Supabase), comprehensive admin tools, and real-time status monitoring.

## 5. Tech Stack

*   **Frontend:**
    *   React (with TypeScript)
    *   Vite (build tool)
    *   Tailwind CSS (styling)
    *   Axios (HTTP client)
*   **Backend:**
    *   Node.js
    *   Express.js
*   **AI Services:**
    *   OpenAI API:
        *   GPT-3.5-turbo (for text summaries)
        *   DALL-E 3 (for image generation)
*   **Database:**
    *   Supabase (PostgreSQL)
*   **Image Storage:**
    *   Vercel Blob
*   **External Search:**
    *   Google Custom Search API
*   **Deployment & Hosting:**
    *   Frontend: Vercel (React/TypeScript application)
    *   Backend: Railway (Node.js with persistent processes and cron scheduling)

## 6. Key Backend API Endpoints

The backend exposes several key API endpoints under the `/api` path:

*   `GET /latest-news`: Fetches the list of processed news articles for the public feed.
*   `POST /add-news`: Allows manual submission of a new article URL for processing.
*   `POST /trigger-fetch`: (Used by Admin Panel) Triggers the processing of a single search query by its index.
    *   *Note: The `GET /trigger-fetch` for a full cron-style run was found to be problematic due to serverless execution limits and is effectively deprecated in favor of the manual, step-by-step fetch from the admin panel.*
*   `POST /batch-update-stories`: Processes a batch of stories from the database. Currently configured to find stories where `ai_image_url` is NULL and regenerate both the summary and image.
*   `POST /regenerate-image`: Regenerates the AI image for a specific article identified by its UUID.
*   `GET /search-queries`: Returns the predefined list of search queries used for fetching articles.

## 7. Setup & Running Locally (Brief Guide)

To set up and run the project locally, you'll generally need to:

1.  **Clone Repositories:**
    *   `git clone <repository_url_for_frontend>` (e.g., `git clone https://github.com/hellolucient/microplastics-pulse-frontend.git`)
    *   `git clone <repository_url_for_backend>` (e.g., `git clone https://github.com/hellolucient/microplastics-pulse-backend.git`)

2.  **Environment Variables:**
    *   Both frontend and backend applications will require environment variables to be set up. Create `.env` files in the root of each repository based on their respective `.env.example` files (if available, or based on required keys).
    *   **Key variables for the backend typically include:**
        *   `SUPABASE_URL`
        *   `SUPABASE_SERVICE_KEY`
        *   `OPENAI_API_KEY`
        *   `GOOGLE_API_KEY`
        *   `GOOGLE_SEARCH_ENGINE_ID`
        *   `BLOB_READ_WRITE_TOKEN` (for Vercel Blob)
        *   `PORT` (for local backend server, e.g., 3001)
    *   **Key variables for the frontend typically include:**
        *   `VITE_BACKEND_API_URL` (e.g., `http://localhost:3001`)
        *   Supabase client keys if direct Supabase calls are made from the frontend (e.g., for auth).

3.  **Install Dependencies:**
    *   Navigate into each repository's directory:
        *   `cd microplastics-pulse-frontend && npm install` (or `yarn install`)
        *   `cd ../microplastics-pulse-backend && npm install` (or `yarn install`)

4.  **Run Development Servers:**
    *   **Backend:** `cd microplastics-pulse-backend && npm run dev` (or your configured script, often `node api/index.js` for local testing if set up for it).
    *   **Frontend:** `cd microplastics-pulse-frontend && npm run dev` (or `yarn dev`). This will usually start the Vite development server, and you can access the frontend in your browser (typically `http://localhost:5173` or similar).

## 8. Admin Panel Features (Recently Enhanced)

### **🚀 New Automation Controls**
*   **Manual Automation Trigger**: Run the complete daily automation suite instantly
*   **Database Integrity Checker**: Comprehensive duplicate URL detection with statistics
*   **Real-time Status Updates**: Live progress tracking with detailed success/error feedback
*   **Individual Task Controls**: Separate triggers for Google fetch, email check, and Twitter posting

### **📊 Enhanced Monitoring**
*   **Automation Task Logs**: Real-time display of backend automation results
*   **Failed URLs Tracking**: Monitor and retry failed article processing
*   **Batch Processing Controls**: Advanced controls for updating existing articles
*   **Timestamp Tracking**: Detailed timing information for all operations

### **🎯 User Experience Improvements**
*   **Beautiful UI Design**: Modern, responsive interface with clear visual feedback
*   **Loading States**: Professional loading indicators and disabled button handling
*   **Error Recovery**: Graceful error handling with detailed error messages
*   **Success Celebrations**: Clear confirmation of successful operations with helpful tips

## 9. Research Library Implementation (January 2025)

**🔍 Advanced Document Search System:**
*   **PDF Processing:** Uses `pdf-parse-pages` for accurate page-by-page text extraction
*   **Intelligent Search:** Whole word matching with regex boundaries to prevent partial matches
*   **Precise Navigation:** Click "View Document" to scroll directly to the exact text position on the correct page
*   **Document Filtering:** Search within specific documents or across all documents
*   **Snippet Display:** Shows relevant text excerpts with highlighted search terms
*   **Page-Aware Processing:** Accurate page number calculation using actual PDF page data

**🛠 Technical Implementation:**
*   **Frontend:** PDF.js integration with custom text layer and precise scroll positioning
*   **Search Logic:** Word boundary regex matching for accurate whole-word search
*   **Navigation:** Smooth scrolling to exact text coordinates within PDF pages
*   **UI Components:** Enhanced PDF viewer with search functionality and document filtering

## 10. Current Production Status

**✅ Frontend Status: FULLY OPERATIONAL**

The admin panel now provides comprehensive tools for:
*   **✅ Real-time Automation Control**: Test and monitor backend systems instantly
*   **✅ Database Management**: Monitor data integrity with automated duplicate detection
*   **✅ Production Monitoring**: Real-time status updates and detailed logging
*   **✅ User-friendly Interface**: Beautiful, responsive design with excellent UX
*   **✅ Research Library**: Advanced document search with precise navigation and whole-word matching

## 11. Future Considerations

*   **UI for Search Query Management**: Allow admins to add/edit/delete search queries directly
*   **Enhanced Analytics Dashboard**: Detailed metrics on article engagement and automation performance  
*   **Image Cropping/Editing**: Basic tools to adjust AI-generated image variants
*   **Multi-user Admin System**: Role-based access controls for different admin levels

---

This README provides a comprehensive overview of the MicroPlastics Pulse Project.

<!-- Updated: Research Library search fix deployed --> 