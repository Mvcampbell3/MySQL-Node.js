const mysql = require("mysql");
const fs = require("fs");

const con = mysql.createConnection({
    host: 'localhost',
    user: "root",
    password: "surfboard",
    multipleStatements: true
});

con.connect(err => {
    if (err) throw err;
    console.log("We're in");
    createDatabase();
});

function createDatabase() {
    fs.readFile("./database.sql", "utf8", (err,data) => {
        if (err) throw err;
        con.query(data, (err, result) => {
            if (err) throw err;
            console.log("Bamazon database dropped, bamazon database created")
            departments();
        })
    })
}


function departments() {
    fs.readFile("./departments.sql","utf8", (err,data) => {
        if (err) throw err;

        con.query(data, (err, result) => {
            if (err) throw err;
            console.log("departments table dropped, departments table added, values added")
            products();
        })
    });
}

function products() {
    fs.readFile("./products.sql","utf8", (err,data) => {
        if (err) throw err;

        con.query(data, (err, result) => {
            if (err) throw err;
            console.log("products table dropped, products table added, values added")
            con.end()
        })
    });
}