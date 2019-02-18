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

con.connect(err => {
    if (err) throw err;
    // console.log("working")
    loadMenu();
});

function loadMenu() {
    clear();

    let menuDesign = [[chalk.cyan("Welcome to the Supervisor Page")]];

    let slot = table(menuDesign);

    console.log(chalk.green(slot));

    inquirer.prompt({
        type: "list",
        name: "menu",
        message: chalk.cyan("What would you like to do boss?\n\n"),
        choices: [
            "View Product Sales by Department\n",
            "Create New Department\n",
            "Exit"
        ]
    }).then(answer => {
        switch (answer.menu) {
            case "View Product Sales by Department\n":
                viewDepartments();
                break;
            case "Create New Department\n":
                // console.log("Still working on that Chief");
                makeDepartment();
                break;
            case "Exit":
                con.end();
                break;
            default:
                console.log("You are litteraly too dumb to insult");
                loadMenu();

        }
    })
};

function viewDepartments() {
    clear();
    con.query("SELECT departments.department_id, departments.department_name, departments.over_head_costs, SUM(products.profit) AS profit FROM products Right JOIN departments ON products.department_name = departments.department_name GROUP BY departments.department_name ORDER BY departments.department_id", (err, result) => {
        if (err) throw err;
        // console.log(result.map(one => one.profit));
        // console.log(result)
        let data = [["Department ID", "Department Name", "Total Dept. Sales", "Over Head Costs", "Profit Margin"]];

        result.forEach(one => {
            let margin = one.profit - one.over_head_costs;
            // console.log(margin);
            data.push([chalk.white(one.department_id), chalk.white(one.department_name), highlight(one.profit || 0), chalk.red(one.over_head_costs), highlight(margin.toFixed(2))])

        });

        let output = table(data);
        console.log(output)
        returnMenuPrompt();
    })
};

function returnMenuPrompt() {
    inquirer.prompt({
        type: "confirm",
        name: "return",
        message: chalk.green("\nWould you like to return to the main menu?"),
        default: true
    }).then(answer => {
        if (answer.return) {
            loadMenu();
            return;
        } else {
            console.log("Cya Later Gator");
            con.end();
        }
    })
};

function highlight(number) {
    if (number > 500) {
        return chalk.green(number)
    } else if (number <= 500 && number > 200) {
        return chalk.yellow(number);
    } else {
        return chalk.red(number);
    }
}

function makeDepartment() {
    clear();
    inquirer.prompt([
        {
            type: "input",
            name: "name",
            message: "What would you like to name the new Department?"
        },
        {
            type: "input",
            name: "overhead",
            message: "How much overhead does this new department have?"
        }
    ]).then(answer => {
        console.log(answer.name, answer.overhead);
        con.query("INSERT INTO departments SET?",{
            department_name: answer.name,
            over_head_costs: answer.overhead
        }, (err, result) => {
            if (err) throw err;
            console.log("Great success")
        })
    })
}








