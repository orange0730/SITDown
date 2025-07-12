// 增強版貓爪拉動效果 - 使用 GSAP
// 可以整合到現有的 script.js 中

class EnhancedCatPaw {
    constructor() {
        this.catPaw = document.getElementById('cat-paw');
        this.container = document.getElementById('cat-paw-container');
        this.videoPage = document.getElementById('video-page');
        this.homepage = document.getElementById('homepage');
        
        // 拖曳狀態
        this.isDragging = false;
        this.startY = 0;
        this.currentY = 0;
        this.progress = 0;
        
        // 初始化 GSAP timeline
        this.setupTimeline();
        this.bindEvents();
    }
    
    setupTimeline() {
        // 創建主要動畫時間軸
        this.tl = gsap.timeline({ paused: true });
        
        // 背景撕裂效果
        this.tl.to('.homepage-content', {
            clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
            duration: 0.8,
            ease: 'power2.inOut'
        }, 0);
        
        // 貓爪上升動畫
        this.tl.to(this.catPaw, {
            y: -300,
            rotation: -10,
            duration: 0.8,
            ease: 'power2.out'
        }, 0);
        
        // 爪子張開效果
        this.tl.to('.claw', {
            scale: 1.5,
            rotation: (index) => index === 1 ? -20 : index === 2 ? 0 : 20,
            duration: 0.6,
            stagger: 0.05,
            ease: 'back.out(1.5)'
        }, 0.2);
        
        // 影片預覽淡入
        this.tl.to('.video-preview', {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: 'power2.out'
        }, 0.4);
    }
    
    bindEvents() {
        // 滑鼠事件
        this.catPaw.addEventListener('mousedown', this.startDrag.bind(this));
        document.addEventListener('mousemove', this.onDrag.bind(this));
        document.addEventListener('mouseup', this.endDrag.bind(this));
        
        // 觸控事件
        this.catPaw.addEventListener('touchstart', this.startDrag.bind(this));
        document.addEventListener('touchmove', this.onDrag.bind(this));
        document.addEventListener('touchend', this.endDrag.bind(this));
    }
    
    startDrag(e) {
        e.preventDefault();
        this.isDragging = true;
        this.startY = e.touches ? e.touches[0].clientY : e.clientY;
        
        // 添加拖曳中的視覺反饋
        gsap.to(this.catPaw, {
            scale: 1.1,
            duration: 0.2,
            ease: 'power2.out'
        });
    }
    
    onDrag(e) {
        if (!this.isDragging) return;
        
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const deltaY = this.startY - clientY;
        
        // 計算進度 (0 到 1)
        this.progress = Math.max(0, Math.min(1, deltaY / 200));
        
        // 更新動畫進度
        this.tl.progress(this.progress);
        
        // 額外的視覺效果
        this.updateVisualEffects(this.progress);
    }
    
    endDrag(e) {
        if (!this.isDragging) return;
        this.isDragging = false;
        
        // 根據進度決定動作
        if (this.progress > 0.7) {
            // 完成拉動，進入影片頁面
            this.completeTransition();
        } else {
            // 回彈動畫
            this.springBack();
        }
    }
    
    updateVisualEffects(progress) {
        // 發光效果
        const glowIntensity = progress * 20;
        gsap.set(this.catPaw, {
            filter: `drop-shadow(0 0 ${glowIntensity}px rgba(78, 205, 196, 0.8))`
        });
        
        // 震動效果
        if (progress > 0.5) {
            const shakeX = (Math.random() - 0.5) * progress * 5;
            const shakeY = (Math.random() - 0.5) * progress * 5;
            gsap.set(this.catPaw, {
                x: shakeX,
                y: -progress * 200 + shakeY
            });
        }
    }
    
    completeTransition() {
        // 完成動畫
        gsap.to(this.tl, {
            progress: 1,
            duration: 0.5,
            ease: 'power2.inOut',
            onComplete: () => {
                // 切換到影片頁面
                this.showVideoPage();
            }
        });
        
        // 爪子收回動畫
        gsap.to('.claw', {
            scale: 0.8,
            opacity: 0,
            duration: 0.3,
            stagger: 0.05,
            ease: 'power2.in'
        });
    }
    
    springBack() {
        // 彈性回彈
        gsap.to(this.tl, {
            progress: 0,
            duration: 0.8,
            ease: 'elastic.out(1, 0.5)'
        });
        
        // 貓爪回彈
        gsap.to(this.catPaw, {
            scale: 1,
            x: 0,
            y: 0,
            rotation: 0,
            duration: 0.8,
            ease: 'elastic.out(1, 0.5)'
        });
        
        // 移除發光
        gsap.to(this.catPaw, {
            filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))',
            duration: 0.3
        });
    }
    
    showVideoPage() {
        // 這裡可以呼叫現有的 showVideoPage 函數
        if (window.showVideoPage) {
            window.showVideoPage();
        }
    }
}

// 使用方式：
// 1. 在 HTML 中引入 GSAP:
// <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
// 
// 2. 初始化：
// const enhancedCatPaw = new EnhancedCatPaw(); 