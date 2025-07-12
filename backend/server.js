const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 進階 CORS 設定 - 繞過瀏覽器安全限制
const corsOptions = {
    origin: function (origin, callback) {
        // 允許所有來源（開發環境）
        callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    exposedHeaders: ['Content-Length', 'Content-Range'],
    maxAge: 86400 // 24 小時
};

app.use(cors(corsOptions));

// 額外的安全頭部設定 - 解決嵌入式內容限制
app.use((req, res, next) => {
    // 移除 X-Frame-Options 限制，允許 iframe 嵌入
    res.removeHeader('X-Frame-Options');
    
    // 設定寬鬆的 Content Security Policy
    res.setHeader('Content-Security-Policy', 
        "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; " +
        "frame-src * data: blob:; " +
        "frame-ancestors *; " +
        "script-src * 'unsafe-inline' 'unsafe-eval'; " +
        "style-src * 'unsafe-inline'; " +
        "img-src * data: blob:; " +
        "media-src * data: blob:; " +
        "connect-src *; " +
        "object-src *; " +
        "child-src * data: blob:; " +
        "worker-src * data: blob:;"
    );
    
    // 允許跨域資源共享
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Expose-Headers', '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    // 移除其他可能的限制
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');
    res.setHeader('Permissions-Policy', 'accelerometer=*, camera=*, geolocation=*, gyroscope=*, magnetometer=*, microphone=*, payment=*, usb=*');
    
    next();
});

// 處理預檢請求
app.options('*', (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', '*');
    res.header('Access-Control-Allow-Headers', '*');
    res.sendStatus(200);
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 提供靜態檔案服務（如果前端檔案在同一專案中）
app.use(express.static(path.join(__dirname, '../')));

// 資料庫連接
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error('資料庫連接失敗:', err);
    } else {
        console.log('成功連接到 SQLite 資料庫');
    }
});

// API 路由

