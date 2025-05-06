# HSMP
This is a full-stack application built with the MERN (MongoDB, Express.js, React.js, Node.js) stack.

## Project Structure

```
HSMP/
├── backend/           # Backend server
│   ├── server.js     # Main server file
│   ├── package.json  # Backend dependencies
│   └── .env        # Environment variables
├── frotend/
├── dashboard/ 
└── README.md         # Project documentation
```

## Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the backend directory with the following variables:
   ```
   PORT=8000
   MONGODB_URI=
   JWT_SECRET=your_jwt_secret_key_here
   CLOUDINARY_CLOUD_NAME=
   CLOUDINARY_API_KEY=
   CLOUDINARY_API_SECRET=
   EMAIL_USER=
   GMAIL_APP_PASSWORD=
   FRONTEND_URL=
   ```

4. Start the development server:
   ```bash
   npm start
   ```

The server will run on `http://localhost:8000`

## Technologies Used

- **Backend:**
  - Node.js
  - Express.js
  - MongoDB
  - Mongoose
  - JWT Authentication
  - Bcrypt for password hashing
  - Node mailer for sending OTP
  - Cloudinary for photo upload
  - Multer
  - SocketIO for notifications

