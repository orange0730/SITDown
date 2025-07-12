// GSAP 動畫增強 - 讓 SITDown 的動畫更流暢、更專業
// 這個檔案增強現有功能，不會破壞原有邏輯

// 等待 DOM 和原始 script.js 載入完成
window.addEventListener('load', function() {
    // 延遲執行，確保原始功能已初始化
    setTimeout(initGSAPEnhancements, 1000);
});

function initGSAPEnhancements() {
    console.log('GSAP 動畫增強已載入');
    
    // 1. 增強標籤出現動畫
    enhanceTagAnimations();
    
    // 2. 增強貓爪拖曳效果
    enhanceCatPawDrag();
    
    // 3. 增強籃子動畫
    enhanceBasketAnimations();
    
    // 4. 增強頁面切換效果
    enhancePageTransitions();
    
    // 5. 增強影片載入動畫
    enhanceVideoLoading();
    
    // 6. 增強繩子動畫
    enhanceRopeAnimations();
    
    // 7. 增強標籤拖曳體驗
    enhanceTagDragging();
    
    // 8. 增強鍵盤控制
    enhanceKeyboardControls();
}

// 1. 增強標籤出現動畫
function enhanceTagAnimations() {
    // 為所有標籤添加更流暢的入場動畫
    const tags = document.querySelectorAll('.draggable-tag');
    
    // 確保標籤已經存在且可見
    if (tags.length === 0) {
        console.log('未找到標籤元素，跳過動畫');
        return;
    }
    
    // 先確保標籤是可見的
    tags.forEach(tag => {
        tag.style.opacity = '1';
        tag.style.transform = 'scale(1)';
    });
    
    // 然後執行動畫
    gsap.fromTo(tags, {
        opacity: 0,
        scale: 0.5,
        rotation: () => Math.random() * 360
    }, {
        opacity: 1,
        scale: 1,
        rotation: 0,
        duration: 0.8,
        stagger: {
            each: 0.05,
            from: "random"
        },
        ease: "back.out(1.7)",
        onComplete: function() {
            // 動畫完成後添加懸浮效果
            tags.forEach(tag => {
                if (!tag.classList.contains('selected')) {
                    // 暫時停用漂浮動畫，避免干擾
                    // addFloatingAnimation(tag);
                }
            });
        }
    });
}

// 為單個標籤添加漂浮動畫
function addFloatingAnimation(tag) {
    // 如果標籤已被選中或正在拖曳，不添加動畫
    if (tag.classList.contains('selected') || tag.classList.contains('dragging')) {
        return;
    }
    
    const tl = gsap.timeline({ repeat: -1 });
    
    tl.to(tag, {
        x: "random(-30, 30)",
        y: "random(-30, 30)",
        rotation: "random(-5, 5)",
        duration: "random(3, 5)",
        ease: "sine.inOut"
    })
    .to(tag, {
        x: "random(-30, 30)",
        y: "random(-30, 30)",
        rotation: "random(-5, 5)",
        duration: "random(3, 5)",
        ease: "sine.inOut"
    });
    
    // 儲存動畫引用，方便後續控制
    tag._floatingTL = tl;
}

