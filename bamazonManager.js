// Imports the stuff
const inquirer = require("inquirer");
const database = require("mysql");
const { table } = require("table")
const chalk = require("chalk");
const clear = require("clear");

// connect variable, might move to inside object but it's fine out here in the wild for now
const con = database.createConnection({
    host: 'localhost',
    user: "root",
    password: "surfboard",
    database: "bamazon"
});

let corporate = {

    idArray: [0],

    connectDatabase: function () {
        con.connect(err => {
            con.query("SELECT * FROM products", (err, result) => {
                if (err) throw err;
                result.forEach(one => this.idArray.push(one.item_id));
                this.loadMenu();

            })
        });
    },

    loadMenu: function () {
        clear();
        let data = [[chalk.cyan("Welcome to the Bamazon Manager Screen")]];

        let output = table(data);

        console.log(output);

        inquirer.prompt({
            type: "list",
            name: "select",
            message: "Which information tab would you like to see?",
            choices: [
                "View Products for Sale", "View Low Inventory", "Add to Inventory", "Add New Product", "Exit"
            ]
        }).then(answer => {
            switch (answer.select) {
                case "View Products for Sale":
                    corporate.displayInventory(corporate.returnMenuPrompt);
                    break;

                case "View Low Inventory":
                    this.lowInventory();
                    break;
                case "Add to Inventory":
                    corporate.displayInventory(corporate.addInventory);
                    break;
                case "Add New Product":
                    corporate.newProductInformation();
                    break;
                case "Exit":
                    clear();
                    con.end()
                    break;
                default:
                    console.log("Switch not working as expected")
            }
        })
    },

    returnMenuPrompt: function () {
        this.idArray = [0];
        con.query("SELECT * FROM products", (err, result) => {
            if (err) throw err;
            result.forEach(one => this.idArray.push(one.item_id));
            inquirer.prompt({
                type: "confirm",
                name: "back",
                message: "Would you like to go back to the main menu?",
                default: true
            }).then(answer => {
                if (answer.back) {
                    corporate.loadMenu();
                    return;
                }
                console.log(chalk.cyan("\nEnjoy the rest of your day!"))
                con.end();
            })
        })

    },

    displayInventory: function (cb) {
        con.query(this.sql.selectAll, (err, result) => {
            if (err) throw err;

            let data = [
                [chalk.yellow("Product ID"), chalk.yellow("Product Name"), chalk.yellow("Department"), chalk.yellow("Price"), chalk.yellow("Quantity")],
            ]

            result.forEach(one => {
                data.push([chalk.white(one.item_id), chalk.white(one.product_name), chalk.white(one.department_name), chalk.white("$" + one.price.toFixed(2)), this.hightlightLow(one.quantity)])
            });

            result.map(meatball => this.idArray.push(meatball.item_id));


            let output = table(data);

            console.log(chalk.green(output));

            cb();
        });
    },

    hightlightLow: function (number) {
        if (number > 5) {
            return chalk.green(number)
        } else if (number <= 5 && number > 2) {
            return chalk.yellow(number);
        } else {
            return chalk.red(number);
        }
    },

    lowInventory: function () {
        con.query(this.sql.selectInventorySort, (err, result) => {
            if (err) throw err;

            let data = [
                [chalk.yellow("Product ID"), chalk.yellow("Product Name"), chalk.yellow("Quantity")],
            ]

            let fiveOrLess = result.filter(cyclone => cyclone.quantity <= 5);

            if (fiveOrLess.length > 0) {
                fiveOrLess.forEach(one => {
                    data.push([chalk.white(one.item_id), chalk.white(one.product_name), this.hightlightLow(one.quantity)])
                });

                let output = table(data);

                console.log(chalk.green(output));

                this.returnMenuPrompt();
            } else {
                data.push([chalk.white("All"), chalk.white("Inventory"), chalk.white("Above 5 units!")])

                let output = table(data);

                console.log(chalk.green(output));

                this.returnMenuPrompt();
            }


        });
    },

    addInventory: function () {
        inquirer.prompt({
            type: "input",
            name: "addInv",
            message: chalk.cyan("Which product would you like to add inventory? (Enter Product ID Number, 0 will return you to main menu)"),
            validate: value => {
                if (isNaN(parseFloat(value)) == true || corporate.idArray.indexOf(parseFloat(value)) == -1) {
                    return ("Please enter in a valid ID or 0");
                }

                return true;
            }

        }).then(answer => {
            if (answer.addInv == 0) {
                corporate.loadMenu();
                return;
            } else {
                corporate.orderInvScreen(answer.addInv)
            }
        })
    },

    orderInvScreen: function (id) {
        clear();

        let data = [
            [chalk.yellow("Product ID"), chalk.yellow("Product Name"), chalk.yellow("Department"), chalk.yellow("Price"), chalk.yellow("Quantity")],
        ]

        con.query(corporate.sql.selectOne(id), (err, result) => {
            if (err) throw err;

            data.push([chalk.white(result[0].item_id), chalk.white(result[0].product_name), chalk.white(result[0].department_name), chalk.white("$" + result[0].price.toFixed(2)), this.hightlightLow(result[0].quantity)]);

            let output = table(data);
            console.log(chalk.green(output));

            inquirer.prompt({
                type: "input",
                name: "order",
                message: "How many units would you like to buy?",
                validate: (value) => {
                    if (isNaN(parseFloat(value)) == true || value == "" || parseFloat(value) < 0) {
                        return "Please enter the number of units you would like to order";
                    }
                    return true;
                }
            }).then(answer => {
                corporate.makeOrder(result[0].item_id, result[0].product_name, result[0].quantity, answer.order);
            })
        })
    },

    makeOrder: function (id, name, start, add) {
        console.log("\n")
        inquirer.prompt({
            type: "confirm",
            name: "confirm",
            message: "You want to order " + chalk.green(add) + " units of the product " + chalk.yellow(name) + "?"
        }).then(answer => {
            if (answer.confirm) {
                let newQuantity = parseFloat(start) + parseFloat(add);
                con.query("UPDATE products SET quantity = ? WHERE item_id = ?", [newQuantity, id], (err, result) => {
                    if (err) throw err;
                    clear();
                    console.log(chalk.cyan("\nYou have added " + add + " units of the product " + name + " to inventory!\n"));
                    
                    inquirer.prompt({
                        type: "list",
                        name: "afterInventory",
                        message: "Where would you like to go now?",
                        choices: ["Add To Inventory", "View Low Inventory", "Back to the Main Menu"]
                    }).then(answer => {
                        
                        switch (answer.afterInventory) {
                            case "Add To Inventory":
                                corporate.displayInventory(corporate.addInventory);
                                break;
                            case "View Low Inventory":
                                corporate.lowInventory();
                                break;
                            case "Back to the Main Menu":
                                corporate.loadMenu();
                                break;
                            default:
                                console.log(chalk.red("Who what now? How did you get here"));
                                console.log(answer.afterInventory)
                        }
                    })

                })
            } else {
                console.log("\n")
                this.returnMenuPrompt();
            }
        })

    },

    newProductInformation: function () {
        con.query("SELECT department_name FROM departments", (err, result) => {
            if (err) throw err;
            let choiceArray = [];
            result.forEach(one => choiceArray.push(one.department_name))
            inquirer.prompt([
                {
                    type: "input",
                    name: "name",
                    message: "What is the name of the new product?",
                    validate: (value) => {
                        if (value == "") {
                            return "Please enter a name for the product"
                        };
                        return true;
                    },
                },
                {
                    type: "list",
                    name: "department",
                    message: "Which department will sell the new product?",
                    choices: choiceArray,
                },
                {
                    type: "input",
                    name: "price",
                    message: "What will be the sale price of the new product?",
                    validate: (value) => {
                        if (isNaN(value) || value == "") {
                            return "Please enter a number"
                        }
                        return true;
                    }
                },
                {
                    type: "input",
                    name: "quantity",
                    message: "Finally, how many units would you like to purchase for inventory?",
                    validate: (value) => {
                        if (value == "" || isNaN(value) === true) {
                            return "Please enter a number";
                        }
                        return true;
                    }
                }
            ]).then(answer => {
                corporate.newConfirm(answer.name, answer.department, answer.price, answer.quantity)
            })
        })

    },

    newConfirm: function (name, department, price, quantity) {
        console.log(
            chalk.cyan("\nNew Product Name: ") + chalk.yellow(name) + chalk.cyan(", Department: ") + chalk.yellow(department) + chalk.cyan(", Price: ") + chalk.yellow(price) + chalk.cyan(", Quantity: ") + chalk.yellow(quantity) + chalk.cyan(".\n")
        );
        inquirer.prompt({
            type: "confirm",
            name: "add",
            message: "Are you sure you want to add this product?",
            default: true
        }).then(answer => {
            if (answer.add) {
                con.query("INSERT INTO products set?", {
                    product_name: name,
                    department_name: department,
                    price: price,
                    quantity: quantity
                }, (err, response) => {
                    if (err) throw err;
                    console.log(chalk.cyan("\nYou have successfully added " + name + " to the store inventory!\n"));
                    corporate.returnMenuPrompt();
                })
            } else {
                corporate.returnMenuPrompt();
            }
        })
    },

    sql: {
        selectAll: "SELECT * FROM products;",

        selectInventorySort: "SELECT item_id, product_name, quantity FROM products ORDER BY quantity;",

        selectOne: function (id) {
            return "SELECT * FROM products WHERE item_id = " + id;
        },

        // Do not use unless you mean it!
        deleteTable: "DROP TABLE products",

        addTo: function (id, number) {
            return "UPDATE products SET quantity = " + number + " WHERE item_id = " + id;
        },

    }

}

corporate.connectDatabase();