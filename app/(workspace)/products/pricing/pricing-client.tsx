"use client";

import { useState, useMemo } from "react";
import { batchUpdateProductPricing } from "@/lib/server/actions";

type Product = {
  id: string;
  sku: string;
  name: string;
  price: any;
  cost: any;
  attributes: any;
};

type ParsedProduct = {
  id: string;
  sku: string;
  name: string;
  price: number;
  cost: number;
  attributes: any;
};

export function PricingClient({ products: initialProducts }: { products: Product[] }) {
  const [products, setProducts] = useState<ParsedProduct[]>(() =>
    initialProducts.map((p) => ({
      ...p,
      price: Number(p.price || 0),
      cost: Number(p.cost || 0),
      attributes: p.attributes
        ? typeof p.attributes === "string"
          ? JSON.parse(p.attributes)
          : p.attributes
        : {},
    }))
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  // Batch operations state
  const [batchTarget, setBatchTarget] = useState<"price" | "cost">("price");
  const [batchOp, setBatchOp] = useState<"discount" | "increase" | "decrease" | "set">("discount");
  const [batchValue, setBatchValue] = useState<number>(0);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage]);

  // Handle inline edit
  const handlePriceChange = (id: string, field: "price" | "cost", value: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  // Handle selection
  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedProducts.length && paginatedProducts.length > 0) {
      // Deselect all on current page
      const newSelected = new Set(selectedIds);
      paginatedProducts.forEach((p) => newSelected.delete(p.id));
      setSelectedIds(newSelected);
    } else {
      // Select all on current page
      const newSelected = new Set(selectedIds);
      paginatedProducts.forEach((p) => newSelected.add(p.id));
      setSelectedIds(newSelected);
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // Apply batch operation
  const applyBatchOperation = () => {
    if (selectedIds.size === 0) {
      alert("請先選擇要操作的產品");
      return;
    }
    if (isNaN(batchValue)) return;

    setProducts((prev) =>
      prev.map((p) => {
        if (!selectedIds.has(p.id)) return p;

        let currentValue = p[batchTarget];
        let newValue = currentValue;

        switch (batchOp) {
          case "discount":
            // e.g., 10% off -> multiply by 0.9
            newValue = currentValue * (1 - batchValue / 100);
            break;
          case "increase":
            newValue = currentValue + batchValue;
            break;
          case "decrease":
            newValue = Math.max(0, currentValue - batchValue);
            break;
          case "set":
            newValue = Math.max(0, batchValue);
            break;
        }

        // Round to 2 decimal places
        newValue = Math.round(newValue * 100) / 100;

        return { ...p, [batchTarget]: newValue };
      })
    );
  };

  // Save changes
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updates = products.map((p) => ({
        id: p.id,
        price: p.price,
        cost: p.cost,
        attributes: p.attributes,
      }));
      await batchUpdateProductPricing(updates);
      alert("保存成功！");
    } catch (error) {
      console.error(error);
      alert("保存失敗");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">產品價格管理</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            批量管理所有產品的基礎售價與成本。
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-md bg-zinc-900 px-6 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {isSaving ? "保存中..." : "保存所有更改"}
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 max-w-xs">
          <input
            type="text"
            placeholder="搜索名稱或 SKU..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mr-2">
            批量操作:
          </div>
          <select
            value={batchTarget}
            onChange={(e) => setBatchTarget(e.target.value as "price" | "cost")}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
          >
            <option value="price">售價</option>
            <option value="cost">成本</option>
          </select>
          <select
            value={batchOp}
            onChange={(e) => setBatchOp(e.target.value as any)}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
          >
            <option value="discount">打折 (%)</option>
            <option value="increase">增加數值</option>
            <option value="decrease">減少數值</option>
            <option value="set">設置為</option>
          </select>
          <input
            type="number"
            min="0"
            step="0.01"
            value={batchValue}
            onChange={(e) => setBatchValue(Number(e.target.value))}
            className="w-24 rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
          />
          <button
            onClick={applyBatchOperation}
            className="rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
          >
            應用到已選
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3 w-12 text-center">
                <input
                  type="checkbox"
                  checked={
                    paginatedProducts.length > 0 &&
                    paginatedProducts.every((p) => selectedIds.has(p.id))
                  }
                  onChange={toggleSelectAll}
                  className="rounded border-zinc-300 dark:border-zinc-600"
                />
              </th>
              <th className="px-4 py-3">產品信息 (SKU / 名稱)</th>
              <th className="px-4 py-3 w-48">成本 (Cost)</th>
              <th className="px-4 py-3 w-48">售價 (Price)</th>
            </tr>
          </thead>
          <tbody>
            {paginatedProducts.map((p) => (
              <tr key={p.id} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                <td className="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(p.id)}
                    onChange={() => toggleSelect(p.id)}
                    className="rounded border-zinc-300 dark:border-zinc-600"
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-zinc-900 dark:text-zinc-100">{p.name}</div>
                  <div className="text-xs text-zinc-500 font-mono mt-0.5">{p.sku}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500 text-sm">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={p.cost}
                      onChange={(e) => handlePriceChange(p.id, "cost", Number(e.target.value))}
                      className="w-full rounded-md border border-zinc-300 pl-7 pr-3 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                    />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500 text-sm">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={p.price}
                      onChange={(e) => handlePriceChange(p.id, "price", Number(e.target.value))}
                      className="w-full rounded-md border border-zinc-300 pl-7 pr-3 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                    />
                  </div>
                </td>
              </tr>
            ))}
            {paginatedProducts.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-zinc-500">
                  沒有找到匹配的產品
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-zinc-500">
            顯示 {((currentPage - 1) * pageSize) + 1} 到 {Math.min(currentPage * pageSize, filteredProducts.length)} 條，共 {filteredProducts.length} 條
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded-md border border-zinc-200 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-zinc-700"
            >
              上一頁
            </button>
            <div className="flex items-center px-3 text-sm font-medium">
              {currentPage} / {totalPages}
            </div>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="rounded-md border border-zinc-200 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-zinc-700"
            >
              下一頁
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
