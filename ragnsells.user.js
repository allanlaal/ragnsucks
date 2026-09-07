// ==UserScript==
// @name         Extract Active Viitenumbers to Maksa Kõik
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Display all active Viitenumber values as comma-separated list under "Maksa kõik"
// @match        https://*/*
// @grant        none
// ==/Script==

(function() {
    'use strict';

    function processViitenumbers() {
        // Find the "Maksa kõik" button/element (case-insensitive text match)
        const allButtons = Array.from(document.querySelectorAll('button, a, input[type="button"], input[type="submit"]'));
        const maksaKoikBtn = allButtons.find(el => el.textContent.trim().toLowerCase().includes('maksa kõik'));

        if (!maksaKoikBtn) return;

        // Collect reference numbers from table rows containing a "maksa arve" button
        const viitenumbers = [];
        const rows = document.querySelectorAll('tr');

        rows.forEach(row => {
            const hasPaymentBtn = Array.from(row.querySelectorAll('button, a, input')).some(el => 
                el.textContent.trim().toLowerCase().includes('maksa arve')
            );

            if (hasPaymentBtn) {
                // Adjust selector or index if 'Viitenumber' is always in a specific column/class
                const cells = row.querySelectorAll('td');
                cells.forEach(cell => {
                    const text = cell.textContent.trim();
                    // Matches typical Estonian reference number formats (digits only, 2 to 20 chars)
                    if (/^\d{2,20}$/.test(text.replace(/\s+/g, ''))) {
                        viitenumbers.push(text.replace(/\s+/g, ''));
                    }
                });
            }
        });

        if (viitenumbers.length === 0) return;

        // Container below "Maksa kõik"
        let container = document.getElementById('viitenumber-summary-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'viitenumber-summary-container';
            container.style.marginTop = '8px';
            container.style.fontSize = '12px';
            container.style.fontFamily = 'monospace';
            container.style.color = '#333';
            container.style.wordBreak = 'break-all';

            maksaKoikBtn.parentNode.insertBefore(container, maksaKoikBtn.nextSibling);
        }

        container.textContent = viitenumbers.join(',');
    }

    // Run on load and observe dynamic DOM changes
    window.addEventListener('load', processViitenumbers);

    const observer = new MutationObserver(() => {
        processViitenumbers();
    });
    observer.observe(document.body, { childList: true, subtree: true });
})();
