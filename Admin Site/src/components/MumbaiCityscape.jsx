export default function MumbaiCityscape() {
  return (
    <svg
      viewBox="0 0 260 200"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', display: 'block' }}
      aria-label="Mumbai Metro cityscape illustration"
    >
      {/* Sky — soft blue-white gradient feel */}
      <rect width="260" height="200" fill="#dce9f8" />
      <rect width="260" height="90" fill="#e8f1fb" />

      {/* Birds */}
      <path d="M152 26 Q155 23 158 26" fill="none" stroke="#9fb8d8" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M163 20 Q166 17 169 20" fill="none" stroke="#9fb8d8" strokeWidth="1.4" strokeLinecap="round"/>

      {/* === BUILDINGS — varying height, blue-gray palette === */}

      {/* Left cluster */}
      <rect x="0"   y="72"  width="24" height="88"  fill="#b6cde6" />
      <rect x="22"  y="90"  width="18" height="70"  fill="#c2d6ea" />
      <rect x="38"  y="52"  width="28" height="108" fill="#a9c3de" />
      {/* windows col 1 */}
      <rect x="43"  y="62"  width="5"  height="6"   fill="#cddff0" rx="0.5"/>
      <rect x="52"  y="62"  width="5"  height="6"   fill="#cddff0" rx="0.5"/>
      <rect x="43"  y="74"  width="5"  height="6"   fill="#cddff0" rx="0.5"/>
      <rect x="52"  y="74"  width="5"  height="6"   fill="#cddff0" rx="0.5"/>
      <rect x="43"  y="86"  width="5"  height="6"   fill="#cddff0" rx="0.5"/>
      <rect x="52"  y="86"  width="5"  height="6"   fill="#cddff0" rx="0.5"/>
      {/* antenna */}
      <rect x="51"  y="44"  width="2"  height="10"  fill="#a9c3de"/>

      <rect x="64"  y="80"  width="18" height="80"  fill="#b6cde6" />
      <rect x="67"  y="90"  width="4"  height="5"   fill="#cddff0" rx="0.5"/>
      <rect x="74"  y="90"  width="4"  height="5"   fill="#cddff0" rx="0.5"/>

      <rect x="80"  y="64"  width="26" height="96"  fill="#a2bedd" />
      <rect x="84"  y="74"  width="5"  height="6"   fill="#bedaf0" rx="0.5"/>
      <rect x="93"  y="74"  width="5"  height="6"   fill="#bedaf0" rx="0.5"/>
      <rect x="84"  y="86"  width="5"  height="6"   fill="#bedaf0" rx="0.5"/>
      <rect x="93"  y="86"  width="5"  height="6"   fill="#bedaf0" rx="0.5"/>
      <rect x="84"  y="98"  width="5"  height="6"   fill="#bedaf0" rx="0.5"/>
      <rect x="93"  y="98"  width="5"  height="6"   fill="#bedaf0" rx="0.5"/>

      <rect x="104" y="86"  width="16" height="74"  fill="#b6cde6" />
      <rect x="107" y="96"  width="4"  height="4"   fill="#cddff0" rx="0.5"/>
      <rect x="114" y="96"  width="4"  height="4"   fill="#cddff0" rx="0.5"/>

      {/* Center tall building */}
      <rect x="118" y="58"  width="32" height="102" fill="#9ab9d6" />
      <rect x="122" y="68"  width="6"  height="7"   fill="#bbdaf0" rx="0.5"/>
      <rect x="132" y="68"  width="6"  height="7"   fill="#bbdaf0" rx="0.5"/>
      <rect x="142" y="68"  width="6"  height="7"   fill="#bbdaf0" rx="0.5"/>
      <rect x="122" y="80"  width="6"  height="7"   fill="#bbdaf0" rx="0.5"/>
      <rect x="132" y="80"  width="6"  height="7"   fill="#bbdaf0" rx="0.5"/>
      <rect x="142" y="80"  width="6"  height="7"   fill="#bbdaf0" rx="0.5"/>
      <rect x="122" y="92"  width="6"  height="7"   fill="#bbdaf0" rx="0.5"/>
      <rect x="132" y="92"  width="6"  height="7"   fill="#bbdaf0" rx="0.5"/>
      <rect x="142" y="92"  width="6"  height="7"   fill="#bbdaf0" rx="0.5"/>
      {/* antenna */}
      <rect x="133" y="50"  width="2"  height="10"  fill="#9ab9d6"/>

      {/* Right cluster */}
      <rect x="148" y="76"  width="20" height="84"  fill="#adc5de" />
      <rect x="151" y="86"  width="4"  height="5"   fill="#c8dff0" rx="0.5"/>
      <rect x="158" y="86"  width="4"  height="5"   fill="#c8dff0" rx="0.5"/>

      <rect x="166" y="66"  width="24" height="94"  fill="#a2bedd" />
      <rect x="169" y="76"  width="5"  height="6"   fill="#bedaf0" rx="0.5"/>
      <rect x="178" y="76"  width="5"  height="6"   fill="#bedaf0" rx="0.5"/>
      <rect x="169" y="88"  width="5"  height="6"   fill="#bedaf0" rx="0.5"/>
      <rect x="178" y="88"  width="5"  height="6"   fill="#bedaf0" rx="0.5"/>

      <rect x="188" y="82"  width="18" height="78"  fill="#b6cde6" />
      <rect x="191" y="92"  width="4"  height="4"   fill="#cddff0" rx="0.5"/>
      <rect x="198" y="92"  width="4"  height="4"   fill="#cddff0" rx="0.5"/>

      <rect x="204" y="68"  width="22" height="92"  fill="#a9c3de" />
      <rect x="207" y="78"  width="5"  height="6"   fill="#cddff0" rx="0.5"/>
      <rect x="216" y="78"  width="5"  height="6"   fill="#cddff0" rx="0.5"/>
      <rect x="207" y="90"  width="5"  height="6"   fill="#cddff0" rx="0.5"/>
      <rect x="216" y="90"  width="5"  height="6"   fill="#cddff0" rx="0.5"/>

      <rect x="224" y="84"  width="36" height="76"  fill="#b2cadf" />

      {/* === ELEVATED TRACK === */}
      {/* platform surface */}
      <rect x="0"   y="150" width="260" height="9"  fill="#9aaec4" rx="1"/>
      {/* rail highlight */}
      <rect x="0"   y="150" width="260" height="2"  fill="#adc2d6"/>

      {/* Pillars */}
      {[16, 52, 92, 132, 172, 212, 248].map((px, i) => (
        <rect key={i} x={px - 4} y={159} width={8} height={41} fill="#8fa3b8" rx="2"/>
      ))}

      {/* === TRAIN === */}
      {/* main body */}
      <rect x="32"  y="124" width="150" height="27" fill="white"   rx="6"/>
      {/* front nose */}
      <rect x="22"  y="127" width="14"  height="21" fill="#edf2fa"  rx="6"/>
      {/* rear */}
      <rect x="179" y="127" width="8"   height="21" fill="#edf2fa"  rx="4"/>

      {/* Indigo / purple stripe */}
      <rect x="22"  y="140" width="165" height="5"  fill="#5b50e8"  rx="1"/>

      {/* Windows */}
      {[42, 68, 94, 120, 146].map((wx) => (
        <rect key={wx} x={wx} y={127} width={18} height={11} fill="#d4e3f5" rx="2"/>
      ))}

      {/* Headlight — amber circle */}
      <circle cx="26" cy="133" r="5.5" fill="#fbbf24" opacity="0.95"/>
      <circle cx="26" cy="133" r="3"   fill="#fef3c7"/>

      {/* Subtle reflection under train */}
      <rect x="32" y="151" width="150" height="3" fill="white" opacity="0.2" rx="1"/>
    </svg>
  )
}