// 2. 增強貓爪拖曳效果
function enhanceCatPawDrag() {
    const catPaw = document.getElementById('cat-paw');
    const catPawContainer = document.getElementById('cat-paw-container');
    
    if (!catPaw || !catPawContainer) return;
    
    // 創建拖曳時間軸
    const dragTL = gsap.timeline({ paused: true });
    
    // 定義拖曳動畫序列
    dragTL
        .to(catPaw, {
            scale: 1.2,
            duration: 0.3,
            ease: "power2.out"
        })
        .to('.claw', {
            scale: 1.3,
            rotation: function(index) {
                return index === 0 ? -25 : index === 1 ? 0 : 25;
            },
            duration: 0.3,
            stagger: 0.05,
            ease: "back.out(2)"
        }, "-=0.2")
        .to('.paw-pad', {
            scale: 1.1,
            duration: 0.3
        }, "-=0.3");
    
    // 監聽原有的拖曳事件並增強
    const originalMouseDown = catPaw.onmousedown;
    const originalTouchStart = catPaw.ontouchstart;
    
    catPaw.addEventListener('mouseenter', function() {
        gsap.to(catPaw, {
            scale: 1.05,
            duration: 0.2,
            ease: "power2.out"
        });
    });
    
    catPaw.addEventListener('mouseleave', function() {
        if (!catPaw.classList.contains('dragging')) {
            gsap.to(catPaw, {
                scale: 1,
                duration: 0.2,
                ease: "power2.out"
            });
        }
    });
    
    // 增強拖曳開始效果
    const enhanceDragStart = function() {
        dragTL.play();
        
        // 添加發光效果
        gsap.to(catPaw, {
            filter: "drop-shadow(0 0 20px rgba(78, 205, 196, 0.8))",
            duration: 0.3
        });
    };
    
    // 增強拖曳結束效果
    const enhanceDragEnd = function() {
        dragTL.reverse();
        
        // 彈性回彈動畫
        gsap.to(catPaw, {
            scale: 1,
            filter: "drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))",
            duration: 0.5,
            ease: "elastic.out(1, 0.5)"
        });
        
        gsap.to('.claw', {
            scale: 1,
            rotation: 0,
            duration: 0.5,
            ease: "elastic.out(1, 0.5)"
        });
    };
    
    // 攔截原有事件
    catPaw.addEventListener('mousedown', enhanceDragStart);
    catPaw.addEventListener('touchstart', enhanceDragStart);
    
    document.addEventListener('mouseup', enhanceDragEnd);
    document.addEventListener('touchend', enhanceDragEnd);
}

// 3. 增強籃子動畫
function enhanceBasketAnimations() {
    const basket = document.getElementById('selection-basket');
    if (!basket) return;
    
    // 監聽標籤進入籃子
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                if (basket.classList.contains('success')) {
                    // 增強成功動畫
                    gsap.fromTo(basket, {
                        scale: 1
                    }, {
                        scale: 1.2,
                        duration: 0.3,
                        ease: "back.out(3)",
                        yoyo: true,
                        repeat: 1
                    });
                    
                    // 添加粒子效果
                    createBasketParticles();
                }
            }
        });
    });
    
    observer.observe(basket, { attributes: true });
}

