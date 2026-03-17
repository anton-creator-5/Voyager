const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Voyager Maritime Intelligence API running");
});

/* WAITLIST */

app.post("/api/waitlist", (req, res) => {
  const { fullName, company, email, fleetSize, role, note } = req.body;

  db.run(
    `INSERT INTO waitlist (fullName, company, email, fleetSize, role, note)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [fullName, company, email, fleetSize, role, note],
    function (err) {
      if (err) {
        return res.status(500).json({ error: "Failed to save waitlist entry" });
      }
      res.json({ id: this.lastID });
    }
  );
});

app.get("/api/waitlist", (req, res) => {
  db.all(`SELECT * FROM waitlist ORDER BY createdAt DESC`, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: "Failed to fetch waitlist" });
    }
    res.json(rows);
  });
});

/* SHIPS */

app.post("/api/ships", (req, res) => {
  const { name, code } = req.body;

  db.run(
    `INSERT INTO ships (name, code) VALUES (?, ?)`,
    [name, code],
    function (err) {
      if (err) {
        return res.status(500).json({ error: "Failed to create ship" });
      }
      res.json({ id: this.lastID, name, code });
    }
  );
});

app.get("/api/ships", (req, res) => {
  db.all(`SELECT * FROM ships ORDER BY name ASC`, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: "Failed to fetch ships" });
    }
    res.json(rows);
  });
});

/* PRODUCTS */

app.post("/api/products", (req, res) => {
  const { shipId, name, category, purchasePrice, salePrice, stock, expiryDate } = req.body;

  db.run(
    `INSERT INTO products (shipId, name, category, purchasePrice, salePrice, stock, expiryDate)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [shipId, name, category, purchasePrice, salePrice, stock, expiryDate || null],
    function (err) {
      if (err) {
        return res.status(500).json({ error: "Failed to create product" });
      }

      res.json({
        id: this.lastID,
        shipId,
        name,
        category,
        purchasePrice,
        salePrice,
        stock,
        expiryDate: expiryDate || null,
      });
    }
  );
});

app.get("/api/products", (req, res) => {
  const shipId = req.query.shipId;

  if (shipId) {
    db.all(
      `SELECT * FROM products WHERE shipId = ? ORDER BY createdAt DESC`,
      [shipId],
      (err, rows) => {
        if (err) {
          return res.status(500).json({ error: "Failed to fetch products" });
        }
        res.json(rows);
      }
    );
  } else {
    db.all(`SELECT * FROM products ORDER BY createdAt DESC`, [], (err, rows) => {
      if (err) {
        return res.status(500).json({ error: "Failed to fetch products" });
      }
      res.json(rows);
    });
  }
});

/* INVENTORY */

