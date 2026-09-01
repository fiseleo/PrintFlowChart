# PrintFlowChart — 系統流程圖工具

一個純前端、免建置的流程圖／P&ID 繪製工具。拖曳元件、拉線連接，即可快速畫出系統流程圖、管路儀表圖（P&ID）與工程系統示意圖。可直接部署到 GitHub Pages，也能用瀏覽器直接開啟 `index.html` 使用。

## 功能

- **拖曳式繪圖**：從左側元件面板拖曳節點到畫布，圓點互拉建立連線
- **豐富元件庫**（分類收合）：
  - 基本流程：開始/結束、處理、決策、輸入/輸出、文件、資料庫、子程序、連接點、註解
  - 閥件（17 種）：閘閥、球形閥、球閥、蝶閥、止回閥、控制閥、安全閥、針閥、角閥、旋塞閥、隔膜閥、電磁閥、三通/四通閥、減壓閥、手動操作閥、調壓閥
  - 設備：泵浦、儲槽、感測器、馬達、氣瓶
  - 火箭部件：火箭引擎、噴嘴、燃燒室、燃料箱、氧化劑箱、助推器、整流罩
  - DAQ 系統：資料擷取器、ADC、DAC、放大器、濾波器、資料記錄器、控制器、電腦
  - Swagelok 閥件：波紋管密封閥、計量閥、比例洩壓閥、氣動球閥、洩放閥、三通球閥(L/T)、四通球閥
- **連線**：箭頭、連線標籤（決策自動標「是/否」）、實線/虛線/顏色、直角折線切換
- **編輯**：文字雙擊編輯、復原/重做、複製/貼上/重製、多選框選、對齊/等距分布
- **排版**：網格吸附＋對齊、一鍵自動排版
- **分頁**：多張流程圖分頁管理（新增/切換/改名/刪除）
- **匯出**：PNG、SVG（向量）、JSON（可再匯入）、列印/PDF
- **其它**：搜尋節點、節點換色、深色模式、自動存檔（localStorage）
- **學術風格**：襯線字體、灰階中性配色、細邊框，適合論文／報告插圖

## 使用說明

| 操作 | 方式 |
| --- | --- |
| 加入節點 | 從左側面板拖曳（或點擊元件加到畫布中央） |
| 編輯文字 | 直接點選節點文字 |
| 建立連線 | 從節點右側（或上/下/左側）圓點拖到另一節點 |
| 連線標籤 | 雙擊連線上的標籤文字 |
| 刪除 | 右鍵或按 `Delete` |
| 框選多個 | `Shift` + 拖曳空白處 |
| 複製/貼上/重製 | `Ctrl+C` / `Ctrl+V` / `Ctrl+D` |
| 復原/重做 | `Ctrl+Z` / `Ctrl+Shift+Z` |
| 縮放 | `Ctrl` + 滾輪 |
| 平移 | 拖曳空白處 |
| 連線轉折點 | 雙擊連線（雙擊轉折點移除） |
| 切換直角連線 | 工具列「∟ 直角」 |
| 連線虛實/顏色 | 先點選連線，再按「實線/虛線」或色塊 |

## 部署到 GitHub Pages

1. 建立新 Repository（例如 `flowchart`）
2. 將本專案**整個資料夾**上傳（需包含 `index.html`、`css/`、`js/`）
3. 到 Repository → **Settings** → **Pages**
4. **Source** 選 `Deploy from a branch`，分支 `main`，資料夾 `/ (root)` → **Save**
5. 數分鐘後即可在 `https://你的帳號.github.io/flowchart/` 使用

> 本工具依賴 [Drawflow](https://github.com/jerosoler/Drawflow) 與 [html2canvas](https://html2canvas.hertzen.com/) 兩個 CDN，需有網路才能載入。

## 專案結構

```
PrintFlowChart/
├── index.html          # 頁面結構與引用
├── css/
│   └── styles.css      # 全部樣式（學術風格）
├── js/
│   ├── data.js         # 元件資料庫（VALVES/EQUIPMENT/ROCKET/DAQ/SWAGELOK/NODE_TYPES/CATEGORIES）
│   └── app.js          # 應用邏輯（編輯器、功能、事件、初始化）
├── LICENSE
└── README.md
```

## 技術說明

- 純前端，無建置步驟，`index.html` 直接以 `<script>` 依序載入 `data.js` 與 `app.js`
- 繪圖引擎使用 [Drawflow](https://github.com/jerosoler/Drawflow)（MIT License）
- PNG 匯出使用 [html2canvas](https://html2canvas.hertzen.com)（MIT License）
- 資料以 `window.FLOW` 命名空間共享，元件資料與邏輯分離
- 圖表資料以 JSON 儲存，可匯出/匯入，並自動備份於瀏覽器 localStorage

## License

MIT License © 2026 afiseleo
