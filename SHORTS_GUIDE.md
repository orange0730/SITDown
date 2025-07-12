# YouTube Shorts 處理指南

## 功能說明

SITDown 現在完全支援 YouTube Shorts！系統會自動將 Shorts URL 轉換為嵌入格式。

## 支援的 Shorts URL 格式

- `https://www.youtube.com/shorts/VIDEO_ID`
- `https://youtube.com/shorts/VIDEO_ID`
- `https://m.youtube.com/shorts/VIDEO_ID` (手機版)

## 自動轉換

當你在 CSV 中加入 Shorts 連結時，系統會自動：

1. 偵測 Shorts URL
2. 提取影片 ID
3. 轉換為 `https://www.youtube.com/embed/VIDEO_ID` 格式
4. 保存原始 URL 資訊
5. 標記為 Shorts 類型

## 測試功能

在瀏覽器 Console 中可以使用以下測試函數：

### 1. 測試單個 Shorts URL 轉換
```javascript
testShortsConversion('https://www.youtube.com/shorts/YOUR_VIDEO_ID')
```

### 2. 批量測試 URL 轉換
```javascript
testMultipleShortsUrls()
```

### 3. 檢查影片庫中的 Shorts
```javascript
checkShortsInLibrary()
```

## CSV 格式範例

在你的 Google Sheets 中，可以直接使用 Shorts URL：

```
標籤,連結
搞笑,https://www.youtube.com/shorts/ABC123
音樂,https://youtube.com/shorts/XYZ789
舞蹈,https://m.youtube.com/shorts/DEF456
```

## 注意事項

1. Shorts 會以相同的嵌入參數播放（隱藏控制條等）
2. 保持 9:16 的顯示比例
3. 自動循環播放
4. 支援所有常見的 Shorts URL 格式

## 疑難排解

如果 Shorts 無法正常播放：

1. 檢查 URL 格式是否正確
2. 使用 `testShortsConversion()` 測試轉換
3. 確認影片 ID 是有效的
4. 查看 Console 是否有錯誤訊息 