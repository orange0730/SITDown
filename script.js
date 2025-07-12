// Google Sheets 設定
const SHEET_ID = '1HHkBtepfUpc_QimDa6MK_KdHBswUbBGuWrWQzt15YDw';
const API_KEY = 'AIzaSyBb92vwH86S9QJ6BlqK8hsNB3FQVCIzn-A'; // 請替換為您的 API 金鑰
const SHEET_NAME = 'Sheet1';
const RANGE = 'A2:C205'; // 從A2開始，避開標題行，到第205行

// 後端 API 設定
const API_BASE_URL = 'http://localhost:3000/api';
// 設定資料來源
const USE_BACKEND = false; // 設為 false 可以切換回 Google Sheets 模式

// 影片庫資料 - 從 Google Sheets 或後端載入
let videoLibrary = [];

// 載入影片庫 - 優先使用後端，失敗則使用 Google Sheets
async function loadVideoLibrary() {
    if (USE_BACKEND) {
        try {
            console.log('嘗試從後端載入影片庫...');
            const response = await fetch(`${API_BASE_URL}/videos`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success && result.data) {
                videoLibrary = result.data;
                console.log(`成功從後端載入 ${videoLibrary.length} 個影片`);
                console.log('載入的影片列表:', videoLibrary);
                
                // 載入完成後初始化標籤
                if (videoLibrary.length > 0) {
                    console.log('開始初始化標籤...');
                    setTimeout(initDraggableTags, 500);
                } else {
                    console.warn('後端沒有影片資料，使用備用資料');
                    videoLibrary = getBackupVideoLibrary();
                    setTimeout(initDraggableTags, 500);
                }
                return;
            }
        } catch (error) {
            console.error('從後端載入失敗:', error);
            console.log('嘗試使用 Google Sheets...');
        }
    }
    
    // 原有的 Google Sheets 載入邏輯
    try {
        console.log('開始載入影片庫...');
        
        // 構建 Google Sheets CSV 導出 URL
        const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=317495087`;
        console.log('CSV URL:', csvUrl);
        
        // 添加 CORS 代理（如果直接訪問失敗）
        let response;
        try {
            // 直接使用 CORS 代理來避免 CORS 問題
            console.log('使用 CORS 代理訪問 Google Sheets...');
            const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(csvUrl)}`;
            response = await fetch(proxyUrl);
            
            if (!response.ok) {
                console.warn('CORS 代理失敗，嘗試直接訪問...');
                // 備用方案：嘗試直接訪問
                response = await fetch(csvUrl, {
                    method: 'GET',
                    mode: 'cors',
                    cache: 'no-cache',
                    credentials: 'omit',
                    redirect: 'follow'
                });
            }
        } catch (error) {
            console.error('無法訪問 Google Sheets:', error);
            // 嘗試另一個 CORS 代理
            try {
                console.log('嘗試備用 CORS 代理...');
                const altProxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(csvUrl)}`;
                response = await fetch(altProxyUrl);
            } catch (altError) {
                console.error('所有方法都失敗了');
                throw new Error('無法訪問 Google Sheets，請確認：\n1. Google Sheets 已設為「公開」\n2. 網路連接正常');
            }
        }
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const csvText = await response.text();
        console.log('CSV 原始內容預覽:', csvText.substring(0, 500));
        
        // 解析 CSV 資料 - 更完善的解析方法
        const videos = [];
        const rows = csvText.split(/\r?\n/); // 處理不同的換行符
        
        console.log(`總共 ${rows.length} 行資料`);
        
        // 跳過標題行，從第二行開始
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i].trim();
            if (!row) {
                console.log(`第 ${i + 1} 行: 空行，跳過`);
                continue;
            }
            
            // 更簡單的 CSV 解析 - A欄是標籤，B欄是網址
            let columns = [];
            let currentValue = '';
            let inQuotes = false;
            
            for (let j = 0; j < row.length; j++) {
                const char = row[j];
                
                if (char === '"' && (j === 0 || row[j-1] === ',')) {
                    inQuotes = true;
                } else if (char === '"' && inQuotes && (j === row.length - 1 || row[j+1] === ',')) {
                    inQuotes = false;
                } else if (char === ',' && !inQuotes) {
                    columns.push(currentValue.trim());
                    currentValue = '';
                } else {
                    currentValue += char;
                }
            }
            // 添加最後一個值
            columns.push(currentValue.trim());
            
            console.log(`第 ${i + 1} 行解析結果:`, columns);
            
            // A欄位是標籤，B欄位是網址
            if (columns.length >= 2) {
                const tags = columns[0]?.trim() || '';
                const link = columns[1]?.trim() || '';
                
                console.log(`  標籤: "${tags}"`);
                console.log(`  連結: "${link}"`);
                
                // 檢查是否為有效的 YouTube 連結
                if (tags && link && (
                    link.includes('youtube.com') || 
                    link.includes('youtu.be') ||
                    link.includes('youtube-nocookie.com')
                )) {
                    // 轉換 YouTube 連結為 embed 格式
                    const embedUrl = convertToEmbedUrl(link);
                    if (embedUrl) {
                        // 處理多個標籤（用逗號、斜線或其他分隔符分隔）
                        const tagList = tags.split(/[,，\/、]/)
                            .map(tag => tag.trim())
                            .filter(tag => tag.length > 0);
                        
                        const video = {
                            id: videos.length + 1,
                            title: generateTitleFromCategory(tagList[0]),
                            url: embedUrl,
                            originalUrl: link,  // 保存原始 URL
                            tags: tagList,
                            type: 'youtube',
                            isShorts: link.includes('/shorts/')  // 標記是否為 Shorts
                        };
                        
                        videos.push(video);
                        console.log(`  ✓ 成功添加 YouTube 影片 #${video.id}:`, video);
                    } else {
                        console.warn(`  ✗ 無法轉換連結為 embed 格式: ${link}`);
                    }
                } 
                // 支援直接影片 URL (mp4, webm 等)
                else if (tags && link && (
                    link.endsWith('.mp4') ||
                    link.endsWith('.webm') ||
                    link.endsWith('.ogg') ||
                    link.includes('.mp4?') ||
                    link.includes('.webm?') ||
                    link.includes('.ogg?')
                )) {
                    const tagList = tags.split(/[,，\/、]/)
                        .map(tag => tag.trim())
                        .filter(tag => tag.length > 0);
                    
                    const video = {
                        id: videos.length + 1,
                        title: generateTitleFromCategory(tagList[0]),
                        url: link,
                        tags: tagList,
                        type: 'direct'
                    };
                    
                    videos.push(video);
                    console.log(`  ✓ 成功添加直接影片 #${video.id}:`, video);
                } else {
                    if (!tags) console.warn(`  ✗ 第 ${i + 1} 行缺少標籤`);
                    if (!link) console.warn(`  ✗ 第 ${i + 1} 行缺少連結`);
                    if (link && !link.includes('youtube') && !link.includes('youtu.be')) {
                        console.warn(`  ✗ 第 ${i + 1} 行的連結不是支援的格式: ${link}`);
                    }
                }
            } else {
                console.warn(`第 ${i + 1} 行: 欄位數量不足 (需要至少 2 欄，得到 ${columns.length} 欄)`);
            }
        }
        
        videoLibrary = videos;
        console.log(`成功載入 ${videoLibrary.length} 個影片`);
        console.log('載入的影片列表:', videoLibrary);
        
        // 載入完成後初始化標籤
        if (videoLibrary.length > 0) {
            console.log('開始初始化標籤...');
            setTimeout(initDraggableTags, 500);
        } else {
            console.warn('沒有載入到任何影片，使用備用資料');
            videoLibrary = getBackupVideoLibrary();
            setTimeout(initDraggableTags, 500);
        }
        
    } catch (error) {
        console.error('載入影片庫失敗:', error);
        console.error('錯誤詳情:', error.message);
        
        // 嘗試從 localStorage 載入手動輸入的資料
        const manualData = localStorage.getItem('sitdown_manual_videos');
        if (manualData) {
            try {
                videoLibrary = JSON.parse(manualData);
                console.log('從 localStorage 載入了手動輸入的資料');
                console.log(`成功載入 ${videoLibrary.length} 個影片`);
                setTimeout(initDraggableTags, 500);
                return;
            } catch (e) {
                console.error('解析 localStorage 資料失敗:', e);
            }
        }
        
        // 如果載入失敗，使用備用資料
        console.log('使用備用影片庫');
        videoLibrary = getBackupVideoLibrary();
        setTimeout(initDraggableTags, 500);
    }
}