// 創建籃子粒子效果
function createBasketParticles() {
    const basket = document.getElementById('selection-basket');
    const rect = basket.getBoundingClientRect();
    
    for (let i = 0; i < 10; i++) {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: fixed;
            width: 10px;
            height: 10px;
            background: #4ecdc4;
            border-radius: 50%;
            pointer-events: none;
            z-index: 1000;
        `;
        
        document.body.appendChild(particle);
        
        gsap.set(particle, {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        });
        
        gsap.to(particle, {
            x: rect.left + rect.width / 2 + (Math.random() - 0.5) * 200,
            y: rect.top + rect.height / 2 + (Math.random() - 0.5) * 200,
            opacity: 0,
            scale: 0,
            duration: 1,
            ease: "power2.out",
            onComplete: function() {
                particle.remove();
            }
        });
    }
}

// 4. 增強頁面切換效果
function enhancePageTransitions() {
    // 暫時停用頁面切換動畫，避免干擾原有功能
    return;
}

// 5. 增強影片載入動畫
function enhanceVideoLoading() {
    const loadingIndicator = document.getElementById('loading-indicator');
    
    if (loadingIndicator) {
        // 增強載入動畫
        gsap.to('.loading-spinner', {
            rotation: 360,
            duration: 1,
            ease: "none",
            repeat: -1
        });
    }
    
    // 監聽影片切換
    const originalLoadCurrentVideo = window.loadCurrentVideo;
    
    window.loadCurrentVideo = function() {
        const videoDisplay = document.querySelector('.video-display');
        
        // 切換動畫
        gsap.to(videoDisplay, {
            scale: 0.95,
            opacity: 0.7,
            duration: 0.3,
            ease: "power2.inOut",
            onComplete: function() {
                // 呼叫原始載入函數
                if (originalLoadCurrentVideo) {
                    originalLoadCurrentVideo();
                }
                
                // 載入完成動畫
                gsap.to(videoDisplay, {
                    scale: 1,
                    opacity: 1,
                    duration: 0.5,
                    ease: "power2.out",
                    delay: 0.5
                });
            }
        });
    };
}

// 工具函數：停止標籤的漂浮動畫
function stopFloatingAnimation(tag) {
    if (tag._floatingTL) {
        tag._floatingTL.kill();
        gsap.set(tag, { x: 0, y: 0, rotation: 0 });
    }
}

// 監聽標籤選中事件，停止漂浮動畫
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('draggable-tag')) {
        if (e.target.classList.contains('selected')) {
            stopFloatingAnimation(e.target);
        }
    }
});

// 6. 增強繩子動畫
function enhanceRopeAnimations() {
    // 監聽繩子的創建
    const ropeContainer = document.getElementById('rope-container');
    if (!ropeContainer) return;
    
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
                if (node.tagName === 'line' && node.classList.contains('rope-line')) {
                    animateRope(node);
                }
            });
        });
    });
    
    observer.observe(ropeContainer, { childList: true });
}

// 為繩子添加動畫
function animateRope(rope) {
    // 暫時停用繩子動畫，避免干擾原有功能
    return;
    
    // 獲取繩子的起點和終點
    const x1 = parseFloat(rope.getAttribute('x1'));
    const y1 = parseFloat(rope.getAttribute('y1'));
    const x2 = parseFloat(rope.getAttribute('x2'));
    const y2 = parseFloat(rope.getAttribute('y2'));
    
    // 從標籤位置開始繪製到籃子
    gsap.fromTo(rope, {
        attr: {
            x2: x1,
            y2: y1
        },
        opacity: 0
    }, {
        attr: {
            x2: x2,
            y2: y2
        },
        opacity: 0.8,
        duration: 0.6,
        ease: "elastic.out(1, 0.5)"
    });
}

// 7. 增強標籤拖曳體驗
function enhanceTagDragging() {
    // 為所有標籤添加 GSAP 拖曳功能
    document.addEventListener('mousedown', function(e) {
        if (e.target.classList.contains('draggable-tag')) {
            const tag = e.target;
            
            // 停止漂浮動畫
            stopFloatingAnimation(tag);
            
            // 拖曳開始效果
            gsap.to(tag, {
                scale: 1.2,
                boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
                duration: 0.2,
                ease: "power2.out"
            });
            
            // 添加拖曳類
            tag.classList.add('gsap-enhanced');
        }
    });
    
    document.addEventListener('mouseup', function(e) {
        const draggingTag = document.querySelector('.draggable-tag.dragging');
        if (draggingTag) {
            // 拖曳結束效果
            gsap.to(draggingTag, {
                scale: 1,
                boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
                duration: 0.3,
                ease: "elastic.out(1, 0.5)",
                onComplete: function() {
                    // 如果標籤未被選中，恢復漂浮動畫
                    if (!draggingTag.classList.contains('selected')) {
                        addFloatingAnimation(draggingTag);
                    }
                }
            });
        }
    });
}

// 8. 添加鍵盤快捷鍵動畫
function enhanceKeyboardControls() {
    document.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            // 為影片切換添加視覺反饋
            const controlBtn = document.querySelector(e.key === 'ArrowDown' ? '.next-btn' : '.prev-btn');
            if (controlBtn) {
                gsap.to(controlBtn, {
                    scale: 0.9,
                    duration: 0.1,
                    yoyo: true,
                    repeat: 1,
                    ease: "power2.inOut"
                });
            }
        }
    });
}

console.log('GSAP 動畫增強定義完成！'); 