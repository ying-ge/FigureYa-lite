let chapters = [];
let chapterTexts = [];

function highlight(text, terms) {
  let re = new RegExp("(" + terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ")", "gi");
  return text.replace(re, '<span class="highlight">$1</span>');
}

function renderToc() {
  // 可选：动态渲染目录
}

function loadAllChapters(callback) {
  fetch('chapters.json')
    .then(res => res.json())
    .then(list => {
      chapters = list;
      let loaded = 0;
      chapterTexts = [];
      if (!chapters.length) callback();
      chapters.forEach((chap, i) => {
        fetch(chap.text)
          .then(res => res.text())
          .then(text => {
            chapterTexts[i] = { ...chap, text };
            loaded++;
            if (loaded === chapters.length) callback();
          })
          .catch(() => {
            chapterTexts[i] = { ...chap, text: "[Failed to load text]" };
            loaded++;
            if (loaded === chapters.length) callback();
          });
      });
    })
    .catch(() => {
      document.getElementById("searchResults").innerHTML = "<p style='color:red'>Failed to load chapters.json</p>";
    });
}

let fuse = null;
function buildIndex() {
  fuse = new Fuse(chapterTexts, {
    keys: ["title", "text"],
    includeMatches: true,
    threshold: 0.4,
    minMatchCharLength: 2,
    ignoreLocation: true,
    useExtendedSearch: true,
  });
}

function doSearch() {
  const q = document.getElementById("searchBox").value.trim();
  const resultsDiv = document.getElementById("searchResults");
  if (!q) { resultsDiv.innerHTML = ""; return; }
  const terms = q.split(/\s+/);
  const results = fuse.search(q, { limit: 50 });
  let html = `<p>${results.length} result${results.length === 1 ? '' : 's'} found:</p>`;
  results.forEach(r => {
    let snippet = r.item.text;
    let idx = snippet.toLowerCase().indexOf(terms[0].toLowerCase());
    if (idx > 30) idx -= 30;
    if (idx < 0) idx = 0;
    snippet = snippet.substr(idx, 120).replace(/\n/g, " ");
    snippet = highlight(snippet, terms);
    html += `<div class="result">
      <div class="result-title"><a href="${r.item.html}" target="_blank">${r.item.title}</a></div>
      <div class="result-snippet">${snippet}...</div>
    </div>`;
  });
  resultsDiv.innerHTML = html;
}

function clearSearch() {
  document.getElementById("searchBox").value = "";
  document.getElementById("searchResults").innerHTML = "";
}

window.onload = function() {
  renderToc();
  loadAllChapters(() => {
    buildIndex();
    document.getElementById("searchBox").addEventListener("input", doSearch);
  });
};
