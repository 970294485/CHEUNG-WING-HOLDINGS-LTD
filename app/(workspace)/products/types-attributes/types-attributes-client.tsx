"use client";

import { useState } from "react";
import { updateProductTypesAttributes } from "@/lib/server/actions";

type Product = {
  id: string;
  sku: string;
  name: string;
  attributes: any;
};

export function TypesAttributesClient({ products }: { products: Product[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || "");
  const [isSaving, setIsSaving] = useState(false);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  // Helper to parse attributes
  const getParsedAttributes = (product: Product | undefined) => {
    if (!product?.attributes) return {};
    try {
      return typeof product.attributes === 'string' 
        ? JSON.parse(product.attributes) 
        : product.attributes;
    } catch (e) {
      return {};
    }
  };

  const initialAttr = getParsedAttributes(selectedProduct);

  // Local state for editing
  const [category, setCategory] = useState(initialAttr.category || "");
  const [subCategory, setSubCategory] = useState(initialAttr.subCategory || "");
  const [packaging, setPackaging] = useState(initialAttr.packaging || "");
  
  const [customAttributes, setCustomAttributes] = useState<{ key: string; value: string }[]>(() => {
    const custom = initialAttr.customAttributes || {};
    return Object.entries(custom).map(([key, value]) => ({ key, value: String(value) }));
  });

  type BOMItem = { id: string; name: string; quantity: number; unit: string; notes: string; };
  const [bomItems, setBomItems] = useState<BOMItem[]>(() => {
    return Array.isArray(initialAttr.bom) ? initialAttr.bom : [];
  });

  // Handle product change
  const handleProductChange = (productId: string) => {
    setSelectedProductId(productId);
    const product = products.find((p) => p.id === productId);
    if (product) {
      const attr = getParsedAttributes(product);
      setCategory(attr.category || "");
      setSubCategory(attr.subCategory || "");
      setPackaging(attr.packaging || "");
      
      const custom = attr.customAttributes || {};
      setCustomAttributes(Object.entries(custom).map(([key, value]) => ({ key, value: String(value) })));
      
      setBomItems(Array.isArray(attr.bom) ? attr.bom : []);
    }
  };

  const handleSave = async () => {
    if (!selectedProduct) return;
    setIsSaving(true);
    try {
      const customObj = customAttributes.reduce((acc, curr) => {
        if (curr.key.trim()) {
          acc[curr.key.trim()] = curr.value.trim();
        }
        return acc;
      }, {} as Record<string, string>);

      const validBom = bomItems.filter(item => item.name.trim() !== "");

      const typesData = {
        category,
        subCategory,
        packaging,
        customAttributes: customObj,
        bom: validBom
      };

      await updateProductTypesAttributes(selectedProduct.id, typesData);
      alert("保存成功！");
    } catch (error) {
      console.error(error);
      alert("保存失敗");
    } finally {
      setIsSaving(false);
    }
  };

  const addBomItem = () => {
    setBomItems([
      ...bomItems,
      { id: crypto.randomUUID(), name: "", quantity: 1, unit: "件", notes: "" }
    ]);
  };

  const updateBomItem = (index: number, field: keyof BOMItem, value: any) => {
    const newItems = [...bomItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setBomItems(newItems);
  };

  const removeBomItem = (index: number) => {
    const newItems = [...bomItems];
    newItems.splice(index, 1);
    setBomItems(newItems);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">類型 / 屬性 / 包裝 / 配件</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          管理產品的分類、子分類、包裝方式、配件BOM及其他自定義屬性。
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
        {/* Product List Sidebar */}
        <div className="md:col-span-1 space-y-4">
          <h3 className="text-sm font-medium">選擇產品</h3>
          
          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="搜索名稱或 SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
            />
          </div>

          <div className="flex flex-col gap-2 max-h-[600px] overflow-y-auto pr-2">
            {filteredProducts.map((p) => (
              <button
                key={p.id}
                onClick={() => handleProductChange(p.id)}
                className={`text-left px-4 py-3 rounded-lg border text-sm transition-colors ${
                  selectedProductId === p.id
                    ? "border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-800"
                    : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                }`}
              >
                <div className="font-medium">{p.name}</div>
                <div className="text-xs text-zinc-500 mt-1">{p.sku}</div>
              </button>
            ))}
            {filteredProducts.length === 0 && (
              <div className="text-sm text-zinc-500 p-4 border border-dashed rounded-lg text-center">
                {searchQuery ? "未找到匹配的產品" : "暫無產品"}
              </div>
            )}
          </div>
        </div>

        {/* Edit Form */}
        <div className="md:col-span-3 space-y-6">
          {selectedProduct ? (
            <>
              {/* Types & Packaging Section */}
              <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                <h3 className="text-sm font-semibold mb-4">基本分類與包裝</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-zinc-500">類型 (Category)</label>
                    <input
                      type="text"
                      placeholder="例如: 家具"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-xs text-zinc-500">子類型 (Sub-Category)</label>
                    <input
                      type="text"
                      placeholder="例如: 辦公椅"
                      value={subCategory}
                      onChange={(e) => setSubCategory(e.target.value)}
                      className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs text-zinc-500">包裝方式 (Packaging)</label>
                    <input
                      type="text"
                      placeholder="例如: 紙箱包裝 (1件/箱)"
                      value={packaging}
                      onChange={(e) => setPackaging(e.target.value)}
                      className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                    />
                  </div>
                </div>
              </section>

              {/* Custom Attributes Section */}
              <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold">其他自定義屬性</h3>
                  <button
                    onClick={() => setCustomAttributes([...customAttributes, { key: "", value: "" }])}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    + 添加屬性
                  </button>
                </div>
                
                <div className="space-y-3">
                  {customAttributes.map((attr, index) => (
                    <div key={index} className="flex gap-3 items-start">
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="屬性名稱 (例: 材質, 產地)"
                          value={attr.key}
                          onChange={(e) => {
                            const newAttrs = [...customAttributes];
                            newAttrs[index].key = e.target.value;
                            setCustomAttributes(newAttrs);
                          }}
                          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="屬性值 (例: 實木, 中國)"
                          value={attr.value}
                          onChange={(e) => {
                            const newAttrs = [...customAttributes];
                            newAttrs[index].value = e.target.value;
                            setCustomAttributes(newAttrs);
                          }}
                          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                        />
                      </div>
                      <button
                        onClick={() => {
                          const newAttrs = [...customAttributes];
                          newAttrs.splice(index, 1);
                          setCustomAttributes(newAttrs);
                        }}
                        className="p-2 text-zinc-400 hover:text-red-500"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {customAttributes.length === 0 && (
                    <div className="text-sm text-zinc-500 text-center py-4 border border-dashed rounded-lg">
                      暫無自定義屬性，點擊右上角添加
                    </div>
                  )}
                </div>
              </section>

              {/* BOM Section */}
              <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold">配件與 BOM 清單</h3>
                  <button
                    onClick={addBomItem}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    + 添加物料
                  </button>
                </div>
                
                <div className="space-y-4">
                  {/* Table Header */}
                  {bomItems.length > 0 && (
                    <div className="grid grid-cols-12 gap-3 text-xs font-medium text-zinc-500 px-1">
                      <div className="col-span-4">物料名稱 / 規格</div>
                      <div className="col-span-2">數量</div>
                      <div className="col-span-2">單位</div>
                      <div className="col-span-3">備註</div>
                      <div className="col-span-1 text-center">操作</div>
                    </div>
                  )}

                  {bomItems.map((item, index) => (
                    <div key={item.id} className="grid grid-cols-12 gap-3 items-start">
                      <div className="col-span-4">
                        <input
                          type="text"
                          placeholder="例如: 螺絲 M4x10"
                          value={item.name}
                          onChange={(e) => updateBomItem(index, "name", e.target.value)}
                          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) => updateBomItem(index, "quantity", Number(e.target.value))}
                          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="text"
                          placeholder="例如: 個"
                          value={item.unit}
                          onChange={(e) => updateBomItem(index, "unit", e.target.value)}
                          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="text"
                          placeholder="可選"
                          value={item.notes}
                          onChange={(e) => updateBomItem(index, "notes", e.target.value)}
                          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                        />
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <button
                          onClick={() => removeBomItem(index)}
                          className="p-2 text-zinc-400 hover:text-red-500"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                  {bomItems.length === 0 && (
                    <div className="text-sm text-zinc-500 text-center py-8 border border-dashed rounded-lg">
                      暫無物料清單，點擊右上角添加
                    </div>
                  )}
                </div>
              </section>

              <div className="flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="rounded-md bg-zinc-900 px-6 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
                >
                  {isSaving ? "保存中..." : "保存更改"}
                </button>
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-zinc-200 p-12 text-zinc-500 dark:border-zinc-800">
              請在左側選擇一個產品進行編輯
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
