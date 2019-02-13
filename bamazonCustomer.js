const inquirer = require("inquirer");
const database = require("mysql");

const selectAll = "SELECT * FROM products";
const deleteTable = "DROP TABLE products";

const con = database.createConnection({
    host: 'localhost',
    user: "root",
    password: "Jackson325!",
    database: "bamazon"
});

con.connect(err => {
    if (err) throw err;
    console.log("Connected!");
    con.query(selectAll, (err, result) => {
        if (err) throw err;
        console.log(result);
    })
})