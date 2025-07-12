// 內嵌診斷工具 - 直接在 index.html 中使用
(function() {
    // 創建診斷面板
    const panel = document.createElement('div');
    panel.id = 'debug-panel';
    panel.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        width: 300px;
        max-height: 80vh;
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 15px;
        border-radius: 10px;
        font-family: monospace;
        font-size: 12px;
        z-index: 99999;
        overflow-y: auto;
        border: 2px solid #4ecdc4;
    `;
    
    // 診斷資訊
    let html = '<h3 style="color:#4ecdc4;margin-top:0;">🔍 診斷資訊</h3>';
    
    // 1. 檢查關鍵元素
    html += '<h4>元素檢查：</h4><ul style="margin:0;padding-left:20px;">';
    const elements = ['homepage', 'video-page', 'tags-playground', 'selection-basket'];
    elements.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            const styles = window.getComputedStyle(el);
            html += `<li style="color:#4ecdc4;">✓ #${id}<br>
                display: ${styles.display}<br>
                opacity: ${styles.opacity}</li>`;
        } else {
            html += `<li style="color:#ff6b6b;">✗ #${id} 不存在</li>`;
        }
    });
    html += '</ul>';
    
    // 2. 檢查 active 頁面
    html += '<h4>Active 頁面：</h4>';
    const activePage = document.querySelector('.page.active');
    if (activePage) {
        html += `<p style="color:#4ecdc4;">✓ ${activePage.id}</p>`;
    } else {
        html += '<p style="color:#ff6b6b;">✗ 沒有 active 頁面</p>';
    }
    
    // 3. 檢查標籤
    html += '<h4>標籤狀態：</h4>';
    const tags = document.querySelectorAll('.draggable-tag');
    html += `<p>找到 ${tags.length} 個標籤</p>`;
    
    // 4. GSAP 狀態
    html += '<h4>GSAP 狀態：</h4>';
    if (typeof gsap !== 'undefined') {
        html += `<p style="color:#4ecdc4;">✓ GSAP 已載入 (v${gsap.version})</p>`;
    } else {
        html += '<p style="color:#ff6b6b;">✗ GSAP 未載入</p>';
    }
    
    // 5. JavaScript 錯誤
    html += '<h4>JS 錯誤：</h4>';
    html += '<div id="error-log" style="max-height:100px;overflow-y:auto;"></div>';
    
    // 快速修復按鈕
    html += '<h4>快速操作：</h4>';
    html += '<button onclick="fixDisplay()" style="margin:2px;padding:5px;">修復顯示</button>';
    html += '<button onclick="location.reload()" style="margin:2px;padding:5px;">重新載入</button>';
    html += '<button onclick="document.getElementById(\'debug-panel\').remove()" style="margin:2px;padding:5px;">關閉診斷</button>';
    
    panel.innerHTML = html;
    document.body.appendChild(panel);
    
    // 錯誤監聽
    window.onerror = function(msg, url, line) {
        const errorLog = document.getElementById('error-log');
        if (errorLog) {
            errorLog.innerHTML += `<div style="color:#ff6b6b;">${msg} (line ${line})</div>`;
        }
    };
    
    // 修復顯示函數
    window.fixDisplay = function() {
        console.log('嘗試修復顯示...');
        
        // 強制顯示首頁
        const homepage = document.getElementById('homepage');
        if (homepage) {
            homepage.classList.add('active');
            homepage.style.display = 'block';
            homepage.style.opacity = '1';
            homepage.style.transform = 'translateY(0)';
            homepage.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        }
        
        // 隱藏影片頁
        const videoPage = document.getElementById('video-page');
        if (videoPage) {
            videoPage.classList.remove('active');
            videoPage.style.display = 'none';
        }
        
        // 確保 body 樣式正確
        document.body.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        document.body.style.color = 'white';
        
        alert('已嘗試修復！');
        
        // 更新診斷面板
        setTimeout(() => {
            document.getElementById('debug-panel').remove();
            // 重新創建診斷面板
            const script = document.createElement('script');
            script.src = 'inline-debug.js';
            document.body.appendChild(script);
        }, 100);
    };
    
    console.log('診斷面板已載入');
})(); 