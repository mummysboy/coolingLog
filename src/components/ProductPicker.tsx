'use client';

import { useState } from 'react';
import { useLogStore } from '@/stores/logStore';
import { PRODUCTS, SUPPLIERS, PACKAGING_TYPES } from '@/lib/types';

export function ProductPicker() {
  const { currentLog, updateLogField } = useLogStore();
  const [customProduct, setCustomProduct] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleProductSelect = (product: string) => {
    if (product === 'Other') {
      setShowCustomInput(true);
      updateLogField('product', '');
    } else {
      setShowCustomInput(false);
      updateLogField('product', product);
    }
  };

  const handleCustomProductSave = () => {
    if (customProduct.trim()) {
      updateLogField('product', customProduct.trim());
      setShowCustomInput(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Shift Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Shift
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(['morning', 'afternoon', 'evening', 'overnight'] as const).map((shift) => (
            <button
              key={shift}
              onClick={() => updateLogField('shift', shift)}
              className={`touch-target py-3 px-4 rounded-xl border-2 font-medium transition-all capitalize ${
                currentLog?.shift === shift
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
              }`}
            >
              {shift}
            </button>
          ))}
        </div>
      </div>

      {/* Product Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Select Product
        </label>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {PRODUCTS.map((product) => (
            <button
              key={product}
              onClick={() => handleProductSelect(product)}
              className={`touch-target flex-shrink-0 px-6 py-3 rounded-xl border-2 font-medium transition-all ${
                currentLog?.product === product
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
              }`}
            >
              {product}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Product Input */}
      {showCustomInput && (
        <div className="bg-gray-50 rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enter Custom Product
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={customProduct}
              onChange={(e) => setCustomProduct(e.target.value)}
              placeholder="Type product name..."
              className="flex-1 px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
              autoFocus
            />
            <button
              onClick={handleCustomProductSave}
              disabled={!customProduct.trim()}
              className="touch-target px-6 py-3 bg-blue-600 text-white rounded-xl font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Product Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Product Code */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Product Code
          </label>
          <input
            type="text"
            value={currentLog?.productCode || ''}
            onChange={(e) => updateLogField('productCode', e.target.value)}
            placeholder="e.g., CHK-001"
            className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Supplier */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Supplier
          </label>
          <select
            value={currentLog?.supplier || ''}
            onChange={(e) => updateLogField('supplier', e.target.value)}
            className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
          >
            <option value="">Select Supplier</option>
            {SUPPLIERS.map((supplier) => (
              <option key={supplier} value={supplier}>
                {supplier}
              </option>
            ))}
          </select>
        </div>

        {/* Received Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Received Date
          </label>
          <input
            type="date"
            value={currentLog?.receivedDate?.toISOString().split('T')[0] || ''}
            onChange={(e) => updateLogField('receivedDate', new Date(e.target.value))}
            className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Expiration Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Expiration Date
          </label>
          <input
            type="date"
            value={currentLog?.expirationDate?.toISOString().split('T')[0] || ''}
            onChange={(e) => updateLogField('expirationDate', new Date(e.target.value))}
            className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Batch Size */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Batch Size (lbs)
          </label>
          <input
            type="number"
            value={currentLog?.batchSize || ''}
            onChange={(e) => updateLogField('batchSize', parseFloat(e.target.value) || 0)}
            placeholder="Enter batch size"
            className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Packaging Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Packaging Type
          </label>
          <select
            value={currentLog?.packagingType || ''}
            onChange={(e) => updateLogField('packagingType', e.target.value)}
            className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
          >
            <option value="">Select Packaging</option>
            {PACKAGING_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Thermometer Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Thermometer #
          </label>
          <input
            type="text"
            value={currentLog?.thermometerNumber || ''}
            onChange={(e) => updateLogField('thermometerNumber', e.target.value)}
            placeholder="Enter thermometer number"
            className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Lot Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Lot #
          </label>
          <input
            type="text"
            value={currentLog?.lotNumber || ''}
            onChange={(e) => updateLogField('lotNumber', e.target.value)}
            placeholder="Enter lot number"
            className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Employee Information */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Employee Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-blue-700 mb-1">
              Employee Name
            </label>
            <p className="text-blue-900 font-medium">{currentLog?.employeeName}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-blue-700 mb-1">
              Employee ID
            </label>
            <p className="text-blue-900 font-medium">{currentLog?.employeeId}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-blue-700 mb-1">
              Initials
            </label>
            <p className="text-blue-900 font-medium">{currentLog?.employeeInitials}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
