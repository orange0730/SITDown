// GSAP 動畫增強 - 安全版本
// 只包含不會破壞原有功能的增強效果

// 等待完全載入
window.addEventListener('load', function() {
    // 確保原始功能已完全初始化
    setTimeout(initSafeGSAPEnhancements, 2000);
});

function initSafeGSAPEnhancements() {
    console.log('GSAP 安全增強已載入');
    
    // 只啟用安全的增強功能
    enhanceBasketSuccess();
    enhanceCatPawHover();
    enhanceControlButtons();
    addLoadingSpinner();
}

// 1. 增強籃子成功動畫（不影響原有功能）
function enhanceBasketSuccess() {
    const basket = document.getElementById('selection-basket');
    if (!basket) return;
    
    // 監聽成功 class 的添加
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && 
                mutation.attributeName === 'class' && 
                basket.classList.contains('success')) {
                
                // 簡單的縮放動畫
                gsap.to(basket, {
                    scale: 1.1,
                    duration: 0.2,
                    yoyo: true,
                    repeat: 1,
                    ease: "power2.inOut"
                });
            }
        });
    });
    
    observer.observe(basket, { attributes: true });
}

// 2. 增強貓爪懸停效果（安全）
function enhanceCatPawHover() {
    const catPaw = document.getElementById('cat-paw');
    if (!catPaw) return;
    
    // 只添加懸停效果，不影響拖曳
    catPaw.addEventListener('mouseenter', function() {
        if (!catPaw.classList.contains('dragging')) {
            gsap.to(catPaw, {
                scale: 1.05,
                duration: 0.2,
                ease: "power2.out"
            });
        }
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
}

// 3. 增強控制按鈕動畫
function enhanceControlButtons() {
    // 為上下控制按鈕添加點擊動畫
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    
    [prevBtn, nextBtn].forEach(btn => {
        if (btn) {
            btn.addEventListener('click', function() {
                gsap.to(btn, {
                    scale: 0.95,
                    duration: 0.1,
                    yoyo: true,
                    repeat: 1,
                    ease: "power2.inOut"
                });
            });
        }
    });
}

// 4. 增強載入動畫
function addLoadingSpinner() {
    const spinner = document.querySelector('.loading-spinner');
    if (spinner) {
        gsap.to(spinner, {
            rotation: 360,
            duration: 1,
            ease: "none",
            repeat: -1
        });
    }
}

// 5. 為新出現的標籤添加淡入效果（安全版本）
function addTagFadeIn() {
    // 監聽新標籤的添加
    const tagsContainer = document.getElementById('tags-playground');
    if (!tagsContainer) return;
    
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
                if (node.classList && node.classList.contains('draggable-tag')) {
                    // 簡單的淡入效果
                    gsap.fromTo(node, {
                        opacity: 0,
                        scale: 0.8
                    }, {
                        opacity: 1,
                        scale: 1,
                        duration: 0.5,
                        ease: "power2.out"
                    });
                }
            });
        });
    });
    
    observer.observe(tagsContainer, { childList: true });
}

console.log('GSAP 安全增強定義完成'); 