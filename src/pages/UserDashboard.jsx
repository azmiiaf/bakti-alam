import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { toast } from "react-toastify";

const UserDashboard = () => {
  const [deposits, setDeposits] = useState([]);
  const [flatDeposits, setFlatDeposits] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchDeposits();
  }, []);

  const fetchDeposits = async () => {
    try {
      console.log("Fetching deposits data...");

      // Fetch transactions
      const { data: transactions, error: transError } = await supabase
        .from("deposit_transactions")
        .select("*")
        .order("created_at", { ascending: false });

      if (transError) {
        console.error("Transactions fetch error:", transError);
        throw transError;
      }

      // Fetch all items
      const { data: items, error: itemsError } = await supabase
        .from("deposit_items")
        .select("*");

      if (itemsError) {
        console.error("Items fetch error:", itemsError);
        throw itemsError;
      }

      // Combine transactions with their items
      const transactionsWithItems = transactions.map((transaction) => ({
        ...transaction,
        deposit_items: items.filter(
          (item) => item.transaction_id === transaction.id
        ),
      }));

      // Also create flat list of items for aggregation
      const depositsWithTransactionInfo = items.map((item) => {
        const transaction = transactions.find(
          (t) => t.id === item.transaction_id
        );
        return {
          ...item,
          depositor_name: transaction?.depositor_name || "Unknown",
          transaction_id: item.transaction_id,
        };
      });

      console.log("Deposits data fetched:", transactionsWithItems);
      setDeposits(transactionsWithItems || []);
      setFlatDeposits(depositsWithTransactionInfo || []);
    } catch (error) {
      console.error("Failed to fetch deposits:", error);
      toast.error("Gagal mengambil data penyetoran. Periksa koneksi database.");
    }
  };

  const filteredDeposits = flatDeposits.filter((deposit) =>
    deposit.depositor_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Aggregate data by depositor - count unique transactions, not items
  const depositorStats = deposits.reduce((acc, transaction) => {
    const depositorName = transaction.depositor_name;
    if (!acc[depositorName]) {
      acc[depositorName] = {
        totalTransactions: 0,
        totalValue: 0,
      };
    }
    acc[depositorName].totalTransactions += 1;
    acc[depositorName].totalValue += transaction.total_value;
    return acc;
  }, {});

  // Filter depositorStats based on search term
  const filteredDepositorStats = Object.entries(depositorStats)
    .filter(([depositorName]) =>
      depositorName.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});

  const totalBalance = Object.values(filteredDepositorStats).reduce(
    (sum, stats) => sum + stats.totalValue,
    0
  );

  // Prepare data for monthly deposit value chart using transactions
  const monthlyData = deposits.reduce((acc, transaction) => {
    const depositDate = new Date(transaction.input_date + "T00:00:00Z");
    const monthYear = `${
      depositDate.getMonth() + 1
    }/${depositDate.getFullYear()}`;
    if (!acc[monthYear]) {
      acc[monthYear] = 0;
    }
    acc[monthYear] += transaction.total_value;
    return acc;
  }, {});

  const chartData = Object.entries(monthlyData).map(([monthYear, value]) => ({
    date: monthYear,
    value,
  }));

  return (
    <div className="space-y-6">
      {/* Trend Visualization */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Trend Penyetoran Per Bulan</h2>
        </div>

        <div className="bg-slate-600 p-6 rounded-lg">
          {chartData.length > 0 ? (
            <div className="h-44 ">
              {/* Simple bar chart using divs */}
              <div className="flex items-end justify-center h-full space-x-2">
                {chartData.map((data, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div
                      className="bg-green-400 rounded-t w-8"
                      style={{
                        height: `${Math.min(
                          (data.value / 100000) * 100,
                          100
                        )}%`,
                        minHeight: "20px",
                      }}
                      title={`Rp ${data.value.toLocaleString("id-ID")}`}
                    />
                    <span className="text-xs  mt-2">{data.date}</span>
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="font-bold text-center text-sm ">
                <p>Nilai penyetoran per Bulan </p>
              </div>
            </div>
          ) : (
            <div className="text-center text-white-500 py-8">
              <p>Tidak ada data penyetoran</p>
            </div>
          )}
        </div>
      </div>
      {/* Search and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Search Bar */}
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="card-title  mb-4">Cari Penyetor</h2>
            <input
              type="text"
              placeholder="Cari berdasarkan nama penyetor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input w-full text-white"
            />
          </div>
        </div>

        {/* Total Balance Card */}
        <div className="card text-center">
          <h2 className="card-title mb-4">Total Saldo</h2>
          <div className="stats-value">
            Rp {totalBalance.toLocaleString("id-ID")}
          </div>
          <div className="stats-label">Seluruh Penyetoran</div>
        </div>
      </div>

      {/* Depositors Table */}
      <div className="card mb-8">
        <div className="card-header">
          <h2 className="card-title">Daftar Penyetor</h2>
        </div>

        <div className="table-container table-scrollable">
          <table className="table table-fixed-header">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">No</th>
                <th className="table-header-cell">Nama Penyetor</th>
                <th className="table-header-cell">Total Transaksi</th>
                <th className="table-header-cell">Total Nilai</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {Object.entries(filteredDepositorStats).length === 0 ? (
                <tr className="table-row">
                  <td
                    colSpan="4"
                    className="table-cell text-center py-8 text-gray-500"
                  >
                    Data tidak ditemukan
                  </td>
                </tr>
              ) : (
                Object.entries(filteredDepositorStats).map(
                  ([name, stats], index) => (
                    <tr key={name} className="table-row">
                      <td className="table-cell">{index + 1}</td>
                      <td className="table-cell font-medium">{name}</td>
                      <td className="table-cell">{stats.totalTransactions}</td>
                      <td className="table-cell">
                        Rp {stats.totalValue.toLocaleString("id-ID")}
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card mt-8">
        <div className="card-header">
          <h2 className="card-title">Riwayat Penyetoran</h2>
        </div>

        <div className="table-container table-scrollable">
          <table className="table table-fixed-header">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">No</th>
                <th className="table-header-cell">Tanggal</th>
                <th className="table-header-cell">Nama Penyetor</th>
                <th className="table-header-cell">Jenis Barang</th>
                <th className="table-header-cell">Total Berat (kg / liter)</th>
                <th className="table-header-cell">Total Nilai</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {deposits.length === 0 ? (
                <tr className="table-row">
                  <td
                    colSpan="6"
                    className="table-cell text-center py-8 text-gray-500"
                  >
                    Data tidak ditemukan
                  </td>
                </tr>
              ) : (
                deposits.slice(0, 10).map((transaction, index) => (
                  <tr key={transaction.id} className="table-row">
                    <td className="table-cell">{index + 1}</td>
                    <td className="table-cell">
                      {new Date(transaction.input_date).toLocaleDateString(
                        "id-ID"
                      )}
                    </td>
                    <td className="table-cell">{transaction.depositor_name}</td>
                    <td className="table-cell">
                      <div className="text-sm">
                        {transaction.deposit_items.map((item, idx) => (
                          <div key={idx} className="mb-1">
                            -{item.item_type} ({item.weight_kg} kg / liter x Rp{" "}
                            {item.price_per_kg.toLocaleString("id-ID")})
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="table-cell">
                      {transaction.total_weight_kg}
                    </td>
                    <td className="table-cell">
                      Rp {transaction.total_value.toLocaleString("id-ID")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
