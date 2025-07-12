# SITDown Docker 部署指南

## 🐳 快速開始

### 1. 使用 Docker Compose（推薦）
```bash
# 構建並啟動所有服務
docker-compose up -d

# 查看服務狀態
docker-compose ps

# 查看日誌
docker-compose logs -f

# 停止服務
docker-compose down
```

### 2. 單獨構建和運行

#### 前端
```bash
# 構建前端映像
docker build -f Dockerfile/Frontend-Updated -t sitdown-frontend .

# 運行前端容器
docker run -d -p 8080:8080 --name sitdown-frontend sitdown-frontend
```

#### 後端
```bash
# 構建後端映像
docker build -f Dockerfile/Backend-Node -t sitdown-backend .

# 運行後端容器
docker run -d -p 3000:8080 -v $(pwd)/backend/database.db:/app/database.db --name sitdown-backend sitdown-backend
```

## 📁 專案結構

```
SITDown/
├── frontend/           # 前端檔案
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   └── ...
├── backend/            # Node.js 後端
│   ├── server.js
│   ├── package.json
│   └── database.db
├── Dockerfile/         # Docker 配置
│   ├── Frontend-Updated
│   └── Backend-Node
├── docker-compose.yml  # Docker Compose 配置
└── .dockerignore      # Docker 忽略檔案
```

## 🔧 環境變數

### 前端
- `BACKEND_URL`: 後端 API 位址（預設：http://backend:3000）

### 後端
- `NODE_ENV`: 執行環境（預設：production）
- `DATABASE_PATH`: 資料庫路徑（預設：/app/database.db）
- `PORT`: 服務 port（預設：8080）

## 🚀 部署注意事項

1. **資料持久化**：後端使用 volume 掛載資料庫檔案，確保資料不會因容器重啟而遺失

2. **網路配置**：前後端使用同一個 Docker 網路，可以透過服務名稱互相通訊

3. **Port 映射**：
   - 前端：8080 -> 8080
   - 後端：3000 -> 8080（容器內部）

4. **健康檢查**：建議在生產環境中添加健康檢查

## 🛠️ 故障排除

### 常見問題

1. **無法連接後端**
   - 檢查 docker-compose logs backend
   - 確認網路設定正確

2. **資料庫錯誤**
   - 確認 database.db 檔案權限
   - 檢查 volume 掛載路徑

3. **前端無法載入**
   - 檢查 nginx 日誌
   - 確認檔案路徑正確

## 📝 開發建議

1. 使用 `docker-compose.override.yml` 來覆蓋開發環境設定
2. 添加 `.env` 檔案管理環境變數
3. 考慮使用多階段構建來減小映像大小 