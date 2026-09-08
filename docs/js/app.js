
        // ============================================================
        // KNAPSACK OUTPUT DATA
        // ============================================================
        let KNAPSACK_DATA = {
            selected_controls: [],
            deferred_controls: [],
            total_cost: 0,
            total_risk_reduction: 0,
            budget: 10,
            financial: {
                capital_at_risk_before: 180,
                capital_at_risk_after: 71,
                portfolio_roi: 11.41,
                risk_trend_labels: ['Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep'],
                risk_trend_values: [210, 205, 195, 190, 185, 180, 180, 180, 180, 180, 180, 71],
                loss_exceedance: [
                    {threshold: 20,  probability: 0.95},
                    {threshold: 50,  probability: 0.85},
                    {threshold: 100, probability: 0.62},
                    {threshold: 150, probability: 0.41},
                    {threshold: 200, probability: 0.23},
                    {threshold: 300, probability: 0.09},
                    {threshold: 500, probability: 0.02}
                ]
            }
        };

        async function fetchOptimizationData() {
            try {
                const response = await fetch('http://127.0.0.1:8000/api/optimize/default');
                
                if (!response.ok) {
                    throw new Error(`API Error: ${response.status}`);
                }
                
                const apiData = await response.json();
                
                Object.assign(KNAPSACK_DATA, apiData);
                console.log("Live Telemetry Sync Complete:", KNAPSACK_DATA);

                if (currentRole === 'cfo' && !document.getElementById('view-cfo-dashboard').classList.contains('view-hidden')) {
                    initCfoDashboard();
                } else if (currentRole === 'ciso' && !document.getElementById('view-ciso-dashboard').classList.contains('view-hidden')) {
                    initCisoDashboard();
                }
                
            } catch (error) {
                console.error("Telemetry Sync Failed. Is the FastAPI backend running?", error);
            }
        }

        fetchOptimizationData();

        const CATEGORY_COLORS = {
            'Identity': '#a78bfa',
            'Endpoint': '#f59e0b',
            'Network': '#60a5fa',
            'Data': '#10b981',
            'People': '#f472b6',
            'Monitoring': '#22d3ee',
            'Assessment': '#c084fc',
            'Email': '#fb923c',
            'Cloud': '#818cf8',
            'Physical': '#94a3b8',
            'Response': '#fbbf24',
            'Application': '#fb7185' // Added Application color for your custom CVEs
        };

        // ============================================================
        // STATE
        // ============================================================
        let currentRole = null;
        let currentUserName = '';

        // ============================================================
        // VIEW ROUTER
        // ============================================================
        function navigate(viewName) {
            const views = ['home', 'auth', 'terminal', 'cfo-dashboard', 'ciso-dashboard'];
            views.forEach(v => {
                const el = document.getElementById(`view-${v}`);
                if (!el) return;
                if (v === viewName) {
                    el.classList.remove('view-hidden');
                } else {
                    el.classList.add('view-hidden');
                }
            });
            window.scrollTo({ top: 0, behavior: 'smooth' });

            if (viewName !== 'home') {
                document.body.classList.remove('is-light');
            } else {
                window.dispatchEvent(new Event('scroll'));
            }

            if (viewName === 'cfo-dashboard') initCfoDashboard();
            if (viewName === 'ciso-dashboard') initCisoDashboard();
        }

        function toggleAuthMode(mode) {
            if (mode === 'login') {
                document.getElementById('auth-signup').classList.add('hidden');
                document.getElementById('auth-login').classList.remove('hidden');
            } else {
                document.getElementById('auth-login').classList.add('hidden');
                document.getElementById('auth-signup').classList.remove('hidden');
            }
        }

        // ============================================================
        // ROLE SELECTION
        // ============================================================
        function selectRole(role) {
            currentRole = role;
            document.querySelectorAll('.role-btn').forEach(btn => {
                if (btn.dataset.role === role) {
                    btn.classList.add('role-selected');
                } else {
                    btn.classList.remove('role-selected');
                }
            });
        }

        function submitSignup(event) {
            event.preventDefault();
            if (!currentRole) {
                alert('Please select your role (CFO or CISO) before continuing.');
                return;
            }
            const name = document.getElementById('signup-name').value.trim();
            currentUserName = name ? `, ${name.split(' ')[0]}` : '';
            setNavRoleIndicator();
            navigate(currentRole === 'cfo' ? 'cfo-dashboard' : 'ciso-dashboard');
        }

        function submitLogin(event) {
            event.preventDefault();
            if (!currentRole) {
                alert('Please select whether you are signing in as CFO or CISO.');
                return;
            }
            const email = document.getElementById('login-email').value.trim();
            currentUserName = email ? `, ${email.split('@')[0]}` : '';
            setNavRoleIndicator();
            navigate(currentRole === 'cfo' ? 'cfo-dashboard' : 'ciso-dashboard');
        }

        function switchRole(role) {
            currentRole = role;
            setNavRoleIndicator();
            navigate(role === 'cfo' ? 'cfo-dashboard' : 'ciso-dashboard');
        }

        function signOut() {
            currentRole = null;
            currentUserName = '';
            setNavRoleIndicator();
            navigate('home');
        }

        function setNavRoleIndicator() {
            const indicator = document.getElementById('nav-role-indicator');
            const cta = document.getElementById('nav-cta-btn');
            const label = document.getElementById('nav-role-label');
            if (currentRole) {
                indicator.classList.remove('hidden');
                indicator.classList.add('flex');
                cta.classList.add('hidden');
                label.textContent = currentRole.toUpperCase();
            } else {
                indicator.classList.add('hidden');
                indicator.classList.remove('flex');
                cta.classList.remove('hidden');
            }
        }

        // ============================================================
        // CHART HELPERS
        // ============================================================
        function smoothPath(points) {
            if (points.length < 2) return '';
            let d = `M ${points[0].x},${points[0].y}`;
            for (let i = 1; i < points.length; i++) {
                const p0 = points[i - 1];
                const p1 = points[i];
                const cx = (p0.x + p1.x) / 2;
                d += ` C ${cx},${p0.y} ${cx},${p1.y} ${p1.x},${p1.y}`;
            }
            return d;
        }

        function renderLineArea(elId, values, color = '#a78bfa') {
            const el = document.getElementById(elId);
            if (!el) return;
            const w = el.clientWidth || 600;
            const h = el.clientHeight || 200;
            const pad = 12;
            const max = Math.max(...values);
            const min = Math.min(...values);
            const range = max - min || 1;
            const stepX = (w - pad * 2) / (values.length - 1);
            const points = values.map((v, i) => ({
                x: pad + i * stepX,
                y: pad + (h - pad * 2) * (1 - (v - min) / range)
            }));
            const line = smoothPath(points);
            const area = line + ` L ${points[points.length - 1].x},${h - pad} L ${points[0].x},${h - pad} Z`;
            const gid = `grad-${elId}`;
            el.innerHTML = `
                <svg width="100%" height="100%" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="overflow:visible">
                    <defs>
                        <linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stop-color="${color}" stop-opacity="0.35"/>
                            <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
                        </linearGradient>
                    </defs>
                    <path d="${area}" fill="url(#${gid})"/>
                    <path d="${line}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                    ${points.map((p, i) => `<circle cx="${p.x}" cy="${p.y}" r="${i === points.length - 1 ? 5 : 3}" fill="${i === points.length - 1 ? '#ffffff' : color}"/>`).join('')}
                </svg>
            `;
        }

        function renderDonut(elId, segments) {
            const el = document.getElementById(elId);
            if (!el) return;
            const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
            const R = 40;
            const C = 2 * Math.PI * R;
            let offset = 0;
            const arcs = segments.map(seg => {
                const pct = seg.value / total;
                const dash = pct * C;
                const arc = `<circle cx="50" cy="50" r="${R}" fill="none"
                    stroke="${seg.color}" stroke-width="10"
                    stroke-dasharray="${dash} ${C - dash}"
                    stroke-dashoffset="${-offset}"
                    transform="rotate(-90 50 50)"/>`;
                offset += dash;
                return arc;
            }).join('');
            const centerLabel = el.querySelector('.absolute');
            el.innerHTML = `
                <svg viewBox="0 0 100 100" class="w-full h-full">
                    <circle cx="50" cy="50" r="${R}" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="10"/>
                    ${arcs}
                </svg>
            `;
            if (centerLabel) el.appendChild(centerLabel);
        }

        function renderHorizontalBars(elId, items, opts = {}) {
            const el = document.getElementById(elId);
            if (!el) return;
            const max = Math.max(...items.map(i => i.value));
            const {
                valuePrefix = '', valueSuffix = '',
                barColorKey = null 
            } = opts;
            el.innerHTML = items.map((item, i) => {
                const pct = (item.value / max) * 100;
                const color = item.color || (barColorKey ? CATEGORY_COLORS[item[barColorKey]] || '#a78bfa' : '#a78bfa');
                return `
                    <div>
                        <div class="flex justify-between text-xs mb-1.5">
                            <span class="text-gray-200 truncate pr-2">${item.label}</span>
                            <span class="text-white font-mono flex-shrink-0">${valuePrefix}${item.value}${valueSuffix}</span>
                        </div>
                        <div class="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div class="h-full rounded-full" style="width:${pct}%; background:${color}; transition:width 0.6s ease-out ${i * 40}ms"></div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        function renderScatter(elId, points) {
            const el = document.getElementById(elId);
            if (!el) return;
            const w = el.clientWidth || 800;
            const h = el.clientHeight || 300;
            const pad = 28;
            const maxX = Math.max(...points.map(p => p.x));
            const maxY = Math.max(...points.map(p => p.y));
            const gridLines = [0, 0.25, 0.5, 0.75, 1].map(t => {
                const y = pad + (h - pad * 2) * (1 - t);
                return `<line x1="${pad}" y1="${y}" x2="${w - pad}" y2="${y}" stroke="rgba(255,255,255,0.04)" stroke-dasharray="2 4"/>`;
            }).join('');
            const dots = points.map(p => {
                const cx = pad + (p.x / maxX) * (w - pad * 2);
                const cy = pad + (h - pad * 2) * (1 - p.y / maxY);
                const fill = p.selected ? '#a78bfa' : '#3f3f46';
                const r = p.selected ? 7 : 5;
                const glow = p.selected ? `<circle cx="${cx}" cy="${cy}" r="${r + 6}" fill="${fill}" opacity="0.15"/>` : '';
                return `
                    <g>
                        ${glow}
                        <circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
                        <text x="${cx}" y="${cy - r - 4}" text-anchor="middle" fill="${p.selected ? '#ffffff' : '#71717a'}" font-family="JetBrains Mono" font-size="9">${p.label}</text>
                    </g>
                `;
            }).join('');
            el.innerHTML = `
                <svg width="100%" height="100%" viewBox="0 0 ${w} ${h}" style="overflow:visible">
                    ${gridLines}
                    <line x1="${pad}" y1="${h - pad}" x2="${w - pad}" y2="${h - pad}" stroke="rgba(255,255,255,0.1)"/>
                    <line x1="${pad}" y1="${pad}" x2="${pad}" y2="${h - pad}" stroke="rgba(255,255,255,0.1)"/>
                    ${dots}
                </svg>
            `;
        }

        // ============================================================
        // COUNT-UP ANIMATION
        // ============================================================
        function countUp(el, target, duration = 1200, divide = 1) {
            const startTime = performance.now();
            function tick(now) {
                const t = Math.min((now - startTime) / duration, 1);
                const eased = 1 - Math.pow(1 - t, 3);
                const val = target * eased / divide;
                el.textContent = divide > 1 ? val.toFixed(2) : Math.floor(val);
                if (t < 1) requestAnimationFrame(tick);
                else el.textContent = divide > 1 ? (target / divide).toFixed(2) : target;
            }
            requestAnimationFrame(tick);
        }

        function runCountUpsIn(sectionId) {
            const section = document.getElementById(sectionId);
            if (!section) return;
            section.querySelectorAll('[data-count-to]').forEach(el => {
                const target = parseFloat(el.dataset.countTo);
                const divide = parseFloat(el.dataset.divide || '1');
                countUp(el, target, 1200, divide);
            });
        }

        // ============================================================
        // CFO DASHBOARD INITIALIZATION
        // ============================================================
        function initCfoDashboard() {
            document.getElementById('cfo-user-name').textContent = currentUserName;
            document.getElementById('cfo-last-update').textContent = new Date().toLocaleString('en-IN', {
                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
            });

            const kpiSpans = document.getElementById('view-cfo-dashboard').querySelectorAll('[data-count-to]');
            if (kpiSpans.length >= 4 && KNAPSACK_DATA && KNAPSACK_DATA.financial) {
                kpiSpans[0].dataset.countTo = KNAPSACK_DATA.financial.capital_at_risk_before;
                kpiSpans[1].dataset.countTo = KNAPSACK_DATA.total_risk_reduction;
                kpiSpans[2].dataset.countTo = KNAPSACK_DATA.total_cost;
                
                const budgetLabel = kpiSpans[2].parentElement.nextElementSibling;
                if (budgetLabel) budgetLabel.textContent = `L / ${KNAPSACK_DATA.budget}L`;
                
                kpiSpans[3].dataset.countTo = (KNAPSACK_DATA.financial.portfolio_roi * 100).toFixed(0);
            }

            runCountUpsIn('view-cfo-dashboard');

            requestAnimationFrame(() => {
                renderLineArea('cfo-trend-chart', KNAPSACK_DATA.financial.risk_trend_values, '#a78bfa');
                const labels = KNAPSACK_DATA.financial.risk_trend_labels;
                document.getElementById('cfo-trend-labels').innerHTML =
                    labels.map(l => `<span>${l}</span>`).join('');

                const byCategory = {};
                KNAPSACK_DATA.selected_controls.forEach(c => {
                    byCategory[c.category] = (byCategory[c.category] || 0) + c.cost;
                });
                const catSegments = Object.entries(byCategory).map(([cat, val]) => ({
                    label: cat, value: val, color: CATEGORY_COLORS[cat] || '#a78bfa'
                }));
                renderDonut('cfo-category-donut', catSegments);
                
                const cfoDonutLabel = document.querySelector('#cfo-category-donut span.text-2xl');
                if (cfoDonutLabel) cfoDonutLabel.textContent = KNAPSACK_DATA.selected_controls.length;

                document.getElementById('cfo-category-legend').innerHTML = catSegments
                    .sort((a, b) => b.value - a.value)
                    .map(s => `
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2">
                                <span class="cat-dot" style="background:${s.color}"></span>
                                <span class="text-gray-300">${s.label}</span>
                            </div>
                            <span class="font-mono text-white">₹${s.value}L</span>
                        </div>
                    `).join('');

                const barItems = KNAPSACK_DATA.selected_controls
                    .slice()
                    .sort((a, b) => b.risk_reduction - a.risk_reduction)
                    .map(c => ({
                        label: `${c.id} · ${c.name}`,
                        value: c.risk_reduction,
                        color: CATEGORY_COLORS[c.category] || '#a78bfa'
                    }));
                renderHorizontalBars('cfo-reduction-bars', barItems, { valuePrefix: '₹', valueSuffix: 'L' });

                const exceedanceValues = KNAPSACK_DATA.financial.loss_exceedance.map(p => p.probability * 100);
                renderLineArea('cfo-exceedance-chart', exceedanceValues, '#f87171');

                const selectedIds = new Set(KNAPSACK_DATA.selected_controls.map(c => c.id));
                const allControls = [...KNAPSACK_DATA.selected_controls, ...KNAPSACK_DATA.deferred_controls];
                const scatterPoints = allControls.map(c => ({
                    x: c.cost, y: c.risk_reduction, label: c.id, selected: selectedIds.has(c.id)
                }));
                renderScatter('cfo-scatter', scatterPoints);
            });

            const selectedRows = KNAPSACK_DATA.selected_controls.map(c => {
                const roi = (c.cost > 0) ? (c.risk_reduction / c.cost).toFixed(2) : "0.00";
                return `
                    <tr class="border-b border-white/5 hover:bg-white/5 transition">
                        <td class="py-3 px-3 font-mono text-gray-500">${c.id.substring(0,12)}...</td>
                        <td class="py-3 px-3 text-white font-medium">${c.name}</td>
                        <td class="py-3 px-3"><span style="color:${CATEGORY_COLORS[c.category] || '#a78bfa'}">${c.category}</span></td>
                        <td class="py-3 px-3 text-right font-mono">₹${c.cost}L</td>
                        <td class="py-3 px-3 text-right font-mono text-qemerald">₹${c.risk_reduction}L</td>
                        <td class="py-3 px-3 text-right font-mono ${c.efficiency >= 4 ? 'text-qamber font-bold' : 'text-gray-300'}">${(c.efficiency || 0).toFixed(2)}</td>
                        <td class="py-3 px-3 text-right font-mono text-white">${roi}x</td>
                    </tr>
                `;
            }).join('');
            document.getElementById('cfo-selected-tbody').innerHTML = selectedRows;

            const deferredRows = KNAPSACK_DATA.deferred_controls.map(c => {
                const roi = (c.cost > 0) ? (c.risk_reduction / c.cost).toFixed(2) : "0.00";
                return `
                    <tr class="border-b border-white/5 hover:bg-white/5 transition">
                        <td class="py-3 px-3 font-mono text-qamber font-bold">#${c.priority_rank}</td>
                        <td class="py-3 px-3 font-mono text-gray-500">${c.id.substring(0,12)}...</td>
                        <td class="py-3 px-3 text-white font-medium">${c.name}</td>
                        <td class="py-3 px-3"><span style="color:${CATEGORY_COLORS[c.category] || '#a78bfa'}">${c.category}</span></td>
                        <td class="py-3 px-3 text-right font-mono">₹${c.cost}L</td>
                        <td class="py-3 px-3 text-right font-mono text-qemerald">₹${c.risk_reduction}L</td>
                        <td class="py-3 px-3 text-right font-mono text-white">${roi}x</td>
                    </tr>
                `;
            }).join('');
            document.getElementById('cfo-deferred-tbody').innerHTML = deferredRows;
        }

        // ============================================================
        // CISO DASHBOARD INITIALIZATION
        // ============================================================
        function initCisoDashboard() {
            document.getElementById('ciso-user-name').textContent = currentUserName;
            document.getElementById('ciso-last-update').textContent = new Date().toLocaleString('en-IN', {
                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
            });

            const cisoSpans = document.getElementById('view-ciso-dashboard').querySelectorAll('[data-count-to]');
            if (cisoSpans.length >= 3 && KNAPSACK_DATA && KNAPSACK_DATA.selected_controls) {
                const total = KNAPSACK_DATA.selected_controls.length + KNAPSACK_DATA.deferred_controls.length;
                const coverage = total > 0 ? Math.round((KNAPSACK_DATA.selected_controls.length / total) * 100) : 0;
                
                cisoSpans[0].dataset.countTo = KNAPSACK_DATA.selected_controls.length;
                
                const totalLabel = cisoSpans[0].parentElement.nextElementSibling;
                if (totalLabel) totalLabel.textContent = `/${total}`;
                
                cisoSpans[1].dataset.countTo = coverage;
                cisoSpans[2].dataset.countTo = KNAPSACK_DATA.deferred_controls.length;
            }

            runCountUpsIn('view-ciso-dashboard');

            requestAnimationFrame(() => {
                const byCategory = {};
                KNAPSACK_DATA.selected_controls.forEach(c => {
                    if (!byCategory[c.category]) byCategory[c.category] = { selected: [], deferred: [] };
                    byCategory[c.category].selected.push(c);
                });
                KNAPSACK_DATA.deferred_controls.forEach(c => {
                    if (!byCategory[c.category]) byCategory[c.category] = { selected: [], deferred: [] };
                    byCategory[c.category].deferred.push(c);
                });
                const heatmap = document.getElementById('ciso-heatmap');
                heatmap.innerHTML = Object.entries(byCategory)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([cat, group]) => {
                        const total = group.selected.length + group.deferred.length;
                        const covPct = Math.round((group.selected.length / total) * 100);
                        const tiles = [
                            ...group.selected.map(c => `<div title="${c.id} · ${c.name} (deployed)" class="heat-cell w-8 h-8 rounded-md bg-qemerald/70 border border-qemerald/40 flex items-center justify-center text-[9px] font-mono text-white cursor-pointer">${c.id.replace('FINDING-','').substring(0,4)}</div>`),
                            ...group.deferred.map(c => `<div title="${c.id} · ${c.name} (deferred)" class="heat-cell w-8 h-8 rounded-md bg-qamber/25 border border-qamber/30 flex items-center justify-center text-[9px] font-mono text-qamber cursor-pointer">${c.id.replace('FINDING-','').substring(0,4)}</div>`)
                        ].join('');
                        return `
                            <div class="flex items-center gap-3">
                                <div class="w-28 flex-shrink-0">
                                    <div class="text-xs text-white font-medium">${cat}</div>
                                    <div class="text-[10px] text-gray-500 font-mono">${covPct}% covered</div>
                                </div>
                                <div class="flex-1 flex flex-wrap gap-1.5">${tiles}</div>
                            </div>
                        `;
                    }).join('');

                renderDonut('ciso-status-donut', [
                    { label: 'Deployed', value: KNAPSACK_DATA.selected_controls.length, color: '#10b981' },
                    { label: 'Deferred', value: KNAPSACK_DATA.deferred_controls.length, color: '#f59e0b' }
                ]);
                
                const cisoDonutLabel = document.querySelector('#ciso-status-donut span.text-2xl');
                if(cisoDonutLabel) cisoDonutLabel.textContent = KNAPSACK_DATA.selected_controls.length + KNAPSACK_DATA.deferred_controls.length;

                const priorityItems = KNAPSACK_DATA.deferred_controls
                    .slice(0, 10)
                    .map(c => ({
                        label: `#${c.priority_rank} · ${c.id.substring(0,12)}...`,
                        value: c.efficiency,
                        color: CATEGORY_COLORS[c.category] || '#a78bfa'
                    }));
                renderHorizontalBars('ciso-priority-bars', priorityItems, { valueSuffix: '' });

                const catCounts = {};
                [...KNAPSACK_DATA.selected_controls, ...KNAPSACK_DATA.deferred_controls].forEach(c => {
                    if (!catCounts[c.category]) catCounts[c.category] = { total: 0, deployed: 0 };
                    catCounts[c.category].total++;
                    if (KNAPSACK_DATA.selected_controls.find(s => s.id === c.id)) catCounts[c.category].deployed++;
                });
                const catBars = Object.entries(catCounts)
                    .sort(([, a], [, b]) => b.total - a.total)
                    .map(([cat, d]) => ({
                        label: `${cat}  (${d.deployed}/${d.total})`,
                        value: d.total,
                        color: CATEGORY_COLORS[cat] || '#a78bfa'
                    }));
                renderHorizontalBars('ciso-category-bars', catBars);
            });

            const maxRed = Math.max(...KNAPSACK_DATA.selected_controls.map(c => c.risk_reduction));
            const selectedRows = KNAPSACK_DATA.selected_controls.map(c => {
                const weight = maxRed > 0 ? Math.round((c.risk_reduction / maxRed) * 100) : 0;
                return `
                    <tr class="border-b border-white/5 hover:bg-white/5 transition">
                        <td class="py-3 px-3">
                            <div class="flex items-center gap-2">
                                <span class="w-1.5 h-1.5 rounded-full bg-qemerald animate-pulse"></span>
                                <span class="text-[10px] font-mono text-qemerald">LIVE</span>
                            </div>
                        </td>
                        <td class="py-3 px-3 font-mono text-gray-500">${c.id.substring(0,12)}...</td>
                        <td class="py-3 px-3 text-white font-medium">${c.name}</td>
                        <td class="py-3 px-3"><span style="color:${CATEGORY_COLORS[c.category] || '#a78bfa'}">${c.category}</span></td>
                        <td class="py-3 px-3 text-right font-mono ${c.efficiency >= 4 ? 'text-qamber font-bold' : 'text-gray-300'}">${(c.efficiency || 0).toFixed(2)}</td>
                        <td class="py-3 px-3 text-right">
                            <div class="inline-block w-24 h-1 bg-white/5 rounded-full overflow-hidden align-middle">
                                <div class="h-full bg-qemerald" style="width:${weight}%"></div>
                            </div>
                            <span class="text-[10px] font-mono text-gray-400 ml-2">${weight}%</span>
                        </td>
                    </tr>
                `;
            }).join('');
            document.getElementById('ciso-selected-tbody').innerHTML = selectedRows;

            const maxDefRed = Math.max(...KNAPSACK_DATA.deferred_controls.map(c => c.risk_reduction));
            const deferredRows = KNAPSACK_DATA.deferred_controls.map(c => {
                const weight = maxDefRed > 0 ? Math.round((c.risk_reduction / maxDefRed) * 100) : 0;
                return `
                    <tr class="border-b border-white/5 hover:bg-white/5 transition">
                        <td class="py-3 px-3 font-mono text-qamber font-bold">#${c.priority_rank}</td>
                        <td class="py-3 px-3 font-mono text-gray-500">${c.id.substring(0,12)}...</td>
                        <td class="py-3 px-3 text-white font-medium">${c.name}</td>
                        <td class="py-3 px-3"><span style="color:${CATEGORY_COLORS[c.category] || '#a78bfa'}">${c.category}</span></td>
                        <td class="py-3 px-3 text-right font-mono text-gray-300">${(c.efficiency || 0).toFixed(2)}</td>
                        <td class="py-3 px-3 text-right">
                            <div class="inline-block w-24 h-1 bg-white/5 rounded-full overflow-hidden align-middle">
                                <div class="h-full bg-qamber" style="width:${weight}%"></div>
                            </div>
                            <span class="text-[10px] font-mono text-gray-400 ml-2">${weight}%</span>
                        </td>
                    </tr>
                `;
            }).join('');
            document.getElementById('ciso-deferred-tbody').innerHTML = deferredRows;
        }

        // ============================================================
        // DECISION AUDIT LOG MODAL CONTROLLER
        // ============================================================
        function openDecisionLogModal() {
            if (!KNAPSACK_DATA || !KNAPSACK_DATA.selected_controls) return;

            // Populate summary metrics
            document.getElementById('audit-status').textContent = KNAPSACK_DATA.status || 'Optimal';
            document.getElementById('audit-time').textContent = `${(KNAPSACK_DATA.solver_time_seconds || 0).toFixed(4)}s`;
            document.getElementById('audit-budget').textContent = `₹${KNAPSACK_DATA.total_cost}L / ₹${KNAPSACK_DATA.budget}L`;
            document.getElementById('audit-risk').textContent = `₹${KNAPSACK_DATA.total_risk_reduction}L`;

            const container = document.getElementById('audit-log-stream');
            const now = new Date();

            container.innerHTML = KNAPSACK_DATA.selected_controls.map((control, index) => {
                const logTime = new Date(now.getTime() - (KNAPSACK_DATA.selected_controls.length - index) * 120).toLocaleString('en-US', {
                    month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
                });
                
                const assetMatch = control.name.match(/AST-\d{4}/);
                const assetTag = assetMatch ? assetMatch[0] : 'PERIMETER';

                return `
                    <div class="p-3 rounded-lg bg-[#050508] border border-white/5 font-mono text-[12px] leading-relaxed space-y-1 text-gray-300">
                        <div><span class="text-gray-500">(${logTime})</span> <span class="text-white font-semibold">TASK_INGESTION</span> : data_ingestion/telemetry_parser.py -> Ingested finding ${control.id} for asset ${assetTag} (${control.category}).</div>
                        <div><span class="text-gray-500">(${logTime})</span> <span class="text-white font-semibold">MONTE_CARLO_ENGINE</span> : solver/monte_carlo.py -> Simulated probabilistic loss distribution; quantified expected risk reduction at ₹${control.risk_reduction}L.</div>
                        <div><span class="text-gray-500">(${logTime})</span> <span class="text-white font-semibold">KNAPSACK_ILP_SOLVER</span> : solver/solver.py -> Evaluated finding ID ${control.id} with CapEx cost ₹${control.cost}L and efficiency ${(control.efficiency || 0).toFixed(2)}x under budget constraint. Assignment: SELECTED [x_${index}=1].</div>
                    </div>
                `;
            }).join('');

            document.getElementById('modal-decision-log').classList.remove('hidden');
        }

        function closeDecisionLogModal() {
            document.getElementById('modal-decision-log').classList.add('hidden');
        }

        // Close modal when clicking on backdrop
        window.addEventListener('DOMContentLoaded', () => {
            const modalEl = document.getElementById('modal-decision-log');
            if(modalEl) {
                modalEl.addEventListener('click', (e) => {
                    if (e.target.id === 'modal-decision-log') closeDecisionLogModal();
                });
            }
        });

        // ============================================================
        // HOME PAGE: Scroll-triggered light-mode navbar
        // ============================================================
        const solutionSection = document.getElementById('section-solution');
        window.addEventListener('scroll', () => {
            if (document.getElementById('view-home').classList.contains('view-hidden')) return;
            if (!solutionSection) return;
            const rect = solutionSection.getBoundingClientRect();
            if (rect.top < window.innerHeight * 0.4) {
                document.body.classList.add('is-light');
            } else {
                document.body.classList.remove('is-light');
            }
        });

        // ============================================================
        // TERMINAL SIMULATION 
        // ============================================================
        const terminalOutput = document.getElementById('terminal-output');
        const logs = [
            "<div class='text-gray-500'>>> Polling agent status...</div>",
            "<div class='text-gray-300'>All 100+ agents actively monitoring parameters.</div>",
            "<div class='text-qviolet mt-2'>>> Re-calculating risk matrix based on patch status.</div>",
            "<div class='text-qemerald'>Delta: Risk exposure reduced by $45,000.</div>",
            "<div class='text-gray-500 mt-2'>Syncing state to database... [OK]</div>"
        ];
        let logIndex = 0;
        setInterval(() => {
            if (!document.getElementById('view-terminal').classList.contains('view-hidden')) {
                if (logIndex < logs.length) {
                    terminalOutput.innerHTML += logs[logIndex];
                    terminalOutput.scrollTop = terminalOutput.scrollHeight;
                    logIndex++;
                } else {
                    logIndex = 0;
                }
            }
        }, 3000);

        // ============================================================
        // NAVBAR SLIDE ON SCROLL
        // ============================================================
        const navWrapper = document.getElementById('main-nav-wrapper');
        let lastScrollY = window.scrollY;
        window.addEventListener('scroll', () => {
            const y = window.scrollY;
            if (y < 150) navWrapper.style.transform = 'translateY(0)';
            else if (y > lastScrollY) navWrapper.style.transform = 'translateY(-150px)';
            else navWrapper.style.transform = 'translateY(0)';
            lastScrollY = y;
        });

        // ============================================================
        // Re-render charts on window resize
        // ============================================================
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                if (!document.getElementById('view-cfo-dashboard').classList.contains('view-hidden')) {
                    initCfoDashboard();
                }
                if (!document.getElementById('view-ciso-dashboard').classList.contains('view-hidden')) {
                    initCisoDashboard();
                }
            }, 200);
        });
   