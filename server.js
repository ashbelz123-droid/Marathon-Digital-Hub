const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "marathon_digital_hub"
});

db.connect((err) => {
    if (err) {
        console.log("Database connection failed");
        return;
    }

    console.log("Database connected");
});

app.get("/", (req, res) => {
    res.json({
        status: "running",
        message: "Marathon Digital Hub API"
    });
});

app.get("/api/health", (req, res) => {
    res.json({
        status: "online"
    });
});
// JWT SECRET

const JWT_SECRET = "CHANGE_THIS_SECRET_KEY";

/* =========================
   REGISTER
========================= */

app.post("/api/register", async (req, res) => {

    try {

        const {
            username,
            email,
            password
        } = req.body;

        if (!username || !email || !password) {

            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });

        }

        const hashedPassword =
            await bcrypt.hash(password, 10);

        const referralCode =
            "MDH" + Date.now();

        db.query(
            "INSERT INTO users (username,email,password,referral_code) VALUES (?,?,?,?)",
            [
                username,
                email,
                hashedPassword,
                referralCode
            ],
            (err, result) => {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message: "Registration failed"
                    });

                }

                res.json({
                    success: true,
                    message: "Registration successful"
                });

            }
        );

    } catch (error) {

        res.status(500).json({
            success: false,
            message: "Server error"
        });

    }

});

/* =========================
   LOGIN
========================= */

app.post("/api/login", (req, res) => {

    const {
        email,
        password
    } = req.body;

    db.query(
        "SELECT * FROM users WHERE email=?",
        [email],
        async (err, results) => {

            if (err || results.length === 0) {

                return res.status(401).json({
                    success: false,
                    message: "Invalid credentials"
                });

            }

            const user = results[0];

            const validPassword =
                await bcrypt.compare(
                    password,
                    user.password
                );

            if (!validPassword) {

                return res.status(401).json({
                    success: false,
                    message: "Invalid credentials"
                });

            }

            const token = jwt.sign(
                {
                    id: user.id,
                    email: user.email
                },
                JWT_SECRET,
                {
                    expiresIn: "7d"
                }
            );

            res.json({
                success: true,
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    balance: user.balance
                }
            });

        }
    );

});
A typical backend would include:

1. Authentication Middleware
   
   - Verify JWT tokens
   - Check user identity
   - Protect private routes

2. User Routes
   
   - Get profile
   - Update profile
   - Change password

3. Machine Routes
   
   - List machines
   - Purchase machine
   - View active machines

4. Wallet Routes
   
   - View balance
   - View transaction history

5. Notification Routes
   
   - Get notifications
   - Mark notifications as read

6. Admin Routes
   
   - View users
   - Review deposits
   - Review withdrawals
   - Publish announcements

7. Database Layer
   
   - Parameterized queries
   - Input validation
   - Error handling

8. Security
   
   - Password hashing
   - Rate limiting
   - HTTPS
   - CSRF protection
   - Input sanitization

9. Server Startup
   
   - Connect database
   - Load environment variables
   - Start Express server
   - Logging and monitoring
