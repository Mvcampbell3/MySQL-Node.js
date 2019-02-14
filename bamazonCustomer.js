const inquirer = require("inquirer");
const database = require("mysql");
const { table } = require("table")
const chalk = require("chalk");

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
                    [chalk.yellow("Product ID"), chalk.yellow("Product Name"), chalk.yellow("Department"), chalk.yellow("Price"), chalk.yellow("Quantity")],
                ]

                result.forEach(one => {
                    data.push([chalk.white(one.item_id), chalk.white(one.product_name), chalk.white(one.department_name), chalk.white("$" + one.price.toFixed(2)), chalk.white(one.quantity)])
                });

                let output = table(data);

                console.log(chalk.green(output));

                this.selectInventory();
            })
        });
    },

    selectInventory: function () {
        inquirer.prompt({
            type: "input",
            name: "which",
            message: chalk.cyan("Which product would you like to purchase today? (Enter Product ID number)")
        }).then(answer => {
            con.query(this.sql.selectOne(answer.which), (err, result) => {
                if (err) throw err;
                if (result[0].quantity > 0) {
                    let data1 = [
                        ["Product ID", "Product Name", "Department", "Price", "Quantity"],
                    ];
                    data1.push([result[0].item_id, result[0].product_name, result[0].department_name, "$" + result[0].price.toFixed(2), result[0].quantity]);
    
                    let output1 = table(data1);
    
                    console.log(chalk.blue(output1));
    
    
                    this.purchaseQuantity(answer.which)
                } else {
                    console.log(chalk.yellow("\nThere is not enough in stock, try again later!\n"));
                    this.returnMenuPrompt();
                }
                

            })
        })
    },

    purchaseQuantity: function (id) {
        con.query(this.sql.selectOne(id), (err, result) => {
            if (err) throw err;

            inquirer.prompt({
                type: "input",
                name: "quantity",
                message: chalk.cyan("How many " + result[0].product_name + " units would you like, there are "+result[0].quantity+ " left (0 returns you to store menu)")

            }).then(answer => {
                if (answer.quantity > result[0].quantity) {
                    console.log(chalk.yellow("\nMust not be more units than in stock!\n"));
                    this.selectQuantity(result[0].item_id)
                } else if (answer.quantity == 0) {
                    this.backMenu();
                } else {
                    this.updateQuantity(result[0].item_id, result[0].quantity, answer.quantity, result[0].price, result[0].product_name);
                }
            })
        })
    },

    updateQuantity: function (id, store, buy, price, name) {
        store = store - buy;
        let sale = "UPDATE products SET quantity = " + store + " WHERE item_id = " + id;
        con.query(sale, (err, result) => {
            if (err) throw err;

            console.log(chalk.green("\nThe total of your purchase is $" + (parseFloat(buy) * parseFloat(price)).toFixed(2)))
            console.log(chalk.cyan("\nEnjoy your order of " + buy + " " + name + "\n"));
            this.returnMenuPrompt();
        })

    },

    returnMenuPrompt: function () {
        inquirer.prompt({
            type: "confirm",
            name: "back",
            message: chalk.cyan("Would you like to go back to the main menu?"),
            default: true
        }).then(answer => {
            if (answer.back) {
                this.backMenu();
                return;
            }
            console.log(chalk.cyan("\nThank you very much for shopping today\n\n"))
            con.end()
        })
    },

    backMenu: function () {
        con.query(this.sql.selectAll, (err, result) => {
            if (err) throw err;
            let data = [
                [chalk.yellow("Product ID"), chalk.yellow("Product Name"), chalk.yellow("Department"), chalk.yellow("Price"), chalk.yellow("Quantity")],
            ]

            result.forEach(one => {
                data.push([chalk.white(one.item_id), chalk.white(one.product_name), chalk.white(one.department_name), chalk.white("$" + one.price.toFixed(2)), chalk.white(one.quantity)])
            });

            let output = table(data);

            console.log(chalk.green("\n"+output));

            this.selectInventory();
        })
    },

    sql: {

        selectAll: "SELECT * FROM products",

        selectOne: function (id) {
            return "SELECT * FROM products WHERE item_id = " + id;
        },

        // Do not use unless you mean it!
        deleteTable: "DROP TABLE products",
    },





}

store.loadMenu();