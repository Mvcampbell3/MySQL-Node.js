const inquirer = require("inquirer");
const database = require("mysql");
const { table } = require("table")
const chalk = require("chalk");
const fs = require("fs");
const clear = require("clear")

const con = database.createConnection({
    host: 'localhost',
    user: "root",
    password: "surfboard",
    database: "bamazon"
});

let store = {

    robot: true,

    idArray: [],

    loadMenu: function () {
        con.connect(err => {
            if (err) throw err;

            store.backMenu();

        });
    },

    selectInventory: function () {
        inquirer.prompt({
            type: "input",
            name: "which",
            message: chalk.cyan("Which product would you like to purchase today? (Enter Product ID number, 0 will exit the store)"),
            validate: (value) => {
                testArray = this.idArray;
                testArray.push(0);
                if (isNaN(value) == true || value == "" || testArray.indexOf(parseFloat(value)) == -1) {
                    return "Please enter either 0 or valid Product ID"
                };
                return true;
            }
        }).then(answer => {
            if (answer.which == 0) {
                inquirer.prompt({
                    type: "confirm",
                    name: "leave",
                    message: chalk.yellow("\nAre you sure you want to leave our store?"),
                    default: true
                }).then(answer => {
                    if (answer.leave) {
                        console.log(chalk.cyan("\nThank you for stopping by today\n"));
                        con.end()
                    } else {
                        this.backMenu();
                    }
                });

            } else {
                clear();
                con.query("SELECT * FROM products WHERE item_id =?", [answer.which], (err, result) => {
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
            }

        })
    },

    purchaseQuantity: function (id) {
        con.query("SELECT * FROM products WHERE item_id = ?", [id], (err, result) => {
            if (err) throw err;

            inquirer.prompt({
                type: "input",
                name: "quantity",
                message: chalk.cyan("How many " + result[0].product_name + " units would you like, there are " + result[0].quantity + " left (0 returns you to store menu)"),
                validate: (value) => {
                    if (isNaN(value) == true || value == "") {
                        return "Please enter a number"
                    } else if (parseFloat(value) > result[0].quantity) {
                        return "There is only " + result[0].quantity + " " + result[0].product_name + " left in stock!"
                    }
                    return true
                }
            }).then(answer => {
                if (answer.quantity == 0) {
                    this.backMenu();
                } else {
                    this.updateQuantity(result[0].item_id, result[0].quantity, answer.quantity, result[0].price, result[0].product_name, result[0].sold_units, result[0].profit);
                }
            })
        })
    },

    updateQuantity: function (id, quantity, buy, price, name, sold, profit) {
        clear();

        if (this.robot) {
            console.log(chalk.yellow.underline.bold("\nPlease confirm you are not a robot"));
            console.log(chalk.yellow("\nBy confirming, you agree to by " + buy + " " + name + ".\n"));
            fs.readFile("./robot.txt", "utf8", (err, data) => {
                let passwords = data.split(", ");
                let whichPass = Math.floor(Math.random() * passwords.length);
                inquirer.prompt({
                    type: "input",
                    name: "robot",
                    message: "Enter in the word '" + chalk.green(passwords[whichPass]) + "'. Caps matter!"
                }).then(answer => {
                    if (answer.robot === passwords[whichPass]) {
                        this.robot = false;
                        clear();
                        console.log(chalk.cyan("Congratulations on not being a robot"));
                        quantity = parseFloat(quantity) - parseFloat(buy);
                        sold = parseFloat(sold) + parseFloat(buy);
                        let amtMade = parseFloat(sold) * parseFloat(price);
                        profit = (parseFloat(profit) + parseFloat(amtMade)).toFixed(2);
                        let sale = "UPDATE products SET quantity = ?, sold_units = ?, profit = ? WHERE item_id = ?"

                        con.query(sale, [quantity, sold, profit, id], (err, result) => {
                            if (err) throw err;
                            console.log(chalk.green("\nThe total of your purchase is $" + amtMade.toFixed(2)));
                            if (parseFloat(buy) === 1) {
                                console.log(chalk.cyan("\nEnjoy your " + name + ".\n"))
                            } else {
                                console.log(chalk.cyan("\nEnjoy your order of " + buy + " units of the " + name + "\n"));
                            }

                            this.returnMenuPrompt();
                        })
                    } else {
                        clear();
                        console.log(chalk.cyan("\nCongratualtions on being a robot\n"));
                        this.returnMenuPrompt();
                    }
                })
            })
        } else {
            // not a robot section
            console.log(chalk.cyan("Since you are a human or a clever robot, you just have to confirm your purchase\n"));
            inquirer.prompt({
                type: "confirm",
                name: "confirm",
                message: "You want to order " + buy + " " + name + "?"
            }).then(answer => {
                if (answer.confirm) {
                    clear();
                        quantity = parseFloat(quantity) - parseFloat(buy);
                        sold = parseFloat(sold) + parseFloat(buy);
                        let amtMade = parseFloat(sold) * parseFloat(price);
                        profit = (parseFloat(profit) + parseFloat(amtMade)).toFixed(2);
                        let sale = "UPDATE products SET quantity = ?, sold_units = ?, profit = ? WHERE item_id = ?"

                        con.query(sale, [quantity, sold, profit, id], (err, result) => {
                            if (err) throw err;
                            console.log(chalk.green("\nThe total of your purchase is $" + amtMade.toFixed(2)));
                            if (parseFloat(buy) === 1) {
                                console.log(chalk.cyan("\nEnjoy your " + name + ".\n"))
                            } else {
                                console.log(chalk.cyan("\nEnjoy your order of " + buy + " units of the " + name + "\n"));
                            }

                            this.returnMenuPrompt();
                        })
                } else {
                    console.log("\n")
                    this.returnMenuPrompt();
                }
            }) 
        }


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
        clear();
        con.query(this.sql.selectAll, (err, result) => {
            if (err) throw err;
            let data = [
                [chalk.yellow("Product ID"), chalk.yellow("Product Name"), chalk.yellow("Department"), chalk.yellow("Price"), chalk.yellow("Quantity")],
            ]

            result.forEach(one => {
                data.push([chalk.white(one.item_id), chalk.white(one.product_name), chalk.white(one.department_name), chalk.white("$" + one.price.toFixed(2)), chalk.white(one.quantity)])
            });

            this.idAarray = []

            result.map(meatball => this.idArray.push(meatball.item_id));

            let output = table(data);

            console.log(chalk.green("\n" + output));

            this.selectInventory();
        })
    },

    sql: {
        selectAll: "SELECT * FROM products",
    },
}

store.loadMenu();