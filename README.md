

# 2048蓝天白云版

![image](https://github.com/user-attachments/assets/aed621a1-f8ae-4ef3-9b28-63541a9d905e)

一个清新风格的2048游戏实现，支持键盘和触摸控制。

## 功能特点

- 🎮 双操作模式：键盘方向键和触摸滑动
- ☁️ 蓝天白云主题界面
- 🔄 撤销上一步功能
- 📱 响应式设计，适配不同设备

## 使用说明

### 键盘控制
- ↑ 向上移动
- ↓ 向下移动
- ← 向左移动
- → 向右移动

### 触摸控制
- 上滑：向上移动
- 下滑：向下移动
- 左滑：向左移动
- 右滑：向右移动

### 按钮功能
- 新游戏：重置游戏
- 撤销：回退上一步操作

## 技术实现

### 文件结构
```
2048蓝天白云版/
├── index.html    # 主页面
├── script.js    # 游戏逻辑
└── style.css    # 样式设计
```

### 核心代码
```javascript
// 触摸控制实现
function setupTouchControls() {
    let touchStartX = 0;
    let touchStartY = 0;
    const minSwipeDistance = 50;
    
    document.addEventListener('touchstart', function(e) {
        const touch = e.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
    }, {passive: false});
    
    document.addEventListener('touchmove', function(e) {
        const touch = e.touches[0];
        const diffX = touchStartX - touch.clientX;
        const diffY = touchStartY - touch.clientY;
        
        if (Math.abs(diffX) > Math.abs(diffY)) {
            diffX > 0 ? handleKeyPress({key: 'ArrowLeft'}) 
                     : handleKeyPress({key: 'ArrowRight'});
        } else {
            diffY > 0 ? handleKeyPress({key: 'ArrowUp'}) 
                     : handleKeyPress({key: 'ArrowDown'});
        }
        e.preventDefault();
    }, {passive: false});
}
```

## 开发建议

1. 可添加的改进：
   - 游戏音效
   - 分数排行榜
   - 更多主题风格
   - 动画效果优化

2. 测试建议：
   - 在不同设备上测试触摸响应
   - 验证撤销功能的正确性
   - 检查内存使用情况

## 许可证
MIT License - 自由使用和修改
