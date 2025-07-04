// Updated server.js - FIXED: /cart/add SQL injection issue, dynamic email_id usage

const con = require('./database');
const express = require('express');
const app = express();
const port = 3006;
const bodyparser = require('body-parser');
const cors = require('cors');
const path = require('path');
const session = require('express-session');

app.use(cors());
app.use(express.static('public'));
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({
    extended: true
}));


app.set('view engine', 'ejs');

app.use(session({
    secret: 'your-secret-key', // Use a strong secret in production
    resave: false,
    saveUninitialized: true,
}));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/shop', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'shop.html'));
    // if (!req.session.user) return res.redirect('/login');

    // res.render('shop', {
    //     name: req.session.user.name,
    //     email: req.session.user.email
    // });
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'about.html'));
});

app.get('/cart', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'cart.html'));
});

app.get('/contact', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'contact.html'));
});

app.get('/payment', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'payment.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.post('/signup', (req, res) => {
    const {
        fullName,
        email,
        mobile,
        password
    } = req.body;
    const sql = `INSERT INTO users (full_name, email_id, passwd, phone_no) VALUES (?, ?, ?, ?)`;
    con.query(sql, [fullName, email, password, mobile], (error) => {
        if (error) {
            console.error('Signup error:', error);
            return res.status(500).send('Signup failed. Email may already exist.');
        }
        // res.send(`<h2>Signup successful!</h2><a href="/login">Go to Login</a>`);
        return res.send(`
                <script>
                    alert("Signup successful!");
                    window.location.href = "/login";
                </script>
            `);
    });
});

app.get('/products', (req, res) => {
    const sql = 'SELECT * FROM products';
    con.query(sql, (err, results) => {
        if (err) return res.status(500).json({
            error: 'Database error'
        });
        res.json(results);
    });
});

app.get('/cart/count', (req, res) => {
    const email = req.query.email;
    if (!email) return res.status(400).json({
        error: 'Email is required'
    });

    const sql = 'SELECT SUM(quantity) AS total FROM cart_items WHERE email_id = ?';
    con.query(sql, [email], (err, result) => {
        if (err) return res.status(500).json({
            error: 'Database error'
        });
        res.json({
            total: result[0].total || 0
        });
    });
});

app.post('/cart/add', (req, res) => {
    const {
        email_id,
        id,
        weight,
        quantity
    } = req.body;
    const sql = `INSERT INTO cart_items (email_id, id, weight, quantity)
                 VALUES (?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE quantity = quantity + ?`;

    con.query(sql, [email_id, id, weight, quantity, quantity], (err) => {
        if (err) {
            console.error('Error adding to cart:', err);
            return res.status(500).json({
                error: 'Database error'
            });
        }
        res.json({
            message: 'Item added to cart'
        });
    });
});

app.get('/cart/items', (req, res) => {
    const email = req.query.email;
    if (!email) {
        return res.status(400).json({
            error: 'Email is required'
        });
    }

    const sql = `
        SELECT ci.id, ci.weight, ci.quantity, p.name, p.price250, p.price500 ,p.image_link 
        FROM cart_items ci
        JOIN products p ON ci.id = p.id
        WHERE ci.email_id = ?
    `;

    con.query(sql, [email], (err, results) => {
        if (err) {
            console.error('Error fetching cart items:', err);
            return res.status(500).json({
                error: 'Database error'
            });
        }

        res.json(results);
    });
});


app.post('/cart/update', (req, res) => {
    const {
        email_id,
        id,
        weight,
        quantity
    } = req.body;
    const sql = `UPDATE cart_items SET quantity = ? WHERE email_id = ? AND id = ? AND weight = ?`;
    con.query(sql, [quantity, email_id, id, weight], (err, result) => {
        if (err) {
            console.error('Error updating cart item:', err);
            return res.status(500).json({
                error: 'Database error'
            });
        }
        res.json({
            message: 'Quantity updated'
        });
    });
});

app.post('/cart/delete', (req, res) => {
    const {
        email_id,
        id,
        weight
    } = req.body;
    const sql = `DELETE FROM cart_items WHERE email_id = ? AND id = ? AND weight = ?`;
    con.query(sql, [email_id, id, weight], (err, result) => {
        if (err) {
            console.error('Error deleting cart item:', err);
            return res.status(500).json({
                error: 'Database error'
            });
        }
        res.json({
            message: 'Item removed from cart'
        });
    });
});



app.post('/login', (req, res) => {
    const {
        email,
        password
    } = req.body;
    const sql = `SELECT * FROM users WHERE email_id = ? AND passwd = ?`;

    con.query(sql, [email, password], (err, results) => {
        if (err) return res.status(500).send('Server error during login.');

        if (results.length > 0) {
            const user = results[0];

            // Optional session saving here
            // req.session.user = { name: user.full_name, email: user.email_id };

            // Respond with a welcome alert + redirect using JS
            return res.send(`
                <script>
                    alert("Welcome back, ${user.full_name}!");
                    window.location.href = "/shop";
                </script>
            `);
        } else {
            return res.send(`<h2>Invalid email or password.</h2><a href="/login">Try again</a>`);
        }
    });
});


app.post('/contact', (req, res) => {
    const {
        fullName,
        customerId,
        department,
        email,
        mobile,
        message
    } = req.body;
    const sql = `INSERT INTO customer_queries (full_name, customer_id, department, email_id, mobile, message)
                 VALUES (?, ?, ?, ?, ?, ?)`;

    con.query(sql, [fullName, customerId, department, email, mobile, message], (err) => {
        if (err) return res.status(500).send('Error submitting your message.');
        res.send(`<h2>Thank you for contacting us, ${fullName}!</h2><a href="/">Go Home</a>`);
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});