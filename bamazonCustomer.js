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

let store = {

    // Part of the gate which stops users from creating errs. 
    idArray: [],

    // This is what is run to connect to the mysql database and display it to the screen in a table
    // Then run the selectInventory function
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

                result.map(meatball => this.idArray.push(meatball.item_id));


                let output = table(data);

                console.log(chalk.green(output));

                this.selectInventory();
            })
        });
    },


    // If want to add press 0 to exit the store, this is where we would do it
    // Need to do nothing with the error, or maybe throw it after we see if they pressed 0
    // Then run con.end and a goodbye message.
    // This all depends on what happens when we intentionally cause an error.
    // Well that didn't work
    // Yo, order of operations man, order of operations...
    selectInventory: function () {
        inquirer.prompt({
            type: "input",
            name: "which",
            message: chalk.cyan("Which product would you like to purchase today? (Enter Product ID number, 0 will exit the store)")
        }).then(answer => {
            if (answer.which == 0){
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

            } else if (this.idArray.indexOf(parseFloat(answer.which)) === -1){
                console.log(chalk.yellow("\nYou must enter in the ID number of the product you would like to view\n"));
                this.returnMenuPrompt();

            } else {
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
            }
            
        })
    },


    // After the user makes a selection, this shows them just the info about the selection and asks them
    // how much they would like to buy.
    // carries info about the item along with it into updateQuantity function
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

    // This simply takes in all of the data from the user in purchase quantity and computes it
    // Takes the remainder of the stock and updates the database quantity
    // Tells the user how much their purchase was
    // Asks them if they want to continue shopping
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

    // This will ask the user if they want to go back to the main menu
    // Then runs appropriate response
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

    // This function is the con query to go back to the main store screen
    // Uses this in rest of program instead of connect because of too many handshakes, not enough sanitizer
    // Ran inside of returnMenuPrompt and also when I want to send you back without asking beforehand
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

    // Stores the mysql commands that interact with the database in con.query/connect functions
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