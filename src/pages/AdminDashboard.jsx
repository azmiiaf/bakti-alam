import React, { useState, useEffect } from "react";
import { useAuth } from "../components/services/useAuth";
import { supabase } from "../lib/supabase";
import { toast } from "react-toastify";
import { useForm } from "react-hook-form";
import ConfirmationModal from "../components/molecules/ConfirmationModal";

const AdminDashboard = () => {
  const { user } = useAuth();
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDeposit, setSelectedDeposit] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [items, setItems] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingTransactionId, setEditingTransactionId] = useState(null);
  const [editItems, setEditItems] = useState([]);
  const [validationModal, setValidationModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    actionLabel: "Konfirmasi",
    isDangerous: false,
    type: "", // "submit", "edit", "delete"
  });
  const [pendingData, setPendingData] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      depositor_name: "",
      created_at: "",
    },
  });

  useEffect(() => {
    fetchDeposits();
  }, []);

  const fetchDeposits = async () => {
    try {
      console.log("Fetching deposits data for admin...");

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
      const { data: allItems, error: itemsError } = await supabase
        .from("deposit_items")
        .select("*");

      if (itemsError) {
        console.error("Items fetch error:", itemsError);
        throw itemsError;
      }

      // Combine transactions with their items
      const depositsWithItems = transactions.map((transaction) => ({
        ...transaction,
        deposit_items: allItems.filter(
          (item) => item.transaction_id === transaction.id
        ),
      }));

      console.log("Admin deposits data fetched:", depositsWithItems);
      setDeposits(depositsWithItems || []);
    } catch (error) {
      console.error("Failed to fetch admin deposits:", error);
      toast.error("Gagal mengambil data penyetoran. Periksa koneksi database.");
    }
  };

  const onSubmit = async (data) => {
    if (items.length === 0) {
      toast.error("Tambahkan minimal 1 jenis barang");
      return;
    }

    // Show validation modal
    setPendingData({ type: "submit", data });
    setValidationModal({
      isOpen: true,
      title: "Konfirmasi Penyimpanan",
      message: `Apakah Anda yakin ingin menyimpan penyetoran dari ${data.depositor_name} dengan ${items.length} jenis barang?`,
      actionLabel: "Simpan",
      isDangerous: false,
      type: "submit",
    });
  };

  const handleSubmitConfirm = async (data) => {
    setLoading(true);
    try {
      const createdAt = data.created_at
        ? new Date(data.created_at).toISOString()
        : new Date().toISOString();

      // Calculate total weight and value
      const totalWeight = items.reduce(
        (sum, item) => sum + parseFloat(item.weight_kg || 0),
        0
      );
      const totalValue = items.reduce(
        (sum, item) =>
          sum +
          parseFloat(item.weight_kg || 0) * parseFloat(item.price_per_kg || 0),
        0
      );

      // Insert transaction
      const { data: transactionData, error: transactionError } = await supabase
        .from("deposit_transactions")
        .insert({
          depositor_name: data.depositor_name,
          total_weight_kg: totalWeight,
          total_value: totalValue,
          created_at: createdAt,
          admin_id: user.id,
        })
        .select();

      if (transactionError) throw transactionError;

      const transactionId = transactionData[0].id;

      // Insert items
      const itemsToInsert = items.map((item) => ({
        transaction_id: transactionId,
        item_type: item.item_type,
        weight_kg: parseFloat(item.weight_kg),
        price_per_kg: parseFloat(item.price_per_kg),
        total_value: parseFloat(item.weight_kg) * parseFloat(item.price_per_kg),
        created_at: createdAt,
      }));

      const { error: itemsError } = await supabase
        .from("deposit_items")
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      toast.success("Data penyetoran berhasil ditambahkan");
      reset();
      setItems([]);
      setValidationModal({ ...validationModal, isOpen: false });
      setPendingData(null);
      fetchDeposits();
    } catch (error) {
      console.error("Error submitting deposit:", error);
      toast.error("Gagal menambahkan data penyetoran");
    } finally {
      setLoading(false);
    }
  };

  const handleValidationConfirm = async () => {
    if (validationModal.type === "submit") {
      await handleSubmitConfirm(pendingData.data);
    } else if (validationModal.type === "edit") {
      await handleEditConfirm();
    } else if (validationModal.type === "delete") {
      await handleDeleteConfirm();
    }
  };

  const handleValidationCancel = () => {
    setValidationModal({ ...validationModal, isOpen: false });
    setPendingData(null);
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        item_type: "",
        weight_kg: "",
        price_per_kg: "",
      },
    ]);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleDelete = (deposit) => {
    setSelectedDeposit(deposit);
    setValidationModal({
      isOpen: true,
      title: "Konfirmasi Penghapusan",
      message: `Apakah Anda yakin ingin menghapus data penyetoran dari ${deposit.depositor_name}? Tindakan ini tidak dapat dibatalkan.`,
      actionLabel: "Hapus",
      isDangerous: true,
      type: "delete",
    });
  };

  const handleDeleteConfirm = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("deposit_transactions")
        .delete()
        .eq("id", selectedDeposit.id);

      if (error) throw error;
      toast.success("Data berhasil dihapus");
      setValidationModal({ ...validationModal, isOpen: false });
      setSelectedDeposit(null);
      fetchDeposits();
    } catch {
      toast.error("Gagal menghapus data");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (deposit) => {
    setSelectedDeposit(deposit);
    setEditingTransactionId(deposit.id);
    setEditItems([...deposit.deposit_items]);
    setIsEditMode(true);
  };

  const handleEditCancel = () => {
    setIsEditMode(false);
    setSelectedDeposit(null);
    setEditingTransactionId(null);
    setEditItems([]);
  };

  const handleEditItemChange = (index, field, value) => {
    const newEditItems = [...editItems];
    newEditItems[index][field] = value;
    setEditItems(newEditItems);
  };

  const addEditItem = () => {
    setEditItems([
      ...editItems,
      {
        item_type: "",
        weight_kg: "",
        price_per_kg: "",
      },
    ]);
  };

  const removeEditItem = (index) => {
    setEditItems(editItems.filter((_, i) => i !== index));
  };

  const handleEditSubmit = async (data) => {
    if (editItems.length === 0) {
      toast.error("Tambahkan minimal 1 jenis barang");
      return;
    }

    // Show validation modal
    setPendingData({ type: "edit", data });
    setValidationModal({
      isOpen: true,
      title: "Konfirmasi Pengubahan",
      message: `Apakah Anda yakin ingin mengubah data penyetoran dari ${data.depositor_name} dengan ${editItems.length} jenis barang?`,
      actionLabel: "Simpan Perubahan",
      isDangerous: false,
      type: "edit",
    });
  };

  const handleEditConfirm = async () => {
    const data = pendingData.data;
    setLoading(true);
    try {
      const createdAt = data.created_at
        ? new Date(data.created_at).toISOString()
        : selectedDeposit.created_at;

      // Calculate total weight and value
      const totalWeight = editItems.reduce(
        (sum, item) => sum + parseFloat(item.weight_kg || 0),
        0
      );
      const totalValue = editItems.reduce(
        (sum, item) =>
          sum +
          parseFloat(item.weight_kg || 0) * parseFloat(item.price_per_kg || 0),
        0
      );

      // Update transaction
      const { error: updateError } = await supabase
        .from("deposit_transactions")
        .update({
          depositor_name: data.depositor_name,
          total_weight_kg: totalWeight,
          total_value: totalValue,
          created_at: createdAt,
        })
        .eq("id", editingTransactionId);

      if (updateError) throw updateError;

      // Delete old items
      const { error: deleteError } = await supabase
        .from("deposit_items")
        .delete()
        .eq("transaction_id", editingTransactionId);

      if (deleteError) throw deleteError;

      // Insert new items
      const itemsToInsert = editItems.map((item) => ({
        transaction_id: editingTransactionId,
        item_type: item.item_type,
        weight_kg: parseFloat(item.weight_kg),
        price_per_kg: parseFloat(item.price_per_kg),
        total_value: parseFloat(item.weight_kg) * parseFloat(item.price_per_kg),
        created_at: createdAt,
      }));

      const { error: insertError } = await supabase
        .from("deposit_items")
        .insert(itemsToInsert);

      if (insertError) throw insertError;

      toast.success("Data penyetoran berhasil diubah");
      setValidationModal({ ...validationModal, isOpen: false });
      setPendingData(null);
      handleEditCancel();
      reset();
      fetchDeposits();
    } catch (error) {
      console.error("Error updating deposit:", error);
      toast.error("Gagal mengubah data penyetoran");
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    let csvContent = "";

    deposits.forEach((transaction) => {
      transaction.deposit_items.forEach((item) => {
        csvContent += `${new Date(transaction.created_at).toLocaleDateString(
          "id-ID"
        )},${transaction.depositor_name},${item.item_type},${item.weight_kg},${
          item.price_per_kg
        },${item.total_value}\n`;
      });
    });

    const header =
      "Tanggal,Nama Penyetor,Jenis Barang,Berat (kg),Harga/kg,Total Nilai\n";
    const blob = new Blob([header + csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "data_penyetoran.csv";
    link.click();
  };

  // Filter deposits based on search criteria
  const filteredDeposits = deposits.filter((transaction) => {
    const matchesName = transaction.depositor_name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const depositDate = new Date(transaction.created_at);
    const matchesDateRange =
      (!startDate || depositDate >= new Date(startDate)) &&
      (!endDate || depositDate <= new Date(endDate));
    return matchesName && matchesDateRange;
  });

  const totalTransactions = filteredDeposits.length;
  const totalWeight = filteredDeposits.reduce(
    (sum, transaction) => sum + transaction.total_weight_kg,
    0
  );
  const totalValue = filteredDeposits.reduce(
    (sum, transaction) => sum + transaction.total_value,
    0
  );

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="stats-card">
          <div className="stats-value">{totalTransactions}</div>
          <div className="stats-label">Total Transaksi</div>
        </div>
        <div className="stats-card">
          <div className="stats-value">{totalWeight.toFixed(2)} kg</div>
          <div className="stats-label">Total Berat Sampah</div>
        </div>
        <div className="stats-card">
          <div className="stats-value">
            Rp {totalValue.toLocaleString("id-ID")}
          </div>
          <div className="stats-label">Total Nilai</div>
        </div>
      </div>

      {/* Deposit Form */}
      <div className="card mb-8">
        <div className="card-header">
          <h2 className="card-title">Form Input Penyetoran Sampah</h2>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Part 1: Nama Penyetor dan Waktu Stor */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold mb-4">
              Bagian 1: Informasi Penyetor
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Nama Penyetor</label>
                <input
                  {...register("depositor_name", {
                    required: "Nama penyetor wajib diisi",
                  })}
                  className="form-input"
                  placeholder="Nama lengkap penyetor"
                />
                {errors.depositor_name && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.depositor_name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="form-label">Waktu Stor (Tanggal & Jam)</label>
                <input
                  type="date"
                  {...register("created_at")}
                  className="form-input"
                />
                <p className="text-gray-500 text-sm mt-1">
                  Biarkan kosong untuk menggunakan waktu saat ini
                </p>
              </div>
            </div>
          </div>

          {/* Part 2: Detail Barang */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Bagian 2: Detail Barang</h3>
              <button
                type="button"
                onClick={addItem}
                className="btn-secondary text-sm"
              >
                + Tambah Barang
              </button>
            </div>

            {items.length === 0 ? (
              <p className="text-gray-500 italic mb-4">
                Klik "Tambah Barang" untuk menambahkan jenis barang
              </p>
            ) : (
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-4 bg-gray-50 space-y-4"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium text-gray-700">
                        Barang #{index + 1}
                      </h4>
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="btn-danger text-sm"
                      >
                        Hapus
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="form-label">Jenis Barang</label>
                        <select
                          value={item.item_type}
                          onChange={(e) =>
                            updateItem(index, "item_type", e.target.value)
                          }
                          className="form-input"
                        >
                          <option value="">Pilih jenis barang</option>
                          <option value="Botol/Gelas Plastik Minuman">
                            Botol/Gelas Plastik Minuman
                          </option>
                          <option value="Kardus">Kardus</option>
                          <option value="Buku">Buku</option>
                          <option value="Logam/Besi">Logam/Besi</option>
                          <option value="Emberan/Campuran">
                            Emberan/Campuran
                          </option>
                          <option value="Elektronik">Elektronik</option>
                        </select>
                        {!item.item_type && (
                          <p className="text-red-500 text-sm mt-1">
                            Jenis barang wajib dipilih
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="form-label">Berat (kg)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={item.weight_kg}
                          onChange={(e) =>
                            updateItem(index, "weight_kg", e.target.value)
                          }
                          className="form-input"
                          placeholder="0.00"
                        />
                        {!item.weight_kg && (
                          <p className="text-red-500 text-sm mt-1">
                            Berat wajib diisi
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="form-label">Harga per kg (Rp)</label>
                        <input
                          type="number"
                          value={item.price_per_kg}
                          onChange={(e) =>
                            updateItem(index, "price_per_kg", e.target.value)
                          }
                          className="form-input"
                          placeholder="0"
                        />
                        {!item.price_per_kg && (
                          <p className="text-red-500 text-sm mt-1">
                            Harga wajib diisi
                          </p>
                        )}
                      </div>
                    </div>

                    {item.weight_kg && item.price_per_kg && (
                      <div className="bg-white p-3 rounded border border-blue-200">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Total:</span> Rp{" "}
                          {(item.weight_kg * item.price_per_kg).toLocaleString(
                            "id-ID"
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || items.length === 0}
            className="btn-primary w-full md:w-auto"
          >
            {loading ? "Memproses..." : "Simpan Penyetoran"}
          </button>
        </form>
      </div>

      {/* Search Section */}
      <div className="card mb-6">
        <div className="card-header">
          <h2 className="card-title">Pencarian Riwayat Penyetoran</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="form-label">Cari Nama Penyetor</label>
            <input
              type="text"
              placeholder="Masukkan nama penyetor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
            />
          </div>
          <div>
            <label className="form-label">Tanggal Mulai</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="form-input"
            />
          </div>
          <div>
            <label className="form-label">Tanggal Akhir</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="form-input"
            />
          </div>
        </div>
      </div>

      {/* Deposits Table */}
      <div className="card">
        <div className="card-header flex justify-between items-center">
          <h2 className="card-title">Riwayat Penyetoran</h2>
          <div className="flex space-x-2">
            <button onClick={exportToCSV} className="btn-secondary text-sm">
              Export CSV
            </button>
          </div>
        </div>

        <div className="table-container table-scrollable">
          <table className="table table-fixed-header">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Tanggal</th>
                <th className="table-header-cell">Nama Penyetor</th>
                <th className="table-header-cell">Jenis Barang</th>
                <th className="table-header-cell">Total Berat (kg)</th>
                <th className="table-header-cell">Total Nilai</th>
                <th className="table-header-cell">Aksi</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {filteredDeposits.length === 0 ? (
                <tr className="table-row">
                  <td
                    colSpan="6"
                    className="table-cell text-center py-8 text-gray-500"
                  >
                    Data tidak ditemukan
                  </td>
                </tr>
              ) : (
                filteredDeposits.map((transaction) => (
                  <tr key={transaction.id} className="table-row">
                    <td className="table-cell">
                      {new Date(transaction.created_at).toLocaleDateString(
                        "id-ID"
                      )}
                    </td>
                    <td className="table-cell">{transaction.depositor_name}</td>
                    <td className="table-cell">
                      <div className="text-sm">
                        {transaction.deposit_items.map((item, idx) => (
                          <div key={idx} className="mb-1">
                            -{item.item_type} ({item.weight_kg} kg @ Rp{" "}
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
                    <td className="table-cell">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(transaction)}
                          className="btn-outline text-sm text-white bg-blue-600 hover:bg-green-500"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(transaction)}
                          className="btn-danger text-sm"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditMode && selectedDeposit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full m-4">
            <h3 className="text-lg font-semibold mb-4">Edit Penyetoran</h3>
            <form
              onSubmit={handleSubmit((data) => handleEditSubmit(data))}
              className="space-y-4"
            >
              {/* Part 1: Nama Penyetor dan Waktu Stor */}
              <div className="border-b pb-4">
                <h4 className="font-semibold mb-3">Informasi Penyetor</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Nama Penyetor</label>
                    <input
                      {...register("depositor_name", {
                        required: "Nama penyetor wajib diisi",
                      })}
                      defaultValue={selectedDeposit.depositor_name}
                      className="form-input"
                      placeholder="Nama lengkap penyetor"
                    />
                    {errors.depositor_name && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.depositor_name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="form-label">Waktu Stor</label>
                    <input
                      type="date"
                      {...register("created_at")}
                      defaultValue={
                        selectedDeposit.created_at
                          ? new Date(selectedDeposit.created_at)
                              .toISOString()
                              .split("T")[0]
                          : ""
                      }
                      className="form-input"
                    />
                  </div>
                </div>
              </div>

              {/* Part 2: Items */}
              <div className="border-b pb-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold">Jenis Barang</h4>
                  <button
                    type="button"
                    onClick={addEditItem}
                    className="btn-secondary text-sm"
                  >
                    + Tambah Barang
                  </button>
                </div>

                {editItems.length === 0 ? (
                  <p className="text-gray-500 text-sm">Tidak ada barang</p>
                ) : (
                  editItems.map((item, index) => (
                    <div
                      key={index}
                      className="mb-4 p-3 border rounded bg-gray-50"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="form-label text-sm">
                            Jenis Barang
                          </label>
                          <select
                            value={item.item_type || ""}
                            onChange={(e) =>
                              handleEditItemChange(
                                index,
                                "item_type",
                                e.target.value
                              )
                            }
                            className="form-input text-sm"
                          >
                            <option value="">Pilih jenis barang</option>
                            <option value="Botol/Gelas Plastik Minuman">
                              Botol/Gelas Plastik Minuman
                            </option>
                            <option value="Kardus">Kardus</option>
                            <option value="Buku">Buku</option>
                            <option value="Logam/Besi">Logam/Besi</option>
                            <option value="Emberan/Campuran">
                              Emberan/Campuran
                            </option>
                            <option value="Elektronik">Elektronik</option>
                          </select>
                        </div>

                        <div>
                          <label className="form-label text-sm">
                            Berat (kg)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={item.weight_kg || ""}
                            onChange={(e) =>
                              handleEditItemChange(
                                index,
                                "weight_kg",
                                e.target.value
                              )
                            }
                            className="form-input text-sm"
                            placeholder="0"
                          />
                        </div>

                        <div>
                          <label className="form-label text-sm">Harga/kg</label>
                          <input
                            type="number"
                            step="0.01"
                            value={item.price_per_kg || ""}
                            onChange={(e) =>
                              handleEditItemChange(
                                index,
                                "price_per_kg",
                                e.target.value
                              )
                            }
                            className="form-input text-sm"
                            placeholder="0"
                          />
                        </div>
                      </div>

                      {item.weight_kg && item.price_per_kg && (
                        <div className="bg-white p-2 rounded border border-blue-200 mt-2">
                          <p className="text-xs text-gray-700">
                            <span className="font-medium">Total:</span> Rp{" "}
                            {(
                              item.weight_kg * item.price_per_kg
                            ).toLocaleString("id-ID")}
                          </p>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => removeEditItem(index)}
                        className="btn-danger text-xs mt-2"
                      >
                        Hapus Item
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Buttons */}
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={handleEditCancel}
                  className="btn-outline flex-1 hover:bg-red-500 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading || editItems.length === 0}
                  className="btn-primary flex-1"
                >
                  {loading ? "Memproses..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Validation Confirmation Modal */}
      <ConfirmationModal
        isOpen={validationModal.isOpen}
        title={validationModal.title}
        message={validationModal.message}
        actionLabel={validationModal.actionLabel}
        isDangerous={validationModal.isDangerous}
        isLoading={loading}
        onConfirm={handleValidationConfirm}
        onCancel={handleValidationCancel}
      />
    </div>
  );
};

export default AdminDashboard;
