const mysql = require("mysql");
const fs = require("fs");

function departments() {
    fs.readFile("./departments.sql","utf8", (err,data) => {
        if (err) throw err;

        con.query(data, (err, result) => {
            if (err) throw err;
            console.log("maybe it worked?")
            products();
        })
    });
}

function products() {
    fs.readFile("./products.sql","utf8", (err,data) => {
        if (err) throw err;

        con.query(data, (err, result) => {
            if (err) throw err;
            console.log("maybe it worked?")
            con.end()
        })
    });
}

const con = mysql.createConnection({
    host: 'localhost',
    user: "root",
    password: "surfboard",
    database: "bamazon",
    multipleStatements: true
});

con.connect(err => {
    if (err) throw err;
    console.log("We're in");
    departments();
})

