/**
 * 搜索功能 - 前台即时搜索
 */
(function() {
  'use strict';

  const searchInput = document.querySelector('.search-input');
  const searchResults = document.getElementById('searchResults');

  if (!searchInput || !searchResults) return;

  let debounceTimer = null;

  searchInput.addEventListener('input', function() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(doLiveSearch, 300);
  });

  function doLiveSearch() {
    const q = searchInput.value.trim();

    if (q.length < 2) {
      searchResults.innerHTML = '';
      return;
    }

    fetch('/api/search?q=' + encodeURIComponent(q))
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (!data.posts || data.posts.length === 0) {
          searchResults.innerHTML = '<div class="empty-state"><p>没有找到相关文章</p></div>';
          return;
        }

        var html = '<p class="search-count">找到 ' + data.posts.length + ' 篇相关文章</p>';
        data.posts.forEach(function(post) {
          var date = new Date(post.date);
          var dateStr = date.toLocaleDateString('zh-CN');
          html += '<article class="post-card">' +
            '<div class="post-card-body">' +
            '<div class="post-meta"><span>' + dateStr + '</span><span>' + (post.category || '') + '</span></div>' +
            '<h2 class="post-title"><a href="/post/' + post.slug + '">' + escapeHtml(post.title) + '</a></h2>' +
            '<p class="post-description">' + escapeHtml(post.description || '') + '</p>' +
            '</div></article>';
        });
        searchResults.innerHTML = html;
      })
      .catch(function(err) {
        console.error('搜索失败:', err);
      });
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }
})();
