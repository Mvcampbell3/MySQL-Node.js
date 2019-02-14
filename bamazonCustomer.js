const inquirer = require("inquirer");
const database = require("mysql");
const { table } = require("table")
const chalk = require("chalk");


const deleteTable = "DROP TABLE products";


const con = database.createConnection({
    host: 'localhost',
    user: "root",
    password: "Jackson325!",
    database: "bamazon"
});

let store = {
    loadMenu: function () {
        con.connect(err => {
            if (err) throw err;
            con.query(this.sql.selectAll, (err, result) => {
                if (err) throw err;

                let data = [
                    ["Product ID", "Product Name", "Department", "Price", "Quantity"],
                ]

                result.forEach(one => {
                    data.push([one.item_id, one.product_name, one.department_name, "$" + one.price.toFixed(2), one.quantity])
                });

                let output = table(data);

                console.log(output);

                this.selectInventory();
            })
        });
    },

    backToMenu: function () {

    },

    selectInventory: function () {
        inquirer.prompt({
            type: "input",
            name: "which",
            message: "Which product would you like to purchase today? (Enter Product ID number)"
        }).then(answer => {
            con.query(this.sql.selectOne(answer.which), (err, result) => {
                if (err) throw err;
                let data1 = [
                    ["Product ID", "Product Name", "Department", "Price", "Quantity"],
                ];
                data1.push([result[0].item_id, result[0].product_name, result[0].department_name, "$" + result[0].price.toFixed(2), result[0].quantity]);

                let output1 = table(data1);

                console.log(output1);


                this.purchaseQuantity(answer.which)

            })
        })
    },

    purchaseQuantity: function (id) {
        con.query(this.sql.selectOne(id), (err, result) => {
            if (err) throw err;

            inquirer.prompt({
                type: "input",
                name: "quantity",
                message: "How many " + result[0].product_name + " units would you like to purchase? (0 returns you to store menu)"

            }).then(answer => {
                if (answer.quantity > result[0].quantity) {
                    console.log("\nMust not be more units than in stock!\n");
                    this.selectQuantity(result[0].item_id)
                } else if (answer.quantity == 0){
                    this.backMenu();
                } else {
                    console.log("The total of your purchase is $" + (parseFloat(answer.quantity) * parseFloat(result[0].price)).toFixed(2))
                    console.log("Enjoy your order of " + answer.quantity + " " + result[0].product_name);
                    this.returnMenuPrompt();

                }
            })
        })
    },

    returnMenuPrompt: function () {
        inquirer.prompt({
            type: "confirm",
            name: "back",
            message: "Would you like to go back to the main menu?",
            default: true
        }).then(answer => {
            if (answer.back) {
                this.backMenu();
                return;
            }
            console.log("Thank you very much for shopping today")
            con.end()
        })
    },

    backMenu: function () {
        console.log("got this far")
        con.query(this.sql.selectAll, (err, result) => {
            if (err) throw err;
            let data = [
                ["Product ID", "Product Name", "Department", "Price", "Quantity"],
            ]

            result.forEach(one => {
                data.push([one.item_id, one.product_name, one.department_name, "$" + one.price.toFixed(2), one.quantity])
            });

            let output = table(data);

            console.log(output);

            this.selectInventory();
        })
    },

    sql: {

        selectAll: "SELECT * FROM products",

        selectOne: function(id) {
            return "SELECT * FROM products WHERE item_id = " + id;
        }
    },





}

store.loadMenu();