// 解析 CSV 行（處理包含逗號的情況）
function parseCSVRow(row) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < row.length; i++) {
        const char = row[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current);
    return result;
}

// 轉換 YouTube 連結為 embed 格式
function convertToEmbedUrl(url) {
    try {
        console.log('轉換 URL:', url);
        
        // 移除前後空白和參數
        url = url.trim();
        
        // 處理不同的 YouTube URL 格式
        let videoId = '';
        let isShorts = false;
        
        // 格式 1: https://youtu.be/VIDEO_ID
        if (url.includes('youtu.be/')) {
            const match = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
            if (match) videoId = match[1];
        }
        // 格式 2: https://www.youtube.com/watch?v=VIDEO_ID
        else if (url.includes('youtube.com/watch')) {
            const match = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
            if (match) videoId = match[1];
        }
        // 格式 3: https://www.youtube.com/shorts/VIDEO_ID
        else if (url.includes('youtube.com/shorts/')) {
            const match = url.match(/shorts\/([a-zA-Z0-9_-]+)/);
            if (match) {
                videoId = match[1];
                isShorts = true;
                console.log('偵測到 YouTube Shorts，video ID:', videoId);
            }
        }
        // 格式 4: https://www.youtube.com/embed/VIDEO_ID (已經是 embed 格式)
        else if (url.includes('youtube.com/embed/')) {
            // 如果已經是 embed 格式，直接返回
            return url;
        }
        // 格式 5: https://m.youtube.com/watch?v=VIDEO_ID (手機版)
        else if (url.includes('m.youtube.com/watch')) {
            const match = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
            if (match) videoId = match[1];
        }
        // 格式 6: https://www.youtube-nocookie.com/embed/VIDEO_ID
        else if (url.includes('youtube-nocookie.com/embed/')) {
            const match = url.match(/embed\/([a-zA-Z0-9_-]+)/);
            if (match) videoId = match[1];
        }
        // 格式 7: 手機版 Shorts
        else if (url.includes('m.youtube.com/shorts/')) {
            const match = url.match(/shorts\/([a-zA-Z0-9_-]+)/);
            if (match) {
                videoId = match[1];
                isShorts = true;
                console.log('偵測到手機版 YouTube Shorts，video ID:', videoId);
            }
        }
        
        if (videoId) {
            // 統一轉換為 embed 格式
            const embedUrl = `https://www.youtube.com/embed/${videoId}`;
            console.log(`轉換成功: ${isShorts ? 'Shorts' : '一般影片'} -> ${embedUrl}`);
            return embedUrl;
        } else {
            console.error('無法提取 video ID:', url);
        }
    } catch (error) {
        console.error('轉換 URL 失敗:', error, 'URL:', url);
    }
    
    return null;
}

// 根據類別生成標題
function generateTitleFromCategory(category) {
    const titleTemplates = {
        '娛樂搞笑': ['搞笑瞬間', '爆笑時刻', '有趣片段'],
        '遊戲': ['遊戲精彩時刻', '遊戲技巧', '遊戲亮點'],
        '藝術': ['藝術創作', '創意作品', '藝術展示'],
        '電影': ['電影片段', '影視精選', '經典場面'],
        '日常': ['生活日常', '日常紀錄', '生活片段'],
        '動物': ['可愛動物', '動物趣事', '萌寵時刻'],
        '療愈': ['療癒時光', '放鬆片段', '治癒瞬間'],
        '音樂舞蹈': ['音樂表演', '舞蹈展示', '藝術表演'],
        '時尚': ['時尚穿搭', '美妝技巧', '風格展示'],
        '教學': ['實用教學', '技巧分享', '學習時刻'],
        '挑戰': ['有趣挑戰', '創意挑戰', '技能挑戰'],
        '實驗創意': ['創意實驗', '科學實驗', '創新想法'],
        '運動': ['運動精彩', '健身技巧', '運動瞬間'],
        '名人': ['名人時刻', '明星片段', '人物專訪']
    };
    
    const templates = titleTemplates[category] || ['精彩片段', '有趣內容', '推薦影片'];
    const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
    
    return randomTemplate;
}

