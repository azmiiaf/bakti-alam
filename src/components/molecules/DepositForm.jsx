import React from 'react'
import { useForm } from 'react-hook-form'
import Input from '../atoms/Input'
import Button from '../atoms/Button'

const DepositForm = ({ onSubmit, loading }) => {
  const { register, handleSubmit, formState: { errors } } = useForm()

  const handleFormSubmit = (data) => {
    const totalValue = data.weight_kg * data.price_per_kg
    onSubmit({ ...data, total_value: totalValue })
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Nama Penyetor"
          {...register('depositor_name', { required: 'Nama penyetor wajib diisi' })}
          error={errors.depositor_name?.message}
          placeholder="Nama lengkap penyetor"
        />

        <div>
          <label className="form-label">Jenis Barang</label>
          <select
            {...register('item_type', { required: 'Jenis barang wajib dipilih' })}
            className="form-input"
          >
            <option value="">Pilih jenis barang</option>
            <option value="plastik">Plastik</option>
            <option value="kertas">Kertas</option>
            <option value="logam">Logam</option>
            <option value="elektronik">Elektronik</option>
          </select>
          {errors.item_type && (
            <p className="text-red-500 text-sm mt-1">{errors.item_type.message}</p>
          )}
        </div>

        <Input
          label="Berat (kg)"
          type="number"
          step="0.01"
          {...register('weight_kg', { 
            required: 'Berat wajib diisi',
            min: { value: 0.01, message: 'Berat harus lebih dari 0' }
          })}
          error={errors.weight_kg?.message}
          placeholder="0.00"
        />

        <Input
          label="Harga per kg (Rp)"
          type="number"
          step="100"
          {...register('price_per_kg', { 
            required: 'Harga wajib diisi',
            min: { value: 1, message: 'Harga harus lebih dari 0' }
          })}
          error={errors.price_per_kg?.message}
          placeholder="0"
        />
      </div>

      <Button
        type="submit"
        loading={loading}
        className="w-full md:w-auto"
      >
        {loading ? 'Memproses...' : 'Simpan Penyetoran'}
      </Button>
    </form>
  )
}

export default DepositForm