# SITDown - 你的影片流

一個創新的影片流應用，使用拖曳標籤的方式來篩選和播放影片。

## 功能特色

- 🏷️ **拖曳式標籤選擇**：將飄動的標籤拖曳到籃子中來篩選影片
- 🎥 **YouTube Shorts 風格**：豎直影片播放介面
- 🐾 **貓爪拉動進入**：可愛的貓爪拉動效果進入影片播放
- 🔄 **自動循環播放**：影片結束後自動重新播放
- 📊 **多資料來源支援**：支援後端資料庫、Google Sheets 和本地儲存

## 最新更新

### 2024-01-XX
- ✅ **影片自動循環播放**：添加 `playlist` 參數確保 YouTube 影片循環播放
- ✅ **標籤顯示在左側**：影片的標籤會顯示在左側資訊欄中，每個標籤有淡入動畫效果
- ✅ **CSV 匯入工具**：新增 `/import-csv.html` 頁面，可以上傳 CSV 檔案匯入影片庫

## CSV 檔案格式

CSV 檔案應包含以下欄位：
```csv
類型,連結,第 1 欄
娛樂搞笑,https://www.youtube.com/shorts/qAY2EX6Kil0,
"娛樂搞笑, 遊戲",https://www.youtube.com/shorts/iWo8Mgk4of4,
藝術,https://www.youtube.com/shorts/Hakpc95Y0TE,
```

- **類型**：影片的標籤，可以是單一標籤或多個標籤（用逗號分隔）
- **連結**：YouTube 影片連結（支援 shorts、watch、youtu.be 等格式）
- **第 1 欄**：可選欄位（系統會忽略）

## 如何使用 CSV 檔案

### 方法 1：使用 CSV 匯入工具（推薦）
1. 開啟 http://localhost:3000/import-csv.html
2. 上傳你的 CSV 檔案
3. 選擇儲存方式：
   - **LocalStorage**：適合快速測試（需要設定 `USE_BACKEND = false`）
   - **後端資料庫**：適合長期使用（需要設定 `USE_BACKEND = true`）

### 方法 2：使用 Google Sheets
1. 將 CSV 資料上傳到 Google Sheets
2. 在 `script.js` 中設定：
   ```javascript
   const USE_BACKEND = false;  // 使用 Google Sheets 模式
   const SHEET_ID = '你的Google_Sheets_ID';
   ```

### 方法 3：使用後端資料庫
1. 確保後端伺服器正在運行
2. 使用 CSV 匯入工具將資料匯入後端
3. 在 `script.js` 中設定：
   ```javascript
   const USE_BACKEND = true;  // 使用後端模式
   ```

## 標籤系統

- 標籤會從 CSV 檔案的「類型」欄位讀取
- 支援多個標籤，可使用以下分隔符號：
  - 半形逗號 `,`
  - 全形逗號 `，`
  - 斜線 `/`
  - 頓號 `、`
- 每個影片的標籤會顯示在播放頁面的左側資訊欄

## 快速開始

### 前端運行
```bash
# 安裝 http-server
npm install -g http-server

# 在專案目錄下運行
http-server -p 3000
```

### 後端運行（可選）
```bash
cd backend
npm install
npm start
```

### 訪問應用
- 主頁面：http://localhost:3000
- CSV 匯入工具：http://localhost:3000/import-csv.html
- 管理介面：http://localhost:3000/admin.html

## 測試頁面

- `/test-video-features.html` - 測試影片循環播放和標籤顯示
- `/test-csv-tags.html` - 測試 CSV 標籤解析功能
- `/debug-tags.html` - 標籤系統除錯頁面

## 技術細節

### YouTube 影片參數
- `loop=1`：啟用循環播放
- `playlist={videoId}`：配合 loop 使用，指定循環的影片
- `controls=0`：隱藏控制條
- `mute=0`：確保有聲音播放

### 標籤動畫
- 使用 CSS animation 實現淡入效果
- 每個標籤延遲 0.1 秒出現，營造流暢的動畫效果

## 系統架構

```
SITDown/
├── index.html          # 主頁面
├── script.js           # 主要邏輯
├── style.css           # 樣式
├── import-csv.html     # CSV 匯入工具
├── test-*.html         # 測試頁面
├── backend/            # 後端服務（可選）
│   ├── server.js
│   ├── init-db.js
│   └── database.db
└── README.md           # 本文件
```

## 疑難排解

### 影片不會循環播放
- 確認 YouTube URL 中包含 `loop=1` 和 `playlist` 參數
- 檢查瀏覽器控制台是否有錯誤訊息

### 標籤沒有顯示
- 確認 CSV 檔案格式正確
- 檢查「類型」欄位是否有資料
- 確認資料來源設定正確（`USE_BACKEND` 的值）

### CSV 匯入失敗
- 確認 CSV 檔案編碼為 UTF-8
- 檢查 URL 格式是否正確
- 確保每行至少有兩個欄位（類型和連結）

## 授權

MIT License 