// 影片代理路由 - 繞過 CORS 限制
app.get('/api/proxy/video', async (req, res) => {
    const { url } = req.query;
    
    if (!url) {
        return res.status(400).json({ error: '需要提供影片 URL' });
    }
    
    try {
        // 設定寬鬆的回應頭
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('X-Frame-Options', 'ALLOWALL');
        res.setHeader('Content-Security-Policy', "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;");
        
        // 如果是 YouTube URL，返回修改過的 iframe
        if (url.includes('youtube') || url.includes('youtu.be')) {
            const processedUrl = processVideoUrl(url);
            res.send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        body { margin: 0; padding: 0; overflow: hidden; }
                        iframe { width: 100vw; height: 100vh; border: none; }
                    </style>
                </head>
                <body>
                    <iframe 
                        src="${processedUrl}"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowfullscreen
                        referrerpolicy="no-referrer-when-downgrade">
                    </iframe>
                    <script>
                        // 攔截並允許所有跨域請求
                        if (window.parent !== window) {
                            document.domain = document.domain;
                        }
                    </script>
                </body>
                </html>
            `);
        } else {
            // 對於直接影片檔案，返回重定向
            res.redirect(url);
        }
    } catch (error) {
        console.error('代理錯誤:', error);
        res.status(500).json({ error: '代理請求失敗' });
    }
});

// 獲取所有影片
app.get('/api/videos', (req, res) => {
    const sql = `
        SELECT v.*, GROUP_CONCAT(t.name) as tags
        FROM videos v
        LEFT JOIN video_tags vt ON v.id = vt.video_id
        LEFT JOIN tags t ON vt.tag_id = t.id
        GROUP BY v.id
        ORDER BY v.created_at DESC
    `;
    
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        // 處理標籤格式
        const videos = rows.map(row => ({
            ...row,
            tags: row.tags ? row.tags.split(',') : []
        }));
        
        res.json({
            success: true,
            data: videos
        });
    });
});

// 根據標籤獲取影片
app.get('/api/videos/by-tags', (req, res) => {
    const tags = req.query.tags ? req.query.tags.split(',') : [];
    
    if (tags.length === 0) {
        return res.status(400).json({ error: '請提供標籤參數' });
    }
    
    const placeholders = tags.map(() => '?').join(',');
    const sql = `
        SELECT DISTINCT v.*, GROUP_CONCAT(t.name) as tags
        FROM videos v
        LEFT JOIN video_tags vt ON v.id = vt.video_id
        LEFT JOIN tags t ON vt.tag_id = t.id
        WHERE v.id IN (
            SELECT DISTINCT video_id 
            FROM video_tags 
            WHERE tag_id IN (
                SELECT id FROM tags WHERE name IN (${placeholders})
            )
        )
        GROUP BY v.id
        ORDER BY v.created_at DESC
    `;
    
    db.all(sql, tags, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        const videos = rows.map(row => ({
            ...row,
            tags: row.tags ? row.tags.split(',') : []
        }));
        
        res.json({
            success: true,
            data: videos
        });
    });
});

// 新增影片
app.post('/api/videos', (req, res) => {
    const { title, url, tags } = req.body;
    
    if (!url) {
        return res.status(400).json({ error: '請提供影片網址' });
    }
    
    // 檢測影片類型
    const type = detectVideoType(url);
    const processedUrl = processVideoUrl(url);
    const videoTitle = title || generateTitle(tags ? tags[0] : '影片');
    
    // 開始事務
    db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        // 插入影片
        const insertVideo = `INSERT INTO videos (title, url, type) VALUES (?, ?, ?)`;
        db.run(insertVideo, [videoTitle, processedUrl, type], function(err) {
            if (err) {
                db.run('ROLLBACK');
                res.status(500).json({ error: err.message });
                return;
            }
            
            const videoId = this.lastID;
            
            // 處理標籤
            if (tags && tags.length > 0) {
                const tagPromises = tags.map(tagName => {
                    return new Promise((resolve, reject) => {
                        // 先檢查標籤是否存在
                        db.get('SELECT id FROM tags WHERE name = ?', [tagName], (err, tag) => {
                            if (err) {
                                reject(err);
                                return;
                            }
                            
                            if (tag) {
                                // 標籤已存在，直接關聯
                                db.run('INSERT INTO video_tags (video_id, tag_id) VALUES (?, ?)', 
                                    [videoId, tag.id], 
                                    (err) => err ? reject(err) : resolve()
                                );
                            } else {
                                // 創建新標籤
                                db.run('INSERT INTO tags (name) VALUES (?)', [tagName], function(err) {
                                    if (err) {
                                        reject(err);
                                        return;
                                    }
                                    
                                    const tagId = this.lastID;
                                    db.run('INSERT INTO video_tags (video_id, tag_id) VALUES (?, ?)', 
                                        [videoId, tagId], 
                                        (err) => err ? reject(err) : resolve()
                                    );
                                });
                            }
                        });
                    });
                });
                
                Promise.all(tagPromises)
                    .then(() => {
                        db.run('COMMIT');
                        res.json({
                            success: true,
                            data: {
                                id: videoId,
                                title: videoTitle,
                                url: processedUrl,
                                type: type,
                                tags: tags
                            }
                        });
                    })
                    .catch(err => {
                        db.run('ROLLBACK');
                        res.status(500).json({ error: err.message });
                    });
            } else {
                db.run('COMMIT');
                res.json({
                    success: true,
                    data: {
                        id: videoId,
                        title: videoTitle,
                        url: processedUrl,
                        type: type,
                        tags: []
                    }
                });
            }
        });
    });
});

// 批量新增影片
app.post('/api/videos/batch', (req, res) => {
    const { videos } = req.body;
    
    if (!videos || !Array.isArray(videos)) {
        return res.status(400).json({ error: '請提供影片陣列' });
    }
    
    const results = [];
    let processed = 0;
    
    videos.forEach((video, index) => {
        const { title, url, tags } = video;
        
        if (!url) {
            results[index] = { error: '缺少網址' };
            processed++;
            if (processed === videos.length) {
                res.json({ success: true, data: results });
            }
            return;
        }
        
        // 使用內部 API 新增每個影片
        const videoData = {
            title: title,
            url: url,
            tags: tags
        };
        
        // 直接呼叫新增影片的邏輯
        const type = detectVideoType(url);
        const processedUrl = processVideoUrl(url);
        const videoTitle = title || generateTitle(tags ? tags[0] : '影片');
        
        db.serialize(() => {
            const insertVideo = `INSERT INTO videos (title, url, type) VALUES (?, ?, ?)`;
            db.run(insertVideo, [videoTitle, processedUrl, type], function(err) {
                if (err) {
                    results[index] = { error: err.message };
                    processed++;
                    if (processed === videos.length) {
                        res.json({ success: true, data: results });
                    }
                    return;
                }
                
                const videoId = this.lastID;
                results[index] = {
                    id: videoId,
                    title: videoTitle,
                    url: processedUrl,
                    type: type,
                    tags: tags || []
                };
                
                processed++;
                if (processed === videos.length) {
                    res.json({ success: true, data: results });
                }
            });
        });
    });
});

// 刪除影片
app.delete('/api/videos/:id', (req, res) => {
    const videoId = req.params.id;
    
    db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        // 先刪除關聯的標籤
        db.run('DELETE FROM video_tags WHERE video_id = ?', [videoId], (err) => {
            if (err) {
                db.run('ROLLBACK');
                res.status(500).json({ error: err.message });
                return;
            }
            
            // 刪除影片
            db.run('DELETE FROM videos WHERE id = ?', [videoId], function(err) {
                if (err) {
                    db.run('ROLLBACK');
                    res.status(500).json({ error: err.message });
                    return;
                }
                
                if (this.changes === 0) {
                    db.run('ROLLBACK');
                    res.status(404).json({ error: '影片不存在' });
                    return;
                }
                
                db.run('COMMIT');
                res.json({ success: true, message: '影片已刪除' });
            });
        });
    });
});

// 獲取所有標籤
app.get('/api/tags', (req, res) => {
    const sql = `
        SELECT t.*, COUNT(vt.video_id) as video_count
        FROM tags t
        LEFT JOIN video_tags vt ON t.id = vt.tag_id
        GROUP BY t.id
        ORDER BY video_count DESC
    `;
    
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        res.json({
            success: true,
            data: rows
        });
    });
});

// 工具函數
function detectVideoType(url) {
    if (url.includes('youtube') || url.includes('youtu.be')) {
        return 'youtube';
    } else if (url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.ogg')) {
        return 'direct';
    }
    return 'unknown';
}

function processVideoUrl(url) {
    // YouTube URL 轉換 - 加入額外參數繞過限制
    let embedUrl = '';
    
    if (url.includes('youtube.com/watch')) {
        const match = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
        if (match) embedUrl = `https://www.youtube.com/embed/${match[1]}`;
    } else if (url.includes('youtu.be/')) {
        const match = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
        if (match) embedUrl = `https://www.youtube.com/embed/${match[1]}`;
    } else if (url.includes('youtube.com/shorts/')) {
        const match = url.match(/shorts\/([a-zA-Z0-9_-]+)/);
        if (match) embedUrl = `https://www.youtube.com/embed/${match[1]}`;
    }
    
    // 如果是 YouTube 影片，加入額外參數
    if (embedUrl) {
        const params = new URLSearchParams({
            'autoplay': '0',           // 不自動播放
            'modestbranding': '1',     // 最小化 YouTube 品牌
            'rel': '0',                // 不顯示相關影片
            'showinfo': '0',           // 不顯示影片資訊
            'enablejsapi': '1',        // 啟用 JavaScript API
            'origin': '*',             // 允許任何來源
            'widget_referrer': '*',    // 允許任何參照
            'playsinline': '1',        // 在行內播放（mobile）
            'fs': '1',                 // 允許全螢幕
            'controls': '1',           // 顯示控制項
            'disablekb': '0',          // 允許鍵盤控制
            'cc_load_policy': '0',     // 不自動載入字幕
            'iv_load_policy': '3'      // 不顯示註解
        });
        
        return `${embedUrl}?${params.toString()}`;
    }
    
    return url;
}

function generateTitle(tag) {
    const templates = {
        '娛樂搞笑': ['搞笑瞬間', '爆笑時刻', '有趣片段'],
        '教學': ['實用教學', '技巧分享', '學習時刻'],
        '音樂': ['音樂欣賞', '精彩演出', '音樂時光'],
        '運動': ['運動精彩', '精彩瞬間', '運動時刻']
    };
    
    const defaultTemplates = ['精彩影片', '推薦觀看', '值得一看'];
    const selectedTemplates = templates[tag] || defaultTemplates;
    return selectedTemplates[Math.floor(Math.random() * selectedTemplates.length)];
}

// 啟動伺服器
app.listen(PORT, () => {
    console.log(`伺服器運行在 http://localhost:${PORT}`);
    console.log('API 端點:');
    console.log('  GET    /api/videos         - 獲取所有影片');
    console.log('  GET    /api/videos/by-tags - 根據標籤獲取影片');
    console.log('  POST   /api/videos         - 新增影片');
    console.log('  POST   /api/videos/batch   - 批量新增影片');
    console.log('  DELETE /api/videos/:id     - 刪除影片');
    console.log('  GET    /api/tags           - 獲取所有標籤');
    console.log('  GET    /api/proxy/video    - 影片代理（繞過 CORS）');
}); 