// 備用影片庫（如果無法載入 Google Sheets）
function getBackupVideoLibrary() {
    console.log('使用備用影片庫資料');
    return [
        {
            id: 1,
            title: "搞笑瞬間",
            url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
            tags: ["娛樂搞笑", "經典"],
            type: "youtube"
        },
        {
            id: 2,
            title: "料理技巧",
            url: "https://www.youtube.com/embed/1-SJGQ2HLp8",
            tags: ["教學", "料理"],
            type: "youtube"
        },
        {
            id: 3,
            title: "示範影片",
            url: "https://www.w3schools.com/html/mov_bbb.mp4",
            tags: ["範例", "測試"],
            type: "direct"
        },
        {
            id: 4,
            title: "音樂創作",
            url: "https://www.youtube.com/embed/kJQP7kiw5Fk",
            tags: ["音樂", "流行"],
            type: "youtube"
        },
        {
            id: 5,
            title: "舞蹈表演",
            url: "https://www.youtube.com/embed/CevxZvSJLk8",
            tags: ["舞蹈", "音樂"],
            type: "youtube"
        },
        {
            id: 6,
            title: "科技開箱",
            url: "https://www.youtube.com/embed/9bZkp7q19f0",
            tags: ["科技", "評測"],
            type: "youtube"
        },
        {
            id: 7,
            title: "可愛動物",
            url: "https://www.youtube.com/embed/J---aiyznGQ",
            tags: ["動物", "療癒"],
            type: "youtube"
        },
        {
            id: 8,
            title: "運動精彩",
            url: "https://www.youtube.com/embed/3JZ_D3ELwOQ",
            tags: ["運動", "精彩時刻"],
            type: "youtube"
        },
        {
            id: 9,
            title: "遊戲實況",
            url: "https://www.youtube.com/embed/hTWKbfoikeg",
            tags: ["遊戲", "娛樂"],
            type: "youtube"
        },
        {
            id: 10,
            title: "生活日常",
            url: "https://www.youtube.com/embed/fLexgOxsZu0",
            tags: ["日常", "Vlog"],
            type: "youtube"
        }
    ];
}

// 全局變數
let currentVideoIndex = 0;
let selectedTags = [];
let filteredVideos = [];
let isVideoPageActive = false;
let isSwitching = false; // 防止快速切換

// 獲取所有唯一標籤
function getAllTags() {
    const allTags = [];
    videoLibrary.forEach(video => {
        video.tags.forEach(tag => {
            if (!allTags.includes(tag)) {
                allTags.push(tag);
            }
        });
    });
    return allTags;
}

// 拖拽相關變數
let draggedTag = null;

// 初始化可拖曳標籤
function initDraggableTags() {
    const tagsPlayground = document.getElementById('tags-playground');
    
    if (!tagsPlayground) {
        console.error('找不到標籤遊樂場元素');
        return;
    }
    
    const allTags = getAllTags();
    console.log('所有標籤:', allTags);
    
    if (allTags.length === 0) {
        console.warn('沒有找到任何標籤');
        return;
    }
    
    allTags.forEach((tag, index) => {
        console.log(`創建標籤 ${index + 1}/${allTags.length}: ${tag}`);
        createDraggableTag(tag, index, tagsPlayground);
    });
    
    initCatEvents();
    console.log('標籤初始化完成');
}

// 創建可拖曳標籤元素
function createDraggableTag(tagName, index, container) {
    console.log(`創建標籤元素: ${tagName}`);
    
    const tagElement = document.createElement('div');
    tagElement.className = 'draggable-tag';
    tagElement.textContent = tagName;
    tagElement.setAttribute('data-tag', tagName);
    
    // 添加拖拽事件
    addDragEvents(tagElement, tagName);
    
    container.appendChild(tagElement);
    console.log(`標籤 ${tagName} 已添加到容器`);
}

// 設置隨機位置 - 整個畫面範圍（但避開左上角標題區域）
function setRandomPosition(tagElement, container) {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const tagRect = tagElement.getBoundingClientRect();
    
    // 定義禁區（左上角的 SITDown 標題區域）
    const forbiddenZone = {
        x: 0,
        y: 0,
        width: 400,  // 標題區域寬度
        height: 200  // 標題區域高度
    };
    
    const maxX = Math.max(50, windowWidth - tagRect.width - 20);
    const maxY = Math.max(50, windowHeight - tagRect.height - 20);
    
    let randomX, randomY;
    let attempts = 0;
    
    // 重試直到找到不在禁區的位置
    do {
        randomX = Math.random() * maxX;
        randomY = Math.random() * maxY;
        attempts++;
        
        // 防止無限循環
        if (attempts > 50) {
            // 如果嘗試太多次，強制放在右側或下方
            if (Math.random() > 0.5) {
                randomX = forbiddenZone.width + 50 + Math.random() * (maxX - forbiddenZone.width - 50);
            } else {
                randomY = forbiddenZone.height + 50 + Math.random() * (maxY - forbiddenZone.height - 50);
            }
            break;
        }
    } while (randomX < forbiddenZone.width && randomY < forbiddenZone.height);
    
    tagElement.style.left = randomX + 'px';
    tagElement.style.top = randomY + 'px';
}

