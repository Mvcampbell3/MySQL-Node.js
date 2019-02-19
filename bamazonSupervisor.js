const inquirer = require("inquirer");
const database = require("mysql");
const { table } = require("table")
const chalk = require("chalk");
const clear = require("clear");

const con = database.createConnection({
    host: 'localhost',
    user: "root",
    password: "surfboard",
    database: "bamazon"
});

let tyrant = {
    connectDatabase: function(){
        con.connect(err => {
            if (err) throw err;
            tyrant.loadMenu();
        });
    },

    loadMenu: function () {
        clear();
        let menuDesign = [[chalk.cyan("Welcome to the Supervisor Page")]];
        let slot = table(menuDesign);
        console.log(slot);
        inquirer.prompt({
            type: "list",
            name: "menu",
            message: chalk.cyan("What would you like to do boss?"),
            choices: [
                "View Product Sales by Department",
                "Create New Department",
                "Exit"
            ]
        }).then(answer => {
            switch (answer.menu) {
                case "View Product Sales by Department":
                    this.viewDepartments();
                    break;
                case "Create New Department":
                    this.makeDepartment();
                    break;
                case "Exit":
                    clear();
                    con.end();
                    break;
                default:
                    console.log("You are litteraly too dumb to insult");
                    this.loadMenu();
            }
        })
    },

    viewDepartments: function () {
        clear();
        inquirer.prompt({
            type: "list",
            name: "order",
            message: chalk.cyan("What would you like to order this list by?"),
            choices: [
                "Department ID",
                "Total Sales",
                "Overhead Costs",
            ]
        }).then(answer => {

            let orderBy = "";

            switch (answer.order) {
                case "Department ID":
                    orderBy = "departments.department_id";
                    break;
                case "Total Sales":
                    orderBy = "SUM(products.profit) DESC"
                    break;
                case "Overhead Costs":
                    orderBy = "departments.over_head_costs DESC"
                    break;
                default:
                    console.log("You should not be able to get to this point")
            }

            con.query("SELECT departments.department_id, departments.department_name, departments.over_head_costs, SUM(products.profit) AS profit FROM products Right JOIN departments ON products.department_name = departments.department_name GROUP BY departments.department_name ORDER BY " + orderBy, (err, result) => {
                if (err) throw err;

                let data = [["Department ID", "Department Name", "Total Dept. Sales", "Overhead Costs", "Profit Margin"]];

                result.forEach(one => {
                    let margin = one.profit - one.over_head_costs;
                    // console.log(margin);
                    data.push([chalk.white(one.department_id), chalk.white(one.department_name), this.highlight(one.profit || 0), chalk.red(one.over_head_costs), this.highlight(margin.toFixed(2))])

                });

                let output = table(data);
                console.log(output)
                this.returnMenuPrompt();
            })
        })
    },

    returnMenuPrompt: function () {
        inquirer.prompt({
            type: "confirm",
            name: "return",
            message: chalk.green("Would you like to return to the main menu?"),
            default: true
        }).then(answer => {
            if (answer.return) {
                this.loadMenu();
                return;
            } else {
                console.log("Cya Later Gator");
                con.end();
            }
        })
    },

    highlight: function (number) {
        if (number > 500) {
            return chalk.green(number)
        } else if (number <= 500 && number > 100) {
            return chalk.yellow(number);
        } else {
            return chalk.red(number);
        }
    },

    makeDepartment: function () {
        clear();
        inquirer.prompt([
            {
                type: "input",
                name: "name",
                message: "What would you like to name the new Department?",
                validate: (value) => {
                    if (value === "") {
                        return "Must enter name of new department"
                    }
                    return true;
                }
            },
            {
                type: "input",
                name: "overhead",
                message: "How much overhead does this new department have?",
                validate: (value) => {
                    if (value === "" || isNaN(value) === true) {
                        return "Must enter a number amount for the overhead cost"
                    };
                    return true;
                }
            }
        ]).then(answer => {
            console.log(chalk.yellow("\nConfimation Message:\n"))
            this.insertDepartment(answer.name, answer.overhead);
        })
    },

    insertDepartment: function(name, overhead) {
        inquirer.prompt({
            type: "confirm",
            name: "make",
            message: "Create a new department named " + chalk.green(name) + " that has an overhead cost of $" + chalk.red(overhead) + "?"
        }).then(answer => {
            if (answer.make) {
                con.query("INSERT INTO departments SET?", {
                    department_name: name,
                    over_head_costs: overhead
                }, (err, result) => {
                    if (err) throw err;
                    console.log("You have successfully added the department " + name + "!");
                    this.returnMenuPrompt();
                })
            } else {
                console.log(chalk.cyan("\nJust checking the ol' create department process, I got you\n"));
                this.returnMenuPrompt();
            }
        })
            
    }
};



tyrant.connectDatabase();





