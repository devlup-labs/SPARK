# Spark

Welcome to **Spark**! This is the official frontend and microservices ecosystem for the Spark platform.

## Live Demo

Check out the live deployment:
**[Spark Live Demo](https://spark-landing-page-dusky.vercel.app/)**

## Overview

Spark is designed to provide a centralized hub to access cloud storage, media management, and administrative services. It features a modern, responsive UI built with Next.js, and a suite of backend microservices.

## Features

- **Modern UI**: Built with Next.js 15, React 19, and Tailwind CSS.
- **Microservices Architecture**: Separate Node.js services for Admin, Media, and Storage, orchestrated with Docker.
- **Authentication**: Secure login and session management powered by NextAuth.
- **Interactive Dashboards**: Clean and functional layouts for managing systems and files.
- **Dark Mode Support**: Seamless theme switching for better user experience.

## Getting Started

### Frontend Development

To run the Next.js frontend locally:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Microservices

To spin up the backend microservices using Docker:

```bash
cd server
docker-compose up -d
```

## Deployment

The frontend application is optimized for deployment on Vercel. Push to the `main` branch to trigger an automatic deployment.