// 開始飄動動畫 - 整個畫面範圍（但避開左上角標題區域）
function startFloatingAnimation(tagElement, container) {
    if (tagElement.classList.contains('selected')) return;
    
    // 儲存速度向量
    let velocityX = (Math.random() - 0.5) * 0.5;
    let velocityY = (Math.random() - 0.5) * 0.5;
    
    const float = () => {
        if (tagElement.classList.contains('selected') || 
            tagElement.classList.contains('dragging')) {
            // 如果已選中或正在拖拽，延遲再次嘗試
            setTimeout(float, 2000);
            return;
        }
        
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const tagRect = tagElement.getBoundingClientRect();
        
        // 定義 SITDown 標題的碰撞箱
        const logoElement = document.querySelector('.logo');
        const logoRect = logoElement ? logoElement.getBoundingClientRect() : null;
        const collisionBox = logoRect ? {
            x: logoRect.left - 20,  // 加一些邊距
            y: logoRect.top - 20,
            width: logoRect.width + 40,
            height: logoRect.height + 40
        } : {
            x: 0,
            y: 0,
            width: 400,
            height: 200
        };
        
        // 取得當前位置
        let currentX = parseFloat(tagElement.style.left) || tagRect.left;
        let currentY = parseFloat(tagElement.style.top) || tagRect.top;
        
        // 計算新位置
        let newX = currentX + velocityX * 100;
        let newY = currentY + velocityY * 100;
        
        // 檢查邊界碰撞
        const maxX = windowWidth - tagRect.width - 20;
        const maxY = windowHeight - tagRect.height - 20;
        
        // 視窗邊界反彈
        if (newX <= 0 || newX >= maxX) {
            velocityX *= -1;
            newX = Math.max(0, Math.min(maxX, newX));
        }
        if (newY <= 0 || newY >= maxY) {
            velocityY *= -1;
            newY = Math.max(0, Math.min(maxY, newY));
        }
        
        // 檢查與 SITDown 標題的碰撞
        const tagBox = {
            x: newX,
            y: newY,
            width: tagRect.width,
            height: tagRect.height
        };
        
        if (isColliding(tagBox, collisionBox)) {
            // 計算碰撞反彈
            const tagCenterX = tagBox.x + tagBox.width / 2;
            const tagCenterY = tagBox.y + tagBox.height / 2;
            const logoCenterX = collisionBox.x + collisionBox.width / 2;
            const logoCenterY = collisionBox.y + collisionBox.height / 2;
            
            // 計算反彈方向
            const dx = tagCenterX - logoCenterX;
            const dy = tagCenterY - logoCenterY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                // 正規化方向向量並反彈
                velocityX = (dx / distance) * Math.abs(velocityX) * 1.2;
                velocityY = (dy / distance) * Math.abs(velocityY) * 1.2;
                
                // 推離碰撞箱
                const pushDistance = 10;
                newX += (dx / distance) * pushDistance;
                newY += (dy / distance) * pushDistance;
                
                // 添加反彈效果
                tagElement.classList.add('bouncing');
                setTimeout(() => {
                    tagElement.classList.remove('bouncing');
                }, 300);
            }
        }
        
        // 隨機擾動（讓動作更自然）
        velocityX += (Math.random() - 0.5) * 0.1;
        velocityY += (Math.random() - 0.5) * 0.1;
        
        // 限制最大速度
        const maxSpeed = 1;
        const speed = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
        if (speed > maxSpeed) {
            velocityX = (velocityX / speed) * maxSpeed;
            velocityY = (velocityY / speed) * maxSpeed;
        }
        
        // 確保最小速度
        if (Math.abs(velocityX) < 0.1) velocityX = (Math.random() - 0.5) * 0.5;
        if (Math.abs(velocityY) < 0.1) velocityY = (Math.random() - 0.5) * 0.5;
        
        // 應用移動
        tagElement.style.transition = 'all 0.5s ease-out';
        tagElement.style.left = newX + 'px';
        tagElement.style.top = newY + 'px';
        
        // 下一次移動
        setTimeout(float, 500);
    };
    
    // 開始第一次移動
    setTimeout(float, 1000 + Math.random() * 3000);
}

