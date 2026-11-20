
import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

const API_URL = "http://localhost:5000/api";

const fruitTypes = ["Apples", "Bananas", "Oranges", "Mangoes", "Grapes"];
const boxSizes = ["Small", "Medium", "Large"];
const LOW_STOCK_LIMIT = 10;

const sellingPrices = {
  Small: 50,
  Medium: 100,
  Large: 150,
};

const provinces = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Western Cape",
];

const initialData = {
  Suppliers: [
    { id: 1, name: "Fresh Produce SA", contact: "John Smith", phone: "0712345678", address: "Johannesburg, South Africa", province: "Gauteng" },
    { id: 2, name: "Green Valley Farms", contact: "Mary Jones", phone: "0723456789", address: "Pretoria, South Africa", province: "Gauteng" },
  ],
  Fruits: [
    { id: 1, name: "Apples", description: "Fresh red apples", status: "Active" },
    { id: 2, name: "Bananas", description: "Fresh yellow bananas", status: "Active" },
    { id: 3, name: "Oranges", description: "Fresh oranges", status: "Active" },
    { id: 4, name: "Mangoes", description: "Fresh mangoes", status: "Active" },
    { id: 5, name: "Grapes", description: "Fresh grapes", status: "Active" },
  ],
  Vendors: [],
  Stock: fruitTypes.flatMap((fruit, fruitIndex) =>
    boxSizes.map((size, sizeIndex) => {
      const startingQuantities = {
        "Apples-Small": 40,
        "Apples-Medium": 25,
        "Bananas-Large": 30,
        "Oranges-Medium": 18,
      };

      return {
        id: fruitIndex * boxSizes.length + sizeIndex + 1,
        fruit,
        size,
        quantity: startingQuantities[`${fruit}-${size}`] || 0,
      };
    })
  ),
  Purchases: [
    {
      id: 1,
      supplier: "Fresh Produce SA",
      date: "2026-11-10",
      items: [
        { fruit: "Apples", size: "Small", quantity: 40, price: 120 },
      ],
    },
  ],
  Sales: [
    {
      id: 1,
      vendor: "Maseru Fresh Market",
      date: "2026-11-12",
      items: [
        { fruit: "Bananas", size: "Large", quantity: 10, price: 150 },
      ],
    },
  ],
  Payments: [
    {
      id: 1,
      saleId: 1,
      reference: "SALE-001",
      vendor: "Maseru Fresh Market",
      date: "2026-11-12",
      amount: 200,
      method: "Cash",
    },
  ],
  Reports: [],
};

const formFields = {
  Suppliers: [
    ["name", "Supplier Name", "text"],
    ["contact", "Contact Person", "text"],
    ["phone", "Phone Number", "tel"],
    ["address", "Address", "text"],
    ["province", "South African Province", "select", provinces],
  ],
  Fruits: [
    ["name", "Fruit Name", "text"],
    ["description", "Description", "text"],
    ["status", "Status", "select", ["Active", "Inactive"]],
  ],
  Vendors: [
    ["name", "Vendor Name", "text"],
    ["phone", "Phone Number", "tel"],
    ["address", "Location", "text"],
    ["registrationDate", "Registration Date", "date"],
  ],
  Stock: [
    ["fruit", "Select Fruit", "select", "Fruits"],
    ["size", "Box Size", "select", boxSizes],
    ["quantity", "Number of Boxes to Add", "number"],
  ],
  Payments: [
    ["saleId", "Select Sale", "select", "Sales"],
    ["date", "Payment Date", "date"],
    ["amount", "Amount Paid (LSL)", "number"],
    ["method", "Payment Method", "select", ["Cash", "Mobile Money", "Outstanding/Credit"]],
  ],
};

const tableFields = {
  Suppliers: ["name", "contact", "phone", "address", "province"],
  Fruits: ["name", "description", "status"],
  Vendors: ["name", "phone", "address", "registrationDate", "outstandingBalance"],
  Stock: ["fruit", "size", "quantity", "stockStatus"],
  Purchases: ["supplier", "date", "itemsSummary", "total"],
  Sales: ["reference", "vendor", "date", "itemsSummary", "total", "amountPaid", "balance", "status"],
  Payments: ["reference", "vendor", "date", "amount", "method"],
};

const headings = {
  Suppliers: ["Supplier Name", "Contact Person", "Phone", "Address", "Province"],
  Fruits: ["Fruit Name", "Description", "Status"],
  Vendors: ["Vendor Name", "Phone", "Location", "Registration Date", "Outstanding Balance"],
  Stock: ["Fruit", "Box Size", "Boxes Available", "Stock Status"],
  Purchases: ["Supplier", "Date", "Items Purchased", "Purchase Total"],
  Sales: ["Sale Reference", "Vendor", "Date", "Items Sold", "Sale Total", "Paid", "Balance", "Status"],
  Payments: ["Sale Reference", "Vendor", "Date", "Amount Paid", "Method"],
};

const pageInfo = {
  Dashboard: ["Business overview", "Monitor your farm distribution activities."],
  Suppliers: ["Suppliers", "Manage the businesses that supply your fruits."],
  Fruits: ["Fruits", "Manage the types of fruits available in your business."],
  Vendors: ["Vendors", "Manage your customers and fruit retailers."],
  Stock: ["Stock Management", "Monitor the number of fruit boxes available."],
  Purchases: ["Purchases", "Record fruit boxes purchased from suppliers."],
  Sales: ["Sales", "Record fruit boxes sold to vendors."],
  Payments: ["Payments", "Manage customer payments and outstanding amounts."],
  Reports: ["Reports", "View a summary of your distribution activities."],
};

function saleReference(saleId) {
  return `SALE-${String(saleId).padStart(3, "0")}`;
}

function getItemsTotal(items = []) {
  return items.reduce(
    (sum, item) =>
      sum + Number(item.quantity || 0) * Number(item.price || 0),
    0
  );
}

function getItemsSummary(items = []) {
  return items
    .map((item) => `${item.fruit} (${item.size}) x ${item.quantity}`)
    .join(", ");
}

function getTransactionItems(record) {
  if (record.items) return record.items;

  if (record.fruit && record.size) {
    return [{
      fruit: record.fruit,
      size: record.size,
      quantity: record.quantity,
      price: record.price,
    }];
  }

  return [];
}

function updateSalePaymentInfo(sales, payments) {
  return sales.map((sale) => {
    const items = getTransactionItems(sale);
    const total = Number(sale.total ?? getItemsTotal(items));

    const amountPaid = payments
      .filter((payment) => Number(payment.saleId) === Number(sale.id))
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

    const balance = Math.max(total - amountPaid, 0);

    let status = "UNPAID";

    if (amountPaid >= total && total > 0) {
      status = "PAID";
    } else if (amountPaid > 0) {
      status = "PARTIALLY_PAID";
    }

    return {
      ...sale,
      items,
      itemsSummary: getItemsSummary(items),
      total,
      amountPaid,
      balance,
      status,
      reference: saleReference(sale.id),
    };
  });
}

