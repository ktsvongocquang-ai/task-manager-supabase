export function getDemoFloorPlan(): string {
  const svg = `<svg width="1000" height="700" viewBox="0 0 1000 700" xmlns="http://www.w3.org/2000/svg">
    <!-- Blueprint background grid -->
    <rect width="1000" height="700" fill="#f8fafc" />
    <defs>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" stroke-width="1" />
      </pattern>
    </defs>
    <rect width="1000" height="700" fill="url(#grid)" />

    <!-- Exterior walls -->
    <rect x="50" y="50" width="900" height="600" fill="none" stroke="#334155" stroke-width="8" stroke-linejoin="round" />
    
    <!-- Interior columns/structure -->
    <rect x="50" y="50" width="20" height="20" fill="#1e293b" />
    <rect x="500" y="50" width="20" height="20" fill="#1e293b" />
    <rect x="930" y="50" width="20" height="20" fill="#1e293b" />
    <rect x="50" y="350" width="20" height="20" fill="#1e293b" />
    <rect x="930" y="350" width="20" height="20" fill="#1e293b" />
    <rect x="50" y="630" width="20" height="20" fill="#1e293b" />
    <rect x="500" y="630" width="20" height="20" fill="#1e293b" />
    <rect x="930" y="630" width="20" height="20" fill="#1e293b" />

    <!-- Inner Wall lines -->
    <!-- Living room & Kitchen divider -->
    <line x1="500" y1="50" x2="500" y2="400" stroke="#475569" stroke-width="6" />
    <line x1="500" y1="480" x2="500" y2="650" stroke="#475569" stroke-width="6" />

    <!-- Bedroom 01 -->
    <line x1="50" y1="350" x2="350" y2="350" stroke="#475569" stroke-width="6" />
    <line x1="420" y1="350" x2="500" y2="350" stroke="#475569" stroke-width="6" />

    <!-- Bedroom 02 -->
    <line x1="500" y1="300" x2="800" y2="300" stroke="#475569" stroke-width="6" />
    <line x1="870" y1="300" x2="950" y2="300" stroke="#475569" stroke-width="6" />

    <!-- Bathroom -->
    <line x1="300" y1="350" x2="300" y2="550" stroke="#475569" stroke-width="6" />
    <line x1="300" y1="550" x2="500" y2="550" stroke="#475569" stroke-width="6" />

    <!-- Door SWINGS / ARCS -->
    <!-- Entrance door -->
    <path d="M 500,400 A 80,80 0 0,1 580,480" fill="none" stroke="#475569" stroke-width="2" stroke-dasharray="4,4" />
    <line x1="500" y1="400" x2="500" y2="480" stroke="#475569" stroke-width="4" />
    
    <!-- Bed 1 door -->
    <path d="M 350,350 A 70,70 0 0,0 420,420" fill="none" stroke="#475569" stroke-width="2" stroke-dasharray="4,4" />
    <line x1="350" y1="350" x2="420" y2="350" stroke="#475569" stroke-width="4" />

    <!-- Bed 2 door -->
    <path d="M 870,300 A 70,70 0 0,0 800,230" fill="none" stroke="#475569" stroke-width="2" stroke-dasharray="4,4" />
    <line x1="870" y1="300" x2="870" y2="230" stroke="#475569" stroke-width="4" />

    <!-- Room Titles / TEXT labels -->
    <text x="270" y="200" font-family="'Inter', sans-serif" font-size="24" font-weight="bold" fill="#1e293b" text-anchor="middle">PHÒNG KHÁCH</text>
    <text x="270" y="230" font-family="'Inter', sans-serif" font-size="14" fill="#64748b" text-anchor="middle">Living Room (S = 42m²)</text>

    <text x="730" y="160" font-family="'Inter', sans-serif" font-size="22" font-weight="bold" fill="#1e293b" text-anchor="middle">PHÒNG NGỦ MASTER</text>
    <text x="730" y="185" font-family="'Inter', sans-serif" font-size="14" fill="#64748b" text-anchor="middle">Master Bedroom (S = 28m²)</text>

    <text x="730" y="470" font-family="'Inter', sans-serif" font-size="22" font-weight="bold" fill="#1e293b" text-anchor="middle">PHÒNG BẾP / ĂN</text>
    <text x="730" y="495" font-family="'Inter', sans-serif" font-size="14" fill="#64748b" text-anchor="middle">Kitchen &amp; Dining (S = 30m²)</text>

    <text x="180" y="500" font-family="'Inter', sans-serif" font-size="20" font-weight="bold" fill="#1e293b" text-anchor="middle">PHÒNG NGỦ 02</text>
    <text x="180" y="525" font-family="'Inter', sans-serif" font-size="13" fill="#64748b" text-anchor="middle">Bedroom 2 (S = 18m²)</text>

    <text x="400" y="470" font-family="'Inter', sans-serif" font-size="16" font-weight="bold" fill="#1e293b" text-anchor="middle">W.C</text>
    <text x="400" y="490" font-family="'Inter', sans-serif" font-size="11" fill="#64748b" text-anchor="middle">(S = 6.5m²)</text>

    <!-- Balcony / Logia -->
    <line x1="50" y1="120" x2="10" y2="120" stroke="#475569" stroke-width="4" />
    <line x1="10" y1="120" x2="10" y2="480" stroke="#475569" stroke-width="4" />
    <line x1="10" y1="480" x2="50" y2="480" stroke="#475569" stroke-width="4" />
    <text x="25" y="300" font-family="'Inter', sans-serif" font-size="14" font-weight="bold" fill="#475569" text-anchor="middle" transform="rotate(-90, 25, 300)">BAN CÔNG / BALCONY</text>

    <!-- Blueprint markers/stairs representation -->
    <path d="M 500,120 L 580,120 L 580,240 L 500,240 Z" fill="#cbd5e1" fill-opacity="0.2" stroke="#475569" stroke-width="2" />
    <text x="540" y="185" font-family="'Inter', sans-serif" font-size="12" fill="#475569" text-anchor="middle">SẢNH THANG</text>

    <!-- Compass rose decoration -->
    <g transform="translate(900, 600)">
      <circle cx="0" cy="0" r="30" fill="none" stroke="#94a3b8" stroke-width="2" />
      <polygon points="0,-40 8,0 0,5" fill="#f43f5e" />
      <polygon points="0,5 -8,0 0,-40" fill="#cbd5e1" />
      <polygon points="0,40 5,0 0,-5" fill="#475569" />
      <polygon points="0,-5 -5,0 0,40" fill="#e2e8f0" />
      <text x="0" y="-45" font-family="'Inter', sans-serif" font-size="12" font-weight="bold" fill="#1e293b" text-anchor="middle">N</text>
      <text x="0" y="52" font-family="'Inter', sans-serif" font-size="12" font-weight="bold" fill="#1e293b" text-anchor="middle">S</text>
    </g>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function getMockProjectFloorPlan(projName: string): string {
  const svg = `<svg width="1000" height="700" viewBox="0 0 1000 700" xmlns="http://www.w3.org/2000/svg">
    <!-- Blueprint background grid -->
    <rect width="1000" height="700" fill="#0f172a" />
    <defs>
      <pattern id="darkgrid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" stroke-width="1" />
      </pattern>
    </defs>
    <rect width="1000" height="700" fill="url(#darkgrid)" />

    <!-- Exterior walls -->
    <rect x="50" y="50" width="900" height="600" fill="none" stroke="#38bdf8" stroke-width="6" stroke-linejoin="round" />
    
    <!-- Title card inside technical blueprint -->
    <rect x="80" y="80" width="480" height="120" fill="#020617" stroke="#0ea5e9" stroke-width="2" rx="12" />
    <text x="100" y="115" font-family="'Inter', sans-serif" font-size="14" font-weight="900" fill="#38bdf8" text-anchor="start">DQH ARCHITECTS - BẢN VẼ PHỤC HỒI</text>
    <text x="100" y="145" font-family="'Inter', sans-serif" font-size="16" font-weight="bold" fill="#ffffff" text-anchor="start">${projName.toUpperCase()}</text>
    <text x="100" y="175" font-family="'Inter', sans-serif" font-size="11" fill="#64748b" text-anchor="start">Bồi dưỡng kinh nghiệm • Trích lục từ ngân hàng học liệu lỗi sụt</text>

    <!-- Floor dividers standard grid model -->
    <line x1="500" y1="50" x2="500" y2="650" stroke="#1e293b" stroke-width="4" stroke-dasharray="5,5" />
    <line x1="50" y1="350" x2="950" y2="350" stroke="#1e293b" stroke-width="4" stroke-dasharray="5,5" />

    <!-- Wall boxes representing rooms -->
    <rect x="500" y="200" width="450" height="450" fill="none" stroke="#0ea5e9" stroke-width="4" />
    <rect x="50" y="350" width="450" height="300" fill="none" stroke="#0ea5e9" stroke-width="4" />

    {/* Labels */}
    <text x="725" y="425" font-family="'Inter', sans-serif" font-size="20" font-weight="bold" fill="#38bdf8" text-anchor="middle">VÙNG VÁCH TRƯỚC SÂN SAU</text>
    <text x="725" y="450" font-family="'Inter', sans-serif" font-size="11" fill="#64748b" text-anchor="middle">Sàn Bê Tông Chống Thấm (S = 180m²)</text>

    <text x="275" y="500" font-family="'Inter', sans-serif" font-size="20" font-weight="bold" fill="#38bdf8" text-anchor="middle">VÙNG THẠCH CAO &amp; MEP KHU BẾP</text>
    <text x="275" y="525" font-family="'Inter', sans-serif" font-size="11" fill="#64748b" text-anchor="middle">Cốt Hạ Sàn Cửa Lùa (S = 120m²)</text>

    <!-- Compass sign -->
    <g transform="translate(880, 150)">
      <circle cx="0" cy="0" r="24" fill="none" stroke="#0369a1" stroke-width="2" />
      <polygon points="0,-30 6,0 0,4" fill="#38bdf8" />
      <polygon points="0,4 -6,0 0,-30" fill="#334155" />
      <text x="0" y="-35" font-family="'Inter', sans-serif" font-size="10" font-weight="bold" fill="#38bdf8" text-anchor="middle">N</text>
    </g>

    <text x="500" y="680" font-family="'Inter', sans-serif" font-size="10" fill="#475569" text-anchor="middle">DQH Architects CAD/Engine Output • Draft Simulation Version 2.0</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function getFlavorFloorPlan(projName: string, flavor: 'tiling' | 'existing' | 'layout'): string {
  const isDark = flavor !== 'layout';
  const bgColor = isDark ? '#0f172a' : '#fafafa';
  const gridColor = isDark ? '#1e293b' : '#f1f5f9';
  const wallColor = isDark ? '#38bdf8' : '#334155';
  const titleColor = isDark ? '#ffffff' : '#0f172a';
  const sSubColor = isDark ? '#64748b' : '#475569';

  // Specific layers based on flavor
  let specializedGraphics = '';
  if (flavor === 'existing') {
    // EXISTING GROUND SLAB & ROUGH DETAILS
    specializedGraphics = `
      <!-- Existing rough brick slabs hatches -->
      <g stroke="#334155" stroke-width="1" opacity="0.35">
        <pattern id="brickHatch" width="40" height="20" patternUnits="userSpaceOnUse">
          <rect width="40" height="20" fill="none" />
          <line x1="0" y1="20" x2="40" y2="20" />
          <line x1="20" y1="0" x2="20" y2="20" />
        </pattern>
        <rect x="520" y="220" width="410" height="410" fill="url(#brickHatch)" />
        <rect x="70" y="370" width="410" height="260" fill="url(#brickHatch)" />
      </g>
      <!-- Concrete columns indicators with caution lines -->
      <rect x="500" y="50" width="30" height="30" fill="#f43f5e" />
      <rect x="50" y="350" width="30" height="30" fill="#f43f5e" />
      <rect x="920" y="350" width="30" height="30" fill="#f43f5e" />
      <text x="500" y="450" font-family="'JetBrains Mono', monospace" font-size="11" fill="#f43f5e" font-weight="bold" text-anchor="middle">▲ LƯU Ý: VÙNG GẠCH CŨ NỨT VỠ / CẦN PHÁ dỠ</text>
      <path d="M 120,420 L 400,600 font-size" stroke="#f43f5e" stroke-width="2" stroke-dasharray="4,4" />
      <circle cx="210" cy="480" r="12" fill="none" stroke="#f43f5e" stroke-width="2" />
      <text x="210" y="484" font-family="'Inter', sans-serif" font-size="10" font-weight="bold" fill="#f43f5e" text-anchor="middle">!</text>
    `;
  } else if (flavor === 'tiling') {
    // TILING MATERIAL GRID PATTERN 800X800
    specializedGraphics = `
      <!-- Precision 800x800 tiling joint pattern -->
      <g stroke="#0ea5e9" stroke-width="1.2" opacity="0.4">
        <pattern id="tilingGrid" width="60" height="60" patternUnits="userSpaceOnUse">
          <rect width="60" height="60" fill="none" />
          <line x1="60" y1="0" x2="0" y2="0" />
          <line x1="0" y1="60" x2="0" y2="0" />
        </pattern>
        <rect x="520" y="220" width="410" height="410" fill="url(#tilingGrid)" />
        <rect x="70" y="370" width="410" height="260" fill="url(#tilingGrid)" />
      </g>
      <!-- Starting point arrows for tile layout -->
      <g transform="translate(550, 250)">
        <circle cx="0" cy="0" r="8" fill="#0ea5e9" />
        <line x1="0" y1="0" x2="40" y2="0" stroke="#38bdf8" stroke-width="2" marker-end="url(#arrow)" />
        <line x1="0" y1="0" x2="0" y2="40" stroke="#38bdf8" stroke-width="2" />
        <text x="15" y="-10" font-family="'JetBrains Mono', monospace" font-size="9" fill="#38bdf8" font-weight="bold">CỐT MỐC LÁT GẠCH SỐ 1</text>
      </g>
      <text x="500" y="450" font-family="'Inter', sans-serif" font-size="12" fill="#38bdf8" font-weight="bold" text-anchor="middle">HƯỚNG ĐI BAY &amp; LIÊN KẾT KEO CHỐNG THẤM</text>
    `;
  } else {
    // INTERIOR WOOD FLOORS & FURNITURE LAYOUT Blueprint
    specializedGraphics = `
      <!-- Interior wood plank lines representation -->
      <g stroke="#94a3b8" stroke-width="0.8" opacity="0.3">
        <pattern id="woodFloors" width="10" height="80" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="0" y2="80" />
          <line x1="0" y1="40" x2="10" y2="40" />
        </pattern>
        <rect x="520" y="220" width="410" height="410" fill="url(#woodFloors)" />
        <rect x="70" y="370" width="410" height="260" fill="url(#woodFloors)" />
      </g>
      <!-- Draw living room sofa furniture vector shapes -->
      <g transform="translate(150, 420)" stroke="#475569" stroke-width="2" fill="#e2e8f0" fill-opacity="0.8">
        <!-- Sofa Sectional L -->
        <rect x="0" y="0" width="160" height="50" rx="8" />
        <rect x="110" y="50" width="50" height="70" rx="8" />
        <!-- Table -->
        <rect x="20" y="70" width="70" height="40" fill="#94a3b8" rx="4" />
        <text x="55" y="95" font-family="'Inter', sans-serif" font-size="10" fill="#1e293b" text-anchor="middle">Sofa &amp; Coffee Table</text>
      </g>
      <!-- Draw bedroom king bad with side lamps -->
      <g transform="translate(680, 350)" stroke="#475569" stroke-width="2" fill="#e2e8f0" fill-opacity="0.8">
        <rect x="0" y="0" width="140" height="150" rx="6" />
        <!-- Pillows -->
        <rect x="15" y="10" width="45" height="30" rx="3" />
        <rect x="80" y="10" width="45" height="30" rx="3" />
        <!-- Blanket fold lines -->
        <line x1="0" y1="60" x2="140" y2="60" />
        <text x="70" y="100" font-family="'Inter', sans-serif" font-size="11" fill="#1e293b" text-anchor="middle">KTS BED 1.8x2.0m</text>
      </g>
    `;
  }

  const svg = `<svg width="1000" height="700" viewBox="0 0 1000 700" xmlns="http://www.w3.org/2000/svg">
    <!-- Background grid setup -->
    <rect width="1000" height="700" fill="${bgColor}" />
    <defs>
      <pattern id="customGridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="${gridColor}" stroke-width="1.2" />
      </pattern>
    </defs>
    <rect width="1000" height="700" fill="url(#customGridPattern)" />

    <!-- Outer Structural boundaries -->
    <rect x="50" y="50" width="900" height="600" fill="none" stroke="${wallColor}" stroke-width="7" stroke-linejoin="round" />

    <!-- Divider grids -->
    <line x1="500" y1="50" x2="500" y2="650" stroke="${gridColor}" stroke-width="4" stroke-dasharray="5,5" />
    <line x1="50" y1="350" x2="950" y2="350" stroke="${gridColor}" stroke-width="4" stroke-dasharray="5,5" />

    <!-- Individual room wireframes -->
    <rect x="500" y="200" width="450" height="450" fill="none" stroke="${wallColor}" stroke-width="3" />
    <rect x="50" y="350" width="450" height="300" fill="none" stroke="${wallColor}" stroke-width="3" />

    <!-- Specialized Graphical flavor elements -->
    ${specializedGraphics}

    <!-- Technical Header block -->
    <rect x="80" y="80" width="510" height="120" fill="${isDark ? '#020617' : '#ffffff'}" stroke="${wallColor}" stroke-width="2" rx="12" />
    <text x="105" y="115" font-family="'Inter', sans-serif" font-size="12" font-weight="900" fill="${isDark ? '#38bdf8' : '#0369a1'}" text-anchor="start">DQH ARCHITECTS - MIRO WORKSPACE COLLAB</text>
    <text x="105" y="145" font-family="'Inter', sans-serif" font-size="16" font-weight="950" fill="${titleColor}" text-anchor="start">${projName.toUpperCase()}</text>
    <text x="105" y="175" font-family="'Inter', sans-serif" font-size="11" fill="${sSubColor}" text-anchor="start">${flavor === 'tiling' ? '✦ BẢN VẼ PHÂN VÙNG SÀN ỐP LÁT - CHỈNH GHÉP MÍ CAO CẤP' : flavor === 'existing' ? '✦ BẢN VẼ BIỂU DIỄN GẠCH HIỆN TRẠNG & BÙ NỀN CHỐNG SÙI' : '✦ BẢN VẼ THIẾT KẾ BỐ TRÍ NỘI THẤT HOÀN THIỆN ĐỒ GỖ'}</text>

    <!-- Compass -->
    <g transform="translate(880, 150)">
      <circle cx="0" cy="0" r="22" fill="none" stroke="${wallColor}" stroke-width="1.5" />
      <polygon points="0,-26 5,0 0,3" fill="#ef4444" />
      <polygon points="0,3 -5,0 0,-26" fill="${isDark ? '#475569' : '#cbd5e1'}" />
      <text x="0" y="-31" font-family="'Inter', sans-serif" font-size="9" font-weight="bold" fill="${isDark ? '#ef4444' : '#b91c1c'}" text-anchor="middle">N</text>
    </g>

    <text x="500" y="680" font-family="'Inter', sans-serif" font-size="10" fill="#475569" text-anchor="middle">DQH Architects Professional Canvas Suite • Floorplan Category: ${flavor.toUpperCase()}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

