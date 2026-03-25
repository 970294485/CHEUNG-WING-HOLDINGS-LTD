"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { deleteProduct } from "@/lib/server/actions";

type Product = {
  id: string;
  sku: string;
  name: string;
  barcode: string | null;
  description: string | null;
  price: any;
  cost: any;
  attributes: any;
  updatedAt: Date;
};

type ParsedProduct = {
  id: string;
  sku: string;
  name: string;
  barcode: string;
  description: string;
  price: number;
  cost: number;
  category: string;
  subCategory: string;
  packaging: string;
  specs: string;
  customAttributes: string;
  bom: string;
  pricingTiers: string;
  updatedAt: Date;
};

export function ProductListClient({ products: initialProducts }: { products: Product[] }) {
  // Parse and flatten product data
  const products: ParsedProduct[] = useMemo(() => {
    return initialProducts.map((p) => {
      let attr: any = {};
      if (p.attributes) {
        try {
          attr = typeof p.attributes === "string" ? JSON.parse(p.attributes) : p.attributes;
        } catch (e) {}
      }

      // Format specs
      const specsObj = attr.specs || {};
      const specsStr = Object.entries(specsObj).map(([k, v]) => `${k}: ${v}`).join("\n");

      // Format custom attributes
      const customObj = attr.customAttributes || {};
      const customStr = Object.entries(customObj).map(([k, v]) => `${k}: ${v}`).join("\n");

      // Format BOM
      const bomArr = Array.isArray(attr.bom) ? attr.bom : [];
      const bomStr = bomArr.map((b: any) => `${b.name} (${b.quantity}${b.unit})`).join("\n");

      // Format pricing tiers
      const tiersArr = Array.isArray(attr.pricingTiers) ? attr.pricingTiers : [];
      const tiersStr = tiersArr.map((t: any) => `${t.name}: $${t.price}`).join("\n");

      return {
        id: p.id,
        sku: p.sku,
        name: p.name,
        barcode: p.barcode || "",
        description: p.description || "",
        price: Number(p.price || 0),
        cost: Number(p.cost || 0),
        category: attr.category || "",
        subCategory: attr.subCategory || "",
        packaging: attr.packaging || "",
        specs: specsStr,
        customAttributes: customStr,
        bom: bomStr,
        pricingTiers: tiersStr,
        updatedAt: p.updatedAt,
      };
    });
  }, [initialProducts]);

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Extract unique categories for filter
  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = categoryFilter === "" || p.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, categoryFilter]);

  const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage]);

  const handleDelete = async (id: string) => {
    if (confirm("確定要刪除此產品嗎？此操作無法恢復。")) {
      try {
        await deleteProduct(id);
        alert("刪除成功");
        // Note: the page will be revalidated by the server action
      } catch (error) {
        console.error(error);
        alert("刪除失敗，可能存在關聯數據");
      }
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">產品列表</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            管理所有產品，支持增刪查改及詳細信息展示。
          </p>
        </div>
        <Link
          href="/products/basic-info"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          + 新增產品
        </Link>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap gap-4">
          <div className="relative w-full max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="搜索名稱、SKU 或描述..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-md border border-zinc-300 pl-9 pr-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
            />
          </div>
          
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full max-w-xs rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
          >
            <option value="">所有分類</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="min-w-full text-left text-sm relative">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3 whitespace-nowrap">SKU / 條碼</th>
              <th className="px-4 py-3 min-w-[150px]">名稱 / 描述</th>
              <th className="px-4 py-3 whitespace-nowrap">分類 / 包裝</th>
              <th className="px-4 py-3 min-w-[150px]">規格 / 屬性</th>
              <th className="px-4 py-3 min-w-[150px]">配件 BOM</th>
              <th className="px-4 py-3 min-w-[150px]">價格 / 成本</th>
              <th className="px-4 py-3 text-center whitespace-nowrap">操作</th>
            </tr>
          </thead>
          <tbody>
            {paginatedProducts.map((p) => (
              <tr key={p.id} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                <td className="px-4 py-3">
                  <div className="font-mono text-xs font-medium text-zinc-900 dark:text-zinc-100">{p.sku}</div>
                  {p.barcode && <div className="text-xs text-zinc-500 mt-1">{p.barcode}</div>}
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-zinc-900 dark:text-zinc-100">{p.name}</div>
                  {p.description && <div className="text-xs text-zinc-500 mt-1 line-clamp-2" title={p.description}>{p.description}</div>}
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                  {p.category && <div>{p.category} {p.subCategory && `> ${p.subCategory}`}</div>}
                  {p.packaging && <div className="text-xs mt-1">📦 {p.packaging}</div>}
                  {!p.category && !p.packaging && "—"}
                </td>
                <td className="px-4 py-3 text-xs text-zinc-600 dark:text-zinc-400">
                  {p.specs && <div className="whitespace-pre-line mb-2"><span className="font-semibold text-zinc-800 dark:text-zinc-200">規格:</span><br/>{p.specs}</div>}
                  {p.customAttributes && <div className="whitespace-pre-line"><span className="font-semibold text-zinc-800 dark:text-zinc-200">自定義:</span><br/>{p.customAttributes}</div>}
                  {!p.specs && !p.customAttributes && "—"}
                </td>
                <td className="px-4 py-3 text-xs text-zinc-600 dark:text-zinc-400 whitespace-pre-line">
                  {p.bom || "—"}
                </td>
                <td className="px-4 py-3 text-xs">
                  <div className="flex justify-between mb-1">
                    <span className="text-zinc-500">售價:</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">${p.price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-zinc-500">成本:</span>
                    <span className="text-zinc-600 dark:text-zinc-400">${p.cost.toFixed(2)}</span>
                  </div>
                  {p.pricingTiers && (
                    <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 whitespace-pre-line text-zinc-500">
                      {p.pricingTiers}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-center align-top">
                  <div className="flex flex-col items-center gap-2">
                    <Link
                      href={`/products/basic-info?id=${p.id}`}
                      className="w-full rounded border border-zinc-200 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      編輯基礎
                    </Link>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="w-full rounded border border-red-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                      刪除
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {paginatedProducts.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-zinc-500">
                  沒有找到匹配的產品
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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
