import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  
  // Stripe webhook MUST be registered BEFORE express.json() for signature verification
  app.post('/api/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
    const signature = req.headers['stripe-signature'];
    
    if (!signature) {
      return res.status(400).send('Missing stripe-signature header');
    }
    
    try {
      const { handleWebhookEvent } = await import('../stripe');
      await handleWebhookEvent(req.body, signature as string);
      res.json({ received: true });
    } catch (err: any) {
      console.error('Stripe webhook error:', err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  });
  
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
  // Download endpoint for audio files with proper Content-Disposition headers
  app.get('/api/download/track/:trackId', async (req, res) => {
    try {
      const trackId = parseInt(req.params.trackId);
      if (isNaN(trackId)) {
        return res.status(400).json({ error: 'Invalid track ID' });
      }
      
      // Import db functions
      const { getTrackById, getAlbumById, getTrackAudioFile } = await import('../db');
      
      // Get track
      const track = await getTrackById(trackId);
      if (!track) {
        return res.status(404).json({ error: 'Track not found' });
      }
      
      // Get album to check access
      const album = await getAlbumById(track.albumId);
      if (!album) {
        return res.status(404).json({ error: 'Album not found' });
      }
      
      // For now, allow public albums or require authentication
      // In production, you'd verify the user's session here
      if (album.visibility !== 'public') {
        // Check if user is authenticated (simplified check)
        const sessionCookie = req.cookies?.['manus-session'];
        if (!sessionCookie) {
          return res.status(403).json({ error: 'Authentication required' });
        }
      }
      
      // Get audio file
      const audioFile = await getTrackAudioFile(trackId);
      if (!audioFile) {
        return res.status(404).json({ error: 'Audio file not found' });
      }
      
      // Fetch the file from S3
      const response = await fetch(audioFile.fileUrl);
      if (!response.ok) {
        return res.status(500).json({ error: 'Failed to fetch audio file' });
      }
      
      // Set headers to force download
      const filename = `${track.title.replace(/[^a-z0-9]/gi, '_')}.mp3`;
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Cache-Control', 'no-cache');
      
      // Stream the file to the client
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      res.send(buffer);
    } catch (error) {
      console.error('Download error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    
    // Start background job processor
    import("../backgroundJobs").then(({ startJobProcessor }) => {
      startJobProcessor();
    }).catch(err => {
      console.error("Failed to start background job processor:", err);
    });
    
    // Start timeout handler for stuck music generation jobs
    import("../timeoutHandler").then(({ startTimeoutHandler }) => {
      startTimeoutHandler();
    }).catch(err => {
      console.error("Failed to start timeout handler:", err);
    });
  });
}

startServer().catch(console.error);
