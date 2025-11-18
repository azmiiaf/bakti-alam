import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { toast } from "react-toastify";

const ReportsPage = () => {
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState("monthly");
  const [reportData, setReportData] = useState([]);

  useEffect(() => {
    fetchDeposits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDeposits = async () => {
    try {
      setLoading(true);

      // Fetch all items (which represent individual deposits)
      const { data: items, error: itemsError } = await supabase
        .from("deposit_items")
        .select("*")
        .order("created_at", { ascending: false });

      if (itemsError) {
        console.error("Items fetch error:", itemsError);
        throw itemsError;
      }

      setDeposits(items || []);
      generateReport(items || []);
    } catch (error) {
      console.error("Failed to fetch deposits:", error);
      toast.error("Gagal mengambil data penyetoran.");
    } finally {
      setLoading(false);
    }
  };

  const generateReport = (data) => {
    let report = [];

    if (reportType === "monthly") {
      // Monthly report by item type
      const monthlyData = data.reduce((acc, deposit) => {
        const date = new Date(deposit.created_at);
        const monthYear = date.toLocaleDateString("id-ID", {
          month: "long",
          year: "numeric",
        });
        const monthKey = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;

        if (!acc[monthKey]) {
          acc[monthKey] = {
            month: monthYear,
            "Botol/Gelas Plastik Minuman": { weight: 0, value: 0 },
            Kardus: { weight: 0, value: 0 },
            Buku: { weight: 0, value: 0 },
            "Logam/Besi": { weight: 0, value: 0 },
            "Emberan/Campuran": { weight: 0, value: 0 },
            Elektronik: { weight: 0, value: 0 },
          };
        }

        if (acc[monthKey][deposit.item_type]) {
          acc[monthKey][deposit.item_type].weight += deposit.weight_kg;
          acc[monthKey][deposit.item_type].value += deposit.total_value;
        }

        return acc;
      }, {});

      report = Object.entries(monthlyData)
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([, data]) => data);
    } else if (reportType === "yearly") {
      // Yearly report by item type
      const yearlyData = data.reduce((acc, deposit) => {
        const year = new Date(deposit.created_at).getFullYear().toString();

        if (!acc[year]) {
          acc[year] = {
            "Botol/Gelas Plastik Minuman": { weight: 0, value: 0 },
            Kardus: { weight: 0, value: 0 },
            Buku: { weight: 0, value: 0 },
            "Logam/Besi": { weight: 0, value: 0 },
            "Emberan/Campuran": { weight: 0, value: 0 },
            Elektronik: { weight: 0, value: 0 },
          };
        }

        if (acc[year][deposit.item_type]) {
          acc[year][deposit.item_type].weight += deposit.weight_kg;
          acc[year][deposit.item_type].value += deposit.total_value;
        }

        return acc;
      }, {});

      report = Object.entries(yearlyData)
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([year, data]) => ({
          year,
          ...data,
        }));
    }

    setReportData(report);
  };

  const handleReportTypeChange = (type) => {
    setReportType(type);
    generateReport(deposits);
  };

  const exportReportToCSV = () => {
    let csvContent = "";

    if (reportType === "monthly") {
      csvContent =
        "Bulan,Botol/Gelas Plastik (kg),Botol/Gelas Plastik (Rp),Kardus (kg),Kardus (Rp),Buku (kg),Buku (Rp),Logam/Besi (kg),Logam/Besi (Rp),Emberan/Campuran (kg),Emberan/Campuran (Rp),Elektronik (kg),Elektronik (Rp)\n";
      reportData.forEach((row) => {
        csvContent += `${row.month},${
          row["Botol/Gelas Plastik Minuman"]?.weight || 0
        },${row["Botol/Gelas Plastik Minuman"]?.value || 0},${
          row.Kardus?.weight || 0
        },${row.Kardus?.value || 0},${row.Buku?.weight || 0},${
          row.Buku?.value || 0
        },${row["Logam/Besi"]?.weight || 0},${row["Logam/Besi"]?.value || 0},${
          row["Emberan/Campuran"]?.weight || 0
        },${row["Emberan/Campuran"]?.value || 0},${
          row.Elektronik?.weight || 0
        },${row.Elektronik?.value || 0}\n`;
      });
    } else if (reportType === "yearly") {
      csvContent =
        "Tahun,Botol/Gelas Plastik (kg),Botol/Gelas Plastik (Rp),Kardus (kg),Kardus (Rp),Buku (kg),Buku (Rp),Logam/Besi (kg),Logam/Besi (Rp),Emberan/Campuran (kg),Emberan/Campuran (Rp),Elektronik (kg),Elektronik (Rp)\n";
      reportData.forEach((row) => {
        csvContent += `${row.year},${
          row["Botol/Gelas Plastik Minuman"]?.weight || 0
        },${row["Botol/Gelas Plastik Minuman"]?.value || 0},${
          row.Kardus?.weight || 0
        },${row.Kardus?.value || 0},${row.Buku?.weight || 0},${
          row.Buku?.value || 0
        },${row["Logam/Besi"]?.weight || 0},${row["Logam/Besi"]?.value || 0},${
          row["Emberan/Campuran"]?.weight || 0
        },${row["Emberan/Campuran"]?.value || 0},${
          row.Elektronik?.weight || 0
        },${row.Elektronik?.value || 0}\n`;
      });
    }

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `laporan_${reportType}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Report Controls */}
      {/* <div className="card">
        <div className="card-header">
          <h2 className="card-title">Laporan dan Analisis</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Jenis Laporan</label>
            <select
              value={reportType}
              onChange={(e) => handleReportTypeChange(e.target.value)}
              className="form-input"
            >
              <option className="text-slate-700 font-bold" value="monthly">
                Laporan Bulanan per Jenis Barang
              </option>
              <option className="text-slate-700 font-bold" value="yearly">
                Laporan Tahunan per Jenis Barang
              </option>
            </select>
          </div>

          
        </div>
      </div> */}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="stats-card">
          <div className="stats-value">{deposits.length}</div>
          <div className="stats-label">Total Transaksi</div>
        </div>
        <div className="stats-card">
          <div className="stats-value">
            {deposits
              .reduce((sum, deposit) => sum + deposit.weight_kg, 0)
              .toFixed(2)}{" "}
            kg
          </div>
          <div className="stats-label">Total Berat Sampah</div>
        </div>
        <div className="stats-card">
          <div className="stats-value">
            Rp{" "}
            {deposits
              .reduce((sum, deposit) => sum + deposit.total_value, 0)
              .toLocaleString("id-ID")}
          </div>
          <div className="stats-label">Total Nilai</div>
        </div>
      </div>

      {/* Report Summary */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            {reportType === "monthly"
              ? "Laporan Bulanan"
              : "Laporan Tahunan per Jenis Barang"}
          </h3>
          <div className="flex items-center justify-end">
            <button
              onClick={exportReportToCSV}
              className="btn-secondary"
              disabled={loading}
            >
              {loading ? "Memuat..." : "Export CSV"}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p>Memuat data laporan...</p>
          </div>
        ) : reportData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Tidak ada data untuk ditampilkan</p>
          </div>
        ) : (
          <div className="table-container table-scrollable h-96 mb-5">
            <table className="table table-fixed-header">
              <thead className="table-header">
                {reportType === "monthly" ? (
                  <tr>
                    <th className="table-header-cell">Bulan</th>
                    <th className="table-header-cell">
                      Botol/Gelas Plastik (kg)
                    </th>
                    <th className="table-header-cell">
                      Botol/Gelas Plastik (Rp)
                    </th>
                    <th className="table-header-cell">Kardus (kg)</th>
                    <th className="table-header-cell">Kardus (Rp)</th>
                    <th className="table-header-cell">Buku (kg)</th>
                    <th className="table-header-cell">Buku (Rp)</th>
                    <th className="table-header-cell">Logam/Besi (kg)</th>
                    <th className="table-header-cell">Logam/Besi (Rp)</th>
                    <th className="table-header-cell">Emberan/Campuran (kg)</th>
                    <th className="table-header-cell">Emberan/Campuran (Rp)</th>
                    <th className="table-header-cell">Elektronik (kg)</th>
                    <th className="table-header-cell">Elektronik (Rp)</th>
                  </tr>
                ) : (
                  <tr>
                    <th className="table-header-cell">Tahun</th>
                    <th className="table-header-cell">
                      Botol/Gelas Plastik (kg)
                    </th>
                    <th className="table-header-cell">
                      Botol/Gelas Plastik (Rp)
                    </th>
                    <th className="table-header-cell">Kardus (kg)</th>
                    <th className="table-header-cell">Kardus (Rp)</th>
                    <th className="table-header-cell">Buku (kg)</th>
                    <th className="table-header-cell">Buku (Rp)</th>
                    <th className="table-header-cell">Logam/Besi (kg)</th>
                    <th className="table-header-cell">Logam/Besi (Rp)</th>
                    <th className="table-header-cell">Emberan/Campuran (kg)</th>
                    <th className="table-header-cell">Emberan/Campuran (Rp)</th>
                    <th className="table-header-cell">Elektronik (kg)</th>
                    <th className="table-header-cell">Elektronik (Rp)</th>
                  </tr>
                )}
              </thead>
              <tbody className="table-body">
                {reportData.length === 0 ? (
                  <tr className="table-row">
                    <td
                      colSpan={13}
                      className="table-cell text-center py-8 text-gray-500"
                    >
                      Data tidak ditemukan
                    </td>
                  </tr>
                ) : (
                  reportData.map((row, index) => (
                    <tr key={index} className="table-row">
                      {reportType === "monthly" ? (
                        <>
                          <td className="table-cell">{row.month}</td>
                          <td className="table-cell">
                            {(
                              row["Botol/Gelas Plastik Minuman"]?.weight || 0
                            ).toFixed(2)}
                          </td>
                          <td className="table-cell">
                            Rp{" "}
                            {(
                              row["Botol/Gelas Plastik Minuman"]?.value || 0
                            ).toLocaleString("id-ID")}
                          </td>
                          <td className="table-cell">
                            {(row.Kardus?.weight || 0).toFixed(2)}
                          </td>
                          <td className="table-cell">
                            Rp{" "}
                            {(row.Kardus?.value || 0).toLocaleString("id-ID")}
                          </td>
                          <td className="table-cell">
                            {(row.Buku?.weight || 0).toFixed(2)}
                          </td>
                          <td className="table-cell">
                            Rp {(row.Buku?.value || 0).toLocaleString("id-ID")}
                          </td>
                          <td className="table-cell">
                            {(row["Logam/Besi"]?.weight || 0).toFixed(2)}
                          </td>
                          <td className="table-cell">
                            Rp{" "}
                            {(row["Logam/Besi"]?.value || 0).toLocaleString(
                              "id-ID"
                            )}
                          </td>
                          <td className="table-cell">
                            {(row["Emberan/Campuran"]?.weight || 0).toFixed(2)}
                          </td>
                          <td className="table-cell">
                            Rp{" "}
                            {(
                              row["Emberan/Campuran"]?.value || 0
                            ).toLocaleString("id-ID")}
                          </td>
                          <td className="table-cell">
                            {(row.Elektronik?.weight || 0).toFixed(2)}
                          </td>
                          <td className="table-cell">
                            Rp{" "}
                            {(row.Elektronik?.value || 0).toLocaleString(
                              "id-ID"
                            )}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="table-cell">{row.year}</td>
                          <td className="table-cell">
                            {(
                              row["Botol/Gelas Plastik Minuman"]?.weight || 0
                            ).toFixed(2)}
                          </td>
                          <td className="table-cell">
                            Rp{" "}
                            {(
                              row["Botol/Gelas Plastik Minuman"]?.value || 0
                            ).toLocaleString("id-ID")}
                          </td>
                          <td className="table-cell">
                            {(row.Kardus?.weight || 0).toFixed(2)}
                          </td>
                          <td className="table-cell">
                            Rp{" "}
                            {(row.Kardus?.value || 0).toLocaleString("id-ID")}
                          </td>
                          <td className="table-cell">
                            {(row.Buku?.weight || 0).toFixed(2)}
                          </td>
                          <td className="table-cell">
                            Rp {(row.Buku?.value || 0).toLocaleString("id-ID")}
                          </td>
                          <td className="table-cell">
                            {(row["Logam/Besi"]?.weight || 0).toFixed(2)}
                          </td>
                          <td className="table-cell">
                            Rp{" "}
                            {(row["Logam/Besi"]?.value || 0).toLocaleString(
                              "id-ID"
                            )}
                          </td>
                          <td className="table-cell">
                            {(row["Emberan/Campuran"]?.weight || 0).toFixed(2)}
                          </td>
                          <td className="table-cell">
                            Rp{" "}
                            {(
                              row["Emberan/Campuran"]?.value || 0
                            ).toLocaleString("id-ID")}
                          </td>
                          <td className="table-cell">
                            {(row.Elektronik?.weight || 0).toFixed(2)}
                          </td>
                          <td className="table-cell">
                            Rp{" "}
                            {(row.Elektronik?.value || 0).toLocaleString(
                              "id-ID"
                            )}
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
