window.FLOW = (function () {
const VALVES = [
      { id: 'gate',      label: '閘閥',   symbol: '<polygon points="2,2 60,26 2,50" fill="#ffca28" stroke="#f9a825" stroke-width="3"/><polygon points="118,2 60,26 118,50" fill="#ffca28" stroke="#f9a825" stroke-width="3"/>' },
      { id: 'globe',     label: '球形閥', symbol: '<circle cx="60" cy="26" r="22" fill="none" stroke="#f9a825" stroke-width="3"/><line x1="38" y1="26" x2="82" y2="26" stroke="#f9a825" stroke-width="3"/><line x1="60" y1="4" x2="60" y2="12" stroke="#f9a825" stroke-width="3"/>' },
      { id: 'ball',      label: '球閥',   symbol: '<polygon points="2,2 52,26 2,50" fill="#ffca28" stroke="#f9a825" stroke-width="3"/><polygon points="118,2 68,26 118,50" fill="#ffca28" stroke="#f9a825" stroke-width="3"/><circle cx="60" cy="26" r="8" fill="#ffca28" stroke="#f9a825" stroke-width="3"/>' },
      { id: 'butterfly', label: '蝶閥',   symbol: '<polygon points="2,2 60,26 2,50" fill="#ffca28" stroke="#f9a825" stroke-width="3"/><polygon points="118,2 60,26 118,50" fill="#ffca28" stroke="#f9a825" stroke-width="3"/><line x1="60" y1="6" x2="60" y2="46" stroke="#f9a825" stroke-width="3"/>' },
      { id: 'check',     label: '止回閥', symbol: '<line x1="30" y1="2" x2="30" y2="50" stroke="#f9a825" stroke-width="3"/><polygon points="40,4 110,26 40,48" fill="#ffca28" stroke="#f9a825" stroke-width="3"/>' },
      { id: 'control',   label: '控制閥', symbol: '<polygon points="2,14 60,30 2,46" fill="#ffca28" stroke="#f9a825" stroke-width="3"/><polygon points="118,14 60,30 118,46" fill="#ffca28" stroke="#f9a825" stroke-width="3"/><line x1="60" y1="2" x2="60" y2="14" stroke="#f9a825" stroke-width="3"/><circle cx="60" cy="6" r="4" fill="none" stroke="#f9a825" stroke-width="3"/>' },
      { id: 'safety',    label: '安全閥', symbol: '<line x1="16" y1="44" x2="104" y2="44" stroke="#f9a825" stroke-width="3"/><polyline points="60,4 44,20 76,20 44,36 76,36 60,44" fill="none" stroke="#f9a825" stroke-width="3"/>' },
      { id: 'needle',    label: '針閥',   symbol: '<polygon points="60,4 84,40 36,40" fill="#ffca28" stroke="#f9a825" stroke-width="3"/><line x1="60" y1="40" x2="60" y2="50" stroke="#f9a825" stroke-width="3"/>' },
      { id: 'angle',     label: '角閥',   symbol: '<path d="M22,6 L22,40 L92,40" fill="none" stroke="#f9a825" stroke-width="3"/><polygon points="10,14 22,20 10,26" fill="#ffca28" stroke="#f9a825" stroke-width="3"/><polygon points="34,14 22,20 34,26" fill="#ffca28" stroke="#f9a825" stroke-width="3"/>' },
      { id: 'plug',      label: '旋塞閥', symbol: '<polygon points="2,18 60,30 2,42" fill="#ffca28" stroke="#f9a825" stroke-width="3"/><polygon points="118,18 60,30 118,42" fill="#ffca28" stroke="#f9a825" stroke-width="3"/><rect x="56" y="2" width="8" height="14" fill="#ffca28" stroke="#f9a825" stroke-width="3"/>' },
      { id: 'diaphragm', label: '隔膜閥', symbol: '<polygon points="2,16 60,28 2,40" fill="#ffca28" stroke="#f9a825" stroke-width="3"/><polygon points="118,16 60,28 118,40" fill="#ffca28" stroke="#f9a825" stroke-width="3"/><line x1="60" y1="2" x2="60" y2="16" stroke="#f9a825" stroke-width="3"/><line x1="48" y1="2" x2="72" y2="2" stroke="#f9a825" stroke-width="3"/>' },
      { id: 'solenoid',  label: '電磁閥', symbol: '<polygon points="2,18 60,32 2,46" fill="#ffca28" stroke="#f9a825" stroke-width="3"/><polygon points="118,18 60,32 118,46" fill="#ffca28" stroke="#f9a825" stroke-width="3"/><rect x="52" y="2" width="16" height="14" fill="none" stroke="#f9a825" stroke-width="3"/><line x1="52" y1="16" x2="68" y2="2" stroke="#f9a825" stroke-width="2"/>' },
      { id: 'threeway',  label: '三通閥', in: 1, out: 2, symbol: '<circle cx="60" cy="26" r="16" fill="#ffca28" stroke="#f9a825" stroke-width="3"/><line x1="60" y1="2" x2="60" y2="10" stroke="#f9a825" stroke-width="3"/><line x1="12" y1="26" x2="44" y2="26" stroke="#f9a825" stroke-width="3"/><line x1="76" y1="26" x2="108" y2="26" stroke="#f9a825" stroke-width="3"/>' },
      { id: 'fourway',   label: '四通閥', in: 2, out: 2, symbol: '<circle cx="60" cy="26" r="16" fill="#ffca28" stroke="#f9a825" stroke-width="3"/><line x1="60" y1="2" x2="60" y2="10" stroke="#f9a825" stroke-width="3"/><line x1="60" y1="42" x2="60" y2="50" stroke="#f9a825" stroke-width="3"/><line x1="12" y1="26" x2="44" y2="26" stroke="#f9a825" stroke-width="3"/><line x1="76" y1="26" x2="108" y2="26" stroke="#f9a825" stroke-width="3"/>' },
      { id: 'prv',       label: '減壓閥', symbol: '<polygon points="2,16 60,30 2,44" fill="#ffca28" stroke="#f9a825" stroke-width="3"/><polygon points="118,16 60,30 118,44" fill="#ffca28" stroke="#f9a825" stroke-width="3"/><line x1="60" y1="2" x2="60" y2="10" stroke="#f9a825" stroke-width="3"/><polygon points="54,4 66,4 60,12" fill="#f9a825"/>' },
      { id: 'manual',    label: '手動操作閥', symbol: '<polygon points="2,18 60,32 2,46" fill="#ffca28" stroke="#f9a825" stroke-width="3"/><polygon points="118,18 60,32 118,46" fill="#ffca28" stroke="#f9a825" stroke-width="3"/><line x1="38" y1="6" x2="82" y2="6" stroke="#f9a825" stroke-width="4"/>' },
      { id: 'regulator', label: '調壓閥', symbol: '<rect x="28" y="16" width="64" height="20" fill="#ffca28" stroke="#f9a825" stroke-width="3"/><line x1="38" y1="26" x2="74" y2="26" stroke="#f9a825" stroke-width="3"/><polygon points="74,26 66,21 66,31" fill="#f9a825"/><polyline points="60,2 54,6 66,6 54,10 66,10 60,14" fill="none" stroke="#f9a825" stroke-width="2"/>' }
    ];

    const EQUIPMENT = [
      { id: 'pump',   label: '泵浦',   symbol: '<circle cx="60" cy="26" r="22" fill="none" stroke="#1565c0" stroke-width="3"/><polygon points="50,14 78,26 50,38" fill="#1565c0"/>' },
      { id: 'tank',   label: '儲槽',   symbol: '<ellipse cx="60" cy="9" rx="38" ry="6" fill="#e3f2fd" stroke="#1565c0" stroke-width="3"/><rect x="22" y="9" width="76" height="36" fill="#e3f2fd" stroke="#1565c0" stroke-width="3"/>' },
      { id: 'sensor', label: '感測器', symbol: '<circle cx="60" cy="22" r="18" fill="none" stroke="#00695c" stroke-width="3"/><line x1="42" y1="22" x2="78" y2="22" stroke="#00695c" stroke-width="3"/><line x1="60" y1="40" x2="60" y2="48" stroke="#00695c" stroke-width="3"/>' },
      { id: 'motor',    label: '馬達',   symbol: '<circle cx="60" cy="26" r="22" fill="none" stroke="#6a1b9a" stroke-width="3"/><text x="60" y="32" text-anchor="middle" font-size="20" font-weight="700" fill="#6a1b9a">M</text>' },
      { id: 'cylinder', label: '氣瓶',   symbol: '<rect x="42" y="14" width="36" height="32" rx="7" fill="#e0f7fa" stroke="#00897b" stroke-width="3"/><rect x="52" y="2" width="16" height="6" fill="none" stroke="#00897b" stroke-width="3"/><line x1="60" y1="8" x2="60" y2="14" stroke="#00897b" stroke-width="3"/>' }
    ];

    const ROCKET = [
      { id: 'engine',   label: '火箭引擎', symbol: '<rect x="50" y="6" width="20" height="14" fill="#e3f2fd" stroke="#1565c0" stroke-width="3"/><polygon points="50,20 70,20 82,44 38,44" fill="#e3f2fd" stroke="#1565c0" stroke-width="3"/>' },
      { id: 'nozzle',   label: '噴嘴',     symbol: '<path d="M46,4 L74,4 L60,22 L84,46 L36,46 Z" fill="#e3f2fd" stroke="#1565c0" stroke-width="3"/>' },
      { id: 'chamber',  label: '燃燒室',   symbol: '<rect x="40" y="10" width="40" height="34" rx="8" fill="#fff3e0" stroke="#ef6c00" stroke-width="3"/>' },
      { id: 'fueltank', label: '燃料箱',   symbol: '<ellipse cx="60" cy="8" rx="34" ry="7" fill="#e8f5e9" stroke="#2e7d32" stroke-width="3"/><rect x="26" y="8" width="68" height="34" fill="#e8f5e9" stroke="#2e7d32" stroke-width="3"/><text x="60" y="31" text-anchor="middle" font-size="16" font-weight="700" fill="#2e7d32">F</text>' },
      { id: 'oxitank',  label: '氧化劑箱', symbol: '<ellipse cx="60" cy="8" rx="34" ry="7" fill="#fff3e0" stroke="#ef6c00" stroke-width="3"/><rect x="26" y="8" width="68" height="34" fill="#fff3e0" stroke="#ef6c00" stroke-width="3"/><text x="60" y="31" text-anchor="middle" font-size="16" font-weight="700" fill="#ef6c00">O</text>' },
      { id: 'booster',  label: '助推器',   symbol: '<polygon points="48,4 72,4 60,16" fill="#f3e5f5" stroke="#8e24aa" stroke-width="3"/><rect x="48" y="16" width="24" height="24" fill="#f3e5f5" stroke="#8e24aa" stroke-width="3"/><polygon points="48,40 60,50 72,40" fill="#f3e5f5" stroke="#8e24aa" stroke-width="3"/>' },
      { id: 'fairing',  label: '整流罩',   symbol: '<polygon points="30,46 90,46 60,4" fill="#e1f5fe" stroke="#0277bd" stroke-width="3"/>' }
    ];

    const DAQ = [
      { id: 'daq',        label: '資料擷取器', symbol: '<rect x="30" y="10" width="60" height="34" rx="4" fill="#e8eaf6" stroke="#3949ab" stroke-width="3"/><line x1="14" y1="18" x2="30" y2="18" stroke="#3949ab" stroke-width="3"/><line x1="14" y1="27" x2="30" y2="27" stroke="#3949ab" stroke-width="3"/><line x1="14" y1="36" x2="30" y2="36" stroke="#3949ab" stroke-width="3"/><line x1="90" y1="27" x2="106" y2="27" stroke="#3949ab" stroke-width="3"/><text x="60" y="31" text-anchor="middle" font-size="13" font-weight="700" fill="#3949ab">DAQ</text>' },
      { id: 'adc',        label: '類比轉數位', symbol: '<polygon points="22,6 84,6 98,46 36,46" fill="#e8eaf6" stroke="#3949ab" stroke-width="3"/><text x="60" y="30" text-anchor="middle" font-size="13" font-weight="700" fill="#3949ab">A/D</text>' },
      { id: 'dac',        label: '數位轉類比', symbol: '<polygon points="36,6 98,6 84,46 22,46" fill="#e8eaf6" stroke="#3949ab" stroke-width="3"/><text x="60" y="30" text-anchor="middle" font-size="13" font-weight="700" fill="#3949ab">D/A</text>' },
      { id: 'amp',        label: '放大器',     symbol: '<polygon points="20,8 20,44 82,26" fill="#e8f5e9" stroke="#2e7d32" stroke-width="3"/>' },
      { id: 'filter',     label: '濾波器',     symbol: '<rect x="24" y="12" width="72" height="28" rx="4" fill="#fff3e0" stroke="#ef6c00" stroke-width="3"/><path d="M36,26 Q42,14 48,26 T60,26 T72,26 T84,26" fill="none" stroke="#ef6c00" stroke-width="2.5"/>' },
      { id: 'logger',     label: '資料記錄器', symbol: '<rect x="30" y="10" width="60" height="34" rx="4" fill="#e0f7fa" stroke="#00897b" stroke-width="3"/><circle cx="60" cy="27" r="9" fill="none" stroke="#00897b" stroke-width="2.5"/><line x1="60" y1="27" x2="60" y2="20" stroke="#00897b" stroke-width="2.5"/><line x1="60" y1="27" x2="67" y2="27" stroke="#00897b" stroke-width="2.5"/>' },
      { id: 'controller', label: '控制器',     symbol: '<rect x="42" y="10" width="36" height="32" rx="3" fill="#f3e5f5" stroke="#8e24aa" stroke-width="3"/><line x1="34" y1="18" x2="42" y2="18" stroke="#8e24aa" stroke-width="3"/><line x1="34" y1="26" x2="42" y2="26" stroke="#8e24aa" stroke-width="3"/><line x1="34" y1="34" x2="42" y2="34" stroke="#8e24aa" stroke-width="3"/><line x1="78" y1="18" x2="86" y2="18" stroke="#8e24aa" stroke-width="3"/><line x1="78" y1="26" x2="86" y2="26" stroke="#8e24aa" stroke-width="3"/><line x1="78" y1="34" x2="86" y2="34" stroke="#8e24aa" stroke-width="3"/>' },
      { id: 'pc',         label: '電腦',       symbol: '<rect x="28" y="6" width="64" height="34" rx="3" fill="#e1f5fe" stroke="#0277bd" stroke-width="3"/><line x1="60" y1="40" x2="60" y2="48" stroke="#0277bd" stroke-width="3"/><line x1="44" y1="48" x2="76" y2="48" stroke="#0277bd" stroke-width="3"/>' }
    ];

    const SWAGELOK = [
      { id: 'bellows',    label: '波紋管密封閥', symbol: '<circle cx="60" cy="30" r="14" fill="none" stroke="#c62828" stroke-width="3"/><line x1="46" y1="30" x2="74" y2="30" stroke="#c62828" stroke-width="3"/><polyline points="60,2 54,7 66,7 54,12 66,12 60,16" fill="none" stroke="#c62828" stroke-width="2"/>' },
      { id: 'metering',   label: '計量閥',       symbol: '<circle cx="60" cy="8" r="7" fill="none" stroke="#c62828" stroke-width="2.5"/><line x1="60" y1="15" x2="60" y2="20" stroke="#c62828" stroke-width="2.5"/><polygon points="60,20 82,42 38,42" fill="#ffcdd2" stroke="#c62828" stroke-width="3"/><line x1="60" y1="42" x2="60" y2="50" stroke="#c62828" stroke-width="3"/>' },
      { id: 'proprelief', label: '比例洩壓閥',   symbol: '<line x1="16" y1="44" x2="104" y2="44" stroke="#c62828" stroke-width="3"/><polyline points="60,12 44,24 76,24 44,36 76,36 60,44" fill="none" stroke="#c62828" stroke-width="3"/><line x1="60" y1="2" x2="60" y2="12" stroke="#c62828" stroke-width="3"/><polygon points="54,3 66,3 60,11" fill="#c62828"/>' },
      { id: 'pnball',     label: '氣動球閥',     symbol: '<polygon points="2,18 52,30 2,42" fill="#ffcdd2" stroke="#c62828" stroke-width="3"/><polygon points="118,18 68,30 118,42" fill="#ffcdd2" stroke="#c62828" stroke-width="3"/><circle cx="60" cy="30" r="8" fill="#ffcdd2" stroke="#c62828" stroke-width="3"/><line x1="60" y1="14" x2="60" y2="22" stroke="#c62828" stroke-width="3"/><rect x="50" y="2" width="20" height="12" fill="none" stroke="#c62828" stroke-width="3"/>' },
      { id: 'bleed',      label: '洩放閥',       symbol: '<circle cx="42" cy="26" r="14" fill="none" stroke="#c62828" stroke-width="3"/><line x1="28" y1="26" x2="56" y2="26" stroke="#c62828" stroke-width="3"/><line x1="56" y1="26" x2="100" y2="26" stroke="#c62828" stroke-width="3"/><line x1="42" y1="26" x2="42" y2="48" stroke="#c62828" stroke-width="3"/>' },
      { id: 'ball3l',     label: '三通球閥 L型', in: 1, out: 2, symbol: '<circle cx="60" cy="28" r="16" fill="none" stroke="#c62828" stroke-width="3"/><path d="M52,22 L52,34 L68,34" fill="none" stroke="#c62828" stroke-width="2.5"/><line x1="60" y1="2" x2="60" y2="12" stroke="#c62828" stroke-width="3"/><line x1="12" y1="28" x2="44" y2="28" stroke="#c62828" stroke-width="3"/><line x1="76" y1="28" x2="108" y2="28" stroke="#c62828" stroke-width="3"/>' },
      { id: 'ball3t',     label: '三通球閥 T型', in: 1, out: 2, symbol: '<circle cx="60" cy="28" r="16" fill="none" stroke="#c62828" stroke-width="3"/><path d="M60,20 L60,36 M52,28 L68,28" fill="none" stroke="#c62828" stroke-width="2.5"/><line x1="60" y1="2" x2="60" y2="12" stroke="#c62828" stroke-width="3"/><line x1="12" y1="28" x2="44" y2="28" stroke="#c62828" stroke-width="3"/><line x1="76" y1="28" x2="108" y2="28" stroke="#c62828" stroke-width="3"/>' },
      { id: 'ball4way',   label: '四通球閥',     in: 2, out: 2, symbol: '<circle cx="60" cy="28" r="16" fill="none" stroke="#c62828" stroke-width="3"/><path d="M60,20 L60,36 M52,28 L68,28" fill="none" stroke="#c62828" stroke-width="2.5"/><line x1="60" y1="2" x2="60" y2="12" stroke="#c62828" stroke-width="3"/><line x1="60" y1="44" x2="60" y2="50" stroke="#c62828" stroke-width="3"/><line x1="12" y1="28" x2="44" y2="28" stroke="#c62828" stroke-width="3"/><line x1="76" y1="28" x2="108" y2="28" stroke="#c62828" stroke-width="3"/>' }
    ];

    const NODE_TYPES = {
      start:      { label: '開始',       cls: 'terminator', in: 0, out: 1 },
      io:         { label: '輸入 / 輸出', cls: 'io',         in: 1, out: 1 },
      process:    { label: '處理',       cls: 'process',    in: 1, out: 1 },
      decision:   { label: '決策',       cls: 'decision',   in: 1, out: 2 },
      document:   { label: '文件',       cls: 'document',   in: 1, out: 1 },
      database:   { label: '資料庫',     cls: 'database',   in: 1, out: 1 },
      predefined: { label: '子程序',     cls: 'predefined', in: 1, out: 1 },
      connector:  { label: 'A',          cls: 'connector',  in: 1, out: 1 },
      note:       { label: '',           cls: 'note',       in: 0, out: 0, ph: '輸入註解…' },
      end:        { label: '結束',       cls: 'terminator', in: 1, out: 0 }
    };
    VALVES.concat(EQUIPMENT).concat(ROCKET).concat(DAQ).concat(SWAGELOK).forEach(function (v) {
      NODE_TYPES[v.id] = { label: v.label, cls: 'sym', in: (v.in == null ? 1 : v.in), out: (v.out == null ? 1 : v.out), symbol: v.symbol };
    });
    const CATEGORIES = [
      { name: '基本流程', items: ['start', 'process', 'decision', 'end', 'connector', 'predefined'] },
      { name: '輸入 / 輸出與資料', items: ['io', 'document', 'database'] },
      { name: '閥件', items: VALVES.map(function (v) { return v.id; }) },
      { name: '設備', items: EQUIPMENT.map(function (v) { return v.id; }) },
      { name: '火箭', items: ROCKET.map(function (v) { return v.id; }) },
      { name: 'DAQ 系統', items: DAQ.map(function (v) { return v.id; }) },
      { name: 'Swagelok 閥件', items: SWAGELOK.map(function (v) { return v.id; }) },
      { name: '註解', items: ['note'] }
    ];
  return { VALVES, EQUIPMENT, ROCKET, DAQ, NODE_TYPES, CATEGORIES };
})();
