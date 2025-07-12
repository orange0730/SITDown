# 修復 Google Sheets 存取問題指南

## 問題描述
您的 SITDown 網站無法載入 Google Sheets 中的影片資料，出現 404 錯誤。這通常是因為 Google Sheets 的共用設定不正確。

## 快速修復步驟

### 1. 開啟您的 Google Sheets
點擊以下連結開啟您的 Google Sheets：
```
https://docs.google.com/spreadsheets/d/1HHkBtepfUpc_QimDa6MK_KdHBswUbBGuWrWQzt15YDw/edit
```

### 2. 設定共用權限
1. 點擊右上角的「**共用**」按鈕
2. 在彈出的視窗中，找到「**一般存取權**」區塊
3. 點擊「**限制**」旁的下拉選單
4. 選擇「**知道連結的任何人**」
5. 確保權限設定為「**檢視者**」（不要選擇「編輯者」）
6. 點擊「**完成**」

### 3. 測試存取權限
1. 開啟測試頁面：http://localhost:8080/test-sheets-access.html
2. 點擊「測試 Google Sheets 存取」按鈕
3. 如果顯示綠色的「✅ 成功存取」，表示設定正確
4. 如果仍然失敗，請等待 1-2 分鐘後再試（Google 需要時間更新權限）

### 4. 重新載入 SITDown
設定完成後，回到主頁面：http://localhost:8080/
- 按 `Ctrl + F5` (Windows) 或 `Cmd + Shift + R` (Mac) 強制重新載入

## 常見問題

### Q: 為什麼會出現 404 錯誤？
A: Google Sheets 預設是私人的，需要明確設定為公開才能讓網站存取。

### Q: 設定後還是不能用怎麼辦？
A: 
1. 確認 Sheet ID 正確（檢查網址中的 ID）
2. 等待 1-2 分鐘讓 Google 更新權限
3. 嘗試使用無痕模式開啟 CSV 連結測試
4. 檢查是否有多個 Google 帳號登入衝突

### Q: 如何確認 CSV 連結可以存取？
A: 直接在瀏覽器開啟這個連結：
```
https://docs.google.com/spreadsheets/d/1HHkBtepfUpc_QimDa6MK_KdHBswUbBGuWrWQzt15YDw/export?format=csv&gid=317495087
```
如果能看到 CSV 內容（而不是錯誤頁面），表示設定成功。

### Q: 我不想公開我的資料怎麼辦？
A: 您可以：
1. 使用網站的「手動輸入」功能（manual-input.html）
2. 使用本地 CSV 檔案（import-csv.html）
3. 直接編輯 script.js 中的備用影片庫

## 備用方案

如果無法修復 Google Sheets 存取，網站會自動使用內建的備用影片庫，包含 10 個示範影片。您也可以：

1. **使用手動輸入頁面**：http://localhost:8080/manual-input.html
2. **匯入本地 CSV 檔案**：http://localhost:8080/import-csv.html
3. **直接編輯備用資料**：修改 `script.js` 中的 `getBackupVideoLibrary()` 函數

## 需要更多協助？

如果問題持續存在，請檢查瀏覽器的開發者工具（F12）中的 Console 標籤，查看詳細錯誤訊息。 