// 檢測兩個矩形是否碰撞
function isColliding(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// 添加拖拽事件
function addDragEvents(tagElement, tagName) {
    let isDragging = false;
    let startX, startY, currentX, currentY;
    
    console.log(`為標籤 ${tagName} 添加拖曳事件`);
    
    // 確保標籤有正確的樣式
    tagElement.style.cursor = 'grab';
    tagElement.style.touchAction = 'none'; // 防止觸控的預設行為
    
    // 通用的開始拖拽函數
    function startDrag(e) {
        console.log(`開始拖曳標籤: ${tagName}`, e.type);
        
        // 阻止事件冒泡和預設行為
        e.stopPropagation();
        e.preventDefault();
        
        if (tagElement.classList.contains('selected')) {
            // 如果已選中，點擊解除選中
            unselectTag(tagName, tagElement);
            return;
        }
        
        isDragging = true;
        draggedTag = tagElement;
        
        // 獲取起始位置
        const touch = e.touches ? e.touches[0] : e;
        const rect = tagElement.getBoundingClientRect();
        
        // 計算滑鼠在標籤內的偏移
        startX = touch.clientX - rect.left;
        startY = touch.clientY - rect.top;
        
        // 記錄標籤當前位置
        currentX = rect.left;
        currentY = rect.top;
        
        tagElement.classList.add('dragging');
        tagElement.style.transition = 'none';
        tagElement.style.zIndex = '1000';
        
        // 添加移動和結束事件監聽器
        if (e.type === 'touchstart') {
            document.addEventListener('touchmove', dragMove, { passive: false });
            document.addEventListener('touchend', dragEnd, { passive: false });
            document.addEventListener('touchcancel', dragEnd, { passive: false });
        } else {
            document.addEventListener('mousemove', dragMove);
            document.addEventListener('mouseup', dragEnd);
            // 防止文字選取
            document.addEventListener('selectstart', preventSelect);
        }
    }
    
    function preventSelect(e) {
        e.preventDefault();
        return false;
    }
    
    function dragMove(e) {
        if (!isDragging || !draggedTag) return;
        
        e.preventDefault();
        
        const touch = e.touches ? e.touches[0] : e;
        
        // 計算新位置
        const newX = touch.clientX - startX;
        const newY = touch.clientY - startY;
        
        // 直接設置位置
        draggedTag.style.left = newX + 'px';
        draggedTag.style.top = newY + 'px';
        
        // 檢查是否在貓咪上方
        checkCatHover(touch);
    }
    
    function dragEnd(e) {
        if (!isDragging || !draggedTag) return;
        
        console.log(`結束拖曳標籤: ${tagName}`);
        
        isDragging = false;
        draggedTag.classList.remove('dragging');
        draggedTag.style.zIndex = '100';
        draggedTag.style.cursor = 'grab';
        
        // 獲取結束位置
        const touch = e.changedTouches ? e.changedTouches[0] : e;
        
        // 檢查是否放在貓咪上
        if (isOverCat(touch)) {
            selectTag(tagName, draggedTag);
        }
        
        draggedTag = null;
        removeCatHover();
        
        // 移除所有事件監聽器
        document.removeEventListener('mousemove', dragMove);
        document.removeEventListener('mouseup', dragEnd);
        document.removeEventListener('touchmove', dragMove);
        document.removeEventListener('touchend', dragEnd);
        document.removeEventListener('touchcancel', dragEnd);
        document.removeEventListener('selectstart', preventSelect);
    }
    
    // 綁定事件
    tagElement.addEventListener('mousedown', startDrag);
    tagElement.addEventListener('touchstart', startDrag, { passive: false });
}





// 選中標籤
function selectTag(tagName, tagElement) {
    if (selectedTags.includes(tagName)) return;
    
    selectedTags.push(tagName);
    tagElement.classList.add('selected');
    
    // 觸發貓咪成功動畫
    const cat = document.getElementById('cat');
    cat.classList.add('success');
    setTimeout(() => {
        cat.classList.remove('success');
    }, 600);
    
    // 移動標籤到貓咪下方
    moveTagToCat(tagElement);
    
    // 更新計數
    updateSelectedCount();
}

// 取消選中標籤
function unselectTag(tagName, tagElement) {
    selectedTags = selectedTags.filter(tag => tag !== tagName);
    tagElement.classList.remove('selected');
    
    // 標籤回到標籤區
    moveTagToPlayground(tagElement);
    
    // 更新計數
    updateSelectedCount();
}



// 更新選中計數
function updateSelectedCount() {
    const countElement = document.getElementById('selected-count');
    countElement.textContent = `餵了 ${selectedTags.length} 個標籤`;
    countElement.classList.add('updated');
    
    setTimeout(() => {
        countElement.classList.remove('updated');
    }, 400);
}



// 過濾影片
function filterVideos() {
    if (selectedTags.length === 0) {
        filteredVideos = [...videoLibrary];
    } else {
        filteredVideos = videoLibrary.filter(video => {
            return selectedTags.some(tag => video.tags.includes(tag));
        });
    }
    
    // 隨機打亂順序
    filteredVideos = shuffleArray(filteredVideos);
}

// 隨機打亂陣列
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// 開始觀看影片
function startWatching() {
    filterVideos();
    if (filteredVideos.length > 0) {
        currentVideoIndex = 0;
        showVideoPage();
        loadCurrentVideo();
    }
}

// 顯示影片頁面
function showVideoPage() {
    const homepage = document.getElementById('homepage');
    const videoPage = document.getElementById('video-page');
    
    homepage.classList.remove('active');
    videoPage.classList.add('active');
    isVideoPageActive = true;
    
    // 確保貓爪隱藏
    hideCatPaw();
}

// 返回首頁
function goHome() {
    const homepage = document.getElementById('homepage');
    const videoPage = document.getElementById('video-page');
    
    videoPage.classList.remove('active');
    homepage.classList.add('active');
    isVideoPageActive = false;
    
    // 清空影片
    document.getElementById('video-frame').src = '';
    document.getElementById('video-player').src = '';
    document.getElementById('video-player').style.display = 'none';
    document.getElementById('video-frame').style.display = 'block';
    
    // 重置貓爪狀態
    hideCatPaw();
}

// 載入當前影片 - 優化版本
function loadCurrentVideo() {
    if (filteredVideos.length === 0) return;
    
    const currentVideo = filteredVideos[currentVideoIndex];
    const videoFrame = document.getElementById('video-frame');
    const videoPlayer = document.getElementById('video-player');
    const videoDisplay = document.querySelector('.video-display');
    const videoInfo = document.querySelector('.video-info');
    const loadingIndicator = document.getElementById('loading-indicator');
    
    console.log('載入影片:', currentVideo);
    
    // 顯示載入指示器
    showLoadingIndicator();
    
    // 添加切換動畫
    videoDisplay.classList.add('switching');
    if (videoInfo) {
        videoInfo.classList.add('updating');
    }
    
    // 延遲載入新影片以確保動畫效果
    setTimeout(() => {
        // 根據影片類型選擇播放方式
        if (currentVideo.type === 'direct') {
            // 直接影片播放
            console.log('使用 video 標籤播放:', currentVideo.url);
            videoFrame.style.display = 'none';
            videoPlayer.style.display = 'block';
            videoPlayer.src = currentVideo.url;
            
            // 確保影片載入完成
            videoPlayer.onloadeddata = () => {
                hideLoadingIndicator();
                videoDisplay.classList.remove('switching');
                if (videoInfo) {
                    videoInfo.classList.remove('updating');
                }
            };
            
            // 錯誤處理
            videoPlayer.onerror = (e) => {
                console.error('影片載入失敗:', e);
                hideLoadingIndicator();
                videoDisplay.classList.remove('switching');
                alert('影片載入失敗，請檢查影片連結是否有效');
            };
        } else {
            // YouTube iframe 播放
            console.log('使用 iframe 播放:', currentVideo.url);
            videoPlayer.style.display = 'none';
            videoFrame.style.display = 'block';
            
            // 設置影片 - 使用正確的參數格式
            const url = new URL(currentVideo.url);
            
            // 提取視頻 ID 用於 playlist 參數
            const videoIdMatch = currentVideo.url.match(/embed\/([a-zA-Z0-9_-]+)/);
            const videoId = videoIdMatch ? videoIdMatch[1] : '';
            
            // 設置所有可用的參數來隱藏 YouTube UI
            url.searchParams.set('autoplay', '1');
            url.searchParams.set('mute', '0');
            url.searchParams.set('loop', '1');
            url.searchParams.set('playlist', videoId); // 添加 playlist 參數以確保循環播放
            url.searchParams.set('controls', '0');  // 隱藏控制條
            url.searchParams.set('modestbranding', '1');  // 減少 YouTube 品牌標識
            url.searchParams.set('rel', '0');  // 不顯示相關影片
            url.searchParams.set('showinfo', '0');  // 隱藏影片資訊
            url.searchParams.set('iv_load_policy', '3');  // 隱藏註解
            url.searchParams.set('fs', '0');  // 隱藏全螢幕按鈕
            url.searchParams.set('disablekb', '1');  // 停用鍵盤控制
            url.searchParams.set('playsinline', '1');  // 在 iOS 上內嵌播放
            url.searchParams.set('cc_load_policy', '0');  // 不自動顯示字幕
            url.searchParams.set('origin', window.location.origin);  // 增加安全性
            
            // 檢查是否為 Shorts（透過原始 URL）
            const originalUrl = filteredVideos[currentVideoIndex].originalUrl || '';
            if (originalUrl.includes('/shorts/')) {
                console.log('正在載入 YouTube Shorts');
            }
            
            videoFrame.src = url.toString();
            console.log('設置影片 src:', videoFrame.src);
            
            // 模擬載入完成
            setTimeout(() => {
                hideLoadingIndicator();
                videoDisplay.classList.remove('switching');
                if (videoInfo) {
                    videoInfo.classList.remove('updating');
                }
            }, 800);
        }
        
        // 更新影片資訊
        updateVideoInfo(currentVideo);
        
    }, 200);
}

// 更新影片資訊
function updateVideoInfo(video) {
    // 只更新標籤，不再更新標題
    updateVideoTags(video.tags);
    
    // 更新播放索引
    updatePlayIndex();
}

// 更新播放索引
function updatePlayIndex() {
    const currentIndexElement = document.getElementById('current-index');
    if (currentIndexElement && filteredVideos.length > 0) {
        currentIndexElement.textContent = `${currentVideoIndex + 1} / ${filteredVideos.length}`;
    }
}

// 更新影片標籤
function updateVideoTags(tags) {
    const videoTagsContainer = document.getElementById('video-tags');
    videoTagsContainer.innerHTML = '';
    
    tags.forEach((tag, index) => {
        const tagElement = document.createElement('span');
        tagElement.className = 'video-tag';
        tagElement.textContent = tag;
        
        // 添加延遲動畫，讓標籤依序出現
        tagElement.style.animationDelay = (index * 0.1) + 's';
        
        videoTagsContainer.appendChild(tagElement);
    });
}

// 顯示載入指示器
function showLoadingIndicator() {
    const loadingIndicator = document.getElementById('loading-indicator');
    loadingIndicator.classList.add('show');
}

// 隱藏載入指示器
function hideLoadingIndicator() {
    const loadingIndicator = document.getElementById('loading-indicator');
    loadingIndicator.classList.remove('show');
}

// 上一個影片
function previousVideo() {
    if (filteredVideos.length === 0 || isSwitching) return;
    
    isSwitching = true;
    updateControlButtons();
    
    currentVideoIndex = (currentVideoIndex - 1 + filteredVideos.length) % filteredVideos.length;
    loadCurrentVideo();
    
    // 重置切換狀態
    setTimeout(() => {
        isSwitching = false;
        updateControlButtons();
    }, 1200);
}

// 下一個影片
function nextVideo() {
    if (filteredVideos.length === 0 || isSwitching) return;
    
    isSwitching = true;
    updateControlButtons();
    
    currentVideoIndex = (currentVideoIndex + 1) % filteredVideos.length;
    loadCurrentVideo();
    
    // 重置切換狀態
    setTimeout(() => {
        isSwitching = false;
        updateControlButtons();
    }, 1200);
}

// 更新控制按鈕狀態
function updateControlButtons() {
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    
    if (isSwitching) {
        prevBtn.classList.add('disabled');
        nextBtn.classList.add('disabled');
    } else {
        prevBtn.classList.remove('disabled');
        nextBtn.classList.remove('disabled');
    }
}

// 鍵盤事件
document.addEventListener('keydown', function(event) {
    if (isVideoPageActive) {
        switch(event.key) {
            case 'ArrowUp':
                event.preventDefault();
                previousVideo();
                break;
            case 'ArrowDown':
                event.preventDefault();
                nextVideo();
                break;
            case 'Escape':
                goHome();
                break;
        }
    } else {
        switch(event.key) {
            case 'Enter':
                startWatching();
                break;
            case 'ArrowDown':
                event.preventDefault();
                startWatching();
                break;
        }
    }
});

// 滾輪事件
document.addEventListener('wheel', function(event) {
    if (isVideoPageActive) {
        event.preventDefault();
        if (event.deltaY > 0) {
            nextVideo();
        } else {
            previousVideo();
        }
    }
});

// 滑動手勢和貓爪變數
let swipeStartY = 0;
let swipeStartTime = 0;
let isSwipeGesture = false;
let catPawVisible = false;

// 初始化貓爪拖曳按鈕
function initCatPawDrag() {
    const catPawContainer = document.getElementById('cat-paw-container');
    const catPaw = document.getElementById('cat-paw');
    
    if (!catPawContainer || !catPaw) return;
    
    let isDragging = false;
    let startY = 0;
    let currentY = 0;
    let initialTransform = 80; // 初始的 translateY 值
    
    // 滑鼠事件
    catPaw.addEventListener('mousedown', startDrag);
    
    // 觸控事件
    catPaw.addEventListener('touchstart', startDrag, { passive: false });
    
    function startDrag(e) {
        if (isVideoPageActive) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        isDragging = true;
        startY = e.touches ? e.touches[0].clientY : e.clientY;
        currentY = startY;
        
        catPaw.style.cursor = 'grabbing';
        catPaw.style.transition = 'none';
        
        // 添加事件監聽器
        if (e.touches) {
            document.addEventListener('touchmove', drag, { passive: false });
            document.addEventListener('touchend', endDrag, { passive: false });
        } else {
            document.addEventListener('mousemove', drag);
            document.addEventListener('mouseup', endDrag);
        }
    }
    
    function drag(e) {
        if (!isDragging) return;
        
        e.preventDefault();
        
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const deltaY = startY - clientY; // 向上拖是正值
        
        // 計算新的位置
        const newTransform = Math.max(-50, initialTransform - deltaY);
        catPaw.style.transform = `translateY(${newTransform}px)`;
        
        // 更新視覺效果
        updateCatPawVisual(deltaY);
        
        // 如果拖得夠遠，顯示提示
        if (deltaY > 100) {
            showPullHint();
        } else {
            hidePullHint();
        }
        
        currentY = clientY;
    }
    
    function endDrag(e) {
        if (!isDragging) return;
        
        isDragging = false;
        const deltaY = startY - currentY;
        
        catPaw.style.cursor = 'grab';
        catPaw.style.transition = 'transform 0.3s ease';
        
        // 如果拖得夠遠，進入影片
        if (deltaY > 120) {
            enterVideoWithCatPaw();
        } else {
            // 回到原位
            resetCatPaw();
        }
        
        hidePullHint();
        
        // 移除事件監聽器
        document.removeEventListener('mousemove', drag);
        document.removeEventListener('mouseup', endDrag);
        document.removeEventListener('touchmove', drag);
        document.removeEventListener('touchend', endDrag);
    }
}

// 更新貓爪視覺效果
function updateCatPawVisual(deltaY) {
    const catPaw = document.getElementById('cat-paw');
    if (!catPaw) return;
    
    // 計算進度 (0 到 1)
    const progress = Math.min(deltaY / 150, 1);
    
    // 更新爪子
    const claws = catPaw.querySelectorAll('.claw');
    claws.forEach((claw, index) => {
        if (progress > 0.3) {
            claw.style.opacity = '1';
            claw.style.transform = claw.style.transform.replace(/scale\([^)]*\)/g, '') + ` scale(${1 + progress * 0.5})`;
        } else {
            claw.style.opacity = '0.7';
            claw.style.transform = claw.style.transform.replace(/scale\([^)]*\)/g, '');
        }
    });
    
    // 添加發光效果
    if (progress > 0.7) {
        catPaw.style.filter = 'drop-shadow(0 0 20px rgba(78, 205, 196, 0.5))';
    } else {
        catPaw.style.filter = 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))';
    }
}