app.post("/api/inventory", (req, res) => {
  const { productId, type, quantity, note } = req.body;

  const multiplier = type === "out" ? -1 : 1;

  db.get(`SELECT * FROM products WHERE id = ?`, [productId], (err, product) => {
    if (err || !product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const newStock = Number(product.stock) + multiplier * Number(quantity);

    if (newStock < 0) {
      return res.status(400).json({ error: "Not enough stock" });
    }

    db.run(
      `INSERT INTO inventory_movements (productId, shipId, type, quantity, note)
       VALUES (?, ?, ?, ?, ?)`,
      [productId, product.shipId, type, quantity, note],
      function (movementErr) {
        if (movementErr) {
          return res.status(500).json({ error: "Failed to save movement" });
        }

        db.run(
          `UPDATE products SET stock = ? WHERE id = ?`,
          [newStock, productId],
          function (updateErr) {
            if (updateErr) {
              return res.status(500).json({ error: "Failed to update stock" });
            }

            res.json({ message: "Inventory updated", newStock });
          }
        );
      }
    );
  });
});

app.get("/api/inventory", (req, res) => {
  const shipId = req.query.shipId;

  const baseSql = `
    SELECT inventory_movements.*, products.name AS productName
    FROM inventory_movements
    JOIN products ON inventory_movements.productId = products.id
  `;

  if (shipId) {
    db.all(
      baseSql + ` WHERE inventory_movements.shipId = ? ORDER BY inventory_movements.createdAt DESC`,
      [shipId],
      (err, rows) => {
        if (err) {
          return res.status(500).json({ error: "Failed to fetch inventory" });
        }
        res.json(rows);
      }
    );
  } else {
    db.all(
      baseSql + ` ORDER BY inventory_movements.createdAt DESC`,
      [],
      (err, rows) => {
        if (err) {
          return res.status(500).json({ error: "Failed to fetch inventory" });
        }
        res.json(rows);
      }
    );
  }
});

/* SALES WITH PROFIT */

app.post("/api/sales", (req, res) => {
  const { productId, quantity, note } = req.body;

  db.get(`SELECT * FROM products WHERE id = ?`, [productId], (err, product) => {
    if (err || !product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const qty = Number(quantity);
    const currentStock = Number(product.stock);
    const unitPrice = Number(product.salePrice || 0);
    const unitCost = Number(product.purchasePrice || 0);
    const newStock = currentStock - qty;
    const totalAmount = unitPrice * qty;
    const totalCost = unitCost * qty;
    const profit = totalAmount - totalCost;

    if (newStock < 0) {
      return res.status(400).json({ error: "Not enough stock" });
    }

    db.run(
      `INSERT INTO sales (productId, shipId, quantity, unitPrice, unitCost, totalAmount, totalCost, profit, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [productId, product.shipId, qty, unitPrice, unitCost, totalAmount, totalCost, profit, note || ""],
      function (saleErr) {
        if (saleErr) {
          return res.status(500).json({ error: "Failed to save sale" });
        }

        db.run(
          `UPDATE products SET stock = ? WHERE id = ?`,
          [newStock, productId],
          function (updateErr) {
            if (updateErr) {
              return res.status(500).json({ error: "Failed to update stock" });
            }

            db.run(
              `INSERT INTO inventory_movements (productId, shipId, type, quantity, note)
               VALUES (?, ?, ?, ?, ?)`,
              [productId, product.shipId, "out", qty, note || "Sale"],
              function (movementErr) {
                if (movementErr) {
                  return res.status(500).json({ error: "Sale saved, movement failed" });
                }

                res.json({
                  message: "Sale recorded successfully",
                  newStock,
                  totalAmount,
                  totalCost,
                  profit
                });
              }
            );
          }
        );
      }
    );
  });
});

app.get("/api/sales", (req, res) => {
  const shipId = req.query.shipId;
  const baseSql = `
    SELECT sales.*, products.name AS productName
    FROM sales
    JOIN products ON sales.productId = products.id
  `;

  if (shipId) {
    db.all(
      baseSql + ` WHERE sales.shipId = ? ORDER BY sales.createdAt DESC`,
      [shipId],
      (err, rows) => {
        if (err) {
          return res.status(500).json({ error: "Failed to fetch sales" });
        }
        res.json(rows);
      }
    );
  } else {
    db.all(baseSql + ` ORDER BY sales.createdAt DESC`, [], (err, rows) => {
      if (err) {
        return res.status(500).json({ error: "Failed to fetch sales" });
      }
      res.json(rows);
    });
  }
});

/* DASHBOARD */

app.get("/api/dashboard", (req, res) => {
  const shipId = req.query.shipId;
  const dashboard = {};

  const productCountSql = shipId
    ? `SELECT COUNT(*) AS totalProducts FROM products WHERE shipId = ?`
    : `SELECT COUNT(*) AS totalProducts FROM products`;

  const salesCountSql = shipId
    ? `SELECT COUNT(*) AS totalSales FROM sales WHERE shipId = ?`
    : `SELECT COUNT(*) AS totalSales FROM sales`;

  const revenueSql = shipId
    ? `SELECT COALESCE(SUM(totalAmount), 0) AS totalRevenue FROM sales WHERE shipId = ?`
    : `SELECT COALESCE(SUM(totalAmount), 0) AS totalRevenue FROM sales`;

  const costSql = shipId
    ? `SELECT COALESCE(SUM(totalCost), 0) AS totalCost FROM sales WHERE shipId = ?`
    : `SELECT COALESCE(SUM(totalCost), 0) AS totalCost FROM sales`;

  const profitSql = shipId
    ? `SELECT COALESCE(SUM(profit), 0) AS totalProfit FROM sales WHERE shipId = ?`
    : `SELECT COALESCE(SUM(profit), 0) AS totalProfit FROM sales`;

  const lowStockSql = shipId
    ? `SELECT * FROM products WHERE shipId = ? AND stock <= 5 ORDER BY stock ASC`
    : `SELECT * FROM products WHERE stock <= 5 ORDER BY stock ASC`;

  const expiredSql = shipId
    ? `SELECT * FROM products WHERE shipId = ? AND expiryDate IS NOT NULL AND expiryDate < date('now') ORDER BY expiryDate ASC`
    : `SELECT * FROM products WHERE expiryDate IS NOT NULL AND expiryDate < date('now') ORDER BY expiryDate ASC`;

  const expiringSoonSql = shipId
    ? `SELECT * FROM products WHERE shipId = ? AND expiryDate IS NOT NULL AND expiryDate >= date('now') AND expiryDate <= date('now', '+7 day') ORDER BY expiryDate ASC`
    : `SELECT * FROM products WHERE expiryDate IS NOT NULL AND expiryDate >= date('now') AND expiryDate <= date('now', '+7 day') ORDER BY expiryDate ASC`;

  const topSellingSql = shipId
    ? `
      SELECT products.name, SUM(sales.quantity) AS totalSold, SUM(sales.totalAmount) AS revenue, SUM(sales.profit) AS profit
      FROM sales
      JOIN products ON sales.productId = products.id
      WHERE sales.shipId = ?
      GROUP BY sales.productId
      ORDER BY totalSold DESC
      LIMIT 5
    `
    : `
      SELECT products.name, SUM(sales.quantity) AS totalSold, SUM(sales.totalAmount) AS revenue, SUM(sales.profit) AS profit
      FROM sales
      JOIN products ON sales.productId = products.id
      GROUP BY sales.productId
      ORDER BY totalSold DESC
      LIMIT 5
    `;

  const params = shipId ? [shipId] : [];

  db.get(productCountSql, params, (err, productsRow) => {
    if (err) return res.status(500).json({ error: "Failed to fetch product count" });
    dashboard.totalProducts = productsRow?.totalProducts || 0;

    db.get(salesCountSql, params, (err2, salesRow) => {
      if (err2) return res.status(500).json({ error: "Failed to fetch sales count" });
      dashboard.totalSales = salesRow?.totalSales || 0;

      db.get(revenueSql, params, (err3, revenueRow) => {
        if (err3) return res.status(500).json({ error: "Failed to fetch revenue" });
        dashboard.totalRevenue = revenueRow?.totalRevenue || 0;

        db.get(costSql, params, (err4, costRow) => {
          if (err4) return res.status(500).json({ error: "Failed to fetch cost" });
          dashboard.totalCost = costRow?.totalCost || 0;

          db.get(profitSql, params, (err5, profitRow) => {
            if (err5) return res.status(500).json({ error: "Failed to fetch profit" });
            dashboard.totalProfit = profitRow?.totalProfit || 0;

            db.all(lowStockSql, params, (err6, lowStockRows) => {
              if (err6) return res.status(500).json({ error: "Failed to fetch low stock items" });
              dashboard.lowStock = lowStockRows || [];

              db.all(expiredSql, params, (err7, expiredRows) => {
                if (err7) return res.status(500).json({ error: "Failed to fetch expired items" });
                dashboard.expired = expiredRows || [];

                db.all(expiringSoonSql, params, (err8, expiringSoonRows) => {
                  if (err8) return res.status(500).json({ error: "Failed to fetch expiring items" });
                  dashboard.expiringSoon = expiringSoonRows || [];

                  db.all(topSellingSql, params, (err9, topSellingRows) => {
                    if (err9) return res.status(500).json({ error: "Failed to fetch top-selling products" });
                    dashboard.topSelling = topSellingRows || [];
                    res.json(dashboard);
                  });
                });
              });
            });
          });
        });
      });
    });
  });
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log("Server running on port 5000");
});