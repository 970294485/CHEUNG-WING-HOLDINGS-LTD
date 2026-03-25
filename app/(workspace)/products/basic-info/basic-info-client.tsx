"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveProductBasicInfo } from "@/lib/server/actions";

type Product = {
  id: string;
  sku: string;
  name: string;
  barcode: string | null;
  description: string | null;
  price: any;
  attributes: any;
  attachments: any;
};

export function BasicInfoClient({ initialProduct }: { initialProduct: Product | null }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  // Helper to parse JSON
  const parseJSON = (data: any, fallback: any) => {
    if (!data) return fallback;
    try {
      return typeof data === "string" ? JSON.parse(data) : data;
    } catch {
      return fallback;
    }
  };

  const attr = parseJSON(initialProduct?.attributes, {});
  const initialSpecsObj = attr.specs || {};
  const initialSpecs = Object.entries(initialSpecsObj).map(([key, value]) => ({ key, value: String(value) }));
  
  const initialMedia = parseJSON(initialProduct?.attachments, []);

  // Form states
  const [sku, setSku] = useState(initialProduct?.sku || "");
  const [name, setName] = useState(initialProduct?.name || "");
  const [barcode, setBarcode] = useState(initialProduct?.barcode || "");
  const [description, setDescription] = useState(initialProduct?.description || "");
  const [price, setPrice] = useState<number>(Number(initialProduct?.price || 0));

  // Specs state
  const [specs, setSpecs] = useState<{ key: string; value: string }[]>(initialSpecs);

  // Media state
  const [media, setMedia] = useState<{ url: string; type: string }[]>(Array.isArray(initialMedia) ? initialMedia : []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku.trim() || !name.trim()) {
      alert("SKU 和 產品名稱為必填項");
      return;
    }

    setIsSaving(true);
    try {
      const specsObj = specs.reduce((acc, curr) => {
        if (curr.key.trim()) {
          acc[curr.key.trim()] = curr.value.trim();
        }
        return acc;
      }, {} as Record<string, string>);

      const validMedia = media.filter((m) => m.url.trim());

      await saveProductBasicInfo(initialProduct?.id || null, {
        sku: sku.trim(),
        name: name.trim(),
        barcode: barcode.trim() || null,
        description: description.trim() || null,
        price,
        specs: specsObj,
        attachments: validMedia,
      });

      alert("保存成功！");
      router.push("/products/list");
    } catch (error) {
      console.error(error);
      alert("保存失敗，請檢查 SKU 是否重複");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          {initialProduct ? "編輯產品資料" : "新增產品資料"}
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          管理產品的基礎信息、規格參數及圖片/視頻資源。
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Basic Info Section */}
        <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-base font-semibold mb-4">基礎信息</h3>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            <div className="space-y-1">
              <label className="text-xs text-zinc-500">SKU <span className="text-red-500">*</span></label>
              <input
                type="text"
                placeholder="例如: PRD-001"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                required
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs text-zinc-500">產品名稱 <span className="text-red-500">*</span></label>
              <input
                type="text"
                placeholder="例如: 辦公椅"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-zinc-500">條碼 (Barcode)</label>
              <input
                type="text"
                placeholder="可選"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              />
            </div>
            <div className="space-y-1 sm:col-span-3">
              <label className="text-xs text-zinc-500">描述</label>
              <input
                type="text"
                placeholder="產品描述..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-zinc-500">建議售價</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              />
            </div>
          </div>
        </section>

        {/* Specs Section */}
        <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold">規格參數</h3>
            <button
              type="button"
              onClick={() => setSpecs([...specs, { key: "", value: "" }])}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              + 添加規格
            </button>
          </div>
          
          <div className="space-y-3">
            {specs.map((spec, index) => (
              <div key={index} className="flex gap-3 items-start">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="規格名稱 (例: 顏色, 尺寸)"
                    value={spec.key}
                    onChange={(e) => {
                      const newSpecs = [...specs];
                      newSpecs[index].key = e.target.value;
                      setSpecs(newSpecs);
                    }}
                    className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="規格值 (例: 紅色, XL)"
                    value={spec.value}
                    onChange={(e) => {
                      const newSpecs = [...specs];
                      newSpecs[index].value = e.target.value;
                      setSpecs(newSpecs);
                    }}
                    className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newSpecs = [...specs];
                    newSpecs.splice(index, 1);
                    setSpecs(newSpecs);
                  }}
                  className="p-2 text-zinc-400 hover:text-red-500"
                >
                  ✕
                </button>
              </div>
            ))}
            {specs.length === 0 && (
              <div className="text-sm text-zinc-500 text-center py-4 border border-dashed rounded-lg">
                暫無規格參數，點擊右上角添加
              </div>
            )}
          </div>
        </section>

        {/* Media Section */}
        <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold">圖片/視頻資源</h3>
            <button
              type="button"
              onClick={() => setMedia([...media, { url: "", type: "image" }])}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              + 添加資源
            </button>
          </div>

          <div className="space-y-4">
            {media.map((item, index) => (
              <div key={index} className="flex gap-3 items-start">
                <div className="w-24">
                  <select
                    value={item.type}
                    onChange={(e) => {
                      const newMedia = [...media];
                      newMedia[index].type = e.target.value;
                      setMedia(newMedia);
                    }}
                    className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                  >
                    <option value="image">圖片</option>
                    <option value="video">視頻</option>
                  </select>
                </div>
                <div className="flex-1">
                  <input
                    type="url"
                    placeholder="請輸入圖片或視頻的 URL 鏈接"
                    value={item.url}
                    onChange={(e) => {
                      const newMedia = [...media];
                      newMedia[index].url = e.target.value;
                      setMedia(newMedia);
                    }}
                    className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                  />
                  {item.url && item.type === "image" && (
                    <div className="mt-2 relative w-24 h-24 rounded-md overflow-hidden border border-zinc-200 dark:border-zinc-700">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={item.url} 
                        alt="Preview" 
                        className="object-cover w-full h-full"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newMedia = [...media];
                    newMedia.splice(index, 1);
                    setMedia(newMedia);
                  }}
                  className="p-2 text-zinc-400 hover:text-red-500"
                >
                  ✕
                </button>
              </div>
            ))}
            {media.length === 0 && (
              <div className="text-sm text-zinc-500 text-center py-4 border border-dashed rounded-lg">
                暫無多媒體資源，點擊右上角添加
              </div>
            )}
          </div>
        </section>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.push("/products/list")}
            className="rounded-md border border-zinc-300 px-6 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-md bg-zinc-900 px-6 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {isSaving ? "保存中..." : "保存產品"}
          </button>
        </div>
      </form>
    </div>
  );
}
