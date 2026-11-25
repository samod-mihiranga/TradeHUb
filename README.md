# TradeHub — Final MERN E-Commerce Platform (Raw Materials, Finished Products, Real-Time Auctions, Image Uploads & Payments)

A full-stack **MERN (MongoDB, Express, React, Node.js)** marketplace with:
- **4 User Roles**: Raw Material Supplier, Product Supplier, Raw Material Customer, and Product Customer (JWT auth + role-based access control).
- **Raw Materials & Finished Products**: Fixed-price listings and timed auctions with live countdowns.
- **Real-Time WebSocket Bid Updates (`Socket.IO`)**: Bids update live across all connected browsers without page refreshes.
- **Image Uploads (`Multer`)**: Suppliers upload product and raw material images directly from their dashboard.
- **Payment Gateway Integration (`Stripe` + Built-in Test Card Gateway)**: Works out of the box with a simulated test card checkout, and switches automatically to real Stripe Checkout when `STRIPE_SECRET_KEY` is added to `server/.env`.
- **MongoDB Atlas**: Persistent storage through the MongoDB URI configured in `server/.env`. An embedded in-memory database is available only when explicitly enabled for temporary development.

---

## Step-by-Step Run Instructions

### 1. Prerequisites
- **Node.js** v18+ (`node -v`)
- A MongoDB Atlas cluster and database user. Add the machine running the app to the cluster's Network Access allowlist.

### 2. Start the Backend (`server/`)
Open Terminal 1 inside the extracted `mern-tradehub` folder:
```bash
cd server
npm install
cp .env.example .env
npm run dev
```
*(On Windows CMD/PowerShell, use `copy .env.example .env`.)*

- In `server/.env`, replace the `MONGO_URI` placeholder with the connection string from Atlas (**Database > Connect > Drivers**). Keep the URI private and URL-encode special characters in the database user's password.
- Keep `USE_MEMORY_DB_FALLBACK=false` for persistent storage. The server reports a connection error rather than silently switching databases if Atlas is unavailable.
- After Atlas connects, run `npm run seed` once to populate sample data.
- Wait until you see: `TradeHub API + WebSocket server running on http://localhost:5000`.

For temporary offline development only, set `USE_MEMORY_DB_FALLBACK=true`. Data in this mode is lost when the server stops.

### 3. Start the Frontend (`client/`)
Open Terminal 2 inside `mern-tradehub`:
```bash
cd client
npm install
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## Enabling Real Stripe Checkout (Optional)
1. Get a Stripe test secret key (`sk_test_...`) from your Stripe Dashboard.
2. Paste it into `server/.env`:
   ```env
   STRIPE_SECRET_KEY=sk_test_your_key_here
   ```
3. Restart `npm run dev` in `server/`. Checkout will automatically redirect to Stripe Checkout. If left blank, the built-in **Test Card Payment Gateway** handles payments locally.

---

## Demo Accounts (Password: `Password123!`)
- **Raw Material Supplier**: `rawsupplier@tradehub.demo`
- **Product Supplier**: `productsupplier@tradehub.demo`
- **Raw Material Customer**: `rawcustomer@tradehub.demo`
- **Product Customer**: `productcustomer@tradehub.demo`
