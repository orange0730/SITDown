# SITDown 使用說明

## Google Sheets 資料格式

在你的 Google Sheets 中，資料應該按照以下格式排列：

| A欄（標籤） | B欄（網址） |
|------------|------------|
| 娛樂搞笑 | https://www.youtube.com/watch?v=dQw4w9WgXcQ |
| 教學,料理 | https://youtu.be/1-SJGQ2HLp8 |
| 藝術/風景 | https://www.youtube.com/shorts/LXb3EKWsInQ |
| 動物、療癒 | https://example.com/cute-cat.mp4 |
| 運動 | https://cdn.example.com/sports.webm |

### 支援的格式：

#### YouTube 連結：
- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/shorts/VIDEO_ID`
- `https://m.youtube.com/watch?v=VIDEO_ID`

#### 直接影片檔案：
- `.mp4` 檔案
- `.webm` 檔案
- `.ogg` 檔案

### 標籤分隔符：
- 逗號：`標籤1,標籤2`
- 斜線：`標籤1/標籤2`
- 頓號：`標籤1、標籤2`

## 測試步驟

1. **開啟測試頁面** `test.html`
2. **點擊「測試連接」**確認 Google Sheets 可以正常連接
3. **開啟主頁面** `index.html`
4. **查看瀏覽器控制台**（F12）了解載入狀況

## 故障排除

### 影片無法載入：
1. 確認 Google Sheets 是「公開」的
2. 確認使用正確的工作表 ID (gid)
3. 檢查網址格式是否正確

### 直接影片無法播放：
1. 確認影片 URL 可以直接訪問
2. 確認影片格式是瀏覽器支援的（MP4、WebM）
3. 確認沒有 CORS 限制

## 控制台指令

在瀏覽器控制台（F12）中可以使用：

```javascript
// 測試 Google Sheets 連接
testGoogleSheets()

// 重新載入影片庫
reloadVideoLibrary()

// 測試系統狀態
testSITDown()
``` 