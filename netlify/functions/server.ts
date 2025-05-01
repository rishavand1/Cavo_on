import { Handler } from '@netlify/functions';
import express from 'express';
import { createServer } from 'http';
import { setupVite, serveStatic } from '../../server/vite';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Create HTTP server
const httpServer = createServer(app);

// Setup Vite in development mode
if (process.env.NODE_ENV === 'development') {
  setupVite(app, httpServer);
} else {
  serveStatic(app);
}

// Convert Express app to Netlify Function
const handler: Handler = async (event, context) => {
  const response = await new Promise((resolve) => {
    const { httpMethod, path, body, headers, queryStringParameters } = event;
    
    const req = {
      method: httpMethod,
      url: path,
      body: body ? JSON.parse(body) : undefined,
      headers,
      query: queryStringParameters,
    } as any;

    const res = {
      statusCode: 200,
      body: '',
      headers: {},
      setHeader: (name: string, value: string) => {
        res.headers[name] = value;
      },
      end: (data: string) => {
        res.body = data;
        resolve({
          statusCode: res.statusCode,
          body: res.body,
          headers: res.headers,
        });
      },
    } as any;

    app(req, res);
  });

  return response;
};

export { handler }; 