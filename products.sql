USE bamazon;

DROP TABLE IF EXISTS products;

CREATE TABLE products (
	item_id INTEGER(10) AUTO_INCREMENT,
    product_name VARCHAR(100) NOT NULL,
    department_name VARCHAR(40) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    quantity INTEGER(5) DEFAULT 10,
    sold_units INTEGER(5) DEFAULT 0,
    PRIMARY KEY(item_id)
);

INSERT INTO products(product_name, department_name, price)
VALUES
("Spartan Kitchen Knife Set","Cookware", 185.95);
("Retro Hot Dog Pop-Up Toaster","Cookware", 19.99),
("Keyboard Waffle Iron","Cookware", 49.00),
("SUSOKI 8-in-1 Kitchen Tool Set","Cookware", 9.99),
("Oenophilia Bali Wine Rack","Cookware", 52.00),
("LEGO Classic Basic Brick Set","Toys", 17.97),
("LEGO Ideas Ship in a Bottle","Toys", 55.59),
("LEGO Ideas NASA Apollo Saturn V","Toys", 119.99),
("LEGO Creator 3in1 Shuttle Transporter","Toys", 21.97),
("LEGO City Police High-Speed Chase","Toys", 31.99),
("Mint Toothpaste","Cosmetics", 4.75),
("Hair Gel","Cosmetics", 6.99),
("Old Spice Deodorant","Cosmetics", 3.99),
("Head and Sholders Shampoo and Conditioner","Cosmetics", 5.50);
