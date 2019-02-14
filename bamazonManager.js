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
            console.log("Connected to the database");
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
                    corporate.displayInventory();
                    break;

                case "View Low Inventory":
                    this.lowInventory();
                    break;
                case "Add to Inventory":
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
                // back to the menu
                this.loadMenu();
                return;
            }
             console.log("Enjoy the rest of your day!")
             con.end();
        })
    },

    displayInventory: function () {
        con.query(this.sql.selectAll, (err, result) => {
            if (err) throw err;

            let data = [
                [chalk.yellow("Product ID"), chalk.yellow("Product Name"), chalk.yellow("Department"), chalk.yellow("Price"), chalk.yellow("Cost"), chalk.yellow("Quantity")],
            ]

            result.forEach(one => {
                data.push([chalk.white(one.item_id), chalk.white(one.product_name), chalk.white(one.department_name), chalk.white("$" + one.price.toFixed(2)), chalk.white("$"+one.cost.toFixed(2)), chalk.white(one.quantity)])
            });

            result.map(meatball => this.idArray.push(meatball.item_id));


            let output = table(data);

            console.log(chalk.green(output));

            this.returnMenuPrompt();
        });
    },

    hightlightLow: function(number) {
        if (number > 5) {
            return chalk.green(number)
        } else if (number <= 5 && number > 2) {
            return chalk.yellow(number);
        } else {
            return chalk.red(number);
        }
    },

    lowInventory: function() {
        con.query(this.sql.selectInventorySort, (err, result) => {
            if (err) throw err;

            let data = [
                [chalk.yellow("Product ID"), chalk.yellow("Product Name"), chalk.yellow("Quantity")],
            ]

            result.forEach(one => {
                data.push([chalk.white(one.item_id), chalk.white(one.product_name), this.hightlightLow(one.quantity)])
            });

            let output = table(data);

            console.log(chalk.green(output));

            // console.log(result);

            this.returnMenuPrompt();
        });
    },

    sql: {
        selectAll: "SELECT * FROM products;",

        selectInventorySort: "SELECT item_id, product_name, quantity FROM products ORDER BY quantity;",

        selectOne: function (id) {
            return "SELECT * FROM products WHERE item_id = " + id;
        },

        // Do not use unless you mean it!
        deleteTable: "DROP TABLE products",
    }
    
}

corporate.connectDatabase();