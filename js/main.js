/**
 * 博客前台脚本 - 主题切换、移动端菜单、图片懒加载
 */
(function() {
  'use strict';

  // ==========================================
  // 暗色/亮色主题切换
  // ==========================================
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    // 从 localStorage 恢复主题
    const savedTheme = localStorage.getItem('blog-theme');
    if (savedTheme === 'dark') {
      document.body.classList.add('dark');
    }

    themeToggle.addEventListener('click', function() {
      document.body.classList.toggle('dark');
      const isDark = document.body.classList.contains('dark');
      localStorage.setItem('blog-theme', isDark ? 'dark' : 'light');

      // 切换 highlight.js 主题
      const hljsTheme = document.getElementById('hljs-theme');
      if (hljsTheme) {
        hljsTheme.href = isDark
          ? 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css'
          : 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css';
      }
    });
  }

  // ==========================================
  // 移动端菜单
  // ==========================================
  const menuToggle = document.getElementById('menuToggle');
  const nav = document.getElementById('nav');
  if (menuToggle && nav) {
    menuToggle.addEventListener('click', function() {
      nav.classList.toggle('open');
    });

    // 点击导航链接后关闭菜单
    nav.querySelectorAll('a').forEach(function(link) {
      link.addEventListener('click', function() {
        nav.classList.remove('open');
      });
    });

    // 点击页面其他区域关闭菜单
    document.addEventListener('click', function(e) {
      if (!menuToggle.contains(e.target) && !nav.contains(e.target)) {
        nav.classList.remove('open');
      }
    });
  }

  // ==========================================
  // 图片懒加载
  // ==========================================
  if ('loading' in HTMLImageElement.prototype) {
    // 浏览器原生 lazy loading
    document.querySelectorAll('img[loading="lazy"]').forEach(function(img) {
      img.addEventListener('load', function() {
        img.classList.add('loaded');
      });
      if (img.complete) {
        img.classList.add('loaded');
      }
    });
  } else {
    // 降级：使用 IntersectionObserver
    const observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src || img.src;
          img.classList.add('loaded');
          observer.unobserve(img);
        }
      });
    });

    document.querySelectorAll('img[loading="lazy"]').forEach(function(img) {
      observer.observe(img);
    });
  }

  // ==========================================
  // 文章页：代码块添加复制按钮
  // ==========================================
  document.querySelectorAll('.post-content pre').forEach(function(pre) {
    const button = document.createElement('button');
    button.className = 'copy-btn';
    button.textContent = '复制';
    button.style.cssText = `
      position: absolute;
      top: 8px;
      right: 8px;
      padding: 4px 12px;
      font-size: 0.8rem;
      background: var(--bg-secondary, #f0f0f0);
      border: 1px solid var(--border-color, #ddd);
      border-radius: 4px;
      cursor: pointer;
      opacity: 0;
      transition: opacity 0.2s;
    `;

    pre.style.position = 'relative';
    pre.appendChild(button);

    pre.addEventListener('mouseenter', function() {
      button.style.opacity = '1';
    });
    pre.addEventListener('mouseleave', function() {
      button.style.opacity = '0';
    });

    button.addEventListener('click', function() {
      const code = pre.querySelector('code');
      if (code) {
        navigator.clipboard.writeText(code.textContent).then(function() {
          button.textContent = '✓ 已复制';
          setTimeout(function() {
            button.textContent = '复制';
          }, 2000);
        }).catch(function() {
          button.textContent = '复制失败';
        });
      }
    });
  });

})();
