// ==UserScript==
// @name         Ragn-Sells Viitenumber Collector
// @namespace    https://github.com/allanlaal/ragnsucks
// @version      1.8
// @description  Automatically render active Viitenumbers from Tasumata arved under Maksa kõik
// @author       Allan Laal
// @match        https://www.ragnsells.ee/iseteenindus/*
// @match        https://*.ragnsells.ee/*
// @downloadURL  https://raw.githubusercontent.com/allanlaal/ragnsucks/refs/heads/master/ragnsells.user.js
// @updateURL    https://raw.githubusercontent.com/allanlaal/ragnsucks/refs/heads/master/ragnsells.user.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Deep recursive selector to pierce Web Components / Shadow DOM
    function querySelectorAllShadow(selector, root = document) {
        let results = Array.from(root.querySelectorAll(selector));
        const pushChildren = (node) => {
            if (node.shadowRoot) {
                results = results.concat(Array.from(node.shadowRoot.querySelectorAll(selector)));
                node.shadowRoot.querySelectorAll('*').forEach(pushChildren);
            }
        };
        root.querySelectorAll('*').forEach(pushChildren);
        return results;
    }

    // Estonian 7-3-1 Reference Number Checksum Validator
    function isValidEstonianRefNumber(refStr) {
        const clean = refStr.replace(/\s+/g, '');
        if (!/^\d{3,20}$/.test(clean)) return false;

        const weights = [7, 3, 1];
        const digits = clean.split('').map(Number);
        const checkDigit = digits.pop();

        let sum = 0;
        let wIdx = 0;
        for (let i = digits.length - 1; i >= 0; i--) {
            sum += digits[i] * weights[wIdx % 3];
            wIdx++;
        }

        const calculatedCheck = (10 - (sum % 10)) % 10;
        return checkDigit === calculatedCheck;
    }

    function collectViitenumbers() {
        const viited = new Set();

        // 1. Locate the "Tasumata arved" section header
        const allElements = querySelectorAllShadow('*');
        const sectionHeader = allElements.find(el => {
            const txt = (el.textContent || '').trim().toLowerCase();
            return (txt === 'tasumata arved' || txt === 'tasutamata arved' || txt.includes('tasumata arved')) && el.children.length === 0;
        });

        // Search scope: Section container or fallback to full document
        const scope = sectionHeader ? (sectionHeader.closest('section, article, div.card, div.block, div') || document) : document;

        // 2. Locate rows inside the unpaid invoices scope
        const rows = querySelectorAllShadow('tr, [role="row"], .table-row, .grid-row, div', scope);

        rows.forEach(row => {
            if (row.children && row.children.length > 12) return;

            // Skip header rows
            const isHeader = row.querySelector('th') || (row.className && row.className.includes('header'));
            if (isHeader) return;

            // Scan cells for valid 7-3-1 reference numbers
            const cells = Array.from(row.querySelectorAll('td, [role="cell"], div, span'));
            cells.forEach(cell => {
                const text = (cell.textContent || '').trim().replace(/\s+/g, '');
                if (isValidEstonianRefNumber(text)) {
                    viited.add(text);
                }
            });
        });

        return Array.from(viited);
    }

    function autoDisplayViitenumbers() {
        // Find the "Maksa kõik" trigger element
        const allClickables = querySelectorAllShadow('button, a, input, div, span');
        const maksaKoikBtn = allClickables.find(el => {
            const t = (el.textContent || '').trim().toLowerCase();
            return (t === 'maksa kõik' || t === 'maksa kõik arved' || t.includes('maksa kõik')) && el.children.length < 2;
        });

        if (!maksaKoikBtn) return;

        const parent = maksaKoikBtn.parentElement || maksaKoikBtn.parentNode;

        // Get or create the output container directly below "Maksa kõik"
        let summaryBox = document.getElementById('rs-viited-summary-box');
        if (!summaryBox) {
            summaryBox = document.createElement('div');
            summaryBox.id = 'rs-viited-summary-box';
            summaryBox.style.cssText = `
                margin-top: 10px;
                padding: 8px 12px;
                background-color: #fff3cd;
                border: 1px solid #ffeeba;
                border-radius: 4px;
                font-family: monospace;
                font-size: 13px;
                font-weight: bold;
                color: #856404;
                word-break: break-all;
                display: block;
                clear: both;
            `;
            parent.appendChild(summaryBox);
        }

        const numbers = collectViitenumbers();

        if (numbers.length > 0) {
            summaryBox.textContent = numbers.join(',');
            summaryBox.style.display = 'block';
        } else {
            summaryBox.style.display = 'none';
        }
    }

    // Continuous polling for dynamic SPA rendering
    setInterval(autoDisplayViitenumbers, 1000);
})();
