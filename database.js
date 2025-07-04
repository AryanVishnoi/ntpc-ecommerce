const mysql = require('mysql');


const con = mysql.createConnection({
    host: "localhost",
    user: "aryanV",
    password: "Ar@060703",
    database: "ntpcecommerce",
    connectionLimit: 10
})
con.connect((err) => {
    if (err) throw err;
    console.log('Connected to the database!');
});
module.exports = con;