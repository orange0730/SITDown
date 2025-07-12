const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.db');

console.log('開始初始化資料庫...');

db.serialize(() => {
    // 創建影片表
    db.run(`
        CREATE TABLE IF NOT EXISTS videos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            url TEXT NOT NULL UNIQUE,
            type TEXT DEFAULT 'unknown',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) {
            console.error('創建 videos 表失敗:', err);
        } else {
            console.log('✓ 創建 videos 表成功');
        }
    });

    // 創建標籤表
    db.run(`
        CREATE TABLE IF NOT EXISTS tags (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) {
            console.error('創建 tags 表失敗:', err);
        } else {
            console.log('✓ 創建 tags 表成功');
        }
    });

    // 創建影片-標籤關聯表
    db.run(`
        CREATE TABLE IF NOT EXISTS video_tags (
            video_id INTEGER NOT NULL,
            tag_id INTEGER NOT NULL,
            PRIMARY KEY (video_id, tag_id),
            FOREIGN KEY (video_id) REFERENCES videos(id),
            FOREIGN KEY (tag_id) REFERENCES tags(id)
        )
    `, (err) => {
        if (err) {
            console.error('創建 video_tags 表失敗:', err);
        } else {
            console.log('✓ 創建 video_tags 表成功');
        }
    });

    // 創建索引
    db.run('CREATE INDEX IF NOT EXISTS idx_video_tags_video_id ON video_tags(video_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_video_tags_tag_id ON video_tags(tag_id)');
    db.run('CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at)');

    // 插入範例資料
    const sampleVideos = [
        {
            title: '搞笑瞬間',
            url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            type: 'youtube',
            tags: ['娛樂搞笑', '經典']
        },
        {
            title: '料理技巧',
            url: 'https://www.youtube.com/embed/1-SJGQ2HLp8',
            type: 'youtube',
            tags: ['教學', '料理']
        },
        {
            title: '示範影片',
            url: 'https://www.w3schools.com/html/mov_bbb.mp4',
            type: 'direct',
            tags: ['範例', '測試']
        },
        {
            title: '音樂創作',
            url: 'https://www.youtube.com/embed/kJQP7kiw5Fk',
            type: 'youtube',
            tags: ['音樂', '流行']
        },
        {
            title: '舞蹈表演',
            url: 'https://www.youtube.com/embed/CevxZvSJLk8',
            type: 'youtube',
            tags: ['舞蹈', '音樂']
        },
        {
            title: '科技開箱',
            url: 'https://www.youtube.com/embed/9bZkp7q19f0',
            type: 'youtube',
            tags: ['科技', '評測']
        },
        {
            title: '可愛動物',
            url: 'https://www.youtube.com/embed/J---aiyznGQ',
            type: 'youtube',
            tags: ['動物', '療癒']
        },
        {
            title: '運動精彩',
            url: 'https://www.youtube.com/embed/3JZ_D3ELwOQ',
            type: 'youtube',
            tags: ['運動', '精彩時刻']
        }
    ];

    console.log('\n插入範例資料...');
    
    let insertedCount = 0;
    const tagMap = new Map();

    // 先插入所有標籤
    const allTags = new Set();
    sampleVideos.forEach(video => {
        video.tags.forEach(tag => allTags.add(tag));
    });

    Array.from(allTags).forEach(tagName => {
        db.run('INSERT OR IGNORE INTO tags (name) VALUES (?)', [tagName], function(err) {
            if (!err && this.lastID) {
                tagMap.set(tagName, this.lastID);
            }
        });
    });

    // 延遲一下確保標籤都插入了
    setTimeout(() => {
        // 獲取所有標籤的 ID
        db.all('SELECT id, name FROM tags', (err, tags) => {
            if (!err) {
                tags.forEach(tag => {
                    tagMap.set(tag.name, tag.id);
                });

                // 插入影片和關聯
                sampleVideos.forEach((video, index) => {
                    db.run(
                        'INSERT OR IGNORE INTO videos (title, url, type) VALUES (?, ?, ?)',
                        [video.title, video.url, video.type],
                        function(err) {
                            if (!err && this.lastID) {
                                const videoId = this.lastID;
                                
                                // 插入標籤關聯
                                video.tags.forEach(tagName => {
                                    const tagId = tagMap.get(tagName);
                                    if (tagId) {
                                        db.run(
                                            'INSERT OR IGNORE INTO video_tags (video_id, tag_id) VALUES (?, ?)',
                                            [videoId, tagId]
                                        );
                                    }
                                });

                                insertedCount++;
                                console.log(`✓ 插入影片: ${video.title}`);
                                
                                if (insertedCount === sampleVideos.length) {
                                    console.log('\n資料庫初始化完成！');
                                    db.close();
                                }
                            }
                        }
                    );
                });
            }
        });
    }, 100);
}); 