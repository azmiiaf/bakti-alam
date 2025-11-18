# Database Schema Update Notes

## Perubahan Form AdminDashboard

Anda telah membuat form penyetoran sampah yang baru dengan struktur:

### Bagian 1: Informasi Penyetor

- Nama Penyetor
- Waktu Stor (Tanggal & Jam)

### Bagian 2: Detail Barang

- Jenis Barang (dapat ditambahkan multiple)
- Berat (kg)
- Harga per kg

## Database Schema Saat Ini

Database `deposits` table sudah mendukung struktur ini karena:

```sql
CREATE TABLE deposits (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    depositor_name TEXT NOT NULL,
    item_type TEXT NOT NULL CHECK (item_type IN ('Botol/Gelas Plastik Minuman', 'Kardus', 'Buku', 'Logam/Besi', 'Emberan/Campuran', 'Elektronik')),
    weight_kg DECIMAL(10,2) NOT NULL,
    price_per_kg DECIMAL(10,2) NOT NULL,
    total_value DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    admin_id UUID
);
```

## Cara Kerja Baru

1. Admin mengisi:
   - **Nama Penyetor**: misal "Budi"
   - **Waktu Stor**: misal "19-11-2025 14:30"
2. Admin klik "Tambah Barang" dan mengisi:

   - **Barang 1**: Kardus, 5 kg, Rp 1500/kg = Rp 7500
   - **Barang 2**: Logam/Besi, 3 kg, Rp 5000/kg = Rp 15000
   - **Barang 3**: Elektronik, 2 kg, Rp 8000/kg = Rp 16000

3. Setelah klik "Simpan Penyetoran", akan membuat 3 records di database:

| ID    | Nama Penyetor | Item Type  | Weight | Price/kg | Total | Created At       |
| ----- | ------------- | ---------- | ------ | -------- | ----- | ---------------- |
| uuid1 | Budi          | Kardus     | 5      | 1500     | 7500  | 19-11-2025 14:30 |
| uuid2 | Budi          | Logam/Besi | 3      | 5000     | 15000 | 19-11-2025 14:30 |
| uuid3 | Budi          | Elektronik | 2      | 8000     | 16000 | 19-11-2025 14:30 |

## Fitur Baru di Form

✅ Multiple Items: Dapat menambahkan beberapa jenis barang dalam satu kali penyetoran
✅ Total Preview: Setiap barang menampilkan total nilai secara real-time
✅ Remove Item: Dapat menghapus barang yang sudah ditambahkan
✅ Validation: Wajib isi semua field dan minimal 1 barang
✅ Same Timestamp: Semua barang dalam satu penyetoran memiliki created_at yang sama

## CSV Export

Struktur CSV tetap sama:

```
Tanggal,Nama Penyetor,Jenis Barang,Berat (kg),Harga/kg,Total Nilai
19-11-2025,Budi,Kardus,5,1500,7500
19-11-2025,Budi,Logam/Besi,3,5000,15000
19-11-2025,Budi,Elektronik,2,8000,16000
```

## Reports Page

Reports tetap menampilkan semua data dengan benar karena:

- Laporan Bulanan: Mengelompokkan berdasarkan bulan, menampilkan 6 item type
- Laporan Tahunan: Mengelompokkan berdasarkan tahun, menampilkan 6 item type

Setiap record yang dibuat dari multiple items akan dihitung secara terpisah dalam laporan.

## Tidak Perlu Perubahan di SQL

Schema yang ada di `supabase_schema_simple.sql` sudah kompatibel dengan struktur baru.
Tidak perlu melakukan alter table atau perubahan apapun di database.