// 重置貓爪
function resetCatPaw() {
    const catPaw = document.getElementById('cat-paw');
    if (catPaw) {
        catPaw.style.transform = 'translateY(80px)';
        catPaw.style.filter = 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))';
        
        // 重置爪子
        const claws = catPaw.querySelectorAll('.claw');
        claws.forEach(claw => {
            claw.style.opacity = '0.7';
            claw.style.transform = claw.style.transform.replace(/scale\([^)]*\)/g, '');
        });
    }
}

// 隱藏貓爪 (保持向後相容)
function hideCatPaw() {
    resetCatPaw();
}

// 貓爪拉動進入影片
function enterVideoWithCatPaw() {
    const catPaw = document.getElementById('cat-paw');
    if (catPaw) {
        // 貓爪向上消失的動畫
        catPaw.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
        catPaw.style.transform = 'translateY(-200px) scale(1.2)';
        catPaw.style.opacity = '0';
        
        // 延遲進入影片頁面
        setTimeout(() => {
            startWatching();
            // 重置貓爪
            setTimeout(() => {
                hideCatPaw();
                catPaw.style.transition = 'transform 0.3s ease';
                catPaw.style.opacity = '1';
            }, 500);
        }, 600);
    }
}

// 顯示拉動提示
function showPullHint() {
    const pullHint = document.getElementById('pull-hint');
    if (pullHint) {
        pullHint.style.opacity = '1';
        pullHint.style.transform = 'translateX(-50%) scale(1.1)';
    }
}

