# SITDown 功能更新

## 已實現的新功能

### 1. 影片自動循環播放
- **實現方式**：在 YouTube embed URL 中添加了 `playlist` 參數
- **程式碼位置**：`script.js` 的 `loadCurrentVideo` 函數（約第 1050-1060 行）
- **效果**：影片播放結束後會自動重新開始播放

```javascript
// 提取視頻 ID 用於 playlist 參數
const videoIdMatch = currentVideo.url.match(/embed\/([a-zA-Z0-9_-]+)/);
const videoId = videoIdMatch ? videoIdMatch[1] : '';

url.searchParams.set('loop', '1');
url.searchParams.set('playlist', videoId); // 確保循環播放
```

### 2. 影片標籤顯示在左側
- **實現方式**：標籤顯示在影片左側的 `video-info-sidebar` 區域
- **程式碼位置**：
  - HTML：`index.html` 第 67-70 行
  - JavaScript：`script.js` 的 `updateVideoTags` 函數（約第 1105-1120 行）
  - CSS：`style.css` 第 569-593 行
- **效果**：每個影片的標籤會以動畫效果顯示在左側資訊欄中

### 測試頁面
- 創建了 `test-video-features.html` 用於測試和驗證功能
- 可以透過 http://localhost:3000/test-video-features.html 訪問

### 使用說明
1. 當影片開始播放時，標籤會自動顯示在左側
2. 影片播放結束後會自動重新開始，無需手動操作
3. 所有 YouTube 影片都會套用這些設定

## 技術細節

### YouTube 參數說明
- `loop=1`：啟用循環播放
- `playlist={videoId}`：必須搭配 loop 使用，指定要循環的影片 ID
- `controls=0`：隱藏控制條，讓介面更簡潔
- `mute=0`：確保有聲音播放

### 標籤動畫
- 使用 CSS animation 實現淡入效果
- 每個標籤有 0.1 秒的延遲，營造依序出現的效果 