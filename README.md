# JD2CV - AI CV Optimizer

JD2CV is an Artificially Intelligent CV tool that helps you optimize your CV/Resume instantly for every new job description you apply.

## Project Overview
JD2CV is an AI-powered CV optimization tool designed to help users create and tailor their resumes effectively with the assistance of generative AI. Its purpose is to simplify and enhance the CV writing process, making it easier for users to craft compelling and targeted resumes for each job application.

## Project Structure
- `components/`: Contains React UI components.
  - `panels/`: Components for different editor panels (content, theme).
  - `shared/`: Common shared components (e.g., ErrorMessage, LoadingSpinner).
- `services/`: Houses services, like `geminiService.ts` for AI integration.
- `App.tsx`: The main application React component.
- `index.tsx`: The entry point for the React application, renders App.tsx.
- `index.html`: The main HTML file template used by Vite.
- `constants.tsx`: Application-wide constants, including themes and initial CV data.
- `types.ts`: TypeScript type definitions for data structures.
- `vite.config.ts`: Configuration for the Vite build tool, including environment variable setup.
- `package.json`: Project dependencies, scripts (like `dev`, `build`).
- `package-lock.json`: Records exact versions of dependencies.
- `Dockerfile`: For building and running the application in a Docker container.
- `README.md`: This file.
- `.gitignore`: Specifies intentionally untracked files that Git should ignore.
- `tsconfig.json`: TypeScript compiler configuration.
- `dist/`: (Generated after `npm run build`) Contains the production-ready static assets.

## Development Setup and Running Locally

This guide provides instructions for setting up and running the JD2CV application locally for development and testing.

### Prerequisites

Before you begin, ensure you have the following installed on your system:

*   **Node.js:** Version 16.x or higher (includes npm). You can download it from [nodejs.org](https://nodejs.org/).
*   **MySQL:** A running MySQL server instance. You can download it from [mysql.com](https://www.mysql.com/downloads/) or use a managed service/Docker container.
*   **Git:** For cloning the repository.

### Setup Instructions

The application consists of two main parts: a Node.js backend and a React frontend.

#### 1. Backend Setup

1.  **Clone the Repository (if you haven't already):**
    ```bash
    git clone <repository_url> # Replace <repository_url> with the actual URL
    cd <repository_directory>  # Replace <repository_directory> with the folder name
    ```

2.  **Navigate to the Backend Directory:**
    ```bash
    cd backend
    ```

3.  **Install Dependencies:**
    ```bash
    npm install
    ```

4.  **Configure Environment Variables:**
    *   Create a `.env` file in the `backend` directory. You can copy `backend/.env.example` if it exists, or create one from scratch. The project's initial setup script also creates a default `.env`.
    *   Open the `backend/.env` file and ensure the following variables are correctly set for your local environment:
        ```dotenv
        PORT=3001                  # Port for the backend server
        DB_HOST=localhost          # Your MySQL host
        DB_USER=your_mysql_user    # Your MySQL username
        DB_PASSWORD=your_mysql_password # Your MySQL password
        DB_NAME=cv_builder_db      # The database name (will be created by schema script)
        JWT_SECRET=yourSuperSecretAndLongJwtKey # A strong, random secret for JWT signing (change this!)
        ```

5.  **Set Up the MySQL Database:**
    *   Ensure your MySQL server is running.
    *   Connect to your MySQL server using a client (e.g., MySQL command-line, MySQL Workbench, DBeaver).
        ```bash
        mysql -u your_mysql_user -p
        ```
    *   The backend contains a schema script at `src/database_schema.sql`. Execute this script to create the `cv_builder_db` database and its tables.
        *   From the MySQL client, after connecting:
            ```sql
            SOURCE /path/to/your/repo/backend/src/database_schema.sql;
            ```
            (Replace `/path/to/your/repo/` with the correct absolute path to the project on your system).
        *   This script also seeds initial `cv_templates`.

6.  **Build TypeScript (Optional, for `npm start`):**
    The `npm run dev` script for the backend uses `nodemon` with `ts-node` (or similar) and usually doesn't require a separate build step for development. If you intend to run with `npm start` (which typically runs compiled JavaScript from `dist/`), you would run:
    ```bash
    npm run build
    ```

#### 2. Frontend Setup

The frontend is part of the same repository, located at the project root.

1.  **Navigate to the Project Root Directory (e.g., `cd ..` if you are in `backend/`):**
    ```bash
    # Ensure you are in the project's root directory
    ```

2.  **Install Dependencies:**
    (These are the dependencies in the root `package.json`)
    ```bash
    npm install
    ```

3.  **Configure Frontend Environment Variables:**
    *   The frontend requires a Google Gemini API key for AI features.
    *   Create a `.env` file in the **project root directory** (alongside `index.html` and `vite.config.ts`).
    *   Add your Gemini API key to this file:
        ```dotenv
        VITE_GEMINI_API_KEY=your_actual_gemini_api_key_here
        ```
    *   **Important Code Modification:** Ensure `src/services/geminiService.ts` uses this environment variable correctly. It should use `import.meta.env.VITE_GEMINI_API_KEY`.
        ```typescript
        // In src/services/geminiService.ts, ensure this line is present:
        const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
        // And remove any lines like: const API_KEY = process.env.API_KEY;
        ```
    *   **Google Analytics ID (Optional):**
        *   If you want to use Google Analytics, replace the placeholder `G-XXXXXXXXXX` in `index.html` (inside the GA script tags) and in `src/services/analyticsService.ts` (the `GA_TRACKING_ID` constant) with your actual Google Analytics Measurement ID.

### Running the Application (Development)

You need to run both the backend and frontend servers simultaneously.

1.  **Run the Backend Server:**
    *   Open a terminal, navigate to the `backend` directory:
        ```bash
        cd backend
        ```
    *   Start the backend development server:
        ```bash
        npm run dev
        ```
    *   The backend should be running on `http://localhost:3001` (or your configured `PORT`).

2.  **Run the Frontend Development Server:**
    *   Open a *new* terminal, navigate to the **project root** directory.
    *   Start the Vite frontend development server:
        ```bash
        npm run dev
        ```
    *   The frontend application should be accessible at `http://localhost:5173` (Vite's default) or another port if specified. Vite will display the URL.

3.  **Vite Proxy for API Calls (Crucial for Development):**
    *   For the frontend to correctly communicate with the backend API (e.g., `/api/users/me`), Vite needs to proxy these requests.
    *   Ensure your `vite.config.ts` file (in the project root) has a server proxy configuration:
        ```typescript
        // vite.config.ts
        import { defineConfig } from 'vite'
        import react from '@vitejs/plugin-react'

        export default defineConfig({
          plugins: [react()],
          server: {
            proxy: {
              '/api': { // All requests starting with /api will be proxied
                target: 'http://localhost:3001', // Your backend server address
                changeOrigin: true,
                // secure: false, // Uncomment if your backend is not HTTPS and you face issues
                // rewrite: (path) => path.replace(/^\/api/, '') // Uncomment if your backend API routes do NOT start with /api
              }
            }
          }
        })
        ```
    *   If this proxy is not configured, frontend API calls to relative paths like `/api/auth/login` will fail.

### Accessing the Application

*   Once both servers are running, open your web browser and navigate to the frontend URL (e.g., `http://localhost:5173`).
*   You should see the landing page. You can then register, log in, and use the CV builder features.


## Deployment
The `dist` folder generated by `npm run build` contains all the static files needed to deploy the application. You can deploy this folder to any static hosting service, such as:
- Vercel
- Netlify
- GitHub Pages
- AWS S3
- Firebase Hosting

Ensure that your hosting service is configured to serve `index.html` for all routes if you are using client-side routing (though this project seems to be a single-page application where this might be less of an issue).

Ensure the `GEMINI_API_KEY` is handled appropriately in your deployment environment. For client-side applications, it's crucial **not to expose the API key directly in the frontend code that gets shipped to the browser if it's a secret/paid key.** The current setup using `process.env.GEMINI_API_KEY` in `vite.config.ts` will embed the key into the built JavaScript files. This is fine for free tier or development keys, but for production, consider using a backend proxy or serverless function to make API calls to Gemini, keeping the actual API key secure on the server-side. **For the purpose of this project, we will assume the current method is acceptable, but highlight this as a security consideration.**

## Key Features
- AI-powered CV content generation (summary, experience, skills).
- CV tailoring based on job descriptions.
- Multiple CV themes and customization options.
- Real-time preview of the CV.
- PDF download of the generated CV.

## Technologies Used
- React
- TypeScript
- Vite
- Tailwind CSS
- AI Models (initially Google Gemini)

## Running with Docker

This application can also be run in a Docker container.

### Prerequisites
- Docker installed on your machine.

### Building the Docker Image
1. Build the Docker image:
   ```bash
   docker build -t ai-cv-maker .
   ```
   If your `GEMINI_API_KEY` is not set as an environment variable in the shell where you run the build command, you can pass it as a build argument:
   ```bash
   docker build --build-arg GEMINI_API_KEY="your_actual_api_key" -t ai-cv-maker .
   ```

### Running the Docker Container
1. Run the Docker container:
   ```bash
   docker run -p 8080:80 ai-cv-maker
   ```
   This will start the application, and it will be accessible at `http://localhost:8080`.
   Make sure your `GEMINI_API_KEY` was available during the build, or the application might not function correctly with the AI features.