// 隱藏拉動提示
function hidePullHint() {
    const pullHint = document.getElementById('pull-hint');
    if (pullHint) {
        pullHint.style.opacity = '0.8';
        pullHint.style.transform = 'translateX(-50%) scale(1)';
    }
}

// 頁面載入完成後初始化
document.addEventListener('DOMContentLoaded', async function() {
    console.log('頁面開始載入...');
    
    // 先載入 Google Sheets 資料
    await loadVideoLibrary();
    
    // 初始化貓爪拖曳按鈕
    initCatPawDrag();
    
    // 初始化控制按鈕狀態
    updateControlButtons();
    
    // 檢查是否需要顯示清除按鈕
    checkAndShowClearButton();
    
    // 添加一些提示文字
    setTimeout(() => {
        const subtitle = document.querySelector('.subtitle');
        if (subtitle) {
            subtitle.innerHTML = '拖曳標籤餵貓咪<br>開始你的影片之旅<br><small>💡 提示：按向下鍵開始觀看</small>';
        }
    }, 1000);
    
    console.log('頁面初始化完成');
}); 

// 測試函數 - 可在控制台中執行
window.testSITDown = function() {
    console.log('=== SITDown 測試開始 ===');
    
    // 檢查影片庫
    console.log(`影片庫: ${videoLibrary.length} 個影片`);
    if (videoLibrary.length > 0) {
        console.log('第一個影片:', videoLibrary[0]);
    }
    
    // 檢查標籤
    const tags = document.querySelectorAll('.draggable-tag');
    console.log(`標籤數量: ${tags.length}`);
    
    // 檢查籃子
    const basket = document.getElementById('selection-basket');
    console.log('籃子元素:', basket ? '存在' : '不存在');
    
    // 檢查影片框架
    const videoFrame = document.getElementById('video-frame');
    console.log('影片框架:', videoFrame ? '存在' : '不存在');
    console.log('當前影片 src:', videoFrame?.src || '無');
    
    // 測試載入第一個影片
    if (videoLibrary.length > 0) {
        console.log('測試載入第一個影片...');
        filteredVideos = videoLibrary;
        currentVideoIndex = 0;
        loadCurrentVideo();
    }
    
    console.log('=== 測試結束 ===');
}; 

// 手動重新載入 Google Sheets 資料
window.reloadVideoLibrary = async function() {
    console.log('=== 手動重新載入影片庫 ===');
    
    // 清空現有標籤
    const tagsPlayground = document.getElementById('tags-playground');
    if (tagsPlayground) {
        tagsPlayground.innerHTML = '';
    }
    
    // 重置選中標籤
    selectedTags = [];
    updateSelectedCount();
    
    // 重新載入資料
    await loadVideoLibrary();
    
    console.log('=== 重新載入完成 ===');
};

// 檢查影片庫中的 Shorts
window.checkShortsInLibrary = function() {
    console.log('=== 檢查影片庫中的 YouTube Shorts ===');
    
    let shortsCount = 0;
    let regularCount = 0;
    const shortsList = [];
    
    videoLibrary.forEach((video, index) => {
        if (video.isShorts || (video.originalUrl && video.originalUrl.includes('/shorts/'))) {
            shortsCount++;
            shortsList.push({
                index: index + 1,
                title: video.title,
                url: video.url,
                originalUrl: video.originalUrl || '無原始 URL'
            });
        } else {
            regularCount++;
        }
    });
    
    console.log(`總影片數: ${videoLibrary.length}`);
    console.log(`Shorts 數量: ${shortsCount}`);
    console.log(`一般影片數量: ${regularCount}`);
    
    if (shortsList.length > 0) {
        console.log('\nShorts 列表:');
        shortsList.forEach(shorts => {
            console.log(`#${shorts.index}: ${shorts.title}`);
            console.log(`  原始: ${shorts.originalUrl}`);
            console.log(`  嵌入: ${shorts.url}`);
        });
    }
    
    return shortsList;
};

// 測試 YouTube Shorts 轉換
window.testShortsConversion = function(url) {
    console.log('=== 測試 YouTube Shorts URL 轉換 ===');
    console.log('原始 URL:', url);
    const embedUrl = convertToEmbedUrl(url);
    console.log('轉換後 URL:', embedUrl);
    
    // 如果成功轉換，試著載入這個影片
    if (embedUrl) {
        const testVideo = {
            id: 999,
            title: "測試 Shorts",
            url: embedUrl,
            originalUrl: url,
            tags: ["測試"],
            type: "youtube",
            isShorts: url.includes('/shorts/')
        };
        
        // 設置為當前影片並載入
        filteredVideos = [testVideo];
        currentVideoIndex = 0;
        
        // 切換到影片頁面
        showVideoPage();
        loadCurrentVideo();
        
        console.log('已載入測試影片，請查看播放效果');
    }
    
    return embedUrl;
};