function App() {
  const [activePage, setActivePage] = useState("Dashboard");

  const [records, setRecords] = useState(() => {
    const purchases = initialData.Purchases.map((purchase) => {
      const items = getTransactionItems(purchase);
      return {
        ...purchase,
        items,
        itemsSummary: getItemsSummary(items),
        total: getItemsTotal(items),
      };
    });

    return {
      ...initialData,
      Purchases: purchases,
      Sales: updateSalePaymentInfo(initialData.Sales, initialData.Payments),
    };
  });

  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [viewingRecord, setViewingRecord] = useState(null);
  const [formData, setFormData] = useState({});
  const [search, setSearch] = useState("");

  const [reportStartDate, setReportStartDate] = useState("");
  const [reportEndDate, setReportEndDate] = useState("");

  const loadFruits = async () => {
    try {
      const response = await axios.get(`${API_URL}/fruits`);

      if (response.data.success) {
        const databaseFruits = response.data.data.map((fruit) => ({
          id: fruit.FruitID,
          databaseId: fruit.FruitID,
          name: fruit.FruitName,
          description: fruit.Description || "",
          status: fruit.Status,
        }));

        const mergedFruits = initialData.Fruits.map((defaultFruit) => {
          const databaseFruit = databaseFruits.find(
            (fruit) => fruit.name.toLowerCase() === defaultFruit.name.toLowerCase()
          );

          return databaseFruit || defaultFruit;
        });

        databaseFruits.forEach((databaseFruit) => {
          const alreadyIncluded = mergedFruits.some(
            (fruit) => fruit.name.toLowerCase() === databaseFruit.name.toLowerCase()
          );

          if (!alreadyIncluded) {
            mergedFruits.push(databaseFruit);
          }
        });

        setRecords((previous) => ({
          ...previous,
          Fruits: mergedFruits,
        }));
      }
    } catch (error) {
      console.error("Error loading fruits:", error);
      alert("Could not load fruits from the database. Please make sure the backend server is running.");
    }
  };

  const loadSuppliers = async () => {
    try {
      const response = await axios.get(`${API_URL}/suppliers`);

      if (response.data.success) {
        const databaseSuppliers = response.data.data.map((supplier) => ({
          id: supplier.SupplierID,
          name: supplier.BusinessName,
          contact: supplier.ContactPerson,
          phone: supplier.Phone,
          address: supplier.Address,
          province: supplier.Province,
        }));

        setRecords((previous) => ({
          ...previous,
          Suppliers: databaseSuppliers,
        }));
      }
    } catch (error) {
      console.error("Error loading suppliers:", error);
      alert("Could not load suppliers from the database. Please make sure the backend server is running.");
    }
  };

  const loadVendors = async () => {
    try {
      const response = await axios.get(`${API_URL}/vendors`);

      if (response.data.success && Array.isArray(response.data.data)) {
        const databaseVendors = response.data.data.map((vendor) => {
          const dateValue = vendor.RegistrationDate;

          let registrationDate = "";

          if (dateValue) {
            const date = new Date(dateValue);

            registrationDate = [
              date.getUTCFullYear(),
              String(date.getUTCMonth() + 1).padStart(2, "0"),
              String(date.getUTCDate()).padStart(2, "0"),
            ].join("-");
          }

          return {
            id: vendor.VendorID,
            name: vendor.VendorName,
            phone: vendor.PhoneNumber,
            address: vendor.Location,
            registrationDate,
          };
        });

        setRecords((previous) => ({
          ...previous,
          Vendors: databaseVendors,
        }));

        console.log("Vendors loaded successfully:", databaseVendors);
      } else {
        console.error("Unexpected vendor response:", response.data);
      }
    } catch (error) {
      console.error("Error loading vendors:", error.response?.data || error);
      alert("Could not load vendors from the database. Please check that the backend server is running.");
    }
  };

  const loadStock = async () => {
    try {
      const response = await axios.get(`${API_URL}/stock`);

      if (response.data.success && Array.isArray(response.data.data)) {
        const databaseStock = response.data.data.reduce((stock, item) => {
          const fruit = item.fruit ?? item.FruitName;
          const size = item.size ?? item.PackagingSize;
          const quantity = Number(item.quantity ?? item.AvailableQuantity ?? 0);
          const existing = stock.find(
            (entry) => entry.fruit === fruit && entry.size === size
          );

          if (existing) {
            existing.quantity += quantity;
          } else {
            stock.push({
              id: item.id ?? item.StockID,
              fruit,
              size,
              quantity,
            });
          }

          return stock;
        }, []);

        setRecords((previous) => ({
          ...previous,
          Stock: databaseStock,
        }));
      }
    } catch (error) {
      console.error("Error loading stock:", error.response?.data || error);
      alert("Could not load stock from the database. Please check that the backend server is running.");
    }
  };

  const loadPurchases = async () => {
    try {
      const response = await axios.get(`${API_URL}/purchases`);

      if (response.data.success && Array.isArray(response.data.data)) {
        const databasePurchases = await Promise.all(
          response.data.data.map(async (purchase) => {
            const detailsResponse = await axios.get(
              `${API_URL}/purchases/${purchase.id}`
            );

            const items = (detailsResponse.data.data || []).map((item) => ({
              fruit: item.fruit,
              fruitID: item.fruitID,
              size: item.size,
              quantity: Number(item.quantity),
              price: Number(item.unitCost),
            }));

            return {
              id: purchase.id,
              supplierID: purchase.supplierID,
              supplier: purchase.supplier,
              date: purchase.purchaseDate
                ? String(purchase.purchaseDate).slice(0, 10)
                : "",
              items,
              itemsSummary: getItemsSummary(items),
              total: Number(purchase.totalAmount || 0),
            };
          })
        );

        setRecords((previous) => ({
          ...previous,
          Purchases: databasePurchases,
        }));
      }
    } catch (error) {
      console.error("Error loading purchases:", error.response?.data || error);
      alert("Could not load purchases from the database. Please check that the backend server is running.");
    }
  };

  const loadSales = async () => {
    try {
      const response = await axios.get(`${API_URL}/sales`);

      if (response.data.success && Array.isArray(response.data.data)) {
        const databaseSales = await Promise.all(
          response.data.data.map(async (sale) => {
            const detailsResponse = await axios.get(
              `${API_URL}/sales/${sale.id}`
            );

            const saleDetails = detailsResponse.data.data?.items || [];

            const items = saleDetails.map((item) => ({
              fruit: item.fruit,
              fruitID: item.fruitID,
              size: item.size,
              quantity: Number(item.quantity),
              price: Number(item.unitPrice),
            }));

            return {
              id: sale.id,
              vendorID: sale.vendorID,
              vendor: sale.vendor,
              date: sale.saleDate ? String(sale.saleDate).slice(0, 10) : "",
              paymentStatus: sale.paymentStatus,
              items,
              itemsSummary: getItemsSummary(items),
              total: Number(sale.totalAmount || getItemsTotal(items)),
            };
          })
        );

        // Load payment records from MySQL instead of clearing them.
        const paymentResponse = await axios.get(`${API_URL}/payments`);

        const databasePayments = paymentResponse.data.data.map((payment) => ({
          id: Number(payment.id),
          saleId: Number(payment.saleId),
          reference: saleReference(payment.saleId),
          vendor: payment.vendor,
          date: payment.date ? String(payment.date).slice(0, 10) : "",
          amount: Number(payment.amount || 0),
          method: payment.method,
        }));

        setRecords((previous) => ({
          ...previous,
          Sales: updateSalePaymentInfo(databaseSales, databasePayments),
          Payments: databasePayments,
        }));
      }
    } catch (error) {
      console.error("Error loading sales and payments:", error.response?.data || error);
      alert("Could not load sales or payments from the database. Please check that the backend server is running.");
    }
  };

  useEffect(() => {
    loadFruits();
    loadSuppliers();
    loadVendors();
    loadStock();
    loadPurchases();
    loadSales();
  }, []);

  useEffect(() => {
    if (activePage === "Vendors") {
      loadVendors();
    }
  }, [activePage]);

  const activeFruitTypes = records.Fruits
    .filter((fruit) => fruit.status === "Active")
    .map((fruit) => fruit.name);

  const openForm = (record = null) => {
    if (activePage === "Purchases" && record) {
      alert("Purchase editing is not connected yet. You can view existing purchases and add new purchases.");
      return;
    }

    setEditingRecord(record);

    if (["Sales", "Purchases"].includes(activePage)) {
      const oldItems = record
        ? getTransactionItems(record)
        : [{ fruit: "", size: "", quantity: "", price: "" }];

      setFormData({
        ...(record || {}),
        items: oldItems.map((item) => ({ ...item })),
      });
    } else {
      setFormData(record ? { ...record } : {});
    }

    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingRecord(null);
    setFormData({});
  };

  const updateField = (name, value) => {
    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const addItem = () => {
    setFormData((previous) => ({
      ...previous,
      items: [
        ...(previous.items || []),
        { fruit: "", size: "", quantity: "", price: "" },
      ],
    }));
  };

  const removeItem = (index) => {
    setFormData((previous) => ({
      ...previous,
      items: previous.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const updateItem = (index, name, value) => {
    setFormData((previous) => ({
      ...previous,
      items: previous.items.map((item, itemIndex) => {
        if (itemIndex !== index) return item;

        const updatedItem = { ...item, [name]: value };

        if (activePage === "Sales" && name === "size") {
          updatedItem.price = sellingPrices[value] || "";
        }

        return updatedItem;
      }),
    }));
  };

  const findStockIndex = (stock, fruit, size) => {
    return stock.findIndex(
      (item) => item.fruit === fruit && item.size === size
    );
  };

  const changeStock = (stock, fruit, size, amount) => {
    const index = findStockIndex(stock, fruit, size);

    if (index === -1) {
      if (amount > 0) {
        stock.push({
          id: Date.now() + Math.random(),
          fruit,
          size,
          quantity: amount,
        });
      }
      return;
    }

    stock[index] = {
      ...stock[index],
      quantity: Number(stock[index].quantity) + amount,
    };
  };

  const changeTransactionStock = (stock, items, multiplier) => {
    items.forEach((item) => {
      changeStock(
        stock,
        item.fruit,
        item.size,
        Number(item.quantity) * multiplier
      );
    });
  };

  const getAvailableForSale = (fruit, size) => {
    const stockItem = records.Stock.find(
      (item) => item.fruit === fruit && item.size === size
    );

    let available = Number(stockItem?.quantity || 0);

    if (editingRecord) {
      getTransactionItems(editingRecord).forEach((oldItem) => {
        if (oldItem.fruit === fruit && oldItem.size === size) {
          available += Number(oldItem.quantity);
        }
      });
    }

    return available;
  };

  const saveRecord = async (event) => {
    event.preventDefault();

    const cleanedData = { ...formData };
    delete cleanedData.outstandingBalance;
    delete cleanedData.stockStatus;

    if (activePage === "Suppliers") {
      if (
        !cleanedData.name?.trim() ||
        !cleanedData.contact?.trim() ||
        !cleanedData.phone?.trim() ||
        !cleanedData.address?.trim() ||
        !cleanedData.province
      ) {
        alert("Please fill in all supplier fields.");
        return;
      }

      try {
        const supplierData = {
          name: cleanedData.name.trim(),
          contactPerson: cleanedData.contact.trim(),
          phone: cleanedData.phone.trim(),
          address: cleanedData.address.trim(),
          province: cleanedData.province,
        };

        if (editingRecord) {
          await axios.put(
            `${API_URL}/suppliers/${editingRecord.id}`,
            supplierData
          );
        } else {
          await axios.post(`${API_URL}/suppliers`, supplierData);
        }

        await loadSuppliers();
        closeForm();
        alert("Supplier saved successfully.");
        return;
      } catch (error) {
        console.error("Error saving supplier:", error);
        alert(
          error.response?.data?.message ||
          "Could not save the supplier. Please check the information and try again."
        );
        return;
      }
    }

    if (activePage === "Fruits") {
      if (!cleanedData.name || !cleanedData.name.trim()) {
        alert("Please enter a fruit name.");
        return;
      }

      if (!cleanedData.status) {
        alert("Please select a fruit status.");
        return;
      }

      if (!["Active", "Inactive"].includes(cleanedData.status)) {
        alert("Please select a valid fruit status.");
        return;
      }

      try {
        const fruitData = {
          name: cleanedData.name.trim(),
          description: cleanedData.description || "",
          status: cleanedData.status,
        };

        if (editingRecord) {
          await axios.put(`${API_URL}/fruits/${editingRecord.id}`, fruitData);
        } else {
          await axios.post(`${API_URL}/fruits`, fruitData);
        }

        await loadFruits();
        closeForm();
        alert("Fruit saved successfully.");
        return;
      } catch (error) {
        console.error("Error saving fruit:", error);
        alert(error.response?.data?.message || "Could not save the fruit. Please try again.");
        return;
      }
    }

    if (activePage === "Vendors") {
      if (
        !cleanedData.name?.trim() ||
        !cleanedData.phone?.trim() ||
        !cleanedData.address?.trim() ||
        !cleanedData.registrationDate
      ) {
        alert("Please fill in all vendor fields.");
        return;
      }

      try {
        const vendorData = {
          name: cleanedData.name.trim(),
          phone: cleanedData.phone.trim(),
          location: cleanedData.address.trim(),
          registrationDate: cleanedData.registrationDate,
        };

        if (editingRecord) {
          await axios.put(
            `${API_URL}/vendors/${editingRecord.id}`,
            vendorData
          );
        } else {
          await axios.post(`${API_URL}/vendors`, vendorData);
        }

        await loadVendors();
        closeForm();
        alert("Vendor saved successfully.");
        return;
      } catch (error) {
        console.error("Error saving vendor:", error.response?.data || error);
        alert(
          error.response?.data?.message ||
          "Could not save the vendor. Please check the information and try again."
        );
        return;
      }
    }

    if (["Sales", "Purchases"].includes(activePage)) {
      const items = (cleanedData.items || []).map((item) => ({
        fruit: item.fruit,
        size: item.size,
        quantity: Number(item.quantity),
        price:
          activePage === "Sales"
            ? Number(sellingPrices[item.size] || 0)
            : Number(item.price),
      }));

      if (items.length === 0) {
        alert("Please add at least one fruit item.");
        return;
      }

      for (const item of items) {
        if (!item.fruit || !item.size) {
          alert("Please select a fruit and box size for every item.");
          return;
        }

        if (!activeFruitTypes.includes(item.fruit)) {
          alert("You cannot use an inactive fruit in a transaction.");
          return;
        }

        if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
          alert("Every item must have a valid quantity greater than zero.");
          return;
        }

        if (
          activePage === "Purchases" &&
          (!Number.isFinite(item.price) || item.price <= 0)
        ) {
          alert("Enter a valid purchase cost for every item.");
          return;
        }
      }

      cleanedData.items = items;

      if (activePage === "Sales") {
        const requested = {};

        items.forEach((item) => {
          const key = `${item.fruit}-${item.size}`;
          requested[key] = (requested[key] || 0) + item.quantity;
        });

        for (const key of Object.keys(requested)) {
          const [fruit, size] = key.split("-");
          const available = getAvailableForSale(fruit, size);

          if (requested[key] > available) {
            alert(
              `Not enough stock! You requested ${requested[key]} boxes of ${fruit} (${size}), but only ${available} are available.`
            );
            return;
          }
        }

        const newSaleTotal = getItemsTotal(items);

        const alreadyPaid = records.Payments
          .filter(
            (payment) =>
              Number(payment.saleId) === Number(editingRecord?.id)
          )
          .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

        if (editingRecord && newSaleTotal < alreadyPaid) {
          alert(
            "This sale cannot be reduced below the amount already paid. Adjust the payments first."
          );
          return;
        }
      }

      if (activePage === "Purchases" && editingRecord) {
        const oldItems = getTransactionItems(editingRecord);
        const availableAfterRemovingOldPurchase = [...records.Stock];

        changeTransactionStock(
          availableAfterRemovingOldPurchase,
          oldItems,
          -1
        );

        for (const item of oldItems) {
          const stockItem = availableAfterRemovingOldPurchase.find(
            (stock) =>
              stock.fruit === item.fruit && stock.size === item.size
          );

          if (Number(stockItem?.quantity || 0) < 0) {
            alert(
              "This purchase cannot be changed because some of its stock has already been used."
            );
            return;
          }
        }
      }

      cleanedData.itemsSummary = getItemsSummary(items);
      cleanedData.total = getItemsTotal(items);

      if (activePage === "Sales") {
        if (!cleanedData.vendor || !cleanedData.date) {
          alert("Please select a vendor and enter the sale date.");
          return;
        }

        const selectedVendor = records.Vendors.find(
          (vendor) => vendor.name === cleanedData.vendor
        );

        if (!selectedVendor) {
          alert("The selected vendor could not be found. Please refresh the page and try again.");
          return;
        }

        const saleItems = items.map((item) => {
          const selectedFruit = records.Fruits.find(
            (fruit) => fruit.name === item.fruit
          );

          return {
            fruitID: Number(selectedFruit?.databaseId ?? selectedFruit?.id),
            size: item.size,
            quantity: Number(item.quantity),
            unitPrice: Number(item.price),
          };
        });

        if (saleItems.some((item) => !Number.isInteger(item.fruitID) || item.fruitID <= 0)) {
          alert("One or more selected fruits could not be found in the database. Please refresh the page and try again.");
          return;
        }

        try {
          const salePayload = {
            vendorID: Number(selectedVendor.id),
            saleDate: cleanedData.date,
            paymentStatus:
              editingRecord?.paymentStatus === "PARTIALLY_PAID"
                ? "PARTIAL"
                : editingRecord?.paymentStatus || "UNPAID",
            items: saleItems,
          };

          if (editingRecord) {
            await axios.put(`${API_URL}/sales/${editingRecord.id}`, salePayload);
          } else {
            await axios.post(`${API_URL}/sales`, salePayload);
          }

          await loadSales();
          await loadStock();
          closeForm();
          alert(editingRecord
            ? "Sale updated successfully. Stock has been adjusted."
            : "Sale saved successfully. Stock has been updated.");
          return;
        } catch (error) {
          console.error("Error saving sale:", error.response?.data || error);
          alert(
            error.response?.data?.message ||
            "Could not save the sale. Please check the information and available stock, then try again."
          );
          return;
        }
      }

      if (activePage === "Purchases") {
        if (editingRecord) {
          alert("Purchase editing is not connected yet. Existing purchases cannot be changed from this form.");
          return;
        }

        if (!cleanedData.supplier || !cleanedData.date) {
          alert("Please select a supplier and enter the purchase date.");
          return;
        }

        const selectedSupplier = records.Suppliers.find(
          (supplier) => supplier.name === cleanedData.supplier
        );

        if (!selectedSupplier) {
          alert("The selected supplier could not be found. Please refresh the page and try again.");
          return;
        }

        const purchaseItems = items.map((item) => {
          const selectedFruit = records.Fruits.find(
            (fruit) => fruit.name === item.fruit
          );

          return {
            fruitID: Number(selectedFruit?.databaseId),
            size: item.size,
            quantity: Number(item.quantity),
            unitCost: Number(item.price),
          };
        });

        if (purchaseItems.some((item) => !Number.isInteger(item.fruitID) || item.fruitID <= 0)) {
          alert("One or more selected fruits could not be found in the database. Please refresh the page and try again.");
          return;
        }

        try {
          await axios.post(`${API_URL}/purchases`, {
            supplierID: Number(selectedSupplier.id),
            purchaseDate: cleanedData.date,
            items: purchaseItems,
          });

          await loadPurchases();
          await loadStock();
          closeForm();
          alert("Purchase saved successfully. Stock has been updated.");
          return;
        } catch (error) {
          console.error("Error saving purchase:", error.response?.data || error);
          alert(
            error.response?.data?.message ||
            "Could not save the purchase. Please check the information and try again."
          );
          return;
        }
      }
    }

    ["quantity", "price", "amount", "saleId"].forEach((field) => {
      if (cleanedData[field] !== undefined && cleanedData[field] !== "") {
        cleanedData[field] = Number(cleanedData[field]);
      }
    });

    if (activePage === "Stock") {
      if (
        !Number.isInteger(cleanedData.quantity) ||
        cleanedData.quantity <= 0
      ) {
        alert("Please enter a valid number of boxes greater than zero.");
        return;
      }

      if (!cleanedData.fruit || !cleanedData.size) {
        alert("Please select a fruit and box size.");
        return;
      }

      if (!activeFruitTypes.includes(cleanedData.fruit)) {
        alert("You cannot add stock for an inactive fruit.");
        return;
      }
    }

    if (activePage === "Stock") {
      try {
        await axios.post(`${API_URL}/stock`, {
          fruit: cleanedData.fruit,
          size: cleanedData.size,
          quantity: Number(cleanedData.quantity),
        });

        await loadStock();
        closeForm();
        alert("Fruit stock restocked successfully.");
        return;
      } catch (error) {
        console.error("Error restocking fruit:", error.response?.data || error);
        alert(
          error.response?.data?.message ||
          "Could not restock the fruit. Please check the backend server and try again."
        );
        return;
      }
    }

    if (activePage === "Payments") {
      if (!cleanedData.saleId) {
        alert("Please select the sale this payment belongs to.");
        return;
      }

      if (!cleanedData.date) {
        alert("Please enter the payment date.");
        return;
      }

      if (!cleanedData.method) {
        alert("Please select a payment method.");
        return;
      }

      if (!Number.isFinite(Number(cleanedData.amount)) || Number(cleanedData.amount) <= 0) {
        alert("Enter a payment amount greater than zero.");
        return;
      }

      const selectedSale = records.Sales.find(
        (sale) => Number(sale.id) === Number(cleanedData.saleId)
      );

      if (!selectedSale) {
        alert("The selected sale could not be found.");
        return;
      }

      const paymentsForSale = records.Payments.filter(
        (payment) =>
          Number(payment.saleId) === Number(cleanedData.saleId) &&
          Number(payment.id) !== Number(editingRecord?.id)
      );

      const alreadyPaid = paymentsForSale.reduce(
        (sum, payment) => sum + Number(payment.amount || 0),
        0
      );

      const remaining = Number(selectedSale.total || 0) - alreadyPaid;

      if (cleanedData.amount > remaining) {
        alert(
          `This sale has only LSL ${remaining.toLocaleString()} remaining. You cannot record a larger payment.`
        );
        return;
      }

      const paymentPayload = {
        saleId: Number(cleanedData.saleId),
        date: cleanedData.date,
        amount: Number(cleanedData.amount),
        method: cleanedData.method,
      };

      try {
        if (editingRecord) {
          await axios.put(
            `${API_URL}/payments/${editingRecord.id}`,
            paymentPayload
          );
        } else {
          await axios.post(
            `${API_URL}/payments`,
            paymentPayload
          );
        }

        await loadSales();
        closeForm();

        alert(
          editingRecord
            ? "Payment updated successfully."
            : "Payment saved successfully."
        );

        return;
      } catch (error) {
        console.error("Error saving payment:", error.response?.data || error);

        alert(
          error.response?.data?.message ||
          "Could not save the payment. Please check the information and try again."
        );

        return;
      }
    }

    setRecords((previous) => {
      const updatedRecords = { ...previous };
      const stock = [...previous.Stock];

      if (activePage === "Stock") {
        changeStock(
          stock,
          cleanedData.fruit,
          cleanedData.size,
          Number(cleanedData.quantity)
        );

        updatedRecords.Stock = stock;
        return updatedRecords;
      }

      if (activePage === "Sales") {
        if (editingRecord) {
          changeTransactionStock(
            stock,
            getTransactionItems(editingRecord),
            1
          );
        }

        changeTransactionStock(stock, cleanedData.items, -1);
        updatedRecords.Stock = stock;
      }

      if (activePage === "Purchases") {
        if (editingRecord) {
          changeTransactionStock(
            stock,
            getTransactionItems(editingRecord),
            -1
          );
        }

        changeTransactionStock(stock, cleanedData.items, 1);
        updatedRecords.Stock = stock;
      }

      const currentRecords = previous[activePage] || [];
      let savedRecords;

      if (editingRecord) {
        savedRecords = currentRecords.map((item) =>
          item.id === editingRecord.id
            ? { ...cleanedData, id: item.id }
            : item
        );
      } else {
        savedRecords = [
          ...currentRecords,
          { ...cleanedData, id: Date.now() },
        ];
      }

      updatedRecords[activePage] = savedRecords;

      if (activePage === "Sales" || activePage === "Payments") {
        updatedRecords.Sales = updateSalePaymentInfo(
          activePage === "Sales" ? savedRecords : previous.Sales,
          activePage === "Payments" ? savedRecords : previous.Payments
        );
      }

      if (activePage === "Purchases") {
        updatedRecords.Purchases = savedRecords.map((purchase) => ({
          ...purchase,
          itemsSummary: getItemsSummary(purchase.items),
          total: getItemsTotal(purchase.items),
        }));
      }

      return updatedRecords;
    });

    closeForm();
  };

  const deleteRecord = async (record) => {
    if (activePage === "Purchases") {
      alert("Purchase deletion is not connected yet. This record has not been deleted.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this record?")) {
      return;
    }

    if (activePage === "Payments") {
      try {
        await axios.delete(`${API_URL}/payments/${record.id}`);

        await loadSales();

        alert("Payment deleted successfully. The sale balance has been updated.");
      } catch (error) {
        console.error("Error deleting payment:", error.response?.data || error);

        alert(
          error.response?.data?.message ||
          "Could not delete the payment. Please try again."
        );
      }

      return;
    }

    if (activePage === "Sales") {
      if (records.Payments.some((payment) => Number(payment.saleId) === Number(record.id))) {
        alert("This sale has payment records. Remove its payment records first before deleting the sale.");
        return;
      }

      try {
        await axios.delete(`${API_URL}/sales/${record.id}`);
        await loadSales();
        await loadStock();
        alert("Sale deleted successfully. The stock has been returned.");
      } catch (error) {
        console.error("Error deleting sale:", error.response?.data || error);
        alert(error.response?.data?.message || "Could not delete the sale. Please try again.");
      }
      return;
    }

    if (activePage === "Suppliers") {
      try {
        await axios.delete(`${API_URL}/suppliers/${record.id}`);
        await loadSuppliers();
        alert("Supplier deleted successfully.");
      } catch (error) {
        console.error("Error deleting supplier:", error);
        alert(
          error.response?.data?.message ||
          "Could not delete the supplier. Please try again."
        );
      }
      return;
    }

    if (activePage === "Fruits") {
      try {
        await axios.delete(`${API_URL}/fruits/${record.id}`);
        await loadFruits();
        alert("Fruit deleted successfully.");
      } catch (error) {
        console.error("Error deleting fruit:", error);
        alert(error.response?.data?.message || "Could not delete the fruit. Please try again.");
      }
      return;
    }

    if (activePage === "Vendors") {
      try {
        await axios.delete(`${API_URL}/vendors/${record.id}`);
        await loadVendors();
        alert("Vendor deleted successfully.");
      } catch (error) {
        console.error("Error deleting vendor:", error);
        alert(
          error.response?.data?.message ||
          "Could not delete the vendor. Please try again."
        );
      }
      return;
    }

    if (
      activePage === "Sales" &&
      records.Payments.some(
        (payment) => Number(payment.saleId) === Number(record.id)
      )
    ) {
      alert(
        "This sale has payment records. Delete its payments first before deleting the sale."
      );
      return;
    }

    if (activePage === "Purchases") {
      const stockAfterDeletion = [...records.Stock];

      changeTransactionStock(
        stockAfterDeletion,
        getTransactionItems(record),
        -1
      );

      if (stockAfterDeletion.some((item) => item.quantity < 0)) {
        alert(
          "This purchase cannot be deleted because some of its stock has already been used."
        );
        return;
      }
    }

    setRecords((previous) => {
      const updatedRecords = { ...previous };
      const stock = [...previous.Stock];

      if (activePage === "Sales") {
        changeTransactionStock(
          stock,
          getTransactionItems(record),
          1
        );

        updatedRecords.Stock = stock;
      }

      if (activePage === "Purchases") {
        changeTransactionStock(
          stock,
          getTransactionItems(record),
          -1
        );

        updatedRecords.Stock = stock;
      }

      updatedRecords[activePage] = previous[activePage].filter(
        (item) => item.id !== record.id
      );

      if (activePage === "Payments") {
        updatedRecords.Sales = updateSalePaymentInfo(
          previous.Sales,
          updatedRecords.Payments
        );
      }

      return updatedRecords;
    });
  };

  const totalOutstanding = records.Sales.reduce(
    (total, sale) => total + Number(sale.balance || 0),
    0
  );

  const lowStockItems = records.Stock.filter(
    (item) => Number(item.quantity || 0) <= LOW_STOCK_LIMIT
  );

  const getVendorOutstanding = (vendorName) =>
    records.Sales
      .filter((sale) => sale.vendor === vendorName)
      .reduce((total, sale) => total + Number(sale.balance || 0), 0);

  const currentRecords = records[activePage] || [];

  const recordsForDisplay = currentRecords.map((record) => {
    if (activePage === "Vendors") {
      return { ...record, outstandingBalance: getVendorOutstanding(record.name) };
    }

    if (activePage === "Stock") {
      return {
        ...record,
        stockStatus:
          Number(record.quantity || 0) <= LOW_STOCK_LIMIT
            ? "LOW STOCK"
            : "Available",
      };
    }

    return record;
  });

  const filteredRecords = recordsForDisplay.filter((record) =>
    Object.values(record).some((value) =>
      String(value).toLowerCase().includes(search.toLowerCase())
    )
  );

  const totalStock = records.Stock.reduce(
    (total, item) => total + Number(item.quantity || 0),
    0
  );

  const totalSales = records.Sales.reduce(
    (total, sale) => total + Number(sale.total || 0),
    0
  );

  const totalPurchases = records.Purchases.length;
  const totalVendors = records.Vendors.length;

  const renderDashboard = () => (
    <>
      <section className="hero-panel">
        <div>
          <span className="hero-tag">BATLOUNG FARM DISTRIBUTION</span>
          <h2>Manage your farm business with confidence.</h2>
          <p>
            Keep track of your fruits, suppliers, stock, purchases and sales in one place.
          </p>
        </div>

        <div className="hero-decoration">BF</div>
      </section>

      <section className="stats-grid">
        <div className="stat-card">
          <span>Total Stock</span>
          <h2>{totalStock}</h2>
          <p>Boxes currently recorded</p>
        </div>

        <div className="stat-card">
          <span>Total Sales</span>
          <h2>LSL {totalSales.toLocaleString()}</h2>
          <p>Recorded sales value</p>
        </div>

        <div className="stat-card">
          <span>Vendors</span>
          <h2>{totalVendors}</h2>
          <p>Registered vendors</p>
        </div>

        <div className="stat-card">
          <span>Purchases</span>
          <h2>{totalPurchases}</h2>
          <p>Purchase records</p>
        </div>

        <div className="stat-card">
          <span>Outstanding Payments</span>
          <h2>LSL {totalOutstanding.toLocaleString()}</h2>
          <p>Money still owed by vendors</p>
        </div>

        <div className="stat-card">
          <span>Low Stock Items</span>
          <h2>{lowStockItems.length}</h2>
          <p>Items with {LOW_STOCK_LIMIT} boxes or fewer</p>
        </div>
      </section>

      <section className="lower-grid">
        <div className="panel">
          <div className="panel-heading">
            <div>
              <h3>Inventory Snapshot</h3>
              <p>Current stock by fruit and size</p>
            </div>

            <button
              className="text-button"
              onClick={() => setActivePage("Stock")}
            >
              View stock
            </button>
          </div>

          <div className="simple-list">
            {records.Stock.map((item) => (
              <div className="activity-item" key={item.id}>
                <div>
                  <strong>{item.fruit}</strong>
                  <p>{item.size} boxes</p>
                </div>

                <div style={{ textAlign: "right" }}>
                  <strong>{item.quantity}</strong>
                  {Number(item.quantity) <= LOW_STOCK_LIMIT && (
                    <p style={{ color: "#b45309", fontWeight: "bold", margin: "4px 0 0" }}>
                      Low stock
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {lowStockItems.length > 0 && (
            <div style={{ marginTop: "16px", padding: "12px", background: "#fff7ed", borderRadius: "8px" }}>
              <strong style={{ color: "#b45309" }}>Low-stock warning</strong>
              <p style={{ margin: "5px 0 0", color: "#7c2d12" }}>
                {lowStockItems.length} fruit and box-size combination(s) need restocking.
              </p>
            </div>
          )}
        </div>

        <div className="panel">
          <div className="panel-heading">
            <div>
              <h3>Quick Access</h3>
              <p>Go directly to a section</p>
            </div>
          </div>

          <div className="shortcut-list">
            {["Suppliers", "Fruits", "Vendors", "Purchases", "Sales", "Payments"].map((page) => (
              <button key={page} onClick={() => setActivePage(page)}>
                <span>{page}</span>
                <span>→</span>
              </button>
            ))}
          </div>
        </div>
      </section>
    </>
  );

  const renderReports = () => {
    const filteredSales = records.Sales.filter((sale) => {
      const saleDate = sale.date || "";

      const afterStartDate =
        !reportStartDate || saleDate >= reportStartDate;

      const beforeEndDate =
        !reportEndDate || saleDate <= reportEndDate;

      return afterStartDate && beforeEndDate;
    });

    const periodRevenue = filteredSales.reduce(
      (total, sale) => total + Number(sale.total || 0),
      0
    );

    const fruitSales = {};

    records.Sales.forEach((sale) => {
      getTransactionItems(sale).forEach((item) => {
        const fruit = item.fruit;
        const quantity = Number(item.quantity || 0);

        fruitSales[fruit] = (fruitSales[fruit] || 0) + quantity;
      });
    });

    const topFiveFruits = Object.entries(fruitSales)
      .map(([fruit, quantity]) => ({ fruit, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    const vendorSales = {};

    records.Sales.forEach((sale) => {
      const vendor = sale.vendor || "Unknown Vendor";

      const boxes = getTransactionItems(sale).reduce(
        (total, item) => total + Number(item.quantity || 0),
        0
      );

      vendorSales[vendor] = (vendorSales[vendor] || 0) + boxes;
    });

    const topVendors = Object.entries(vendorSales)
      .map(([vendor, quantity]) => ({ vendor, quantity }))
      .sort((a, b) => b.quantity - a.quantity);

    const stockReport = records.Fruits.map((fruitRecord) => fruitRecord.name).flatMap((fruit) =>
      boxSizes.map((size) => {
        const stockItem = records.Stock.find(
          (item) => item.fruit === fruit && item.size === size
        );

        const quantity = Number(stockItem?.quantity || 0);

        return {
          fruit,
          size,
          quantity,
          status:
            quantity <= LOW_STOCK_LIMIT ? "LOW STOCK" : "AVAILABLE",
        };
      })
    );

    const reportLowStockCount = stockReport.filter(
      (item) => item.status === "LOW STOCK"
    ).length;

    return (
      <div className="report-layout">
        <div className="panel">
          <div className="panel-heading">
            <div>
              <h3>Business Summary</h3>
              <p>Overall farm distribution information</p>
            </div>
          </div>

          <div className="activity-item">
            <span>Number of suppliers</span>
            <strong>{records.Suppliers.length}</strong>
          </div>

          <div className="activity-item">
            <span>Number of fruits</span>
            <strong>{records.Fruits.length}</strong>
          </div>

          <div className="activity-item">
            <span>Number of vendors</span>
            <strong>{records.Vendors.length}</strong>
          </div>

          <div className="activity-item">
            <span>Total stock boxes</span>
            <strong>{totalStock}</strong>
          </div>

          <div className="activity-item">
            <span>Total sales value</span>
            <strong>LSL {totalSales.toLocaleString()}</strong>
          </div>

          <div className="activity-item">
            <span>Outstanding payments</span>
            <strong>LSL {totalOutstanding.toLocaleString()}</strong>
          </div>

          <div className="activity-item">
            <span>Low-stock combinations</span>
            <strong>{reportLowStockCount}</strong>
          </div>
        </div>

        <div className="panel">
          <div className="panel-heading">
            <div>
              <h3>Top Five Best-Selling Fruits</h3>
              <p>Ranked according to the number of boxes sold</p>
            </div>
          </div>

          {topFiveFruits.length > 0 ? (
            topFiveFruits.map((item, index) => (
              <div className="activity-item" key={item.fruit}>
                <div>
                  <strong>{index + 1}. {item.fruit}</strong>
                  <p>Boxes sold</p>
                </div>

                <strong>{item.quantity}</strong>
              </div>
            ))
          ) : (
            <p>No sales have been recorded yet.</p>
          )}
        </div>

        <div className="panel">
          <div className="panel-heading">
            <div>
              <h3>Sales Revenue Report</h3>
              <p>Calculate sales revenue between two dates</p>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="reportStartDate">Start Date</label>
              <input
                id="reportStartDate"
                type="date"
                value={reportStartDate}
                onChange={(event) => setReportStartDate(event.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="reportEndDate">End Date</label>
              <input
                id="reportEndDate"
                type="date"
                min={reportStartDate || undefined}
                value={reportEndDate}
                onChange={(event) => setReportEndDate(event.target.value)}
              />
            </div>
          </div>

          {reportStartDate && reportEndDate &&
            reportStartDate > reportEndDate && (
              <p style={{ color: "#b45309" }}>
                The end date must be after the start date.
              </p>
            )}

          <div className="activity-item">
            <span>Number of sales</span>
            <strong>
              {reportStartDate && reportEndDate &&
              reportStartDate > reportEndDate
                ? 0
                : filteredSales.length}
            </strong>
          </div>

          <div className="activity-item">
            <span>Total revenue</span>
            <strong>
              LSL {
                (reportStartDate && reportEndDate &&
                reportStartDate > reportEndDate
                  ? 0
                  : periodRevenue).toLocaleString()
              }
            </strong>
          </div>

          <button
            className="text-button"
            type="button"
            onClick={() => {
              setReportStartDate("");
              setReportEndDate("");
            }}
          >
            Clear Dates
          </button>
        </div>

        <div className="panel">
          <div className="panel-heading">
            <div>
              <h3>Top Vendor</h3>
              <p>Vendor with the highest number of boxes purchased</p>
            </div>
          </div>

          {topVendors.length > 0 ? (
            <>
              <div className="activity-item">
                <span>Top vendor</span>
                <strong>{topVendors[0].vendor}</strong>
              </div>

              <div className="activity-item">
                <span>Boxes purchased</span>
                <strong>{topVendors[0].quantity}</strong>
              </div>

              <h4>Vendor Sales Ranking</h4>

              {topVendors.map((vendor, index) => (
                <div className="activity-item" key={vendor.vendor}>
                  <span>{index + 1}. {vendor.vendor}</span>
                  <strong>{vendor.quantity} boxes</strong>
                </div>
              ))}
            </>
          ) : (
            <p>No vendor sales have been recorded yet.</p>
          )}
        </div>

        <div className="panel">
          <div className="panel-heading">
            <div>
              <h3>Current Stock Report</h3>
              <p>Available quantities for every fruit and box size</p>
            </div>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Fruit</th>
                  <th>Box Size</th>
                  <th>Boxes Available</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {stockReport.map((item) => (
                  <tr key={`${item.fruit}-${item.size}`}>
                    <td>{item.fruit}</td>
                    <td>{item.size}</td>
                    <td>{item.quantity}</td>
                    <td>
                      <span
                        style={{
                          color:
                            item.status === "LOW STOCK"
                              ? "#b45309"
                              : "#15803d",
                          fontWeight: "bold",
                        }}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderTable = () => {
    const fields = tableFields[activePage] || [];
    const headers = headings[activePage] || [];

    return (
      <div className="records-panel">
        <div className="records-toolbar">
          <input
            type="search"
            placeholder={`Search ${activePage.toLowerCase()}...`}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <button className="primary-button" onClick={() => openForm()}>
            {activePage === "Stock"
              ? "+ Restock Fruit"
              : `+ Add ${activePage === "Fruits" ? "Fruit" : activePage.slice(0, -1)}`}
          </button>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                {headers.map((heading) => (
                  <th key={heading}>{heading}</th>
                ))}
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredRecords.length > 0 ? (
                filteredRecords.map((record) => (
                  <tr key={record.id}>
                    {fields.map((field) => (
                      <td key={field}>
                        {["price", "amount", "total", "amountPaid", "balance", "outstandingBalance"].includes(field) ? (
                          `LSL ${Number(record[field] || 0).toLocaleString()}`
                        ) : field === "stockStatus" ? (
                          <span
                            style={{
                              color: record.stockStatus === "LOW STOCK" ? "#b45309" : "#15803d",
                              fontWeight: "bold",
                            }}
                          >
                            {record.stockStatus}
                          </span>
                        ) : record[field]}
                      </td>
                    ))}
                    <td>
                      <div className="table-actions">
                        <button
                          className="view-button"
                          onClick={() => setViewingRecord(record)}
                        >
                          View
                        </button>

                        {activePage !== "Stock" && activePage !== "Purchases" && (
                          <>
                            <button
                              className="edit-button"
                              onClick={() => openForm(record)}
                            >
                              Edit
                            </button>

                            <button
                              className="delete-button"
                              onClick={() => deleteRecord(record)}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={headers.length + 1} className="empty-message">
                    No records found. Add a new record to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderFormField = (field) => {
    const [name, label, type, options] = field;

    if (type === "select") {
      let choices = [];

      if (activePage === "Payments" && name === "saleId") {
        choices = records.Sales.map((sale) => ({
          value: sale.id,
          label: `${saleReference(sale.id)} - ${sale.vendor} - LSL ${Number(sale.total || 0).toLocaleString()} (Balance: LSL ${Number(sale.balance || 0).toLocaleString()})`,
        }));
      } else if (activePage === "Fruits" && name === "status") {
        choices = ["Active", "Inactive"].map((choice) => ({
          value: choice,
          label: choice,
        }));
      } else if (activePage === "Stock" && name === "fruit") {
        choices = activeFruitTypes.map((choice) => ({
          value: choice,
          label: choice,
        }));
      } else if (Array.isArray(options)) {
        choices = options.map((choice) => ({
          value: choice,
          label: choice,
        }));
      } else {
        choices = (records[options] || []).map((item) => ({
          value: item.name,
          label: item.name,
        }));
      }

      return (
        <div className="form-group" key={name}>
          <label htmlFor={name}>{label}</label>

          <select
            id={name}
            value={formData[name] ?? ""}
            onChange={(event) => updateField(name, event.target.value)}
            required
          >
            <option value="">Choose {label.toLowerCase()}</option>

            {choices.map((choice) => (
              <option value={choice.value} key={choice.value}>
                {choice.label}
              </option>
            ))}
          </select>

          {activePage === "Payments" &&
            name === "saleId" &&
            formData.saleId &&
            (() => {
              const selectedSale = records.Sales.find(
                (sale) => Number(sale.id) === Number(formData.saleId)
              );

              if (!selectedSale) return null;

              return (
                <small className="payment-sale-info">
                  Sale total: LSL {Number(selectedSale.total || 0).toLocaleString()} ·
                  Remaining: LSL {Number(selectedSale.balance || 0).toLocaleString()}
                </small>
              );
            })()}
        </div>
      );
    }

    return (
      <div className="form-group" key={name}>
        <label htmlFor={name}>{label}</label>

        <input
          id={name}
          type={type}
          min={type === "number" ? "0" : undefined}
          step={type === "number" ? "any" : undefined}
          value={formData[name] ?? ""}
          onChange={(event) => updateField(name, event.target.value)}
          required
        />
      </div>
    );
  };

  const renderTransactionForm = () => {
    const isSale = activePage === "Sales";
    const items = formData.items || [];

    const grandTotal = items.reduce((sum, item) => {
      const price = isSale
        ? Number(sellingPrices[item.size] || 0)
        : Number(item.price || 0);

      return sum + Number(item.quantity || 0) * price;
    }, 0);

    return (
      <>
        <div className="form-grid">
          {renderFormField(
            isSale
              ? ["vendor", "Vendor", "select", "Vendors"]
              : ["supplier", "Supplier", "select", "Suppliers"]
          )}

          {renderFormField([
            "date",
            isSale ? "Sale Date" : "Purchase Date",
            "date",
          ])}
        </div>

        <div style={{ marginTop: "22px" }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            marginBottom: "14px",
            flexWrap: "wrap",
          }}>
            <div>
              <h3 style={{ margin: 0 }}>Fruit Items</h3>
              <p style={{ margin: "5px 0 0" }}>
                Add each fruit and box size included in this transaction.
              </p>
            </div>

            <button
              type="button"
              className="primary-button"
              onClick={addItem}
            >
              + Add Another Item
            </button>
          </div>

          {items.map((item, index) => {
            const linePrice = isSale
              ? Number(sellingPrices[item.size] || 0)
              : Number(item.price || 0);

            const lineTotal = Number(item.quantity || 0) * linePrice;

            return (
              <div
                key={index}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "10px",
                  padding: "15px",
                  marginBottom: "12px",
                  background: "#fff",
                }}
              >
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "12px",
                }}>
                  <strong>Item {index + 1}</strong>

                  {items.length > 1 && (
                    <button
                      type="button"
                      className="delete-button"
                      onClick={() => removeItem(index)}
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Fruit</label>
                    <select
                      value={item.fruit}
                      onChange={(event) =>
                        updateItem(index, "fruit", event.target.value)
                      }
                      required
                    >
                      <option value="">Choose fruit</option>
                      {activeFruitTypes.map((fruit) => (
                        <option key={fruit} value={fruit}>
                          {fruit}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Box Size</label>
                    <select
                      value={item.size}
                      onChange={(event) =>
                        updateItem(index, "size", event.target.value)
                      }
                      required
                    >
                      <option value="">Choose box size</option>
                      {boxSizes.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Quantity of Boxes</label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={item.quantity}
                      onChange={(event) =>
                        updateItem(index, "quantity", event.target.value)
                      }
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      {isSale ? "Selling Price per Box (LSL)" : "Cost per Box (LSL)"}
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={isSale ? (item.size ? linePrice : "") : item.price}
                      onChange={(event) =>
                        updateItem(index, "price", event.target.value)
                      }
                      readOnly={isSale}
                      required={!isSale}
                      placeholder={isSale ? "Select box size first" : "Enter cost"}
                    />
                  </div>
                </div>

                <div style={{
                  textAlign: "right",
                  marginTop: "12px",
                  fontWeight: "bold",
                }}>
                  Item total: LSL {lineTotal.toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{
          background: "#f1f4f8",
          borderRadius: "10px",
          padding: "18px",
          marginTop: "16px",
          textAlign: "right",
        }}>
          <span style={{ display: "block", marginBottom: "5px" }}>
            {isSale ? "Sale Grand Total" : "Purchase Grand Total"}
          </span>

          <strong style={{ fontSize: "23px" }}>
            LSL {grandTotal.toLocaleString()}
          </strong>
        </div>
      </>
    );
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">BF</div>

          <div>
            <h2>Batloung</h2>
            <p>Farm Distribution</p>
          </div>
        </div>

        <div className="menu-label">WORKSPACE</div>

        <nav className="navigation">
          {[
            { heading: "MAIN", pages: ["Dashboard"] },
            { heading: "MANAGEMENT", pages: ["Suppliers", "Fruits", "Vendors", "Stock"] },
            { heading: "OPERATIONS", pages: ["Purchases", "Sales", "Payments"] },
            { heading: "OTHER", pages: ["Reports"] },
          ].map((group) => (
            <div className="nav-group" key={group.heading}>
              {group.heading !== "MAIN" && (
                <p className="menu-label">{group.heading}</p>
              )}

              {group.pages.map((page) => (
                <button
                  key={page}
                  className={`nav-link ${activePage === page ? "active" : ""}`}
                  onClick={() => {
                    setActivePage(page);
                    setSearch("");
                  }}
                >
                  <span>{page}</span>
                  <span className="nav-arrow">›</span>
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <span>BATLOUNG FARM</span>
          <p>Distribution Management System</p>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div>
            <p className="breadcrumb">Farm Management / {activePage}</p>
            <h1>{activePage}</h1>
          </div>

          <div className="user-label">
            <span className="user-circle">A</span>

            <div>
              <strong>Administrator</strong>
              <p>System User</p>
            </div>
          </div>
        </header>

        <div className="page-content">
          {activePage === "Dashboard" ? (
            renderDashboard()
          ) : (
            <>
              <section className="page-intro">
                <div>
                  <h2>{pageInfo[activePage][0]}</h2>
                  <p>{pageInfo[activePage][1]}</p>
                </div>
              </section>

              {activePage === "Reports" ? renderReports() : renderTable()}
            </>
          )}

          <footer className="page-footer">
            Batloung Farm Distribution System · Management Portal
          </footer>
        </div>
      </main>

      {showForm && (
        <div
          className="modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeForm();
          }}
        >
          <div className="form-modal">
            <div className="modal-heading">
              <div>
                <span className="form-eyebrow">RECORD MANAGEMENT</span>

                <h2>
                  {editingRecord ? "Edit" : "Add"}{" "}
                  {activePage === "Stock"
                    ? "Fruit Restock"
                    : activePage === "Fruits"
                      ? "Fruit"
                      : activePage.slice(0, -1)}
                </h2>

                <p>Enter the information in the fields below.</p>
              </div>

              <button
                className="close-button"
                type="button"
                onClick={closeForm}
              >
                ×
              </button>
            </div>

            <form onSubmit={saveRecord}>
              {["Sales", "Purchases"].includes(activePage) ? (
                renderTransactionForm()
              ) : (
                <div className="form-grid">
                  {(formFields[activePage] || []).map(renderFormField)}
                </div>
              )}

              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={closeForm}
                >
                  Cancel
                </button>

                <button type="submit" className="primary-button">
                  {editingRecord ? "Save Changes" : "Save Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingRecord && (
        <div
          className="modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setViewingRecord(null);
            }
          }}
        >
          <div className="form-modal view-modal">
            <div className="modal-heading">
              <div>
                <span className="form-eyebrow">RECORD INFORMATION</span>
                <h2>{activePage} Details</h2>
                <p>View the information saved for this record.</p>
              </div>

              <button
                className="close-button"
                type="button"
                onClick={() => setViewingRecord(null)}
              >
                ×
              </button>
            </div>

            <div className="record-details">
              {Object.entries(viewingRecord).map(([key, value]) => {
                if (key === "items" && Array.isArray(value)) {
                  return (
                    <div className="detail-row" key={key}>
                      <span>Items</span>
                      <strong>
                        {value.map((item, index) => (
                          <div key={index} style={{ marginBottom: "8px" }}>
                            {item.fruit} ({item.size}) — {item.quantity} boxes
                            <br />
                            LSL {(
                              Number(item.quantity) * Number(item.price)
                            ).toLocaleString()}
                          </div>
                        ))}
                      </strong>
                    </div>
                  );
                }

                if (key === "itemsSummary") return null;

                return (
                  <div className="detail-row" key={key}>
                    <span>{key.replace(/([A-Z])/g, " $1")}</span>
                    <strong>
                      {["total", "amountPaid", "balance", "amount", "outstandingBalance"].includes(key)
                        ? `LSL ${Number(value || 0).toLocaleString()}`
                        : String(value)}
                    </strong>
                  </div>
                );
              })}
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="cancel-button"
                onClick={() => setViewingRecord(null)}
              >
                Close
              </button>

              {activePage !== "Stock" && activePage !== "Sales" && (
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => {
                    const record = viewingRecord;
                    setViewingRecord(null);
                    openForm(record);
                  }}
                >
                  Edit Record
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
