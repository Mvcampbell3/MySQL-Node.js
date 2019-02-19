USE bamazon;

DROP TABLE IF EXISTS departments;

CREATE TABLE departments(
	department_id INTEGER(3) NOT NULL AUTO_INCREMENT,
    department_name VARCHAR(75) NOT NULL,
    over_head_costs DECIMAL(10, 2) NOT NULL,
    PRIMARY KEY (department_id)
);

INSERT INTO departments (department_name, over_head_costs)
VALUES
("Toys", 500.00),
("Cosmetics", 500.00),
("Cookware", 1000.00); 