// 批量測試 Shorts URL
window.testMultipleShortsUrls = function() {
    const testUrls = [
        'https://www.youtube.com/shorts/ABC123',
        'https://youtube.com/shorts/XYZ789',
        'https://m.youtube.com/shorts/DEF456',
        'https://www.youtube.com/watch?v=GHI789',
        'https://youtu.be/JKL012'
    ];
    
    console.log('=== 批量測試 URL 轉換 ===');
    testUrls.forEach(url => {
        console.log(`\n測試: ${url}`);
        const result = convertToEmbedUrl(url);
        console.log(`結果: ${result || '轉換失敗'}`);
    });
};

// 測試 Google Sheets 連接
window.testGoogleSheets = async function() {
    console.log('=== 測試 Google Sheets 連接 ===');
    
    const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;
    console.log('測試 URL:', csvUrl);
    
    try {
        const response = await fetch(csvUrl);
        console.log('Response status:', response.status);
        console.log('Response OK:', response.ok);
        
        if (response.ok) {
            const text = await response.text();
            console.log('CSV 內容長度:', text.length);
            console.log('前 500 字元:');
            console.log(text.substring(0, 500));
            
            // 簡單分析
            const rows = text.split(/\r?\n/);
            console.log('總行數:', rows.length);
            
            // 顯示前 5 行
            console.log('前 5 行內容:');
            for (let i = 0; i < Math.min(5, rows.length); i++) {
                console.log(`第 ${i + 1} 行:`, rows[i]);
            }
        }
    } catch (error) {
        console.error('連接失敗:', error);
    }
    
    console.log('=== 測試結束 ===');
}; 

// 檢查並顯示清除按鈕
function checkAndShowClearButton() {
    const clearBtn = document.getElementById('clearDataBtn');
    if (!clearBtn) return;
    
    // 檢查localStorage是否有匯入的資料
    const manualData = localStorage.getItem('sitdown_manual_videos');
    
    if (manualData) {
        try {
            const videos = JSON.parse(manualData);
            if (videos && videos.length > 0) {
                clearBtn.style.display = 'block';
                console.log(`發現已匯入 ${videos.length} 個影片，顯示清除按鈕`);
            }
        } catch (e) {
            console.error('解析匯入資料失敗:', e);
        }
    }
}

// 清除已匯入的資料
function clearImportedData() {
    // 顯示確認對話框
    const confirmMsg = `確定要清除所有已匯入的影片資料嗎？\n\n這將會：\n• 刪除所有從CSV匯入的影片\n• 恢復使用預設的影片來源\n\n此操作無法復原！`;
    
    if (confirm(confirmMsg)) {
        try {
            // 清除localStorage中的資料
            localStorage.removeItem('sitdown_manual_videos');
            
            // 顯示成功訊息
            alert('✅ 已成功清除所有匯入的影片資料！\n\n頁面將重新載入...');
            
            // 重新載入頁面
            window.location.reload();
        } catch (error) {
            console.error('清除資料失敗:', error);
            alert('❌ 清除資料時發生錯誤，請稍後再試。');
        }
    }
} 

// 初始化貓咪事件
function initCatEvents() {
    const cat = document.getElementById('cat');
    const catImg = document.getElementById('cat-img');
    const catContainer = document.getElementById('cat-container');
    
    if (!catContainer || !cat || !catImg) {
        console.error('找不到貓咪容器元素');
        return;
    }
    
    catContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
        cat.classList.add('drag-over');
        catImg.src = 'cat2_open.png';  // 切換到張嘴圖片
    });
    
    catContainer.addEventListener('dragleave', (e) => {
        // 確保是真的離開了貓咪區域
        const rect = catContainer.getBoundingClientRect();
        const x = e.clientX;
        const y = e.clientY;
        
        if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
            cat.classList.remove('drag-over');
            catImg.src = 'cat1_close.png';  // 切換回閉嘴圖片
        }
    });
    
    catContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        cat.classList.remove('drag-over');
        catImg.src = 'cat1_close.png';  // 切換回閉嘴圖片
    });
} 

// 檢查滑鼠/觸控是否在貓咪上方
function checkCatHover(touch) {
    const cat = document.getElementById('cat');
    const catImg = document.getElementById('cat-img');
    const catContainer = document.getElementById('cat-container');
    const catRect = catContainer.getBoundingClientRect();
    
    const clientX = touch.clientX;
    const clientY = touch.clientY;
    
    if (clientX >= catRect.left && clientX <= catRect.right &&
        clientY >= catRect.top && clientY <= catRect.bottom) {
        cat.classList.add('drag-over');
        catImg.src = 'cat2_open.png';  // 切換到張嘴圖片
    } else {
        cat.classList.remove('drag-over');
        catImg.src = 'cat1_close.png';  // 切換回閉嘴圖片
    }
}

// 檢查是否放在貓咪上
function isOverCat(touch) {
    const catContainer = document.getElementById('cat-container');
    const catRect = catContainer.getBoundingClientRect();
    
    const clientX = touch.clientX;
    const clientY = touch.clientY;
    
    return clientX >= catRect.left && clientX <= catRect.right &&
           clientY >= catRect.top && clientY <= catRect.bottom;
}

// 移除貓咪懸停效果
function removeCatHover() {
    const cat = document.getElementById('cat');
    const catImg = document.getElementById('cat-img');
    cat.classList.remove('drag-over');
    catImg.src = 'cat1_close.png';  // 切換回閉嘴圖片
}

// 移動標籤到貓咪下方
function moveTagToCat(tagElement) {
    const selectedArea = document.getElementById('selected-tags-area');
    
    // 從原本的容器移除
    if (tagElement.parentNode) {
        tagElement.parentNode.removeChild(tagElement);
    }
    
    // 添加到已選擇區域
    selectedArea.appendChild(tagElement);
}

// 移動標籤回標籤區
function moveTagToPlayground(tagElement) {
    const playground = document.getElementById('tags-playground');
    
    // 從已選擇區域移除
    if (tagElement.parentNode) {
        tagElement.parentNode.removeChild(tagElement);
    }
    
    // 添加回標籤區
    playground.appendChild(tagElement);
}