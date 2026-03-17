import React, { useEffect, useMemo, useState } from "react";
import "./App.css";

function App() {
  const [formData, setFormData] = useState({
    fullName: "",
    company: "",
    email: "",
    fleetSize: "",
    role: "",
    note: "",
  });

  const [shipForm, setShipForm] = useState({
    name: "",
    code: "",
  });

  const [ships, setShips] = useState([]);
  const [selectedShipId, setSelectedShipId] = useState("");

  const [productForm, setProductForm] = useState({
    shipId: "",
    name: "",
    category: "",
    purchasePrice: "",
    salePrice: "",
    stock: "",
    expiryDate: "",
  });

  const [inventoryForm, setInventoryForm] = useState({
    productId: "",
    type: "in",
    quantity: "",
    note: "",
  });

  const [salesForm, setSalesForm] = useState({
    productId: "",
    quantity: "",
    note: "",
  });

  const [message, setMessage] = useState("");
  const [entries, setEntries] = useState([]);
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [sales, setSales] = useState([]);

  const [dashboard, setDashboard] = useState({
    totalProducts: 0,
    totalSales: 0,
    totalRevenue: 0,
    totalCost: 0,
    totalProfit: 0,
    lowStock: [],
    expired: [],
    expiringSoon: [],
    topSelling: [],
  });

  const [showAdmin, setShowAdmin] = useState(false);
  const [showProducts, setShowProducts] = useState(false);
  const [showSales, setShowSales] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showShips, setShowShips] = useState(false);

  const safeEntries = Array.isArray(entries) ? entries : [];
  const safeShips = Array.isArray(ships) ? ships : [];
  const safeProducts = Array.isArray(products) ? products : [];
  const safeMovements = Array.isArray(movements) ? movements : [];
  const safeSales = Array.isArray(sales) ? sales : [];
  const safeLowStock = Array.isArray(dashboard?.lowStock) ? dashboard.lowStock : [];
  const safeExpired = Array.isArray(dashboard?.expired) ? dashboard.expired : [];
  const safeExpiringSoon = Array.isArray(dashboard?.expiringSoon) ? dashboard.expiringSoon : [];
  const safeTopSelling = Array.isArray(dashboard?.topSelling) ? dashboard.topSelling : [];

  const shipQuery = selectedShipId ? `?shipId=${selectedShipId}` : "";

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleShipChange = (e) => {
    setShipForm({ ...shipForm, [e.target.name]: e.target.value });
  };

  const handleProductChange = (e) => {
    setProductForm({ ...productForm, [e.target.name]: e.target.value });
  };

  const handleInventoryChange = (e) => {
    setInventoryForm({ ...inventoryForm, [e.target.name]: e.target.value });
  };

  const handleSalesChange = (e) => {
    setSalesForm({ ...salesForm, [e.target.name]: e.target.value });
  };

  const fetchWaitlist = async () => {
    try {
      const response = await fetch("https://voyager-production-c301.up.railway.app/api/waitlist");
      const data = await response.json();
      setEntries(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch waitlist:", error);
      setEntries([]);
    }
  };

  const fetchShips = async () => {
    try {
      const response = await fetch("https://voyager-production-c301.up.railway.app/api/ships");
      const data = await response.json();
      setShips(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch ships:", error);
      setShips([]);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch(`https://voyager-production-c301.up.railway.app/api/products${shipQuery}`);
      const data = await response.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      setProducts([]);
    }
  };

  const fetchMovements = async () => {
    try {
      const response = await fetch(`https://voyager-production-c301.up.railway.app/api/inventory${shipQuery}`);
      const data = await response.json();
      setMovements(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch movements:", error);
      setMovements([]);
    }
  };

  const fetchSales = async () => {
    try {
      const response = await fetch(`https://voyager-production-c301.up.railway.app/api/sales${shipQuery}`);
      const data = await response.json();
      setSales(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch sales:", error);
      setSales([]);
    }
  };

  const fetchDashboard = async () => {
    try {
      const response = await fetch(`https://voyager-production-c301.up.railway.app/api/dashboard${shipQuery}`);
      const data = await response.json();

      setDashboard({
        totalProducts: Number(data?.totalProducts || 0),
        totalSales: Number(data?.totalSales || 0),
        totalRevenue: Number(data?.totalRevenue || 0),
        totalCost: Number(data?.totalCost || 0),
        totalProfit: Number(data?.totalProfit || 0),
        lowStock: Array.isArray(data?.lowStock) ? data.lowStock : [],
        expired: Array.isArray(data?.expired) ? data.expired : [],
        expiringSoon: Array.isArray(data?.expiringSoon) ? data.expiringSoon : [],
        topSelling: Array.isArray(data?.topSelling) ? data.topSelling : [],
      });
    } catch (error) {
      console.error("Failed to fetch dashboard:", error);
      setDashboard({
        totalProducts: 0,
        totalSales: 0,
        totalRevenue: 0,
        totalCost: 0,
        totalProfit: 0,
        lowStock: [],
        expired: [],
        expiringSoon: [],
        topSelling: [],
      });
    }
  };

  useEffect(() => {
    fetchShips();
  }, []);

  useEffect(() => {
    if (showAdmin) fetchWaitlist();
    if (showProducts) {
      fetchProducts();
      fetchMovements();
    }
    if (showSales) {
      fetchProducts();
      fetchSales();
    }
    if (showDashboard) {
      fetchDashboard();
      fetchProducts();
      fetchSales();
    }
    if (showShips) {
      fetchShips();
    }
  }, [showAdmin, showProducts, showSales, showDashboard, showShips, selectedShipId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("https://voyager-production-c301.up.railway.app/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setMessage("You have successfully joined the waitlist.");
        setFormData({
          fullName: "",
          company: "",
          email: "",
          fleetSize: "",
          role: "",
          note: "",
        });
      } else {
        setMessage("Something went wrong. Please try again.");
      }
    } catch (error) {
      setMessage("Server connection failed.");
    }
  };

  const handleShipSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("https://voyager-production-c301.up.railway.app/api/ships", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(shipForm),
      });

      if (response.ok) {
        setShipForm({ name: "", code: "" });
        fetchShips();
      } else {
        alert("Failed to create ship.");
      }
    } catch (error) {
      alert("Server connection failed.");
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("https://voyager-production-c301.up.railway.app/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productForm),
      });

      if (response.ok) {
        setProductForm({
          shipId: selectedShipId || "",
          name: "",
          category: "",
          purchasePrice: "",
          salePrice: "",
          stock: "",
          expiryDate: "",
        });
        fetchProducts();
        fetchDashboard();
      } else {
        alert("Failed to create product.");
      }
    } catch (error) {
      alert("Server connection failed.");
    }
  };

  const handleInventorySubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("https://voyager-production-c301.up.railway.app/api/inventory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(inventoryForm),
      });

      const data = await response.json();

      if (response.ok) {
        setInventoryForm({
          productId: "",
          type: "in",
          quantity: "",
          note: "",
        });
        fetchProducts();
        fetchMovements();
        fetchDashboard();
      } else {
        alert(data.message || data.error || "Failed to save inventory movement.");
      }
    } catch (error) {
      alert("Server connection failed.");
    }
  };

  const handleSalesSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("https://voyager-production-c301.up.railway.app/api/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(salesForm),
      });

      const data = await response.json();

      if (response.ok) {
        setSalesForm({
          productId: "",
          quantity: "",
          note: "",
        });
        fetchSales();
        fetchProducts();
        fetchMovements();
        fetchDashboard();
      } else {
        alert(data.error || "Failed to save sale.");
      }
    } catch (error) {
      alert("Server connection failed.");
    }
  };

  const ShipSelector = () => (
    <div style={{ marginBottom: "20px" }}>
      <select
        className="inventory-select"
        value={selectedShipId}
        onChange={(e) => {
          setSelectedShipId(e.target.value);
          setProductForm((prev) => ({ ...prev, shipId: e.target.value }));
        }}
      >
        <option value="">All Ships / No Filter</option>
        {safeShips.map((ship) => (
          <option key={ship.id} value={ship.id}>
            {ship.name} {ship.code ? `(${ship.code})` : ""}
          </option>
        ))}
      </select>
    </div>
  );

  const aiInsights = useMemo(() => {
    const insights = [];

    if (dashboard.totalProfit < 0) {
      insights.push("This ship is currently unprofitable. Revenue is lower than cost.");
    }

    if (dashboard.totalSales === 0 && dashboard.totalProducts > 0) {
      insights.push("Products exist but no sales were recorded yet.");
    }

    if (safeExpired.length > 0) {
      insights.push(`${safeExpired.length} product(s) are already expired and may be causing waste.`);
    }

    if (safeExpiringSoon.length > 0) {
      insights.push(`${safeExpiringSoon.length} product(s) will expire within 7 days.`);
    }

    if (safeLowStock.length > 0) {
      insights.push(`${safeLowStock.length} product(s) are low on stock and may need replenishment.`);
    }

    const noSalesProducts = safeProducts.filter(
      (p) => !safeSales.some((s) => Number(s.productId) === Number(p.id))
    );

    if (noSalesProducts.length > 0) {
      insights.push(`${noSalesProducts.length} product(s) have no sales history. Review whether they should stay onboard.`);
    }

    if (safeTopSelling.length > 0) {
      insights.push(`Top seller right now: ${safeTopSelling[0].name}.`);
    }

    if (insights.length === 0) {
      insights.push("No major operational risks detected right now.");
    }

    return insights;
  }, [
    dashboard.totalProfit,
    dashboard.totalSales,
    dashboard.totalProducts,
    safeExpired,
    safeExpiringSoon,
    safeLowStock,
    safeProducts,
    safeSales,
    safeTopSelling,
  ]);

  if (showShips) {
    return (
      <div className="admin-page">
        <div className="admin-header">
          <h1>Fleet Mode — Ships</h1>
          <button className="secondary-btn" onClick={() => setShowShips(false)}>
            Back
          </button>
        </div>

        <form className="waitlist-form" onSubmit={handleShipSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Ship name"
            value={shipForm.name}
            onChange={handleShipChange}
            required
          />
          <input
            type="text"
            name="code"
            placeholder="Ship code / IMO / short code"
            value={shipForm.code}
            onChange={handleShipChange}
          />
          <button type="submit" className="primary-btn">Add Ship</button>
        </form>

        <div className="table-wrapper" style={{ marginTop: "30px" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Code</th>
              </tr>
            </thead>
            <tbody>
              {safeShips.length > 0 ? (
                safeShips.map((ship) => (
                  <tr key={ship.id}>
                    <td>{ship.name}</td>
                    <td>{ship.code}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="2">No ships yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (showDashboard) {
    return (
      <div className="admin-page">
        <div className="admin-header">
          <h1>SlopChest Fleet Dashboard</h1>
          <button className="secondary-btn" onClick={() => setShowDashboard(false)}>
            Back
          </button>
        </div>

        <ShipSelector />

        <div className="dashboard-grid">
          <div className="metric-card">
            <h3>{Number(dashboard?.totalProducts || 0)}</h3>
            <p>Total Products</p>
          </div>

          <div className="metric-card">
            <h3>{Number(dashboard?.totalSales || 0)}</h3>
            <p>Total Sales</p>
          </div>

          <div className="metric-card">
            <h3>${Number(dashboard?.totalRevenue || 0).toFixed(2)}</h3>
            <p>Total Revenue</p>
          </div>

          <div className="metric-card">
            <h3>${Number(dashboard?.totalCost || 0).toFixed(2)}</h3>
            <p>Total Cost</p>
          </div>

          <div className="metric-card">
            <h3>${Number(dashboard?.totalProfit || 0).toFixed(2)}</h3>
            <p>Total Profit</p>
          </div>

          <div className="metric-card">
            <h3>{safeLowStock.length}</h3>
            <p>Low Stock Items</p>
          </div>

          <div className="metric-card">
            <h3>{safeExpired.length}</h3>
            <p>Expired Items</p>
          </div>

          <div className="metric-card">
            <h3>{safeExpiringSoon.length}</h3>
            <p>Expiring Soon</p>
          </div>
        </div>

        <div className="table-wrapper" style={{ marginTop: "30px" }}>
          <h2>AI Insights</h2>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Insight</th>
              </tr>
            </thead>
            <tbody>
              {aiInsights.map((item, index) => (
                <tr key={index}>
                  <td>{item}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="table-wrapper" style={{ marginTop: "30px" }}>
          <h2>Low Stock Products</h2>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Stock</th>
              </tr>
            </thead>
            <tbody>
              {safeLowStock.length > 0 ? (
                safeLowStock.map((product) => (
                  <tr key={product.id}>
                    <td>{product.name}</td>
                    <td>{product.category}</td>
                    <td>{product.stock}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3">No low stock items.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="table-wrapper" style={{ marginTop: "30px" }}>
          <h2>Expired Products</h2>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Expiry Date</th>
              </tr>
            </thead>
            <tbody>
              {safeExpired.length > 0 ? (
                safeExpired.map((product) => (
                  <tr key={product.id}>
                    <td>{product.name}</td>
                    <td>{product.category}</td>
                    <td>{product.expiryDate}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3">No expired products.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="table-wrapper" style={{ marginTop: "30px" }}>
          <h2>Expiring Within 7 Days</h2>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Expiry Date</th>
              </tr>
            </thead>
            <tbody>
              {safeExpiringSoon.length > 0 ? (
                safeExpiringSoon.map((product) => (
                  <tr key={product.id}>
                    <td>{product.name}</td>
                    <td>{product.category}</td>
                    <td>{product.expiryDate}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3">No products expiring soon.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="table-wrapper" style={{ marginTop: "30px" }}>
          <h2>Top Selling Products</h2>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Total Sold</th>
                <th>Revenue</th>
                <th>Profit</th>
              </tr>
            </thead>
            <tbody>
              {safeTopSelling.length > 0 ? (
                safeTopSelling.map((item, index) => (
                  <tr key={index}>
                    <td>{item.name}</td>
                    <td>{item.totalSold}</td>
                    <td>${Number(item.revenue || 0).toFixed(2)}</td>
                    <td>${Number(item.profit || 0).toFixed(2)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4">No sales data yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (showSales) {
    return (
      <div className="admin-page">
        <div className="admin-header">
          <h1>SlopChest Sales Logger</h1>
          <button className="secondary-btn" onClick={() => setShowSales(false)}>
            Back
          </button>
        </div>

        <ShipSelector />

        <form className="waitlist-form" onSubmit={handleSalesSubmit}>
          <select
            name="productId"
            value={salesForm.productId}
            onChange={handleSalesChange}
            required
            className="inventory-select"
          >
            <option value="">Select product</option>
            {safeProducts.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} (Stock: {product.stock})
              </option>
            ))}
          </select>

          <input
            type="number"
            name="quantity"
            placeholder="Quantity sold"
            value={salesForm.quantity}
            onChange={handleSalesChange}
            required
          />

          <input
            type="text"
            name="note"
            placeholder="Note"
            value={salesForm.note}
            onChange={handleSalesChange}
          />

          <button type="submit" className="primary-btn">Record Sale</button>
        </form>

        <div className="table-wrapper" style={{ marginTop: "30px" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Unit Cost</th>
                <th>Total Amount</th>
                <th>Total Cost</th>
                <th>Profit</th>
                <th>Note</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {safeSales.length > 0 ? (
                safeSales.map((sale) => (
                  <tr key={sale.id}>
                    <td>{sale.productName}</td>
                    <td>{sale.quantity}</td>
                    <td>{sale.unitPrice}</td>
                    <td>{sale.unitCost}</td>
                    <td>{sale.totalAmount}</td>
                    <td>{sale.totalCost}</td>
                    <td>{sale.profit}</td>
                    <td>{sale.note}</td>
                    <td>{sale.createdAt}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9">No sales yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (showProducts) {
    return (
      <div className="admin-page">
        <div className="admin-header">
          <h1>SlopChest Products Manager</h1>
          <button className="secondary-btn" onClick={() => setShowProducts(false)}>
            Back
          </button>
        </div>

        <ShipSelector />

        <form className="waitlist-form" onSubmit={handleProductSubmit}>
          <select
            name="shipId"
            value={productForm.shipId}
            onChange={handleProductChange}
            required
            className="inventory-select"
          >
            <option value="">Select ship</option>
            {safeShips.map((ship) => (
              <option key={ship.id} value={ship.id}>
                {ship.name}
              </option>
            ))}
          </select>

          <input
            type="text"
            name="name"
            placeholder="Product name"
            value={productForm.name}
            onChange={handleProductChange}
            required
          />
          <input
            type="text"
            name="category"
            placeholder="Category"
            value={productForm.category}
            onChange={handleProductChange}
          />
          <input
            type="number"
            step="0.01"
            name="purchasePrice"
            placeholder="Purchase price"
            value={productForm.purchasePrice}
            onChange={handleProductChange}
          />
          <input
            type="number"
            step="0.01"
            name="salePrice"
            placeholder="Sale price"
            value={productForm.salePrice}
            onChange={handleProductChange}
          />
          <input
            type="number"
            name="stock"
            placeholder="Stock quantity"
            value={productForm.stock}
            onChange={handleProductChange}
          />
          <input
            type="date"
            name="expiryDate"
            value={productForm.expiryDate}
            onChange={handleProductChange}
          />

          <button type="submit" className="primary-btn">Add Product</button>
        </form>

        <form className="waitlist-form" onSubmit={handleInventorySubmit} style={{ marginTop: "30px" }}>
          <select
            name="productId"
            value={inventoryForm.productId}
            onChange={handleInventoryChange}
            required
            className="inventory-select"
          >
            <option value="">Select product</option>
            {safeProducts.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>

          <select
            name="type"
            value={inventoryForm.type}
            onChange={handleInventoryChange}
            className="inventory-select"
          >
            <option value="in">Stock In</option>
            <option value="out">Stock Out</option>
          </select>

          <input
            type="number"
            name="quantity"
            placeholder="Quantity"
            value={inventoryForm.quantity}
            onChange={handleInventoryChange}
            required
          />

          <input
            type="text"
            name="note"
            placeholder="Reason / note"
            value={inventoryForm.note}
            onChange={handleInventoryChange}
          />

          <button type="submit" className="primary-btn">Save Movement</button>
        </form>

        <div className="table-wrapper" style={{ marginTop: "30px" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Ship ID</th>
                <th>Category</th>
                <th>Purchase Price</th>
                <th>Sale Price</th>
                <th>Stock</th>
                <th>Expiry</th>
              </tr>
            </thead>
            <tbody>
              {safeProducts.length > 0 ? (
                safeProducts.map((product) => (
                  <tr key={product.id}>
                    <td>{product.name}</td>
                    <td>{product.shipId}</td>
                    <td>{product.category}</td>
                    <td>{product.purchasePrice}</td>
                    <td>{product.salePrice}</td>
                    <td>{product.stock}</td>
                    <td>{product.expiryDate || "-"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7">No products yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="table-wrapper" style={{ marginTop: "30px" }}>
          <h2>Inventory Movements</h2>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Note</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {safeMovements.length > 0 ? (
                safeMovements.map((movement) => (
                  <tr key={movement.id}>
                    <td>{movement.productName}</td>
                    <td>{movement.type}</td>
                    <td>{movement.quantity}</td>
                    <td>{movement.note}</td>
                    <td>{movement.createdAt}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5">No inventory movements yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (showAdmin) {
    return (
      <div className="admin-page">
        <div className="admin-header">
          <h1>SlopChest Admin Dashboard</h1>
          <button className="secondary-btn" onClick={() => setShowAdmin(false)}>
            Back to Landing Page
          </button>
        </div>

        <div className="admin-summary">
          <div className="metric-card">
            <h3>{safeEntries.length}</h3>
            <p>Total waitlist entries</p>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Company</th>
                <th>Email</th>
                <th>Fleet Size</th>
                <th>Role</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {safeEntries.length > 0 ? (
                safeEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.fullName}</td>
                    <td>{entry.company}</td>
                    <td>{entry.email}</td>
                    <td>{entry.fleetSize}</td>
                    <td>{entry.role}</td>
                    <td>{entry.note}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6">No waitlist entries yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="hero">
        <nav className="nav">
          <div className="logo">Voyager Maritime Intelligence</div>
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#why-now">Why Now</a>
            <a href="#waitlist">Waitlist</a>

            <button className="nav-admin-btn" onClick={() => setShowAdmin(true)}>
              Admin
            </button>

            <button className="nav-admin-btn" onClick={() => setShowShips(true)}>
              Ships
            </button>

            <button className="nav-admin-btn" onClick={() => setShowDashboard(true)}>
              Dashboard
            </button>

            <button className="nav-admin-btn" onClick={() => setShowProducts(true)}>
              Products
            </button>

            <button className="nav-admin-btn" onClick={() => setShowSales(true)}>
              Sales
            </button>
          </div>
        </nav>

        <div className="hero-content">
          <p className="eyebrow">Built for modern fleets</p>
          <h1>SlopChest Fleet Mode</h1>
          <h2>Modern onboard inventory and crew-store intelligence for shipping companies</h2>
          <p className="hero-text">
            Manage products, sales, inventory, profit, expiry risk, and analytics by ship — then roll everything up into a fleet-wide system.
          </p>

          <div className="hero-buttons">
            <a className="primary-btn" href="#waitlist">Join the Waitlist</a>
            <a className="secondary-btn" href="#waitlist">Book Early Access</a>
          </div>
        </div>
      </header>

      <main>
        <section className="metrics">
          <div className="metric-card">
            <h3>Fleet</h3>
            <p>Multi-ship visibility</p>
          </div>
          <div className="metric-card">
            <h3>Profit</h3>
            <p>Revenue, cost, and margin control</p>
          </div>
          <div className="metric-card">
            <h3>Expiry</h3>
            <p>Reduce waste before products expire</p>
          </div>
          <div className="metric-card">
            <h3>Insights</h3>
            <p>Operational alerts for better decisions</p>
          </div>
        </section>

        <section id="features" className="section">
          <h2>What Fleet Mode solves</h2>
          <div className="grid">
            <div className="card">
              <h3>Ship-by-ship inventory</h3>
              <p>Separate operational data for each vessel while keeping it inside one company system.</p>
            </div>
            <div className="card">
              <h3>Profit visibility</h3>
              <p>Measure revenue, cost, and profit by ship and by product.</p>
            </div>
            <div className="card">
              <h3>Expiry intelligence</h3>
              <p>Track expired and soon-to-expire products before they become losses.</p>
            </div>
          </div>
        </section>

        <section id="why-now" className="section alt">
          <h2>Why now</h2>
          <p>
            Maritime operations still rely on fragmented spreadsheets and inconsistent shipboard tracking. Fleet Mode creates a scalable foundation for a real maritime SaaS platform with commercial intelligence built in.
          </p>
        </section>

        <section id="waitlist" className="section">
          <h2>Join the waitlist</h2>

          <form className="waitlist-form" onSubmit={handleSubmit}>
            <input
              type="text"
              name="fullName"
              placeholder="Full name"
              value={formData.fullName}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="company"
              placeholder="Company"
              value={formData.company}
              onChange={handleChange}
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="fleetSize"
              placeholder="Fleet size"
              value={formData.fleetSize}
              onChange={handleChange}
            />
            <input
              type="text"
              name="role"
              placeholder="Role"
              value={formData.role}
              onChange={handleChange}
            />
            <textarea
              name="note"
              placeholder="Optional note"
              rows="4"
              value={formData.note}
              onChange={handleChange}
            ></textarea>

            <button type="submit" className="primary-btn">Join the Waitlist</button>
          </form>

          {message && <p style={{ marginTop: "16px", color: "#77b7ff" }}>{message}</p>}
        </section>
      </main>

      <footer className="footer">
        <p>Voyager Maritime Intelligence — SlopChest Fleet Mode</p>
        <p>Built for modern fleets.</p>
      </footer>
    </div>
  );
}

export default App;