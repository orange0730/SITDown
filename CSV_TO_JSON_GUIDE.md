# CSV 到 JSON 轉換指南

## 已完成的三個任務

### 1. ✅ CSV 轉 JSON 工具
創建了 `/csv-to-json.html` 工具頁面，特點：
- 支援拖拽上傳 CSV 檔案
- **只使用現有的 19 個標籤**（不會創建新標籤）
- 自動過濾未知標籤
- 顯示統計資訊
- 可以複製、下載或儲存到 LocalStorage

### 2. ✅ 現有標籤列表
系統只會使用以下標籤：
- 娛樂搞笑、遊戲、藝術、電影、日常
- 動物、療愈、音樂舞蹈、時尚、教學
- 挑戰、實驗創意、運動、名人、科技
- 旅遊、勵志、惡整、食物

### 3. ✅ 修復標籤與 SITDown 文字重疊
修改了三個函數以避開左上角 400x200 的標題區域：
- `createDraggableTag`：初始位置從 x=450 開始
- `setRandomPosition`：隨機位置避開標題區域
- `startFloatingAnimation`：飄動時也避開標題區域

## 使用步驟

### 1. 轉換 CSV 到 JSON
1. 開啟 http://localhost:3000/csv-to-json.html
2. 上傳你的「影片庫 - 工作表.csv」檔案
3. 查看統計資訊（哪些標籤被使用、哪些被忽略）
4. 選擇一種儲存方式：
   - **複製 JSON**：複製到剪貼簿
   - **下載 JSON**：下載為 videos.json 檔案
   - **儲存到 LocalStorage**：直接儲存供網站使用

### 2. 使用 JSON 資料
確保 `script.js` 中的設定：
```javascript
const USE_BACKEND = false;  // 使用 LocalStorage 模式
```

### JSON 格式範例
```json
[
  {
    "id": 1,
    "title": "搞笑瞬間",
    "url": "https://www.youtube.com/embed/qAY2EX6Kil0",
    "tags": ["娛樂搞笑"],
    "type": "youtube"
  },
  {
    "id": 2,
    "title": "遊戲精彩時刻",
    "url": "https://www.youtube.com/embed/iWo8Mgk4of4",
    "tags": ["娛樂搞笑", "遊戲"],
    "type": "youtube"
  }
]
```

## 特點說明

### CSV 處理邏輯
- 自動轉換 YouTube 連結為 embed 格式
- 支援多種分隔符號：`,` `，` `/` `、`
- 只保留現有標籤，忽略未知標籤
- 根據第一個標籤生成影片標題

### 標籤不重疊設計
- 標籤初始位置在畫面右側（x > 450）
- 隨機移動時避開左上角 400x200 區域
- 如果嘗試 50 次都在禁區，強制移到安全區域

## 快速測試
1. 訪問 http://localhost:3000/csv-to-json.html
2. 上傳 CSV 檔案
3. 點擊「儲存到 LocalStorage」
4. 返回主頁面查看效果 