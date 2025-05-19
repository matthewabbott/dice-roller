
### Deployment Plan: TTRPG Dice Roller Widget

This plan outlines how to deploy your dice roller widget to your website, specifically at `website-url/dice` (e.g., `example.com/dice`). It includes deploying the React front-end, setting up the GraphQL server, configuring NGINX, and verifying the setup.

#### Prerequisites
- **NGINX** is installed and configured to serve your website.
- **Node.js** and **npm** are installed on your server for the GraphQL server.
- You have SSH access to your server for file transfers and configuration.
- (Optional but recommended) **HTTPS** is set up for secure WebSocket connections.

---

#### Step 1: Build and Prepare the React App
The React app must be built into static files that NGINX can serve. Assuming you're using **Vite** as your build tool, follow these steps:

1. **Configure the Base Path**:
   - In your `vite.config.ts`, set the `base` option to `/dice/` so assets load correctly from the subpath:
     ```typescript
     import { defineConfig } from 'vite';
     import react from '@vitejs/plugin-react';

     export default defineConfig({
       plugins: [react()],
       base: '/dice/',  // Set base path
       build: {
         outDir: 'dist',  // Output directory
       },
     });
     ```

2. **Build the App**:
   - Run the build command to generate static files:
     ```bash
     npm run build
     ```
   - This creates a `dist` folder with files like `index.html`, `assets/index-[hash].js`, and `assets/index-[hash].css`.

3. **Transfer Files to the Server**:
   - Copy the `dist` folder to your server (e.g., to `/var/www/dice`) using a tool like `scp`:
     ```bash
     scp -r dist/* user@your-server:/var/www/dice
     ```

---

#### Step 2: Configure NGINX to Serve the React App
NGINX will serve the static files at `website-url/dice`.

1. **Edit the NGINX Configuration**:
   - Open your site’s NGINX configuration file (e.g., `/etc/nginx/sites-available/example.com`) and add a `location` block:
     ```nginx
     server {
         listen 80;
         server_name example.com;  # Replace with your domain

         # Existing website configuration
         root /var/www/html;
         index index.html;

         # Serve dice roller at /dice
         location /dice/ {
             alias /var/www/dice/;  # Point to the build files
             try_files $uri $uri/ /dice/index.html;  # Handle SPA routing
         }
     }
     ```

2. **Set Permissions**:
   - Ensure NGINX can access the files:
     ```bash
     sudo chown -R www-data:www-data /var/www/dice
     sudo chmod -R 755 /var/www/dice
     ```

3. **Test and Reload NGINX**:
   - Verify the configuration:
     ```bash
     sudo nginx -t
     ```
   - Apply changes:
     ```bash
     sudo systemctl reload nginx
     ```
   - Visit `website-url/dice` to confirm the app loads (it won’t fully work yet without the GraphQL server).

---

#### Step 3: Deploy the GraphQL Server
The GraphQL server handles real-time subscriptions (e.g., dice roll updates) and must be deployed and proxied through NGINX.

1. **Prepare the Server Code**:
   - Copy your GraphQL server code (e.g., `server.ts`) and its `package.json` to a directory like `/var/www/dice-server`:
     ```bash
     scp -r server/* user@your-server:/var/www/dice-server
     ```
   - Install dependencies:
     ```bash
     cd /var/www/dice-server
     npm install
     ```

2. **Run the Server with pm2**:
   - Install **pm2** globally:
     ```bash
     sudo npm install -g pm2
     ```
   - Start the server (assumes it runs on `http://localhost:4000/graphql`):
     ```bash
     pm2 start server.ts --name dice-server
     ```

3. **Configure NGINX as a Reverse Proxy**:
   - Add a `location` block to proxy `/dice/graphql` to the server:
     ```nginx
     server {
         # ... existing config ...

         # Proxy GraphQL HTTP and WebSocket requests
         location /dice/graphql {
             proxy_pass http://localhost:4000/graphql;
             proxy_set_header Host $host;
             proxy_set_header X-Real-IP $remote_addr;
             proxy_http_version 1.1;
             proxy_set_header Upgrade $http_upgrade;
             proxy_set_header Connection "upgrade";
         }
     }
     ```
   - Reload NGINX:
     ```bash
     sudo systemctl reload nginx
     ```

4. **Update Apollo Client in the React App**:
   - Ensure your Apollo Client points to the correct endpoint. In your React app (e.g., `main.tsx`), configure it like this:
     ```typescript
     import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';
     import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
     import { createClient } from 'graphql-ws';
     import { split, getMainDefinition } from '@apollo/client/utilities';

     const httpLink = new HttpLink({
       uri: 'https://example.com/dice/graphql',  // Replace with your domain
     });

     const wsLink = new GraphQLWsLink(
       createClient({
         url: 'wss://example.com/dice/graphql',  // Replace with your domain
       })
     );

     const splitLink = split(
       ({ query }) => {
         const definition = getMainDefinition(query);
         return (
           definition.kind === 'OperationDefinition' &&
           definition.operation === 'subscription'
         );
       },
       wsLink,
       httpLink
     );

     const client = new ApolloClient({
       link: splitLink,
       cache: new InMemoryCache(),
     });
     ```
   - Rebuild and redeploy the app:
     ```bash
     npm run build
     scp -r dist/* user@your-server:/var/www/dice
     ```

5. **Enable HTTPS (Recommended)**:
   - For WebSocket subscriptions (`wss://`), HTTPS is required. If not already set up, use **Let’s Encrypt**:
     ```bash
     sudo apt install certbot python3-certbot-nginx
     sudo certbot --nginx -d example.com
     ```
   - Follow the prompts to enable SSL.

---

#### Step 4: Test and Verify the Deployment
1. **Check the React App**:
   - Visit `https://example.com/dice` and ensure the widget loads with 3D dice rendering.

2. **Test GraphQL Queries**:
   - Use a tool like **Apollo Sandbox** to query `https://example.com/dice/graphql` and verify responses.

3. **Verify Real-Time Subscriptions**:
   - Open two browser tabs at `https://example.com/dice`.
   - Roll a die in one tab and confirm the result updates in both tabs in real-time.

4. **Troubleshooting**:
   - Check the browser console for errors.
   - If assets fail to load, verify the `base` path in `vite.config.ts`.
   - If subscriptions fail, ensure NGINX is proxying WebSocket requests correctly.

---

#### Step 5: Monitor and Maintain
- **Monitor the GraphQL Server**:
  - Check its status:
    ```bash
    pm2 status
    ```
  - Enable automatic restarts:
    ```bash
    pm2 save
    pm2 startup
    ```

- **Update the Widget**:
  - Rebuild and redeploy the `dist` folder for updates:
    ```bash
    npm run build
    scp -r dist/* user@your-server:/var/www/dice
    ```

---

### Final Deployment Checklist
- [ ] React app built with `base: '/dice/'`.
- [ ] Build files copied to `/var/www/dice`.
- [ ] NGINX configured to serve `/dice/` and proxy `/dice/graphql`.
- [ ] GraphQL server running with `pm2`.
- [ ] Apollo Client updated to `https://example.com/dice/graphql`.
- [ ] HTTPS enabled.
- [ ] Widget tested with real-time updates and 3D rendering.
