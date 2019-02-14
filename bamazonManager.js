// Imports the stuff
const inquirer = require("inquirer");
const database = require("mysql");
const { table } = require("table")
const chalk = require("chalk");

// connect variable, might move to inside object but it's fine out here in the wild for now
const con = database.createConnection({
    host: 'localhost',
    user: "root",
    password: "Jackson325!",
    database: "bamazon"
});


let corporate = {

    idArray: [],

    connectDatabase: function () {
        con.connect(err => {
            this.loadMenu();
        });
    },

    loadMenu: function () {

        let data = [["View Products for Sale", "View Low Inventory", "Add to Inventory", "Add New Product"]];

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
                    break;
                case "Exit":
                    con.end()
                    break;
                default:
                    console.log("Switch not working as expected")
            }
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
                corporate.loadMenu();
                return;
            }
            console.log("Enjoy the rest of your day!")
            con.end();
        })
    },

    displayInventory: function (cb) {
        con.query(this.sql.selectAll, (err, result) => {
            if (err) throw err;

            let data = [
                [chalk.yellow("Product ID"), chalk.yellow("Product Name"), chalk.yellow("Department"), chalk.yellow("Price"), chalk.yellow("Cost"), chalk.yellow("Quantity")],
            ]

            result.forEach(one => {
                data.push([chalk.white(one.item_id), chalk.white(one.product_name), chalk.white(one.department_name), chalk.white("$" + one.price.toFixed(2)), chalk.white("$" + one.cost.toFixed(2)), this.hightlightLow(one.quantity)])
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
            message: "Which product would you like to add inventory? (Enter Product ID Number, 0 will return you to main menu)"
        }).then(answer => {
            if (answer.addInv == 0) {
                corporate.loadMenu();
                return;
            } else if (corporate.idArray.indexOf(parseFloat(answer.addInv)) === -1) {
                console.log(answer.addInv)
                console.log(corporate.idArray)
                console.log("\nInvalid Product ID number\n");
                corporate.addInventory();
                return;
            } else {
                console.log("ask how many they want to order")
                corporate.orderInvScreen(answer.addInv)

            }
        })
    },

    orderInvScreen: function (id) {
        let data = [
            [chalk.yellow("Product ID"), chalk.yellow("Product Name"), chalk.yellow("Department"), chalk.yellow("Price"), chalk.yellow("Cost"), chalk.yellow("Quantity")],
        ]

        con.query(corporate.sql.selectOne(id), (err, result) => {
            if (err) throw err;

            data.push([chalk.white(result[0].item_id), chalk.white(result[0].product_name), chalk.white(result[0].department_name), chalk.white("$" + result[0].price.toFixed(2)), chalk.white("$" + result[0].cost.toFixed(2)), this.hightlightLow(result[0].quantity)]);

            let output = table(data);
            console.log(chalk.green(output));

            inquirer.prompt({
                type: "input",
                name: "order",
                message: "How many units would you like to buy?"
            }).then(answer => {
                corporate.makeOrder(result[0].item_id, result[0].product_name, result[0].quantity, answer.order, result[0].cost);
            })
        })
    },

    makeOrder: function (id, name, start, add, cost) {

        let newQuantity = parseFloat(start) + parseFloat(add);
        con.query(corporate.sql.addTo(id, newQuantity), (err, result) => {
            if (err) throw err;
            console.log(chalk.cyan("\nYou have added " + add + " units of the product " + name + " to inventory at a total cost of $" + ((parseFloat(cost) * parseFloat(add)).toFixed(2)) + "\n"));

            inquirer.prompt({
                type: "list",
                name: "afterInventory",
                message: "Where would you like to go now?",
                choices: ["Add inventory menu", "View Low Inventory", "Back to the main menu"]
            }).then(answer => {
                switch (answer.afterInventory) {
                    case "Add inventory menu":
                        corporate.displayInventory(corporate.addInventory);
                        break;
                    case "View Low Inventory":
                        corporate.lowInventory();
                        break;
                    case "Back to the main menu":
                        corporate.loadMenu();
                        break;
                    default:
                        console.log(chalk.red("Who what now? How did you get here"));
                        console.log(answer.afterInventory)
                }
            })

        })
    },

    newProductInformation: function () {
        var productName;
        var productDepartment;
        var productPrice;
        var productCost;
        var productQuantity;
        
        inquirer.prompt({
            type: "input",
            name: "name",
            message: "What is the name of the new product?"
        }).then(answer => {
            ProductName = answer.name;
            inquirer.prompt({
                type: "input",
                name: "department",
                message: "In what department will " + productName + " going to be sold?"
            }).then(answer => {
                productDepartment = answer.department;
                inquirer.prompt({
                    type: "input",
                    name: "price",
                    message: "What is the selling price of " + productName + "?"
                }).then(answer => {
                    productPrice = answer.price;
                    inquirer.prompt({
                        type: "input",
                        name: "cost",
                        message: "What is the COGS"
                    })
                })
            })
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

        newProduct: function (name, department, price, cost, quantity) {
            return "INSERT INTO products(product_name, department_name, price, cost, quantity) VALUES (" + name + ", " + department + ", " + price + ", " + cost + ", " + quantity + ");"
        }
    }

}

corporate.connectDatabase();