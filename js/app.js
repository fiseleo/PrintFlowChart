(function () {
  const { VALVES, EQUIPMENT, ROCKET, DAQ, NODE_TYPES, CATEGORIES } = window.FLOW;
const canvas = document.getElementById('drawflow');
    const editor = new Drawflow(canvas);
    editor.reroute = true;
    editor.draggable_inputs = false;
    editor.zoom_max = 2;
    editor.zoom_min = 0.3;
    editor.start();

    let orthoMode = false;
    const origCreateCurvature = editor.createCurvature;
    editor.createCurvature = function (x1, y1, x2, y2, curvature, type) {
      if (orthoMode && type === 'openclose') {
        const mid = x1 + (x2 - x1) / 2;
        return 'M ' + x1 + ' ' + y1 + ' L ' + mid + ' ' + y1 + ' L ' + mid + ' ' + y2 + ' L ' + x2 + ' ' + y2;
      }
      return origCreateCurvature.call(this, x1, y1, x2, y2, curvature, type);
    };

    // ---------- Node creation ----------
    function nodeHtml(type, label) {
      const t = NODE_TYPES[type];
      const cls = t.cls;
      const ph = t.ph || '輸入文字';
      if (t.symbol) {
        return '<div class="shape sym">' +
          '<svg class="sym-icon" viewBox="0 0 120 52" aria-hidden="true">' + t.symbol + '</svg>' +
          '<span class="node-label" contenteditable="true" df-label data-ph="' + ph + '">' + label + '</span>' +
        '</div>';
      }
      return '<div class="shape ' + cls + '"><span class="node-label" contenteditable="true" df-label data-ph="' + ph + '">' + label + '</span></div>';
    }

    function createNode(type, x, y, labelOverride) {
      const t = NODE_TYPES[type];
      const label = labelOverride || t.label;
      return editor.addNode(type, t.in, t.out, x, y, t.cls, { label: label }, nodeHtml(type, label));
    }

    // ---------- Palette ----------
    const paletteList = document.getElementById('paletteList');
    CATEGORIES.forEach(function (cat) {
      const header = document.createElement('div');
      header.className = 'palette-cat';
      header.innerHTML = '<span class="palette-cat-name">' + cat.name + '</span><span class="palette-cat-arrow">▾</span>';
      header.addEventListener('click', function () {
        const body = header.nextElementSibling;
        const collapsed = body.classList.toggle('collapsed');
        header.querySelector('.palette-cat-arrow').textContent = collapsed ? '▸' : '▾';
      });
      paletteList.appendChild(header);

      const body = document.createElement('div');
      body.className = 'palette-cat-body';
      cat.items.forEach(function (type) {
        const t = NODE_TYPES[type];
        if (!t) return;
        const item = document.createElement('div');
        item.className = 'drag-item';
        item.draggable = true;
        item.dataset.node = type;
        item.innerHTML = t.symbol
          ? '<svg class="mini-svg" viewBox="0 0 120 52" aria-hidden="true">' + t.symbol + '</svg><span>' + t.label + '</span>'
          : '<i class="mini ' + t.cls + '"></i><span>' + t.label + '</span>';
        item.addEventListener('dragstart', function (e) {
          e.dataTransfer.setData('node', type);
          e.dataTransfer.effectAllowed = 'copy';
        });
        item.addEventListener('click', function () {
          addAtCenter(type);
        });
        body.appendChild(item);
      });
      paletteList.appendChild(body);
    });

    function addAtCenter(type) {
      const rect = canvas.getBoundingClientRect();
      addNodeAt(type, rect.left + rect.width / 2, rect.top + rect.height / 2);
    }

    function addNodeAt(type, clientX, clientY) {
      if (editor.editor_mode !== 'edit') return;
      const pc = editor.precanvas;
      const sx = pc.clientWidth / (pc.clientWidth * editor.zoom);
      const sy = pc.clientHeight / (pc.clientHeight * editor.zoom);
      const pos_x = clientX * sx - pc.getBoundingClientRect().x * sx;
      const pos_y = clientY * sy - pc.getBoundingClientRect().y * sy;
      createNode(type, pos_x - 66, pos_y - 30);
    }

    canvas.addEventListener('dragover', function (e) { e.preventDefault(); });
    canvas.addEventListener('drop', function (e) {
      e.preventDefault();
      const type = e.dataTransfer.getData('node');
      if (NODE_TYPES[type]) addNodeAt(type, e.clientX, e.clientY);
    });

    // ---------- Sample diagram ----------
    function loadSample() {
      const start = createNode('start', 90, 215);
      const io = createNode('io', 250, 210, '輸入資料');
      const dec = createNode('decision', 435, 190, '資料正確？');
      const doc = createNode('document', 650, 90, '儲存結果');
      const proc = createNode('process', 650, 300, '修正資料');
      const end = editor.addNode('end', 2, 0, 870, 200, 'terminator', { label: '結束' }, nodeHtml('end', '結束'));

      editor.addConnection(start, io, 'output_1', 'input_1');
      editor.addConnection(io, dec, 'output_1', 'input_1');
      editor.addConnection(dec, doc, 'output_1', 'input_1');
      editor.addConnection(dec, proc, 'output_2', 'input_1');
      editor.addConnection(doc, end, 'output_1', 'input_1');
      editor.addConnection(proc, end, 'output_1', 'input_2');
    }

    // ---------- Undo / redo ----------
    let history = [];
    let redoStack = [];
    let applying = false;

    function snapshot() { return JSON.stringify(editor.export()); }

    function pushHistory() {
      if (applying) return;
      const s = snapshot();
      if (history[history.length - 1] === s) return;
      history.push(s);
      if (history.length > 60) history.shift();
      redoStack = [];
      updateUndoButtons();
    }

    function undo() {
      if (history.length <= 1) return;
      redoStack.push(history.pop());
      applying = true;
      editor.import(JSON.parse(history[history.length - 1]));
      applying = false;
      afterLoad();
      updateUndoButtons();
    }

    function redo() {
      if (!redoStack.length) return;
      const s = redoStack.pop();
      history.push(s);
      applying = true;
      editor.import(JSON.parse(s));
      applying = false;
      afterLoad();
      updateUndoButtons();
    }

    function updateUndoButtons() {
      document.getElementById('btnUndo').disabled = history.length <= 1;
      document.getElementById('btnRedo').disabled = redoStack.length === 0;
    }

    function debounce(fn, ms) {
      let t;
      return function () { clearTimeout(t); t = setTimeout(fn, ms); };
    }

    // ---------- Snap / alignment ----------
    const GRID = 20;
    let snapEnabled = true;
    function snapNode(id) {
      if (!snapEnabled) return;
      const data = editor.drawflow.drawflow[editor.module].data[id];
      if (!data) return;
      let nx = Math.round(data.pos_x / GRID) * GRID;
      let ny = Math.round(data.pos_y / GRID) * GRID;
      const threshold = 8;
      for (const oid in editor.drawflow.drawflow[editor.module].data) {
        if (oid === String(id)) continue;
        const o = editor.drawflow.drawflow[editor.module].data[oid];
        if (Math.abs(o.pos_x - nx) < threshold) nx = o.pos_x;
        if (Math.abs(o.pos_y - ny) < threshold) ny = o.pos_y;
      }
      if (nx !== data.pos_x || ny !== data.pos_y) {
        data.pos_x = nx; data.pos_y = ny;
        const el = editor.container.querySelector('#node-' + id);
        if (el) { el.style.left = nx + 'px'; el.style.top = ny + 'px'; }
        editor.updateConnectionNodes('node-' + id);
      }
    }

    // ---------- Edge labels ----------
    const SVG_NS = 'http://www.w3.org/2000/svg';
    function refreshEdgeLabels() {
      const data = editor.drawflow.drawflow[editor.module].data;
      for (const nid in data) {
        const node = data[nid];
        for (const oc in node.outputs) {
          (node.outputs[oc].connections || []).forEach(function (conn) {
            const svg = editor.container.querySelector('.connection.node_in_node-' + conn.node + '.node_out_node-' + nid + '.' + oc + '.' + conn.output);
            if (!svg) return;
            const path = svg.querySelector('.main-path');
            if (path) {
              if (conn.style === 'dashed') path.setAttribute('stroke-dasharray', '6 4'); else path.removeAttribute('stroke-dasharray');
              path.style.stroke = conn.color || '';
            }
            let lbl = svg.querySelector('.edge-label');
            if (conn.label) {
              if (!lbl) {
                lbl = document.createElementNS(SVG_NS, 'text');
                lbl.classList.add('edge-label');
                lbl.setAttribute('data-out', nid);
                lbl.setAttribute('data-in', conn.node);
                lbl.setAttribute('data-oc', oc);
                lbl.setAttribute('data-ic', conn.output);
                svg.appendChild(lbl);
              }
              const mid = path.getPointAtLength(path.getTotalLength() / 2);
              lbl.setAttribute('x', mid.x);
              lbl.setAttribute('y', mid.y);
              lbl.textContent = conn.label;
            } else if (lbl) { lbl.remove(); }
          });
        }
      }
    }

    // ---------- Custom color ----------
    const COLOR_PALETTE = ['#e3f2fd','#e8f5e9','#fff3e0','#f3e5f5','#ffebee','#e0f7fa','#fffde7','#eceff1','#fce4ec','#e8eaf6'];
    let selectedNodeId = null;
    function applyNodeColor(id, color) {
      const node = editor.container.querySelector('#node-' + id);
      if (node) {
        const shape = node.querySelector('.shape');
        if (shape) { if (color) shape.style.setProperty('--fill', color); else shape.style.removeProperty('--fill'); }
      }
      const data = editor.drawflow.drawflow[editor.module].data[id];
      if (data) { if (color) data.data.color = color; else delete data.data.color; }
    }
    function refreshColors() {
      const data = editor.drawflow.drawflow[editor.module].data;
      for (const id in data) {
        const node = editor.container.querySelector('#node-' + id);
        if (!node) continue;
        const shape = node.querySelector('.shape');
        if (!shape) continue;
        const color = data[id].data && data[id].data.color;
        if (color) shape.style.setProperty('--fill', color); else shape.style.removeProperty('--fill');
      }
    }
    function afterLoad() { refreshColors(); refreshEdgeLabels(); pages = Object.keys(editor.drawflow.drawflow); renderTabs(); }

    // ---------- Multi-select / copy-paste ----------
    let multiSel = new Set();
    let moveOrigins = null;
    let clipboard = null;

    function applySelection() {
      editor.container.querySelectorAll('.drawflow-node').forEach(function (el) {
        el.classList.toggle('multi-selected', multiSel.has(el.id.slice(5)));
      });
    }
    function clearSelection() {
      if (!multiSel.size) return;
      multiSel.clear();
      moveOrigins = null;
      applySelection();
    }
    function beginGroupDrag(e) {
      const nodeEl = e.target.closest && e.target.closest('.drawflow-node');
      if (!nodeEl) { clearSelection(); return; }
      const id = nodeEl.id.slice(5);
      if (multiSel.size > 1 && multiSel.has(id)) {
        moveOrigins = {};
        multiSel.forEach(function (oid) {
          const o = editor.drawflow.drawflow[editor.module].data[oid];
          if (o) moveOrigins[oid] = { x: o.pos_x, y: o.pos_y };
        });
      } else if (multiSel.size) {
        clearSelection();
      }
    }
    let marqueeEl = null;
    function startMarquee(e) {
      const wrap = document.querySelector('.canvas-wrap');
      const rect = canvas.getBoundingClientRect();
      const x0 = e.clientX - rect.left, y0 = e.clientY - rect.top;
      if (!marqueeEl) { marqueeEl = document.createElement('div'); marqueeEl.className = 'marquee'; wrap.appendChild(marqueeEl); }
      marqueeEl.style.left = x0 + 'px'; marqueeEl.style.top = y0 + 'px';
      marqueeEl.style.width = '0px'; marqueeEl.style.height = '0px';
      marqueeEl.style.display = 'block';
      function onMove(ev) {
        const x = ev.clientX - rect.left, y = ev.clientY - rect.top;
        marqueeEl.style.left = Math.min(x0, x) + 'px';
        marqueeEl.style.top = Math.min(y0, y) + 'px';
        marqueeEl.style.width = Math.abs(x - x0) + 'px';
        marqueeEl.style.height = Math.abs(y - y0) + 'px';
      }
      function onUp(ev) {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        marqueeEl.style.display = 'none';
        const x = ev.clientX - rect.left, y = ev.clientY - rect.top;
        const box = { l: Math.min(x0, x), t: Math.min(y0, y), r: Math.max(x0, x), b: Math.max(y0, y) };
        if (box.r - box.l < 3 && box.b - box.t < 3) return;
        if (!e.shiftKey) multiSel.clear();
        const data = editor.drawflow.drawflow[editor.module].data;
        for (const id in data) {
          const el = editor.container.querySelector('#node-' + id);
          if (!el) continue;
          const r = el.getBoundingClientRect();
          const nl = r.left - rect.left, nt = r.top - rect.top, nr = r.right - rect.left, nb = r.bottom - rect.top;
          if (nl < box.r && nr > box.l && nt < box.b && nb > box.t) multiSel.add(id);
        }
        applySelection();
      }
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    }

    function copySelection() {
      const ids = multiSel.size ? Array.from(multiSel) : (selectedNodeId ? [selectedNodeId] : []);
      if (!ids.length) return;
      clipboard = ids.map(function (id) {
        const d = editor.drawflow.drawflow[editor.module].data[id];
        return { type: d.name, label: d.data && d.data.label, color: d.data && d.data.color };
      });
    }
    function pasteClipboard() {
      if (!clipboard || !clipboard.length) return;
      multiSel.clear();
      applying = true;
      clipboard.forEach(function (item, i) {
        const id = createNode(item.type, 40 + i * 28, 40 + i * 28, item.label);
        if (item.color) applyNodeColor(id, item.color);
        multiSel.add(String(id));
      });
      applying = false;
      applySelection();
      refreshEdgeLabels();
      pushHistory(); saveDebounced();
    }
    function duplicateSelection() { copySelection(); pasteClipboard(); }
    function deleteSelection() {
      if (!multiSel.size) return;
      applying = true;
      const ids = Array.from(multiSel);
      ids.forEach(function (id) { editor.removeNodeId('node-' + id); });
      applying = false;
      multiSel.clear(); moveOrigins = null; applySelection();
      refreshEdgeLabels(); pushHistory(); saveDebounced();
    }

    // ---------- Line style ----------
    const LINE_COLORS = ['#64748b','#2563eb','#16a34a','#e11d48','#d97706','#0ea5e9'];
    let selectedConn = null;
    function setLineStyle(key, val) {
      if (!selectedConn) return;
      const data = editor.drawflow.drawflow[editor.module].data[selectedConn.output_id];
      if (!data) return;
      const conn = (data.outputs[selectedConn.output_class].connections || []).find(function (x) { return x.node == selectedConn.input_id && x.output == selectedConn.input_class; });
      if (!conn) return;
      if (val === null) delete conn[key]; else conn[key] = val;
      refreshEdgeLabels();
      pushHistory(); saveDebounced();
    }

    // ---------- Pages (tabs) ----------
    let pages = [];
    function renderTabs() {
      const el = document.getElementById('tabs');
      if (!el) return;
      el.innerHTML = '';
      pages.forEach(function (name) {
        const tab = document.createElement('div');
        tab.className = 'tab' + (editor.module === name ? ' active' : '');
        const label = document.createElement('span');
        label.textContent = name;
        tab.appendChild(label);
        if (pages.length > 1) {
          const close = document.createElement('span');
          close.className = 'tab-close';
          close.textContent = '×';
          close.addEventListener('click', function (ev) { ev.stopPropagation(); closePage(name); });
          tab.appendChild(close);
        }
        tab.addEventListener('click', function () { switchPage(name); });
        tab.addEventListener('dblclick', function () { renamePage(name); });
        el.appendChild(tab);
      });
      const add = document.createElement('div');
      add.className = 'tab add';
      add.textContent = '＋';
      add.title = '新增頁面';
      add.addEventListener('click', addPage);
      el.appendChild(add);
    }
    function switchPage(name) {
      if (editor.module === name) return;
      editor.changeModule(name);
      document.getElementById('zoomLabel').textContent = '100%';
      multiSel.clear(); moveOrigins = null; selectedConn = null;
      afterLoad();
    }
    function addPage() {
      let n = 'Page ' + (pages.length + 1), i = pages.length + 1;
      while (editor.drawflow.drawflow[n]) { i++; n = 'Page ' + i; }
      editor.addModule(n);
      pages.push(n);
      editor.changeModule(n);
      document.getElementById('zoomLabel').textContent = '100%';
      multiSel.clear(); moveOrigins = null; selectedConn = null;
      afterLoad();
    }
    function renamePage(oldName) {
      const nv = prompt('頁面名稱：', oldName);
      if (nv === null) return;
      const nn = nv.trim();
      if (!nn || nn === oldName) return;
      if (editor.drawflow.drawflow[nn]) { alert('名稱已存在'); return; }
      editor.drawflow.drawflow[nn] = editor.drawflow.drawflow[oldName];
      delete editor.drawflow.drawflow[oldName];
      if (editor.module === oldName) editor.module = nn;
      pages = pages.map(function (p) { return p === oldName ? nn : p; });
      renderTabs(); save();
    }
    function closePage(name) {
      if (pages.length <= 1) return;
      editor.removeModule(name);
      pages = pages.filter(function (p) { return p !== name; });
      multiSel.clear(); moveOrigins = null; selectedConn = null;
      afterLoad(); save();
    }

    // ---------- Auto layout ----------
    function autoLayout() {
      const data = editor.drawflow.drawflow[editor.module].data;
      const ids = Object.keys(data);
      if (ids.length <= 1) return;
      const inDeg = {}, layer = {};
      ids.forEach(function (id) { inDeg[id] = 0; layer[id] = 0; });
      for (const id in data) {
        for (const ic in data[id].inputs) if (data[id].inputs[ic].connections.length) inDeg[id]++;
      }
      const queue = [];
      ids.forEach(function (id) { if (inDeg[id] === 0) queue.push(id); });
      const processed = {};
      while (queue.length) {
        const id = queue.shift();
        processed[id] = true;
        const node = data[id];
        for (const oc in node.outputs) {
          (node.outputs[oc].connections || []).forEach(function (conn) {
            const child = String(conn.node);
            if (layer[child] < layer[id] + 1) layer[child] = layer[id] + 1;
            if (--inDeg[child] === 0) queue.push(child);
          });
        }
      }
      let maxL = 0;
      ids.forEach(function (id) { if (layer[id] > maxL) maxL = layer[id]; });
      ids.forEach(function (id) { if (!processed[id]) layer[id] = ++maxL; });
      const cols = {};
      ids.forEach(function (id) { (cols[layer[id]] = cols[layer[id]] || []).push(id); });
      const H_SPACE = 230, V_SPACE = 120;
      Object.keys(cols).sort(function (a, b) { return a - b; }).forEach(function (l, li) {
        cols[l].forEach(function (id, ri) {
          const d = data[id];
          d.pos_x = 40 + li * H_SPACE;
          d.pos_y = 40 + ri * V_SPACE;
          const el = editor.container.querySelector('#node-' + id);
          if (el) { el.style.left = d.pos_x + 'px'; el.style.top = d.pos_y + 'px'; }
          editor.updateConnectionNodes('node-' + id);
        });
      });
      refreshEdgeLabels();
      pushHistory(); saveDebounced();
    }

    // ---------- SVG export ----------
    const SVG_FILL = { terminator: '#e8f5e9', process: '#e3f2fd', database: '#e0f7fa', predefined: '#eceff1', connector: '#fffde7', decision: '#fff3e0', io: '#f3e5f5', document: '#ffebee', note: '#fefce8', sym: '#f8fafc' };
    function escapeXml(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
    function nodeToSVG(id, d) {
      const el = editor.container.querySelector('#node-' + id);
      const w = el ? el.offsetWidth : 132;
      const h = el ? el.offsetHeight : 58;
      const x = d.pos_x, y = d.pos_y;
      const label = (d.data && d.data.label) || '';
      const fill = (d.data && d.data.color) || SVG_FILL[d.name] || '#f8fafc';
      let shape = '';
      const cx = x + w / 2, cy = y + h / 2;
      switch (d.name) {
        case 'decision': shape = '<polygon points="' + cx + ',' + y + ' ' + (x + w) + ',' + cy + ' ' + cx + ',' + (y + h) + ' ' + x + ',' + cy + '" fill="' + fill + '"/>'; break;
        case 'io': shape = '<polygon points="' + (x + w * 0.14) + ',' + y + ' ' + (x + w) + ',' + y + ' ' + (x + w * 0.86) + ',' + (y + h) + ' ' + x + ',' + (y + h) + '" fill="' + fill + '"/>'; break;
        case 'connector': shape = '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + w / 2 + '" ry="' + h / 2 + '" fill="' + fill + '"/>'; break;
        case 'terminator': shape = '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + Math.min(w, h) / 2 + '" fill="' + fill + '"/>'; break;
        case 'note': shape = '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="6" fill="' + fill + '" stroke="#eab308" stroke-dasharray="4 3"/>'; break;
        default: shape = '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="6" fill="' + fill + '"/>';
      }
      let inner = '';
      const t = NODE_TYPES[d.name];
      if (t && t.symbol) {
        inner += '<svg x="' + (cx - 48) + '" y="' + (y + 8) + '" width="96" height="44" viewBox="0 0 120 52">' + t.symbol + '</svg>';
        inner += '<text x="' + cx + '" y="' + (y + h - 8) + '" text-anchor="middle" font-size="13" font-family="Segoe UI, sans-serif" fill="#1f2937">' + escapeXml(label) + '</text>';
      } else {
        inner += '<text x="' + cx + '" y="' + (cy + 4) + '" text-anchor="middle" font-size="13" font-family="Segoe UI, sans-serif" fill="#1f2937" stroke="#fff" stroke-width="3" paint-order="stroke">' + escapeXml(label) + '</text>';
      }
      return '<g>' + shape + inner + '</g>';
    }
    function buildSVG() {
      const data = editor.drawflow.drawflow[editor.module].data;
      const ids = Object.keys(data);
      if (!ids.length) return null;
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      ids.forEach(function (id) {
        const d = data[id];
        const el = editor.container.querySelector('#node-' + id);
        const w = el ? el.offsetWidth : 132, h = el ? el.offsetHeight : 58;
        minX = Math.min(minX, d.pos_x); minY = Math.min(minY, d.pos_y);
        maxX = Math.max(maxX, d.pos_x + w); maxY = Math.max(maxY, d.pos_y + h);
      });
      const pad = 30;
      const W = maxX - minX + pad * 2, H = maxY - minY + pad * 2;
      const ox = minX - pad, oy = minY - pad;
      let body = '<defs><marker id="arrow-svg" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="9" markerHeight="9" markerUnits="userSpaceOnUse" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#64748b"/></marker></defs>';
      body += '<g transform="translate(' + (-ox) + ',' + (-oy) + ')">';
      ids.forEach(function (id) { body += nodeToSVG(id, data[id]); });
      for (const id in data) {
        const node = data[id];
        for (const oc in node.outputs) {
          (node.outputs[oc].connections || []).forEach(function (conn) {
            const svgEl = editor.container.querySelector('.connection.node_in_node-' + conn.node + '.node_out_node-' + id + '.' + oc + '.' + conn.output);
            if (!svgEl) return;
            const p = svgEl.querySelector('.main-path');
            if (!p) return;
            const dattr = p.getAttribute('d');
            const stroke = conn.color || '#64748b';
            body += '<path d="' + dattr + '" fill="none" stroke="' + stroke + '" stroke-width="2" marker-end="url(#arrow-svg)"' + (conn.style === 'dashed' ? ' stroke-dasharray="6 4"' : '') + '/>';
            if (conn.label) {
              const mid = p.getPointAtLength(p.getTotalLength() / 2);
              body += '<text x="' + mid.x + '" y="' + (mid.y + 4) + '" text-anchor="middle" font-size="12" fill="#334155" stroke="#fff" stroke-width="3" paint-order="stroke">' + escapeXml(conn.label) + '</text>';
            }
          });
        }
      }
      body += '</g>';
      return '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '">' + body + '</svg>';
    }
    function exportSVG() {
      const svg = buildSVG();
      if (!svg) { alert('沒有可匯出的內容'); return; }
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'flowchart.svg';
      a.click();
      URL.revokeObjectURL(a.href);
    }
    function printDiagram() {
      const svg = buildSVG();
      if (!svg) { alert('沒有可列印的內容'); return; }
      const w = window.open('', '_blank');
      if (!w) { alert('請允許彈出視窗以列印'); return; }
      const printSvg = svg.replace('<svg ', '<svg style="width:100%;height:auto" ');
      w.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>流程圖</title><style>html,body{margin:0;padding:12px}svg{width:100%;height:auto}</style></head><body>' + printSvg + '<script>setTimeout(function(){window.print()},200);<\/script></body></html>');
      w.document.close();
    }

    // ---------- Theme ----------
    function applyTheme(dark) {
      document.body.classList.toggle('dark', dark);
      const b = document.getElementById('btnTheme');
      if (b) b.textContent = dark ? '☀️' : '🌙';
      try { localStorage.setItem('flowchart-theme', dark ? 'dark' : 'light'); } catch (e) {}
    }

    // ---------- Search ----------
    let searchMatches = [];
    let searchIndex = 0;
    function centerOnNode(id) {
      const el = editor.container.querySelector('#node-' + id);
      if (!el) return;
      const d = editor.drawflow.drawflow[editor.module].data[id];
      const nw = el.offsetWidth, nh = el.offsetHeight;
      const tx = d.pos_x + nw / 2, ty = d.pos_y + nh / 2;
      editor.canvas_x = canvas.clientWidth / 2 - tx * editor.zoom;
      editor.canvas_y = canvas.clientHeight / 2 - ty * editor.zoom;
      editor.zoom_refresh();
    }
    function doSearch(q) {
      editor.container.querySelectorAll('.search-hit').forEach(function (el) { el.classList.remove('search-hit'); });
      searchMatches = [];
      searchIndex = 0;
      if (!q) return;
      const ql = q.toLowerCase();
      const data = editor.drawflow.drawflow[editor.module].data;
      for (const id in data) {
        const label = (data[id].data && data[id].data.label) || '';
        if (label.toLowerCase().indexOf(ql) !== -1) searchMatches.push(id);
      }
      searchMatches.forEach(function (id) {
        const el = editor.container.querySelector('#node-' + id);
        if (el) el.classList.add('search-hit');
      });
      if (searchMatches.length) centerOnNode(searchMatches[0]);
    }

    // ---------- Align / distribute ----------
    function selectedNodes() {
      const data = editor.drawflow.drawflow[editor.module].data;
      return Array.from(multiSel).filter(function (id) { return data[id]; });
    }
    function nodeRect(id) {
      const d = editor.drawflow.drawflow[editor.module].data[id];
      const el = editor.container.querySelector('#node-' + id);
      return { x: d.pos_x, y: d.pos_y, w: el ? el.offsetWidth : 132, h: el ? el.offsetHeight : 58 };
    }
    function moveNode(id, x, y) {
      const d = editor.drawflow.drawflow[editor.module].data[id];
      d.pos_x = x; d.pos_y = y;
      const el = editor.container.querySelector('#node-' + id);
      if (el) { el.style.left = x + 'px'; el.style.top = y + 'px'; }
      editor.updateConnectionNodes('node-' + id);
    }
    function alignNodes(mode) {
      const nodes = selectedNodes();
      if (nodes.length < 2) return;
      const rects = nodes.map(nodeRect);
      if (mode === 'left') { const r = Math.min.apply(null, rects.map(function (v) { return v.x; })); nodes.forEach(function (id, i) { moveNode(id, r, rects[i].y); }); }
      else if (mode === 'centerH') { const cs = rects.map(function (v) { return v.x + v.w / 2; }); const c = (Math.min.apply(null, cs) + Math.max.apply(null, cs)) / 2; nodes.forEach(function (id, i) { moveNode(id, c - rects[i].w / 2, rects[i].y); }); }
      else if (mode === 'right') { const r = Math.max.apply(null, rects.map(function (v) { return v.x + v.w; })); nodes.forEach(function (id, i) { moveNode(id, r - rects[i].w, rects[i].y); }); }
      else if (mode === 'top') { const r = Math.min.apply(null, rects.map(function (v) { return v.y; })); nodes.forEach(function (id, i) { moveNode(id, rects[i].x, r); }); }
      else if (mode === 'middleV') { const cs = rects.map(function (v) { return v.y + v.h / 2; }); const c = (Math.min.apply(null, cs) + Math.max.apply(null, cs)) / 2; nodes.forEach(function (id, i) { moveNode(id, rects[i].x, c - rects[i].h / 2); }); }
      else if (mode === 'bottom') { const r = Math.max.apply(null, rects.map(function (v) { return v.y + v.h; })); nodes.forEach(function (id, i) { moveNode(id, rects[i].x, r - rects[i].h); }); }
      refreshEdgeLabels(); pushHistory(); saveDebounced();
    }
    function distribute(mode) {
      const nodes = selectedNodes();
      if (nodes.length < 3) return;
      const arr = nodes.map(function (id) { return { id: id, r: nodeRect(id) }; });
      if (mode === 'h') {
        arr.sort(function (a, b) { return a.r.x - b.r.x; });
        const min = arr[0].r.x, max = arr[arr.length - 1].r.x + arr[arr.length - 1].r.w;
        const totalW = arr.reduce(function (s, o) { return s + o.r.w; }, 0);
        const gap = (max - min - totalW) / (arr.length - 1);
        let cur = min;
        arr.forEach(function (o) { moveNode(o.id, cur, o.r.y); cur += o.r.w + gap; });
      } else {
        arr.sort(function (a, b) { return a.r.y - b.r.y; });
        const min = arr[0].r.y, max = arr[arr.length - 1].r.y + arr[arr.length - 1].r.h;
        const totalH = arr.reduce(function (s, o) { return s + o.r.h; }, 0);
        const gap = (max - min - totalH) / (arr.length - 1);
        let cur = min;
        arr.forEach(function (o) { moveNode(o.id, o.r.x, cur); cur += o.r.h + gap; });
      }
      refreshEdgeLabels(); pushHistory(); saveDebounced();
    }
    function reflowConnections() {
      Object.keys(editor.drawflow.drawflow[editor.module].data).forEach(function (id) { editor.updateConnectionNodes('node-' + id); });
      refreshEdgeLabels();
    }

    // ---------- Persistence ----------
    const LS_KEY = 'flowchart-editor-v1';
    function save() { try { localStorage.setItem(LS_KEY, JSON.stringify(editor.export())); } catch (e) {} }
    function loadSaved() { try { return localStorage.getItem(LS_KEY); } catch (e) { return null; } }
    const saveDebounced = debounce(save, 500);

    // ---------- Events ----------
    editor.on('nodeCreated', function () { if (applying) return; refreshEdgeLabels(); pushHistory(); saveDebounced(); });
    editor.on('nodeRemoved', function (id) { if (applying) return; multiSel.delete(id); applySelection(); refreshEdgeLabels(); pushHistory(); saveDebounced(); });
    editor.on('connectionCreated', function (c) {
      const outNode = editor.drawflow.drawflow[editor.module].data[c.output_id];
      if (outNode && outNode.name === 'decision') {
        const conn = (outNode.outputs[c.output_class].connections || []).find(function (x) { return x.node == c.input_id && x.output == c.input_class; });
        if (conn) conn.label = (c.output_class === 'output_1' ? '是' : '否');
      }
      refreshEdgeLabels();
      if (applying) return;
      pushHistory(); saveDebounced();
    });
    editor.on('connectionRemoved', function () { if (applying) return; refreshEdgeLabels(); pushHistory(); saveDebounced(); });
    editor.on('nodeMoved', function (id) {
      if (applying) return;
      const moved = [id];
      if (multiSel.size > 1 && moveOrigins && moveOrigins[id]) {
        const d0 = editor.drawflow.drawflow[editor.module].data[id];
        const dx = d0.pos_x - moveOrigins[id].x;
        const dy = d0.pos_y - moveOrigins[id].y;
        multiSel.forEach(function (oid) {
          if (oid === id) return;
          const o = editor.drawflow.drawflow[editor.module].data[oid];
          if (!o) return;
          o.pos_x = moveOrigins[oid].x + dx;
          o.pos_y = moveOrigins[oid].y + dy;
          const el = editor.container.querySelector('#node-' + oid);
          if (el) { el.style.left = o.pos_x + 'px'; el.style.top = o.pos_y + 'px'; }
          editor.updateConnectionNodes('node-' + oid);
          moved.push(oid);
        });
        moveOrigins = null;
      }
      moved.forEach(function (mid) { snapNode(mid); });
      refreshEdgeLabels();
      pushHistory(); saveDebounced();
    });
    editor.on('nodeSelected', function (id) { selectedNodeId = id; });
    editor.on('nodeUnselected', function () { selectedNodeId = null; });
    editor.on('connectionSelected', function (c) { selectedConn = c; });
    editor.on('connectionUnselected', function () { selectedConn = null; });
    editor.on('nodeDataChanged', debounce(function () { if (applying) return; pushHistory(); saveDebounced(); }, 400));
    editor.on('zoom', function (z) { document.getElementById('zoomLabel').textContent = Math.round(z * 100) + '%'; });

    canvas.addEventListener('mousedown', function (e) {
      if (editor.editor_mode !== 'edit') return;
      if (!e.shiftKey) { beginGroupDrag(e); return; }
      const nodeEl = e.target.closest && e.target.closest('.drawflow-node');
      if (nodeEl) {
        e.stopPropagation();
        const id = nodeEl.id.slice(5);
        if (multiSel.has(id)) multiSel.delete(id); else multiSel.add(id);
        applySelection();
      } else {
        e.stopPropagation();
        startMarquee(e);
      }
    }, true);

    canvas.addEventListener('dblclick', function (e) {
      const lbl = e.target.closest && e.target.closest('.edge-label');
      if (!lbl) return;
      e.stopPropagation();
      const cur = lbl.textContent || '';
      const val = prompt('連線標籤：', cur);
      if (val === null) return;
      const outId = lbl.getAttribute('data-out');
      const data = editor.drawflow.drawflow[editor.module].data[outId];
      if (!data) return;
      const conn = (data.outputs[lbl.getAttribute('data-oc')].connections || []).find(function (x) { return x.node == lbl.getAttribute('data-in') && x.output == lbl.getAttribute('data-ic'); });
      if (conn) {
        if (val.trim() === '') delete conn.label; else conn.label = val.trim();
        refreshEdgeLabels();
        pushHistory(); saveDebounced();
      }
    });

    // ---------- View helpers ----------
    function resetView() {
      editor.canvas_x = 0; editor.canvas_y = 0;
      editor.zoom = 1; editor.zoom_last_value = 1;
      editor.precanvas.style.transform = '';
      document.getElementById('zoomLabel').textContent = '100%';
    }

    // ---------- Toolbar actions ----------
    document.getElementById('btnUndo').addEventListener('click', undo);
    document.getElementById('btnRedo').addEventListener('click', redo);
    document.getElementById('btnZoomIn').addEventListener('click', function () { editor.zoom_in(); });
    document.getElementById('btnZoomOut').addEventListener('click', function () { editor.zoom_out(); });
    document.getElementById('btnZoomReset').addEventListener('click', function () { editor.zoom_reset(); });

    const btnSnap = document.getElementById('btnSnap');
    btnSnap.addEventListener('click', function () {
      snapEnabled = !snapEnabled;
      btnSnap.classList.toggle('active', snapEnabled);
    });

    const swatchesEl = document.getElementById('swatches');
    const resetSwatch = document.createElement('span');
    resetSwatch.className = 'swatch reset';
    resetSwatch.title = '回復預設顏色';
    resetSwatch.addEventListener('click', function () { if (selectedNodeId) { applyNodeColor(selectedNodeId, null); pushHistory(); saveDebounced(); } });
    swatchesEl.appendChild(resetSwatch);
    COLOR_PALETTE.forEach(function (c) {
      const s = document.createElement('span');
      s.className = 'swatch';
      s.style.background = c;
      s.title = c;
      s.addEventListener('click', function () { if (selectedNodeId) { applyNodeColor(selectedNodeId, c); pushHistory(); saveDebounced(); } });
      swatchesEl.appendChild(s);
    });

    document.getElementById('btnCopy').addEventListener('click', copySelection);
    document.getElementById('btnPaste').addEventListener('click', pasteClipboard);
    document.getElementById('btnAutoLayout').addEventListener('click', autoLayout);
    document.getElementById('btnExportSvg').addEventListener('click', exportSVG);
    document.getElementById('btnTheme').addEventListener('click', function () { applyTheme(!document.body.classList.contains('dark')); });

    document.getElementById('btnLineSolid').addEventListener('click', function () { setLineStyle('style', null); });
    document.getElementById('btnLineDashed').addEventListener('click', function () { setLineStyle('style', 'dashed'); });
    const lineColorsEl = document.getElementById('lineColors');
    LINE_COLORS.forEach(function (c) {
      const s = document.createElement('span');
      s.className = 'swatch';
      s.style.background = c;
      s.title = c;
      s.addEventListener('click', function () { setLineStyle('color', c); });
      lineColorsEl.appendChild(s);
    });

    document.getElementById('btnOrtho').addEventListener('click', function () {
      orthoMode = !orthoMode;
      this.classList.toggle('active', orthoMode);
      reflowConnections();
    });
    document.getElementById('alL').addEventListener('click', function () { alignNodes('left'); });
    document.getElementById('alC').addEventListener('click', function () { alignNodes('centerH'); });
    document.getElementById('alR').addEventListener('click', function () { alignNodes('right'); });
    document.getElementById('alT').addEventListener('click', function () { alignNodes('top'); });
    document.getElementById('alM').addEventListener('click', function () { alignNodes('middleV'); });
    document.getElementById('alB').addEventListener('click', function () { alignNodes('bottom'); });
    document.getElementById('distH').addEventListener('click', function () { distribute('h'); });
    document.getElementById('distV').addEventListener('click', function () { distribute('v'); });
    document.getElementById('btnPrint').addEventListener('click', printDiagram);

    const searchBox = document.getElementById('searchBox');
    searchBox.addEventListener('input', function () { doSearch(searchBox.value); });
    searchBox.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); if (searchMatches.length) { searchIndex = (searchIndex + 1) % searchMatches.length; centerOnNode(searchMatches[searchIndex]); } }
      else if (e.key === 'Escape') { searchBox.value = ''; doSearch(''); }
    });

    document.getElementById('btnExportJson').addEventListener('click', function () {
      const blob = new Blob([JSON.stringify(editor.export(), null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'flowchart.json';
      a.click();
      URL.revokeObjectURL(a.href);
    });

    const fileInput = document.getElementById('fileInput');
    document.getElementById('btnImportJson').addEventListener('click', function () { fileInput.click(); });
    fileInput.addEventListener('change', function () {
      const f = fileInput.files[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = function () {
        try {
          const data = JSON.parse(reader.result);
          applying = true;
          editor.import(data);
          applying = false;
          resetView();
          afterLoad();
          history = [snapshot()];
          redoStack = [];
          updateUndoButtons();
          save();
        } catch (err) {
          alert('匯入失敗：' + err.message);
        }
      };
      reader.readAsText(f);
      fileInput.value = '';
    });

    document.getElementById('btnExportPng').addEventListener('click', function () {
      if (typeof html2canvas === 'undefined') { alert('匯出元件載入失敗，請檢查網路連線。'); return; }
      const pc = editor.precanvas;
      const container = canvas;
      const prevTransform = pc.style.transform;
      const prevOverflow = container.style.overflow;
      const prevW = pc.style.width, prevH = pc.style.height;

      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      pc.querySelectorAll('.drawflow-node').forEach(function (n) {
        minX = Math.min(minX, n.offsetLeft);
        minY = Math.min(minY, n.offsetTop);
        maxX = Math.max(maxX, n.offsetLeft + n.offsetWidth);
        maxY = Math.max(maxY, n.offsetTop + n.offsetHeight);
      });
      if (!isFinite(minX)) { minX = 0; minY = 0; maxX = 400; maxY = 300; }
      const pad = 40;
      const W = Math.max(200, maxX - minX + pad * 2);
      const H = Math.max(150, maxY - minY + pad * 2);

      pc.style.transform = '';
      pc.style.width = W + 'px';
      pc.style.height = H + 'px';
      container.style.overflow = 'visible';

      html2canvas(pc, { backgroundColor: '#ffffff', scale: 2 }).then(function (c) {
        const a = document.createElement('a');
        a.download = 'flowchart.png';
        a.href = c.toDataURL('image/png');
        a.click();
      }).catch(function (err) {
        alert('匯出 PNG 失敗：' + err.message);
      }).finally(function () {
        pc.style.transform = prevTransform;
        pc.style.width = prevW; pc.style.height = prevH;
        container.style.overflow = prevOverflow;
      });
    });

    document.getElementById('btnClear').addEventListener('click', function () {
      if (!confirm('確定要清空畫布嗎？')) return;
      editor.clear();
      editor.module = 'Home';
      resetView();
      afterLoad();
      pushHistory();
      save();
    });

    // ---------- Keyboard shortcuts ----------
    window.addEventListener('keydown', function (e) {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const ae = document.activeElement;
        if (ae && (ae.isContentEditable || ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA')) return;
        if (multiSel.size > 1) { e.preventDefault(); e.stopPropagation(); deleteSelection(); }
        return;
      }
    }, true);

    window.addEventListener('keydown', function (e) {
      const ae = document.activeElement;
      if (ae && (ae.isContentEditable || ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA')) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        e.preventDefault(); copySelection();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        e.preventDefault(); pasteClipboard();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault(); duplicateSelection();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo(); else undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault(); redo();
      }
    });

    // ---------- Init ----------
    try { if (localStorage.getItem('flowchart-theme') === 'dark') applyTheme(true); } catch (e) {}
    applying = true;
    const saved = loadSaved();
    try {
      if (saved) { editor.import(JSON.parse(saved)); }
      else { loadSample(); }
    } catch (e) {
      loadSample();
    }
    applying = false;
    resetView();
    afterLoad();
    history = [snapshot()];
    updateUndoButtons();
  })();
