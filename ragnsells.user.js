// ==UserScript==
// @name         Ragn-Sells Viitenumber Collector
// @namespace    https://github.com/allanlaal/ragnsucks
// @version      1.1
// @description  Extract active Viitenumbers and display them under Maksa Kõik
// @author       Allan Laal
// @match        https://*.ragnsells.ee/*
// @downloadURL  https://github.com/allanlaal/ragnsucks/ragnsells.user.js
// @updateURL    https://github.com/allanlaal/ragnsucks/ragnsells.user.js
// @grant        none
// ==/Script==

(function() {
    'use strict';

    function extractViitenumbers() {
        // Find the "Maksa kõik" trigger element
        const allClickables = Array.from(document.querySelectorAll('button, a, input[type="button"], input[type="submit"], div, span'));
        const maksaKoikBtn = allClickables.find(el => {
            const txt = el.textContent.trim().toLowerCase();
            return txt === 'maksa kõik' || txt === 'maksa kõik arved';
        });

        if (!maksaKoikBtn) return;

        const viitenumbers = [];

        // Scan tables for headers matching "Viitenumber" and "Maksa arve" / actions
        const tables = document.querySelectorAll('table');

        tables.forEach(table => {
            const headers = Array.from(table.querySelectorAll('th'));
            if (headers.length === 0) return;

            let viiteColIdx = -1;
            let actionColIdx = -1;

            headers.forEach((th, idx) => {
                const text = th.textContent.trim().toLowerCase();
                if (text.includes('viitenumber') || text.includes('viitenr')) {
                    viiteColIdx = idx;
                }
                if (text.includes('maksa') || text.includes('tegevus') || text.includes('toiming')) {
                    actionColIdx = idx;
                }
            });

            const rows = table.querySelectorAll('tbody tr');

            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length === 0) return;

                // Check if row has an active "Maksa arve" button/link
                let hasActivePaymentBtn = false;

                if (actionColIdx !== -1 && cells[actionColIdx]) {
                    hasActivePaymentBtn = Array.from(cells[actionColIdx].querySelectorAll('a, button, input')).some(el => 
                        el.textContent.trim().toLowerCase().includes('maksa')
                    );
                } else {
                    // Fallback across the entire row
                    hasActivePaymentBtn = Array.from(row.querySelectorAll('a, button, input')).some(el => 
                        el.textContent.trim().toLowerCase().includes('maksa arve')
                    );
                }

                if (hasActivePaymentBtn) {
                    let refNum = '';

                    if (viiteColIdx !== -1 && cells[viiteColIdx]) {
                        refNum = cells[viiteColIdx].textContent.trim();
                    } else {
                        // Fallback: search row cells for numeric reference number pattern
                        cells.forEach(cell => {
                            const val = cell.textContent.trim().replace(/\s+/g, '');
                            if (/^\d{2,20}$/.test(val)) {
                                refNum = val;
                            }
                        });
                    }

                    refNum = refNum.replace(/\s+/g, '');
                    if (refNum && /^\d+$/.test(refNum)) {
                        viitenumbers.push(refNum);
                    }
                }
            });
        });

        if (viitenumbers.length === 0) return;

        // Render summary output container right under "Maksa kõik"
        let container = document.getElementById('ragnsells-viited-summary');
        if (!container) {
            container = document.createElement('div');
            container.id = 'ragnsells-viited-summary';
            container.style.cssText = 'margin-top: 6px; font-size: 13px; font-weight: bold; font-family: monospace; color: #111; background: #fff3cd; padding: 4px 8px; border: 1px solid #ffeeba; border-radius: 4px; word-break: break-all; display: block;';
            
            maksaKoikBtn.parentNode.insertBefore(container, maksaKoikBtn.nextSibling);
        }

        container.textContent = viitenumbers.join(',');
    }

    // Debounced dynamic observer execution
    let timeout = null;
    const observer = new MutationObserver(() => {
        clearTimeout(timeout);
        timeout = setTimeout(extractViitenumbers, 200);
    });

    window.addEventListener('load', extractViitenumbers);
    observer.observe(document.body, { childList: true, subtree: true });
    extractViitenumbers();
})();
