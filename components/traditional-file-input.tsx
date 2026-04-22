"use client";

import { useRef, useState } from "react";

type Props = {
  name?: string;
  accept?: string;
  className?: string;
};

/** 隱藏瀏覽器預設的簡體「選擇檔案」按鈕，改以繁體文案觸發同一個表單欄位。 */
export function TraditionalFileInput({
  name = "attachment",
  accept,
  className,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("未選擇任何檔案");

  return (
    <div className={className ?? "flex flex-wrap items-center gap-3"}>
      <input
        ref={inputRef}
        type="file"
        name={name}
        accept={accept}
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          setFileName(f ? f.name : "未選擇任何檔案");
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="rounded-md bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
      >
        選擇檔案
      </button>
      <span
        className="max-w-[min(100%,12rem)] truncate text-sm text-zinc-500 sm:max-w-md"
        title={fileName}
      >
        {fileName}
      </span>
    </div>
  );
}
