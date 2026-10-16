// Theme toggle functionality
function initThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;
    const body = document.body;

    const moonIcon = themeToggle.querySelector('.icon-moon');
    const sunIcon = themeToggle.querySelector('.icon-sun');

    function applyTheme(isDark) {
        if (isDark) {
            body.classList.add('dark-mode');
        } else {
            body.classList.remove('dark-mode');
        }
        if (moonIcon) moonIcon.style.display = isDark ? 'none' : 'block';
        if (sunIcon)  sunIcon.style.display  = isDark ? 'block' : 'none';
    }

    // Load saved theme
    const savedTheme = localStorage.getItem('theme');
    applyTheme(savedTheme === 'dark');

    themeToggle.addEventListener('click', () => {
        const isDark = !body.classList.contains('dark-mode');
        applyTheme(isDark);
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
}
// Safe non-breaking zero-width invisible characters
// STRICT EXCLUSION OF \u200B AND \u200C:
// 1. \u200B (Zero-Width Space) has line-break class ZW in Unicode UAX #14. Word processors (MS Word, Google Docs)
//    and layout engines treat \u200B as an explicit line-break opportunity, wrapping words in half at the end of a line
//    (e.g., "ba" on one line, "nking" on the next line).
// 2. \u200C (Zero-Width Non-Joiner) splits morphological word stems in spell checkers, triggering incorrect spellings.
// 3. \u2060 (Word Joiner, WJ) has line-break class WJ (Rule LB11: prohibit line break before and after).
//    It is 100% invisible and GUARANTEES that words are never split or broken across lines at margins.
const invisibleChars = ['\u2060'];
const allDetectableInvisibleChars = ['\u200B', '\u200C', '\u200D', '\u2060', '\uFEFF'];

// Text statistics calculation
function calculateStats(text) {
    const characters = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
    const sentences = text.trim() ? text.split(/[.!?]+/).filter(s => s.trim()).length : 0;
    let invisibleCount = 0;
    for (let i = 0; i < text.length; i++) {
        if (allDetectableInvisibleChars.includes(text[i])) invisibleCount++;
    }
    return { characters, words, sentences, invisibleCount };
}

// Update stats display
function updateStats(text, statsElement) {
    if (!statsElement) return;
    const stats = calculateStats(text);
    let html = `Characters: ${stats.characters.toLocaleString()} | Words: ${stats.words.toLocaleString()} | Sentences: ${stats.sentences.toLocaleString()}`;
    if (stats.invisibleCount > 0) {
        html += ` | <span style="color: var(--brand-primary, #10b981); font-weight: 600;">Invisible Bytes: ${stats.invisibleCount.toLocaleString()}</span>`;
    }
    statsElement.innerHTML = html;
}

/* Upgraded Refining Engine */

const linguisticRules = {
    "in conclusion": ["ultimately", "in essence", "all in all", "to sum up", "in the final analysis"],
    "moreover": ["furthermore", "additionally", "what is more", "alongside this"],
    "therefore": ["consequently", "as a result", "thus", "hence"],
    "consequently": ["as a result", "therefore", "thus", "hence"],
    "delve": ["explore", "investigate", "go into", "examine", "analyze"],
    "delving": ["exploring", "investigating", "examining", "analyzing"],
    "testament": ["tribute", "proof", "demonstration", "evidence", "witness"],
    "pivotal": ["critical", "crucial", "vital", "essential", "significant"],
    "meticulously": ["carefully", "thoroughly", "precisely", "conscientiously"],
    "landscape": ["environment", "arena", "sector", "domain", "realm"],
    "utilize": ["use", "employ", "exploit", "apply"],
    "utilizing": ["using", "employing", "exploiting", "applying"],
    "not only": ["both", "as well as"],
    "good": ["excellent", "great", "positive", "fine", "superb"],
    "bad": ["poor", "unfavorable", "terrible", "adverse", "awful"],
    "big": ["large", "huge", "enormous", "massive", "substantial"],
    "small": ["tiny", "little", "compact", "miniature", "minor"],
    "fast": ["quick", "rapid", "swift", "speedy", "efficient"],
    "slow": ["sluggish", "lethargic", "delayed", "gradual"],
    "happy": ["joyful", "cheerful", "delighted", "pleased", "content"],
    "sad": ["unhappy", "sorrowful", "gloomy", "depressed", "heavy-hearted"],
    "very": ["exceptionally", "highly", "significantly", "extremely", "remarkably"],
    "important": ["critical", "vital", "crucial", "essential", "significant"],
    "ensure": ["guarantee", "verify", "secure", "confirm"],
    "provide": ["offer", "furnish", "supply", "give"],
    "firstly": ["first", "initially", "to begin with", "first and foremost"],
    "secondly": ["second", "furthermore", "in addition"],
    "thirdly": ["third", "subsequently", "next"],
    "finally": ["lastly", "in the end", "ultimately"]
};

const homoglyphs = {
    'a': '\u0430', // Cyrillic small a
    'c': '\u0441', // Cyrillic small es
    'e': '\u0435', // Cyrillic small ie
    'i': '\u0456', // Cyrillic small Ukrainian i
    'j': '\u0458', // Cyrillic small je
    'o': '\u043e', // Cyrillic small o
    'p': '\u0440', // Cyrillic small er
    's': '\u0455', // Cyrillic small dze
    'x': '\u0445', // Cyrillic small ha
    'y': '\u0443', // Cyrillic small u
    'A': '\u0410', // Cyrillic capital a
    'B': '\u0412', // Cyrillic capital ve
    'C': '\u0421', // Cyrillic capital es
    'E': '\u0415', // Cyrillic capital ie
    'H': '\u041d', // Cyrillic capital en
    'I': '\u0406', // Cyrillic capital Ukrainian i
    'J': '\u0408', // Cyrillic capital je
    'K': '\u041a', // Cyrillic capital ka
    'M': '\u041c', // Cyrillic capital em
    'O': '\u041e', // Cyrillic capital o
    'P': '\u0420', // Cyrillic capital er
    'T': '\u0422', // Cyrillic capital te
    'X': '\u0425', // Cyrillic capital ha
    'Y': '\u0423'  // Cyrillic capital u
};

let currentSegments = []; // Array of { type: 'text'|'replaced', original: string, current: string, options: string[] }
let activeTooltip = null;

// Case matching helper
function matchCase(original, replacement) {
    if (!original || !replacement) return replacement;
    if (original.length > 1 && original === original.toUpperCase()) {
        return replacement.toUpperCase();
    }
    if (original[0] === original[0].toUpperCase()) {
        return replacement.charAt(0).toUpperCase() + replacement.slice(1);
    }
    return replacement.toLowerCase();
}

// Visual homoglyph utility
function hasHomoglyph(text) {
    for (let char of text) {
        if (Object.values(homoglyphs).includes(char)) return true;
    }
    return false;
}

// Inject obfuscation into characters
function applyObfuscation(text, homoglyphToggle, homoglyphStrength, invisibleToggle, invisibleStrength) {
    if (!text) return '';
    let result = '';
    
    for (let i = 0; i < text.length; i++) {
        let char = text[i];
        const origChar = char;
        if (homoglyphToggle && homoglyphs[origChar] !== undefined) {
            if (Math.random() < (homoglyphStrength / 100)) {
                char = homoglyphs[origChar];
            }
        }
        result += char;
        
        // Inject non-breaking invisible characters strictly between alphanumeric letters.
        // Uses \u2060 (Word Joiner) to GUARANTEE words are never broken across line ends at margins!
        if (invisibleToggle && i < text.length - 1) {
            const nextChar = text[i + 1];
            if (/[a-zA-Z0-9]/.test(origChar) && /[a-zA-Z0-9]/.test(nextChar)) {
                if (Math.random() < (invisibleStrength / 100)) {
                    result += invisibleChars[Math.floor(Math.random() * invisibleChars.length)];
                }
            }
        }
    }
    return result;
}

// Render the interactive synonym output preview
function renderPreview() {
    const previewEl = document.getElementById('output-preview');
    if (!previewEl) return;
    
    const homoglyphToggle = document.getElementById('homoglyph-toggle').checked;
    const homoglyphStrength = parseFloat(document.getElementById('homoglyph-strength').value);
    const invisibleToggle = document.getElementById('invisible-toggle').checked;
    const invisibleStrength = parseFloat(document.getElementById('invisible-strength').value);
    
    previewEl.innerHTML = '';
    
    currentSegments.forEach((segment, idx) => {
        if (segment.type === 'replaced') {
            const span = document.createElement('span');
            span.className = 'interactive-word';
            span.dataset.index = idx;
            
            const obfuscatedText = applyObfuscation(segment.current, homoglyphToggle, homoglyphStrength, invisibleToggle, invisibleStrength);
            span.textContent = obfuscatedText;
            
            if (homoglyphToggle && hasHomoglyph(obfuscatedText)) {
                span.classList.add('homoglyph-marked');
            }
            
            span.addEventListener('click', (e) => {
                showSynonymTooltip(span, idx);
                e.stopPropagation();
            });
            
            previewEl.appendChild(span);
        } else {
            const obfuscatedText = applyObfuscation(segment.current, homoglyphToggle, homoglyphStrength, invisibleToggle, invisibleStrength);
            previewEl.appendChild(document.createTextNode(obfuscatedText));
        }
    });
    
    syncTextarea();
}

// Synchronize output content
function syncTextarea() {
    const outputText = document.getElementById('output-text');
    if (outputText) {
        outputText.value = getRawProcessedText();
    }
}

// Get flattened raw output text (with all obfuscations applied)
function getRawProcessedText() {
    const homoglyphToggle = document.getElementById('homoglyph-toggle').checked;
    const homoglyphStrength = parseFloat(document.getElementById('homoglyph-strength').value);
    const invisibleToggle = document.getElementById('invisible-toggle').checked;
    const invisibleStrength = parseFloat(document.getElementById('invisible-strength').value);
    
    return currentSegments.map(segment => {
        return applyObfuscation(segment.current, homoglyphToggle, homoglyphStrength, invisibleToggle, invisibleStrength);
    }).join('');
}

// Interactive synonyms picker tooltip
function showSynonymTooltip(element, index) {
    closeActiveTooltip();
    
    const segment = currentSegments[index];
    if (!segment) return;
    
    const tooltip = document.createElement('div');
    tooltip.className = 'synonym-tooltip';
    
    const header = document.createElement('div');
    header.className = 'tooltip-header';
    header.textContent = 'Alternative Phrasings';
    tooltip.appendChild(header);
    
    segment.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'synonym-option';
        btn.textContent = opt;
        
        if (opt.toLowerCase() === segment.current.toLowerCase()) {
            btn.classList.add('active');
        }
        
        if (opt.toLowerCase() === segment.original.toLowerCase()) {
            btn.classList.add('original-opt');
            btn.innerHTML = `${opt} <span style="font-size:0.75rem; opacity:0.6;">(original)</span>`;
        }
        
        btn.addEventListener('click', () => {
            segment.current = opt;
            renderPreview();
            updateStats(getRawProcessedText(), document.getElementById('output-stats'));
            const newScore = calculateAILikelihood(getRawProcessedText(), true);
            updateGauge(newScore);
            closeActiveTooltip();
        });
        
        tooltip.appendChild(btn);
    });
    
    document.body.appendChild(tooltip);
    activeTooltip = tooltip;
    
    const rect = element.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    
    let top = rect.bottom + window.scrollY + 8;
    let left = rect.left + window.scrollX;
    
    if (top + tooltipRect.height > window.innerHeight + window.scrollY) {
        top = rect.top + window.scrollY - tooltipRect.height - 8;
    }
    if (left + tooltipRect.width > window.innerWidth) {
        left = window.innerWidth - tooltipRect.width - 16;
    }
    
    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
}

function closeActiveTooltip() {
    if (activeTooltip) {
        activeTooltip.remove();
        activeTooltip = null;
    }
}

// Close tooltip on document clicks
window.addEventListener('click', (e) => {
    if (activeTooltip && !activeTooltip.contains(e.target) && !e.target.classList.contains('interactive-word')) {
        closeActiveTooltip();
    }
});

/* Quality Metrics & Gauge Analysis */

// Flesch Reading Ease
function calculateReadability(text) {
    if (!text.trim()) return { score: 0, grade: 'N/A', desc: 'Enter text to evaluate' };
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim()).length || 1;
    
    // Syllables estimation
    let syllables = 0;
    const wordsArray = text.toLowerCase().match(/\b[a-z]+\b/g) || [];
    wordsArray.forEach(w => {
        let count = 0;
        let vowels = 'aeiouy';
        for (let i = 0; i < w.length; i++) {
            if (vowels.includes(w[i])) {
                if (i === 0 || !vowels.includes(w[i - 1])) {
                    count++;
                }
            }
        }
        if (w.endsWith('e') && count > 1) count--;
        if (count === 0) count = 1;
        syllables += count;
    });
    
    if (words === 0) return { score: 100, grade: 'Easy', desc: 'Very short' };
    
    const score = 206.835 - (1.015 * (words / sentences)) - (84.6 * (syllables / words));
    const rounded = Math.round(Math.max(0, Math.min(100, score)));
    
    let desc = '';
    let grade = '';
    if (rounded >= 90) { grade = '5th Grade'; desc = 'Very easy. Conversation level.'; }
    else if (rounded >= 80) { grade = '6th Grade'; desc = 'Easy to read. Plain English.'; }
    else if (rounded >= 70) { grade = '7th Grade'; desc = 'Fairly easy to read.'; }
    else if (rounded >= 60) { grade = '8th-9th Grade'; desc = 'Standard English. Easily understood.'; }
    else if (rounded >= 50) { grade = 'High School'; desc = 'Fairly difficult to read.'; }
    else if (rounded >= 30) { grade = 'College'; desc = 'Difficult. Academic prose style.'; }
    else { grade = 'Post-Grad'; desc = 'Extremely difficult. Highly specialized.'; }
    
    return { score: rounded, grade, desc };
}

// Simulated AI Detection Score
function calculateAILikelihood(text, isProcessed) {
    if (!text.trim()) return 0;
    
    let score = 50;
    
    const aiVibeWords = ["delve", "testament", "pivotal", "meticulously", "landscape", "utilize", "furthermore", "moreover", "in conclusion", "ensure", "critical"];
    aiVibeWords.forEach(w => {
        const regex = new RegExp(`\\b${w}\\b`, 'gi');
        const matches = text.match(regex);
        if (matches) score += matches.length * 8;
    });
    
    const readability = calculateReadability(text);
    if (readability.score < 50) score += 15; // advanced
    if (readability.score > 80) score -= 10; // simple
    
    score = Math.max(10, Math.min(98, score));
    
    if (isProcessed) {
        const homoglyphToggle = document.getElementById('homoglyph-toggle').checked;
        const homoglyphStrength = parseFloat(document.getElementById('homoglyph-strength').value);
        const invisibleToggle = document.getElementById('invisible-toggle').checked;
        const invisibleStrength = parseFloat(document.getElementById('invisible-strength').value);
        
        let reduction = 0;
        if (homoglyphToggle) reduction += homoglyphStrength * 0.45;
        if (invisibleToggle) reduction += invisibleStrength * 0.5;
        
        const mode = document.querySelector('.tab.active').getAttribute('data-mode');
        if (mode === 'plagiarism') reduction += 12;
        
        score -= reduction;
        score = Math.max(2, Math.min(95, Math.round(score)));
    }
    
    return score;
}

// Update Gauge Dashboard Card
function updateGauge(percentage) {
    const fill = document.getElementById('gauge-fill');
    const text = document.getElementById('gauge-text');
    const status = document.getElementById('ai-status');
    const desc = document.getElementById('ai-status-desc');
    
    if (!fill || !text || !status || !desc) return;
    
    const offset = 226 - (226 * percentage / 100);
    fill.style.strokeDashoffset = offset;
    text.textContent = `${percentage}%`;
    
    fill.classList.remove('safe', 'warning');
    
    if (percentage > 70) {
        status.textContent = "High Risk";
        status.style.color = "#ef4444";
        desc.textContent = "Likely flagged by AI checkers";
    } else if (percentage > 30) {
        fill.classList.add('warning');
        status.textContent = "Moderate";
        status.style.color = "#f59e0b";
        desc.textContent = "Potential AI style markers";
    } else {
        fill.classList.add('safe');
        status.textContent = "Human Grade";
        status.style.color = "#10b981";
        desc.textContent = "Securely bypasses analysis";
    }
}

/* Comparison View & Diff Highlighter */

// Longest Common Subsequence Diff Engine
function computeWordDiff(original, processed) {
    const tokenize = (text) => text.split(/(\s+|[.,!?;:()\[\]{}""''])/g).filter(Boolean);
    const origTokens = tokenize(original);
    const procTokens = tokenize(processed);

    const m = origTokens.length;
    const n = procTokens.length;
    const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (origTokens[i - 1] === procTokens[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }

    let i = m, j = n;
    const diff = [];

    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && origTokens[i - 1] === procTokens[j - 1]) {
            diff.push({ type: 'equal', text: origTokens[i - 1] });
            i--;
            j--;
        } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
            diff.push({ type: 'insert', text: procTokens[j - 1] });
            j--;
        } else {
            diff.push({ type: 'delete', text: origTokens[i - 1] });
            i--;
        }
    }

    return diff.reverse();
}

// Compare modal display
function initCompareModal() {
    const compareBtn = document.getElementById('compare-btn');
    const modal = document.getElementById('compare-modal');
    if (!compareBtn || !modal) return;
    
    const closeBtn = modal.querySelector('.close');

    compareBtn.addEventListener('click', () => {
        const originalText = document.getElementById('input-text').value;
        const processedText = getRawProcessedText();

        document.getElementById('compare-original-text').textContent = originalText;
        
        // Compute and highlight diffs in processed viewport
        const diffs = computeWordDiff(originalText, processedText);
        const processedContainer = document.getElementById('compare-processed-text');
        processedContainer.innerHTML = '';
        
        let insertedChars = 0;
        let deletedChars = 0;
        
        diffs.forEach(chunk => {
            if (chunk.type === 'equal') {
                processedContainer.appendChild(document.createTextNode(chunk.text));
            } else if (chunk.type === 'insert') {
                const span = document.createElement('span');
                span.className = 'diff-insert';
                span.textContent = chunk.text;
                processedContainer.appendChild(span);
                insertedChars += chunk.text.length;
            } else {
                const span = document.createElement('span');
                span.className = 'diff-delete';
                span.textContent = chunk.text;
                processedContainer.appendChild(span);
                deletedChars += chunk.text.length;
            }
        });

        // Obfuscation and Byte difference summary
        const originalBytes = new TextEncoder().encode(originalText);
        const processedBytes = new TextEncoder().encode(processedText);
        
        const diffInfo = `Original Size: ${originalBytes.length} bytes | Processed Size: ${processedBytes.length} bytes\n` +
                         `Linguistic Adjustments: +${insertedChars} chars inserted, -${deletedChars} chars redacted.\n` +
                         `Net Density Shift: ${processedBytes.length - originalBytes.length} bytes.`;
                         
        document.getElementById('diff-info').innerHTML = diffInfo.replace(/\n/g, '<br>');

        modal.classList.add('show');
    });

    closeBtn.addEventListener('click', () => {
        modal.classList.remove('show');
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });
}

// File format states
let uploadedFileType = 'txt';
let uploadedFileName = 'refined_text';
let uploadedDocxArrayBuffer = null; // Store original .docx binary for format-preserving download

// File Upload
function initFileUpload() {
    const uploadBtn = document.getElementById('upload-btn');
    const fileInput = document.getElementById('file-upload');
    const inputText = document.getElementById('input-text');

    if (uploadBtn && fileInput && inputText) {
        uploadBtn.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const dotIndex = file.name.lastIndexOf('.');
                uploadedFileName = dotIndex > 0 ? file.name.substring(0, dotIndex) : file.name;

                if (file.name.endsWith('.txt')) {
                    uploadedFileType = 'txt';
                    uploadedDocxArrayBuffer = null;
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        inputText.value = e.target.result;
                        inputText.dispatchEvent(new Event('input'));
                    };
                    reader.readAsText(file);
                } else if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
                    uploadedFileType = 'docx';
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        // Store the original .docx binary for format-preserving download later
                        uploadedDocxArrayBuffer = e.target.result.slice(0);
                        mammoth.extractRawText({ arrayBuffer: e.target.result })
                            .then((result) => {
                                inputText.value = dehyphenateText(result.value);
                                inputText.dispatchEvent(new Event('input'));
                            })
                            .catch((err) => {
                                console.error('Error reading document:', err);
                                alert('Error extracting document file. Please upload a .txt file.');
                            });
                    };
                    reader.readAsArrayBuffer(file);
                } else {
                    alert('Format not supported. Please select a .txt, .doc, or .docx file.');
                }
            }
        });
    }
}

// Downloads
function downloadAsText(text, filename) {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/* ============================================================================
   Dehyphenation Engine - Fix broken words, soft hyphens & Unicode dashes
   ============================================================================ */
function dehyphenateText(text) {
    if (!text) return text;
    return text
        // Fix words broken with any dash/hyphen followed by newline and optional whitespace
        .replace(/([a-zA-Z0-9])[-‐‑‒–—\u00AD]\r?\n\s*([a-zA-Z0-9])/g, '$1$2')
        // Fix words with soft hyphen anywhere inside:
        .replace(/([a-zA-Z0-9])\u00AD+([a-zA-Z0-9])/g, '$1$2')
        // Fix PDF-style line wrap breaks with hyphen and multiple spaces:
        .replace(/([a-zA-Z0-9])[-‐‑‒–—]\s{2,}([a-zA-Z0-9])/g, '$1$2')
        // Clean out any rogue zero-width characters in text
        .replace(/[\u200B\u200C\u200D\u200E\u200F\u2060\uFEFF]/g, '');
}

// Helper to escape regex special characters
function escRx(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Case matching helper: preserves UPPERCASE, TitleCase, and lowercase
function matchCasePreserving(orig, repl) {
    if (!orig || !repl) return repl;
    if (orig.length > 1 && orig === orig.toUpperCase() && /[A-Z]/.test(orig)) {
        return repl.toUpperCase();
    }
    if (orig.charAt(0) === orig.charAt(0).toUpperCase() && /[A-Z]/.test(orig.charAt(0))) {
        return repl.charAt(0).toUpperCase() + repl.slice(1);
    }
    return repl.toLowerCase();
}

/* ==========================================================================
   Format-Preserving DOCX Processing Engine
   Heals broken paragraphs, repairs cross-run hyphens, and applies refinements
   directly into word/document.xml without UI freezing or cascading corruption
   ========================================================================== */

// Core XML Refinement Routine: Used both in Web Worker and in chunked main-thread processor
function applyRefinementsToDocumentXml(xmlDoc, replacements, obfuscationConfig) {
    const wNS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

    // ------------------------------------------------------------------------
    // Step 1: Heal paragraph breaks caused by line-break hyphens
    // If paragraph A ends with a hyphenated word (e.g. "INTE-") and paragraph B
    // begins with letters (e.g. "LLIGENT"), merge B into A and remove the hyphen!
    // ------------------------------------------------------------------------
    const paragraphs = Array.from(xmlDoc.getElementsByTagNameNS(wNS, 'p'));
    for (let p = 0; p < paragraphs.length - 1; p++) {
        const pNode = paragraphs[p];
        const nextPNode = paragraphs[p + 1];
        if (!pNode || !nextPNode || !pNode.parentNode || !nextPNode.parentNode) continue;

        const pTextNodes = pNode.getElementsByTagNameNS(wNS, 't');
        const nextPTextNodes = nextPNode.getElementsByTagNameNS(wNS, 't');
        if (pTextNodes.length === 0 || nextPTextNodes.length === 0) continue;

        const lastT = pTextNodes[pTextNodes.length - 1];
        const firstNextT = nextPTextNodes[0];

        if (lastT && firstNextT && lastT.textContent && firstNextT.textContent) {
            const lastTrimmed = lastT.textContent.trimEnd();
            const firstTrimmed = firstNextT.textContent.trimStart();

            // Check if lastT ends with a word letter + hyphen, and next starts with a word letter
            const hyphenMatch = lastTrimmed.match(/([a-zA-Z0-9])[-‐‑‒–—\u00AD]$/);
            const nextWordMatch = firstTrimmed.match(/^[a-zA-Z0-9]/);

            if (hyphenMatch && nextWordMatch) {
                // Remove the hyphen from the end of lastT
                lastT.textContent = lastT.textContent.replace(/[-‐‑‒–—\u00AD]\s*$/, '');

                // Move all run children of nextPNode into pNode
                const nextChildren = Array.from(nextPNode.childNodes);
                for (const child of nextChildren) {
                    if (child.nodeName !== 'w:pPr' && child.localName !== 'pPr') {
                        pNode.appendChild(child);
                    }
                }

                // Remove nextPNode from its parent
                nextPNode.parentNode.removeChild(nextPNode);

                // Re-evaluate current paragraph index since next was merged
                p--;
            }
        }
    }

    // ------------------------------------------------------------------------
    // Step 2: Cross-run hyphen repair within every paragraph
    // If run A ends with "word-" and run B begins with "part", remove the hyphen!
    // ------------------------------------------------------------------------
    const activeParagraphs = xmlDoc.getElementsByTagNameNS(wNS, 'p');
    for (let p = 0; p < activeParagraphs.length; p++) {
        const pNode = activeParagraphs[p];
        const pTextNodes = pNode.getElementsByTagNameNS(wNS, 't');
        for (let tn = 0; tn < pTextNodes.length - 1; tn++) {
            const curr = pTextNodes[tn];
            const next = pTextNodes[tn + 1];
            if (curr && next && curr.textContent && next.textContent) {
                const cMatch = curr.textContent.match(/([a-zA-Z0-9]+)[-‐‑‒–—\u00AD]$/);
                const nMatch = next.textContent.match(/^[a-zA-Z0-9]+/);
                if (cMatch && nMatch) {
                    curr.textContent = curr.textContent.replace(/[-‐‑‒–—\u00AD]$/, '');
                }
            }
        }
    }

    // ------------------------------------------------------------------------
    // Step 3: Prepare non-cascading replacement structures
    // ------------------------------------------------------------------------
    const phraseList = [];
    const wordQueues = {};

    for (let r = 0; r < replacements.length; r++) {
        const rep = replacements[r];
        if (!rep || !rep.from || !rep.to) continue;
        if (rep.from.indexOf(' ') !== -1) {
            phraseList.push({
                from: rep.from,
                to: rep.to,
                used: false
            });
        } else {
            const key = rep.from.toLowerCase();
            if (!wordQueues[key]) wordQueues[key] = [];
            wordQueues[key].push(rep);
        }
    }

    phraseList.sort((a, b) => b.from.length - a.from.length);

    // ------------------------------------------------------------------------
    // Step 4: Single-pass text node processing (clean, non-cascading, case-aware)
    // ------------------------------------------------------------------------
    // Helper: Ensure <w:noProof/> on run so Word never underlines obfuscated/refined words with red squiggles
    function ensureNoProofOnRun(textNode) {
        let rNode = textNode.parentNode;
        if (!rNode) return;
        while (rNode && rNode.localName !== 'r' && rNode.nodeName !== 'w:r' && rNode !== xmlDoc.documentElement) {
            rNode = rNode.parentNode;
        }
        if (!rNode || (rNode.localName !== 'r' && rNode.nodeName !== 'w:r')) return;

        let rPr = null;
        for (let c = 0; c < rNode.childNodes.length; c++) {
            const child = rNode.childNodes[c];
            if (child.localName === 'rPr' || child.nodeName === 'w:rPr') {
                rPr = child;
                break;
            }
        }
        if (!rPr) {
            rPr = xmlDoc.createElementNS(wNS, 'w:rPr');
            if (rNode.firstChild) {
                rNode.insertBefore(rPr, rNode.firstChild);
            } else {
                rNode.appendChild(rPr);
            }
        }
        let hasNoProof = false;
        for (let c = 0; c < rPr.childNodes.length; c++) {
            const child = rPr.childNodes[c];
            if (child.localName === 'noProof' || child.nodeName === 'w:noProof') {
                hasNoProof = true;
                break;
            }
        }
        if (!hasNoProof) {
            const noProof = xmlDoc.createElementNS(wNS, 'w:noProof');
            rPr.appendChild(noProof);
        }
    }

    const textNodes = xmlDoc.getElementsByTagNameNS(wNS, 't');

    for (let i = 0; i < textNodes.length; i++) {
        const node = textNodes[i];
        let text = node.textContent;
        if (!text) continue;

        const originalText = text;

        // Clean out dirty directional control codes, soft hyphens, and any old zero-width breakable spaces
        text = text.replace(/[\u00AD\u200B\u200C\u200E\u200F\uFEFF]/g, '');

        // Within-node line-wrap hyphen repair (e.g. "manage-\r\nment")
        text = text.replace(/([a-zA-Z0-9])[-‐‑‒–—]\s*[\r\n]+\s*([a-zA-Z0-9])/g, '$1$2');

        // Clean out literal newlines or carriage returns inside <w:t> (Word invalidates them)
        text = text.replace(/[\r\n]+/g, ' ');

        // Apply multi-word phrase replacements
        for (let pi = 0; pi < phraseList.length; pi++) {
            const pr = phraseList[pi];
            if (pr.used) continue;
            const pRegex = new RegExp('\\b' + escRx(pr.from) + '\\b', 'i');
            if (pRegex.test(text)) {
                text = text.replace(pRegex, (matched) => {
                    pr.used = true;
                    return matchCasePreserving(matched, pr.to);
                });
            }
        }

        // Apply single-pass word replacements
        // Each word is checked once in linear order; never cascades!
        text = text.replace(/\b([a-zA-Z0-9]+(?:'[a-zA-Z0-9]+)?)\b/g, (matchedWord) => {
            const lower = matchedWord.toLowerCase();
            const q = wordQueues[lower];
            if (q && q.length > 0) {
                const m = q.shift();
                return matchCasePreserving(matchedWord, m.to);
            }
            return matchedWord;
        });

        // Embed safe non-breaking invisible characters and homoglyphs according to user settings
        if (obfuscationConfig && (obfuscationConfig.invisibleToggle || obfuscationConfig.homoglyphToggle)) {
            text = applyObfuscation(
                text,
                obfuscationConfig.homoglyphToggle,
                obfuscationConfig.homoglyphStrength,
                obfuscationConfig.invisibleToggle,
                obfuscationConfig.invisibleStrength
            );
        }

        if (text !== originalText) {
            node.textContent = text;
        }

        // Suppress spelling error squiggles on modified/refined text runs in Microsoft Word
        ensureNoProofOnRun(node);

        // Ensure xml:space="preserve" so Word never strips spaces
        if (/^\s|\s$|\s{2,}/.test(node.textContent)) {
            node.setAttribute('xml:space', 'preserve');
        }
    }
}

// Worker function — defined here but only executed inside a Web Worker context via Blob URL
function docxWorkerFunction() {
    importScripts('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');

    // Strictly non-breaking Word Joiner \u2060 (prevents line-end word breaking in Word)
    var safeInvChars = ['\u2060'];

    function ensureNoProof(textNode, xmlDoc, wNS) {
        var rNode = textNode.parentNode;
        if (!rNode) return;
        while (rNode && rNode.localName !== 'r' && rNode.nodeName !== 'w:r' && rNode !== xmlDoc.documentElement) {
            rNode = rNode.parentNode;
        }
        if (!rNode || (rNode.localName !== 'r' && rNode.nodeName !== 'w:r')) return;

        var rPr = null;
        for (var c = 0; c < rNode.childNodes.length; c++) {
            var child = rNode.childNodes[c];
            if (child.localName === 'rPr' || child.nodeName === 'w:rPr') {
                rPr = child;
                break;
            }
        }
        if (!rPr) {
            rPr = xmlDoc.createElementNS(wNS, 'w:rPr');
            if (rNode.firstChild) {
                rNode.insertBefore(rPr, rNode.firstChild);
            } else {
                rNode.appendChild(rPr);
            }
        }
        var hasNoProof = false;
        for (var c = 0; c < rPr.childNodes.length; c++) {
            var child = rPr.childNodes[c];
            if (child.localName === 'noProof' || child.nodeName === 'w:noProof') {
                hasNoProof = true;
                break;
            }
        }
        if (!hasNoProof) {
            var noProof = xmlDoc.createElementNS(wNS, 'w:noProof');
            rPr.appendChild(noProof);
        }
    }

    function escRx(s) {
        return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function matchCase(orig, repl) {
        if (!orig || !repl) return repl;
        if (orig.length > 1 && orig === orig.toUpperCase() && /[A-Z]/.test(orig)) {
            return repl.toUpperCase();
        }
        if (orig.charAt(0) === orig.charAt(0).toUpperCase() && /[A-Z]/.test(orig.charAt(0))) {
            return repl.charAt(0).toUpperCase() + repl.slice(1);
        }
        return repl.toLowerCase();
    }

    self.onmessage = async function(e) {
        var data = e.data;
        var originalBuffer = data.originalBuffer;
        var replacements = data.replacements;
        var obfuscationConfig = data.obfuscationConfig;
        var homoglyphsMap = data.homoglyphs || {};

        try {
            self.postMessage({ type: 'progress', percent: 5, message: 'Opening document archive...' });
            var zip = await JSZip.loadAsync(originalBuffer);

            self.postMessage({ type: 'progress', percent: 20, message: 'Parsing document structure...' });
            var docXmlFile = zip.file('word/document.xml');

            if (docXmlFile) {
                var docXml = await docXmlFile.async('string');
                self.postMessage({ type: 'progress', percent: 35, message: 'Analyzing text nodes...' });

                var parser = new DOMParser();
                var xmlDoc = parser.parseFromString(docXml, 'application/xml');
                var wNS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

                self.postMessage({ type: 'progress', percent: 45, message: 'Repairing paragraph breaks and hyphens...' });

                // Step 1: Heal paragraph breaks caused by line-break hyphens
                var paragraphs = Array.from(xmlDoc.getElementsByTagNameNS(wNS, 'p'));
                for (var p = 0; p < paragraphs.length - 1; p++) {
                    var pNode = paragraphs[p];
                    var nextPNode = paragraphs[p + 1];
                    if (!pNode || !nextPNode || !pNode.parentNode || !nextPNode.parentNode) continue;

                    var pTextNodes = pNode.getElementsByTagNameNS(wNS, 't');
                    var nextPTextNodes = nextPNode.getElementsByTagNameNS(wNS, 't');
                    if (pTextNodes.length === 0 || nextPTextNodes.length === 0) continue;

                    var lastT = pTextNodes[pTextNodes.length - 1];
                    var firstNextT = nextPTextNodes[0];

                    if (lastT && firstNextT && lastT.textContent && firstNextT.textContent) {
                        var lastTrimmed = lastT.textContent.trimEnd();
                        var firstTrimmed = firstNextT.textContent.trimStart();

                        var hyphenMatch = lastTrimmed.match(/([a-zA-Z0-9])[-‐‑‒–—\u00AD]$/);
                        var nextWordMatch = firstTrimmed.match(/^[a-zA-Z0-9]/);

                        if (hyphenMatch && nextWordMatch) {
                            lastT.textContent = lastT.textContent.replace(/[-‐‑‒–—\u00AD]\s*$/, '');
                            var nextChildren = Array.from(nextPNode.childNodes);
                            for (var c = 0; c < nextChildren.length; c++) {
                                var child = nextChildren[c];
                                if (child.nodeName !== 'w:pPr' && child.localName !== 'pPr') {
                                    pNode.appendChild(child);
                                }
                            }
                            nextPNode.parentNode.removeChild(nextPNode);
                            p--;
                        }
                    }
                }

                // Step 2: Cross-run hyphen repair within paragraphs
                var activeParagraphs = xmlDoc.getElementsByTagNameNS(wNS, 'p');
                for (var ap = 0; ap < activeParagraphs.length; ap++) {
                    var aPNode = activeParagraphs[ap];
                    var aTextNodes = aPNode.getElementsByTagNameNS(wNS, 't');
                    for (var tn = 0; tn < aTextNodes.length - 1; tn++) {
                        var curr = aTextNodes[tn];
                        var next = aTextNodes[tn + 1];
                        if (curr && next && curr.textContent && next.textContent) {
                            var cMatch = curr.textContent.match(/([a-zA-Z0-9]+)[-‐‑‒–—\u00AD]$/);
                            var nMatch = next.textContent.match(/^[a-zA-Z0-9]+/);
                            if (cMatch && nMatch) {
                                curr.textContent = curr.textContent.replace(/[-‐‑‒–—\u00AD]$/, '');
                            }
                        }
                    }
                }

                self.postMessage({ type: 'progress', percent: 60, message: 'Applying refinements and invisible characters...' });

                // Step 3: Prepare replacement structures
                var phraseList = [];
                var wordQueues = {};

                for (var r = 0; r < replacements.length; r++) {
                    var rep = replacements[r];
                    if (!rep || !rep.from || !rep.to) continue;
                    if (rep.from.indexOf(' ') !== -1) {
                        phraseList.push({ from: rep.from, to: rep.to, used: false });
                    } else {
                        var key = rep.from.toLowerCase();
                        if (!wordQueues[key]) wordQueues[key] = [];
                        wordQueues[key].push(rep);
                    }
                }

                phraseList.sort(function(a, b) { return b.from.length - a.from.length; });

                // Step 4: Single-pass text node processing
                var textNodes = xmlDoc.getElementsByTagNameNS(wNS, 't');
                for (var i = 0; i < textNodes.length; i++) {
                    var node = textNodes[i];
                    var text = node.textContent;
                    if (!text) continue;

                    var originalText = text;
                    text = text.replace(/[\u00AD\u200B\u200C\u200E\u200F\uFEFF]/g, '');
                    text = text.replace(/([a-zA-Z0-9])[-‐‑‒–—]\s*[\r\n]+\s*([a-zA-Z0-9])/g, '$1$2');
                    text = text.replace(/[\r\n]+/g, ' ');

                    for (var pi = 0; pi < phraseList.length; pi++) {
                        var pr = phraseList[pi];
                        if (pr.used) continue;
                        var pRegex = new RegExp('\\b' + escRx(pr.from) + '\\b', 'i');
                        if (pRegex.test(text)) {
                            text = text.replace(pRegex, function(matched) {
                                pr.used = true;
                                return matchCase(matched, pr.to);
                            });
                        }
                    }

                    text = text.replace(/\b([a-zA-Z0-9]+(?:'[a-zA-Z0-9]+)?)\b/g, function(matchedWord) {
                        var lower = matchedWord.toLowerCase();
                        var q = wordQueues[lower];
                        if (q && q.length > 0) {
                            var m = q.shift();
                            return matchCase(matchedWord, m.to);
                        }
                        return matchedWord;
                    });

                    // Embed safe non-breaking invisible characters and homoglyphs into DOCX text
                    if (obfuscationConfig && (obfuscationConfig.invisibleToggle || obfuscationConfig.homoglyphToggle)) {
                        var obfResult = '';
                        for (var idx = 0; idx < text.length; idx++) {
                            var ch = text[idx];
                            if (obfuscationConfig.homoglyphToggle && homoglyphsMap[ch] !== undefined) {
                                if (Math.random() < (obfuscationConfig.homoglyphStrength / 100)) {
                                    ch = homoglyphsMap[ch];
                                }
                            }
                            obfResult += ch;
                            if (obfuscationConfig.invisibleToggle && idx < text.length - 1) {
                                var nextCh = text[idx + 1];
                                if (/[a-zA-Z0-9]/.test(ch) && /[a-zA-Z0-9]/.test(nextCh)) {
                                    if (Math.random() < (obfuscationConfig.invisibleStrength / 100)) {
                                        obfResult += safeInvChars[Math.floor(Math.random() * safeInvChars.length)];
                                    }
                                }
                            }
                        }
                        text = obfResult;
                    }

                    if (text !== originalText) {
                        node.textContent = text;
                    }

                    // Suppress Word spelling and grammar squiggles
                    ensureNoProof(node, xmlDoc, wNS);

                    if (/^\s|\s$|\s{2,}/.test(node.textContent)) {
                        node.setAttribute('xml:space', 'preserve');
                    }

                    if (i % 250 === 0 && textNodes.length > 0) {
                        var pct = 60 + Math.round((i / textNodes.length) * 18);
                        self.postMessage({ type: 'progress', percent: pct, message: 'Processing node ' + i + ' of ' + textNodes.length + '...' });
                    }
                }

                self.postMessage({ type: 'progress', percent: 80, message: 'Serializing document XML...' });
                var serializer = new XMLSerializer();
                zip.file('word/document.xml', serializer.serializeToString(xmlDoc));

                // Suppress Word spelling and grammar squiggles at document settings level
                try {
                    var settingsXmlFile = zip.file('word/settings.xml');
                    if (settingsXmlFile) {
                        var settingsXml = await settingsXmlFile.async('string');
                        var settingsDoc = parser.parseFromString(settingsXml, 'application/xml');
                        var rootSettings = settingsDoc.getElementsByTagNameNS(wNS, 'settings')[0] || settingsDoc.documentElement;
                        if (rootSettings) {
                            var hasHideSpell = false;
                            var hasHideGram = false;
                            for (var sc = 0; sc < rootSettings.childNodes.length; sc++) {
                                var scNode = rootSettings.childNodes[sc];
                                if (scNode.localName === 'hideSpellingErrors' || scNode.nodeName === 'w:hideSpellingErrors') hasHideSpell = true;
                                if (scNode.localName === 'hideGrammaticalErrors' || scNode.nodeName === 'w:hideGrammaticalErrors') hasHideGram = true;
                            }
                            if (!hasHideSpell) rootSettings.appendChild(settingsDoc.createElementNS(wNS, 'w:hideSpellingErrors'));
                            if (!hasHideGram) rootSettings.appendChild(settingsDoc.createElementNS(wNS, 'w:hideGrammaticalErrors'));
                            zip.file('word/settings.xml', serializer.serializeToString(settingsDoc));
                        }
                    } else {
                        zip.file('word/settings.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:settings xmlns:w="' + wNS + '"><w:hideSpellingErrors/><w:hideGrammaticalErrors/></w:settings>');
                    }
                } catch (sErr) {
                    // Non-fatal if settings.xml cannot be modified
                }
            }

            self.postMessage({ type: 'progress', percent: 88, message: 'Rebuilding document package...' });
            var blob = await zip.generateAsync({
                type: 'blob',
                mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                compression: 'DEFLATE',
                compressionOptions: { level: 6 }
            });

            self.postMessage({ type: 'progress', percent: 100, message: 'Complete!' });
            self.postMessage({ type: 'done', blob: blob });

        } catch (err) {
            self.postMessage({ type: 'error', message: err.message || String(err) });
        }
    };
}

/* Download Progress Overlay UI */

let downloadOverlayStylesInjected = false;

function injectDownloadOverlayStyles() {
    if (downloadOverlayStylesInjected) return;
    downloadOverlayStylesInjected = true;

    const style = document.createElement('style');
    style.textContent = `
        #download-overlay {
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0, 0, 0, 0.88);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            z-index: 100000;
            display: none;
            align-items: center;
            justify-content: center;
            transition: opacity 0.3s ease;
        }
        #download-overlay.active { display: flex; }
        .dl-overlay-card {
            background: var(--card-bg, #1a1a2e);
            border: 1px solid var(--border-color, #2a2a3e);
            border-radius: 20px;
            padding: 2.5rem 3rem;
            text-align: center;
            max-width: 440px;
            width: 90%;
            box-shadow: 0 24px 80px rgba(0, 0, 0, 0.6), 0 0 40px rgba(29, 185, 84, 0.08);
        }
        .dl-spinner {
            width: 52px; height: 52px;
            border: 3px solid rgba(255, 255, 255, 0.08);
            border-top-color: var(--brand-primary, #1db954);
            border-radius: 50%;
            animation: dl-spin 0.7s linear infinite;
            margin: 0 auto 1.5rem;
        }
        @keyframes dl-spin { to { transform: rotate(360deg); } }
        .dl-overlay-card h3 {
            color: var(--text-primary, #fff);
            font-family: 'Outfit', 'Inter', sans-serif;
            font-size: 1.35rem;
            font-weight: 700;
            margin: 0 0 0.4rem;
        }
        .dl-overlay-card .dl-msg {
            color: var(--text-secondary, #999);
            font-size: 0.88rem;
            margin: 0 0 1.4rem;
            min-height: 1.2em;
            transition: opacity 0.2s;
        }
        .dl-progress-track {
            width: 100%; height: 6px;
            background: var(--border-color, #2a2a3e);
            border-radius: 3px;
            overflow: hidden;
            margin-bottom: 0.6rem;
        }
        .dl-progress-fill {
            height: 100%;
            background: linear-gradient(90deg, var(--brand-primary, #1db954), #00e676);
            border-radius: 3px;
            width: 0%;
            transition: width 0.35s ease;
        }
        .dl-pct {
            color: var(--brand-primary, #1db954);
            font-size: 0.85rem;
            font-weight: 700;
            font-family: 'Inter', sans-serif;
        }
    `;
    document.head.appendChild(style);
}

function showDownloadOverlay() {
    injectDownloadOverlayStyles();

    let overlay = document.getElementById('download-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'download-overlay';
        overlay.innerHTML = `
            <div class="dl-overlay-card">
                <div class="dl-spinner"></div>
                <h3>Generating Document</h3>
                <p class="dl-msg" id="dl-progress-msg">Preparing...</p>
                <div class="dl-progress-track">
                    <div class="dl-progress-fill" id="dl-progress-fill"></div>
                </div>
                <span class="dl-pct" id="dl-progress-pct">0%</span>
            </div>
        `;
        document.body.appendChild(overlay);
    }
    overlay.classList.add('active');
}

function updateDownloadProgress(percent, message) {
    const msg = document.getElementById('dl-progress-msg');
    const fill = document.getElementById('dl-progress-fill');
    const pct = document.getElementById('dl-progress-pct');
    if (msg) msg.textContent = message;
    if (fill) fill.style.width = percent + '%';
    if (pct) pct.textContent = Math.round(percent) + '%';
}

function hideDownloadOverlay() {
    const overlay = document.getElementById('download-overlay');
    if (overlay) overlay.classList.remove('active');
}

/* Format-Preserving DOCX Download — Web Worker Pipeline */

async function downloadAsDocxPreserved(refinedText, filename) {
    if (!uploadedDocxArrayBuffer) {
        downloadAsDocxFallback(refinedText, filename);
        return;
    }

    // Build clean replacement list from currentSegments
    const replacements = [];
    for (const seg of currentSegments) {
        if (seg.type === 'replaced' && seg.original.toLowerCase() !== seg.current.toLowerCase()) {
            replacements.push({ from: seg.original, to: seg.current });
        }
    }

    const homoglyphToggle = document.getElementById('homoglyph-toggle') ? document.getElementById('homoglyph-toggle').checked : true;
    const homoglyphStrength = document.getElementById('homoglyph-strength') ? parseFloat(document.getElementById('homoglyph-strength').value) : 25;
    const invisibleToggle = document.getElementById('invisible-toggle') ? document.getElementById('invisible-toggle').checked : true;
    const invisibleStrength = document.getElementById('invisible-strength') ? parseFloat(document.getElementById('invisible-strength').value) : 30;

    const obfuscationConfig = {
        homoglyphToggle,
        homoglyphStrength,
        invisibleToggle,
        invisibleStrength
    };

    // Direct processing using native DOMParser and XMLSerializer with UI yielding
    await downloadAsDocxChunked(refinedText, filename, obfuscationConfig);
}

/* Chunked Main-Thread DOCX Engine — used on file:/// or as worker fallback */

async function downloadAsDocxChunked(refinedText, filename, obfuscationConfig) {
    if (!uploadedDocxArrayBuffer) {
        downloadAsDocxFallback(refinedText, filename);
        return;
    }

    if (!obfuscationConfig) {
        obfuscationConfig = {
            homoglyphToggle: document.getElementById('homoglyph-toggle') ? document.getElementById('homoglyph-toggle').checked : true,
            homoglyphStrength: document.getElementById('homoglyph-strength') ? parseFloat(document.getElementById('homoglyph-strength').value) : 25,
            invisibleToggle: document.getElementById('invisible-toggle') ? document.getElementById('invisible-toggle').checked : true,
            invisibleStrength: document.getElementById('invisible-strength') ? parseFloat(document.getElementById('invisible-strength').value) : 30
        };
    }

    showDownloadOverlay();
    updateDownloadProgress(5, 'Opening document archive...');

    const yieldToUI = () => new Promise(resolve => setTimeout(resolve, 0));

    try {
        await yieldToUI();
        const zip = await JSZip.loadAsync(uploadedDocxArrayBuffer);

        updateDownloadProgress(25, 'Parsing document structure...');
        await yieldToUI();

        const replacements = [];
        for (const seg of currentSegments) {
            if (seg.type === 'replaced' && seg.original.toLowerCase() !== seg.current.toLowerCase()) {
                replacements.push({ from: seg.original, to: seg.current });
            }
        }

        const docXmlFile = zip.file('word/document.xml');
        if (docXmlFile) {
            const docXml = await docXmlFile.async('string');
            await yieldToUI();

            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(docXml, 'application/xml');
            await yieldToUI();

            updateDownloadProgress(45, 'Healing paragraphs and applying AI-bypass encoding...');
            applyRefinementsToDocumentXml(xmlDoc, replacements, obfuscationConfig);
            await yieldToUI();

            updateDownloadProgress(78, 'Serializing document...');
            await yieldToUI();

            const serializer = new XMLSerializer();
            zip.file('word/document.xml', serializer.serializeToString(xmlDoc));

            // Suppress Word spelling and grammar squiggles at document settings level
            try {
                const settingsXmlFile = zip.file('word/settings.xml');
                const wNS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
                if (settingsXmlFile) {
                    const settingsXml = await settingsXmlFile.async('string');
                    const settingsDoc = parser.parseFromString(settingsXml, 'application/xml');
                    const rootSettings = settingsDoc.getElementsByTagNameNS(wNS, 'settings')[0] || settingsDoc.documentElement;
                    if (rootSettings) {
                        let hasHideSpell = false;
                        let hasHideGram = false;
                        for (let sc = 0; sc < rootSettings.childNodes.length; sc++) {
                            const scNode = rootSettings.childNodes[sc];
                            if (scNode.localName === 'hideSpellingErrors' || scNode.nodeName === 'w:hideSpellingErrors') hasHideSpell = true;
                            if (scNode.localName === 'hideGrammaticalErrors' || scNode.nodeName === 'w:hideGrammaticalErrors') hasHideGram = true;
                        }
                        if (!hasHideSpell) rootSettings.appendChild(settingsDoc.createElementNS(wNS, 'w:hideSpellingErrors'));
                        if (!hasHideGram) rootSettings.appendChild(settingsDoc.createElementNS(wNS, 'w:hideGrammaticalErrors'));
                        zip.file('word/settings.xml', serializer.serializeToString(settingsDoc));
                    }
                } else {
                    const wNS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
                    zip.file('word/settings.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:settings xmlns:w="' + wNS + '"><w:hideSpellingErrors/><w:hideGrammaticalErrors/></w:settings>');
                }
            } catch (sErr) {
                // Non-fatal if settings.xml cannot be modified
            }
        }

        updateDownloadProgress(88, 'Generating download package...');
        await yieldToUI();

        const blob = await zip.generateAsync({
            type: 'blob',
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            compression: 'DEFLATE',
            compressionOptions: { level: 6 }
        });

        updateDownloadProgress(100, 'Complete!');
        setTimeout(() => {
            saveAs(blob, filename);
            hideDownloadOverlay();
        }, 300);

    } catch (err) {
        console.error('DOCX processing failed:', err);
        hideDownloadOverlay();
        alert('Error processing document formatting. Falling back to basic format.');
        downloadAsDocxFallback(refinedText, filename);
    }
}

// Fallback: create a new basic docx (used when no original file is available)
function downloadAsDocxFallback(text, filename) {
    const { Document, Packer, Paragraph, TextRun } = window.docx;
    
    // 1. Strip HTML tags, dirty directional codes, and old breakable zero-width spaces
    const cleanText = (text || '')
        .replace(/<[^>]+>/g, '')
        .replace(/[\u00AD\u200B\u200C\u200E\u200F\uFEFF]/g, '');

    // 2. Normalize line endings
    const normalized = cleanText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // 3. Split on double newlines for real paragraphs
    const rawParagraphs = normalized.split(/\n\s*\n+/);

    const docxParagraphs = [];

    for (const rawPara of rawParagraphs) {
        const trimmedPara = rawPara.trim();
        if (!trimmedPara) continue;

        const lines = trimmedPara.split(/\n/);
        // If it's a short-line block (like title page: "TITLE\nBY\nNAME" or bullet list)
        const isListOrTitle = lines.every(l => l.trim().length < 65 || /^[-*•\d+.)]\s/.test(l.trim()));

        if (isListOrTitle && lines.length > 1) {
            for (const line of lines) {
                const lineTrimmed = line.trim();
                if (lineTrimmed) {
                    docxParagraphs.push(new Paragraph({
                        children: [
                            new TextRun({
                                text: lineTrimmed,
                                font: 'Calibri',
                                size: 24,
                                noProof: true,
                            }),
                        ],
                        spacing: { after: 120 },
                    }));
                }
            }
        } else {
            // Flowing prose: rejoin line-end hyphenated words and join wrapped lines with space
            const flowingText = trimmedPara
                .replace(/([a-zA-Z0-9])[-‐‑‒–—]\s*\n\s*([a-zA-Z0-9])/g, '$1$2')
                .replace(/\n\s*/g, ' ');

            docxParagraphs.push(new Paragraph({
                children: [
                    new TextRun({
                        text: flowingText,
                        font: 'Calibri',
                        size: 24,
                        noProof: true,
                    }),
                ],
                spacing: { after: 140, line: 276 }, // 1.15 line spacing, 7pt space after
            }));
        }
    }

    const doc = new Document({
        sections: [{
            properties: {},
            children: docxParagraphs.length > 0 ? docxParagraphs : [new Paragraph({ children: [new TextRun({ text: '' })] })],
        }],
    });

    Packer.toBlob(doc).then(blob => {
        saveAs(blob, filename);
    }).catch(err => {
        console.error('Error constructing DOCX:', err);
        alert('Unable to pack DOCX. Falling back to .txt download.');
        downloadAsText(text, filename.replace('.docx', '.txt'));
    });
}

// Keep the old name for compatibility with typist download
function downloadAsDocx(text, filename) {
    if (uploadedDocxArrayBuffer) {
        downloadAsDocxPreserved(text, filename);
    } else {
        downloadAsDocxFallback(text, filename);
    }
}

function downloadResult(text, baseName) {
    if (uploadedFileType === 'docx') {
        downloadAsDocxPreserved(text, baseName + '.docx');
    } else {
        downloadAsText(text, baseName + '.txt');
    }
}

function copyToClipboard(text) {
    if (!text) return;

    // Build plain text and rich HTML with mso-no-proof to prevent red squiggly underlines when pasted into Word
    const escapedHtml = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br/>');

    if (navigator.clipboard && window.ClipboardItem) {
        const textBlob = new Blob([text], { type: 'text/plain' });
        const htmlBlob = new Blob([`<div style="mso-no-proof:yes;" spellcheck="false">${escapedHtml}</div>`], { type: 'text/html' });
        navigator.clipboard.write([
            new ClipboardItem({
                'text/plain': textBlob,
                'text/html': htmlBlob
            })
        ]).then(() => {
            alert('Processed text copied securely to clipboard (including invisible AI-bypass characters)!');
        }).catch(() => {
            fallbackClipboard(text);
        });
    } else {
        fallbackClipboard(text);
    }
}

function fallbackClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('Processed text copied securely to clipboard (including invisible AI-bypass characters)!');
    }).catch(err => {
        console.error('Failed to copy: ', err);
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('Processed text copied securely to clipboard (including invisible AI-bypass characters)!');
    });
}

/* Process Execution Control */

function processText() {
    const inputText = document.getElementById('input-text').value;
    const outputPreview = document.getElementById('output-preview');
    const progress = document.getElementById('progress');
    const progressStatus = document.getElementById('progress-status');
    const activeTab = document.querySelector('.tab.active');
    const mode = activeTab ? activeTab.getAttribute('data-mode') : 'humanizer';

    if (!inputText.trim()) {
        alert('Please enter text content to refine.');
        return;
    }

    // Trigger high-tech scan overlay animations
    startScanningAnimation();

    progress.style.display = 'flex';
    progressStatus.textContent = "Analyzing lexical patterns...";

    setTimeout(() => {
        progressStatus.textContent = "Injecting active synonyms and transitional structures...";
        
        setTimeout(() => {
            progressStatus.textContent = "Encoding custom zero-width bytes and homoglyphs...";
            
            setTimeout(() => {
                // Dehyphenate text to fix word breaks before processing
                let textToProcess = dehyphenateText(inputText);
                let phraseMappings = [];

                // Step 1: Pre-replace multi-word transitions to keep them intact
                Object.keys(linguisticRules).forEach(ruleKey => {
                    if (ruleKey.includes(' ')) {
                        const regex = new RegExp(`\\b${ruleKey}\\b`, 'gi');
                        textToProcess = textToProcess.replace(regex, (match) => {
                            const placeholder = `__PHRASE_PLACEHOLDER_${phraseMappings.length}__`;
                            phraseMappings.push({
                                placeholder: placeholder,
                                original: match,
                                synonyms: linguisticRules[ruleKey]
                            });
                            return placeholder;
                        });
                    }
                });

                // Step 2: Tokenize on word boundaries and placeholders
                const tokens = textToProcess.split(/(\b\w+\b|__PHRASE_PLACEHOLDER_\d+__)/g).filter(Boolean);
                currentSegments = [];

                tokens.forEach(token => {
                    if (token.startsWith('__PHRASE_PLACEHOLDER_')) {
                        const matchPlaceholder = token.match(/__PHRASE_PLACEHOLDER_(\d+)__/);
                        if (matchPlaceholder) {
                            const mapping = phraseMappings[parseInt(matchPlaceholder[1])];
                            const options = [mapping.original, ...mapping.synonyms];
                            const chosen = mapping.synonyms[Math.floor(Math.random() * mapping.synonyms.length)];
                            const matched = matchCase(mapping.original, chosen);
                            currentSegments.push({
                                type: 'replaced',
                                original: mapping.original,
                                current: matched,
                                options: options.map(o => matchCase(mapping.original, o))
                            });
                        }
                    } else {
                        const lowerWord = token.toLowerCase();
                        if (linguisticRules[lowerWord]) {
                            const synonymsList = linguisticRules[lowerWord];
                            const options = [token, ...synonymsList];
                            const chosen = synonymsList[Math.floor(Math.random() * synonymsList.length)];
                            const matched = matchCase(token, chosen);
                            currentSegments.push({
                                type: 'replaced',
                                original: token,
                                current: matched,
                                options: options.map(o => matchCase(token, o))
                            });
                        } else {
                            currentSegments.push({
                                type: 'text',
                                original: token,
                                current: token
                            });
                        }
                    }
                });

                // Step 3: Render and update dashboard
                renderPreview();
                updateStats(getRawProcessedText(), document.getElementById('output-stats'));

                // Simulated AI Gauge Evaluation
                const originalScore = calculateAILikelihood(inputText, false);
                const finalScore = calculateAILikelihood(getRawProcessedText(), true);
                
                const integrityScore = Math.max(88, 100 - Math.round(currentSegments.filter(s => s.type === 'replaced').length * 0.4));
                document.getElementById('integrity-score').textContent = `${integrityScore}%`;
                
                const readability = calculateReadability(getRawProcessedText());
                document.getElementById('readability-score').textContent = readability.grade;
                document.getElementById('readability-desc').textContent = readability.desc;

                // Animate gauge change
                let currentGaugeVal = originalScore;
                updateGauge(currentGaugeVal);
                const gaugeInterval = setInterval(() => {
                    if (currentGaugeVal > finalScore) {
                        currentGaugeVal--;
                        updateGauge(currentGaugeVal);
                    } else {
                        clearInterval(gaugeInterval);
                        updateGauge(finalScore);
                    }
                }, 15);

                // Stop the scan overlay animations
                stopScanningAnimation();

                // Trigger brief dynamic glow animation on AI score gauge circle
                const gaugeFillEl = document.getElementById('gauge-fill');
                if (gaugeFillEl) {
                    gaugeFillEl.classList.add('glow-pulse');
                    setTimeout(() => gaugeFillEl.classList.remove('glow-pulse'), 2500);
                }

                progress.style.display = 'none';
            }, 600);
        }, 600);
    }, 600);
}

/* Forensic Auto-Typist Engine */

// QWERTY mistake mapping
const qwertyMistakes = {
    'a': 'qwsz', 'b': 'vghn', 'c': 'xdfv', 'd': 'ersfxc', 'e': 'wsdr', 'f': 'rtgvcd',
    'g': 'tyhbvf', 'h': 'yujnbg', 'i': 'ujko', 'j': 'uikmnh', 'k': 'ijlm', 'l': 'okp',
    'm': 'njk', 'n': 'bhjm', 'o': 'iklp', 'p': 'ol', 'q': 'wa', 'r': 'edft',
    's': 'wedxza', 't': 'rfgy', 'u': 'yhji', 'v': 'cfgb', 'w': 'qase', 'x': 'zsdc',
    'y': 'tghu', 'z': 'asx',
    'A': 'QWSZ', 'B': 'VGHN', 'C': 'XDFV', 'D': 'ERSFXC', 'E': 'WSDR', 'F': 'RTGVCD',
    'G': 'TYHBVF', 'H': 'YUJNBG', 'I': 'UJKO', 'J': 'UIKMNH', 'K': 'IJLM', 'L': 'OKP',
    'M': 'NJK', 'N': 'BHJM', 'O': 'IKLP', 'P': 'OL', 'Q': 'WA', 'R': 'EDFT',
    'S': 'WEDXZA', 'T': 'RFGY', 'U': 'YHJI', 'V': 'CFGB', 'W': 'QASE', 'X': 'ZSDC',
    'Y': 'TGHU', 'Z': 'ASX'
};

let typistOriginalText = "";
let typistProcessedText = "";
let typistQueue = [];
let typistQueueIndex = 0;
let typistTimer = null;
let typistStartTime = null;
let typistSimulatedTime = 0; // Milliseconds
let typistErrorsCount = 0;
let typistIsPaused = false;
let typistFileFormat = 'txt';
let typistFileName = 'written_document';
let typistForensicLog = []; // [{ time, action, char }]

// Force selection caret to always sit at the end of the text container during typing
function forceCaretToEnd(element) {
    try {
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(element);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
    } catch (err) {
        console.warn("Unable to force caret to end:", err);
    }
}

// Dispatch programmatic events for active tracking extensions
function fireTypingEvents(element, char) {
    const key = char === '\n' ? 'Enter' : char;
    const keyCode = char === '\n' ? 13 : char.charCodeAt(0);
    
    // Programmatically align cursor to the end of the text block to prevent user disruptions
    forceCaretToEnd(element);
    
    element.dispatchEvent(new KeyboardEvent('keydown', { key: key, keyCode: keyCode, bubbles: true }));
    element.dispatchEvent(new KeyboardEvent('keypress', { key: key, keyCode: keyCode, bubbles: true }));
    
    if (char === '\n') {
        document.execCommand('insertLineBreak');
    } else {
        const sel = window.getSelection();
        if (sel.rangeCount) {
            const range = sel.getRangeAt(0);
            range.deleteContents();
            const textNode = document.createTextNode(char);
            range.insertNode(textNode);
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);
        } else {
            element.appendChild(document.createTextNode(char));
        }
    }
    
    element.dispatchEvent(new KeyboardEvent('keyup', { key: key, keyCode: keyCode, bubbles: true }));
    element.dispatchEvent(new Event('input', { bubbles: true }));
}

function fireBackspaceEvent(element) {
    const key = 'Backspace';
    const keyCode = 8;
    
    // Programmatically align cursor to the end of the text block to prevent user disruptions
    forceCaretToEnd(element);
    
    element.dispatchEvent(new KeyboardEvent('keydown', { key: key, keyCode: keyCode, bubbles: true }));
    document.execCommand('delete', false, null);
    element.dispatchEvent(new KeyboardEvent('keyup', { key: key, keyCode: keyCode, bubbles: true }));
    element.dispatchEvent(new Event('input', { bubbles: true }));
}

function updateEditorStats() {
    const editor = document.getElementById('typist-editor');
    if (!editor) return;
    const text = editor.innerText || "";
    const stats = calculateStats(text);
    document.getElementById('typist-char-count').textContent = `Characters: ${stats.characters}`;
    document.getElementById('typist-word-count').textContent = `Words: ${stats.words}`;
}

// Build human-like keystroke action queues
function compileTypistQueue() {
    typistQueue = [];
    const text = typistProcessedText;
    const errorRate = parseFloat(document.getElementById('error-rate').value);
    
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        
        // Occasional human-like typo correction emulation
        if (errorRate > 0 && Math.random() * 100 < errorRate && qwertyMistakes[char] !== undefined) {
            const adjacent = qwertyMistakes[char];
            const typoChar = adjacent[Math.floor(Math.random() * adjacent.length)];
            
            // Queue typo character
            typistQueue.push({ action: 'type', char: typoChar, isTypo: true });
            // Brief typo realization delay
            typistQueue.push({ action: 'wait', ms: Math.random() * 150 + 80 });
            // Backspace delete action
            typistQueue.push({ action: 'backspace' });
            // Correction delay
            typistQueue.push({ action: 'wait', ms: Math.random() * 180 + 90 });
            typistErrorsCount++;
        }
        
        // Standard typing action
        typistQueue.push({ action: 'type', char: char, isTypo: false });
        
        // Simulated delays
        if (char === ' ') {
            // Delay between words
            typistQueue.push({ action: 'wait', ms: Math.random() * 180 + 120 });
        } else if (char === '.' || char === '?' || char === '!') {
            // Cognitive delay between sentences
            typistQueue.push({ action: 'wait', ms: Math.random() * 1200 + 400 });
        } else if (char === '\n') {
            // Pause before carriage return
            typistQueue.push({ action: 'wait', ms: Math.random() * 800 + 300 });
        } else {
            // Variable keystroke delay
            typistQueue.push({ action: 'wait', ms: Math.random() * 140 + 70 });
        }
    }
}

// Executing single simulation step
function executeTypistStep() {
    if (typistIsPaused || typistQueueIndex >= typistQueue.length) {
        if (typistQueueIndex >= typistQueue.length) {
            finishTypistSession();
        }
        return;
    }
    
    // Auto-save state periodically
    if (typistQueueIndex % 50 === 0) {
        saveSimulationState();
    }
    
    const editor = document.getElementById('typist-editor');
    const step = typistQueue[typistQueueIndex];
    const dilationSpeed = parseFloat(document.getElementById('dilation-speed').value);
    
    let stepRealMs = 0;
    
    if (step.action === 'type') {
        fireTypingEvents(editor, step.char);
        updateEditorStats();
        
        // Trigger typist visual rhythm pulse
        if (activeTypistVisualizer) {
            activeTypistVisualizer.addKeystroke(50, false);
        }

        // Log forensic timestamp
        typistForensicLog.push({
            time: new Date(typistStartTime.getTime() + typistSimulatedTime).toISOString(),
            action: 'type',
            key: step.char,
            typo: step.isTypo
        });
        
        stepRealMs = 50; // standard simulated execution cost
        typistQueueIndex++;
    } else if (step.action === 'backspace') {
        fireBackspaceEvent(editor);
        updateEditorStats();
        
        // Trigger typist visual rhythm pulse (backspace variation)
        if (activeTypistVisualizer) {
            activeTypistVisualizer.addKeystroke(60, true);
        }

        typistForensicLog.push({
            time: new Date(typistStartTime.getTime() + typistSimulatedTime).toISOString(),
            action: 'backspace',
            key: 'Backspace'
        });
        
        stepRealMs = 60;
        typistQueueIndex++;
    } else if (step.action === 'wait') {
        stepRealMs = step.ms;
        typistQueueIndex++;
    }
    
    // Advances simulated time by original delay interval scaled by dilation speed
    const simulatedStepMs = stepRealMs;
    typistSimulatedTime += simulatedStepMs;
    
    // Real time interval to wait before next visual step
    const nextRealDelay = Math.max(1, stepRealMs / dilationSpeed);
    
    // Update metrics UI
    updateTypistStatusDashboard();
    
    typistTimer = setTimeout(executeTypistStep, nextRealDelay);
}

// Format simulated duration
function formatElapsedTime(ms) {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor(ms / (1000 * 60 * 60));
    return `${hours}h ${minutes}m ${seconds}s`;
}

function updateTypistStatusDashboard() {
    const elapsed = document.getElementById('typist-elapsed');
    const wpm = document.getElementById('typist-wpm');
    const errors = document.getElementById('typist-errors');
    const bar = document.getElementById('typist-progress-bar');
    const pct = document.getElementById('typist-progress-pct');
    
    if (!elapsed || !wpm || !errors || !bar || !pct) return;
    
    elapsed.textContent = formatElapsedTime(typistSimulatedTime);
    errors.textContent = typistErrorsCount;
    
    // Calculate typing speed dynamically
    const wordsTyped = (document.getElementById('typist-editor').innerText || "").trim().split(/\s+/).filter(Boolean).length;
    const simulatedMinutes = (typistSimulatedTime / 60000) || 0.01;
    wpm.textContent = `${Math.round(wordsTyped / simulatedMinutes)} WPM`;
    
    // Progress calculation
    const progressPct = Math.min(100, Math.round((typistQueueIndex / typistQueue.length) * 100)) || 0;
    pct.textContent = `${progressPct}%`;
    bar.style.width = `${progressPct}%`;
}

function startTypistSession() {
    const editor = document.getElementById('typist-editor');
    if (!editor) return;
    
    if (!typistOriginalText.trim()) {
        alert('Please upload a document to begin the Forensic Auto-Typist.');
        return;
    }
    
    const durationHrs = parseFloat(document.getElementById('typist-duration').value);
    
    // If not paused, this is a fresh typing session setup
    if (!typistIsPaused && !typistTimer) {
        editor.innerHTML = '';
        editor.focus();
        
        // 1. Humanize original text before retyping
        const activeTab = document.querySelector('.tab.active');
        const homoglyphToggle = document.getElementById('homoglyph-toggle').checked;
        const homoglyphStrength = parseFloat(document.getElementById('homoglyph-strength').value);
        const invisibleToggle = document.getElementById('invisible-toggle').checked;
        const invisibleStrength = parseFloat(document.getElementById('invisible-strength').value);
        
        // Pre-humanize the content
        let textToProcess = dehyphenateText(typistOriginalText);
        let phraseMappings = [];
        
        Object.keys(linguisticRules).forEach(ruleKey => {
            if (ruleKey.includes(' ')) {
                const regex = new RegExp(`\\b${ruleKey}\\b`, 'gi');
                textToProcess = textToProcess.replace(regex, (match) => {
                    const placeholder = `__PHRASE_PLACEHOLDER_${phraseMappings.length}__`;
                    phraseMappings.push({
                        placeholder: placeholder,
                        original: match,
                        synonyms: linguisticRules[ruleKey]
                    });
                    return placeholder;
                });
            }
        });
        
        const tokens = textToProcess.split(/(\b\w+\b|__PHRASE_PLACEHOLDER_\d+__)/g).filter(Boolean);
        let temporarySegments = [];
        
        tokens.forEach(token => {
            if (token.startsWith('__PHRASE_PLACEHOLDER_')) {
                const matchPlaceholder = token.match(/__PHRASE_PLACEHOLDER_(\d+)__/);
                if (matchPlaceholder) {
                    const mapping = phraseMappings[parseInt(matchPlaceholder[1])];
                    const chosen = mapping.synonyms[Math.floor(Math.random() * mapping.synonyms.length)];
                    const matched = matchCase(mapping.original, chosen);
                    temporarySegments.push(applyObfuscation(matched, homoglyphToggle, homoglyphStrength, invisibleToggle, invisibleStrength));
                }
            } else {
                const lowerWord = token.toLowerCase();
                if (linguisticRules[lowerWord]) {
                    const synonymsList = linguisticRules[lowerWord];
                    const chosen = synonymsList[Math.floor(Math.random() * synonymsList.length)];
                    const matched = matchCase(token, chosen);
                    temporarySegments.push(applyObfuscation(matched, homoglyphToggle, homoglyphStrength, invisibleToggle, invisibleStrength));
                } else {
                    temporarySegments.push(applyObfuscation(token, homoglyphToggle, homoglyphStrength, invisibleToggle, invisibleStrength));
                }
            }
        });
        
        typistProcessedText = temporarySegments.join('');
        
        // 2. Prepare queuing
        typistErrorsCount = 0;
        typistSimulatedTime = 0;
        typistQueueIndex = 0;
        typistForensicLog = [];
        
        // Distribute timestamps over the chosen timeframe
        typistStartTime = new Date(Date.now() - (durationHrs * 3600 * 1000)); // Simulates starting in the past
        
        compileTypistQueue();
    }
    
    typistIsPaused = false;
    document.getElementById('typist-status').textContent = "Typing...";
    document.getElementById('typist-status').style.color = "#10b981";
    
    // Toggle locking visual state to prevent user click disruptions
    if (editor) editor.classList.add('typing-active');
    
    document.getElementById('typist-play').disabled = true;
    document.getElementById('typist-pause').disabled = false;
    document.getElementById('typist-stop').disabled = false;
    
    document.getElementById('typist-download-doc').disabled = true;
    document.getElementById('typist-download-log').disabled = true;
    document.getElementById('typist-download-cert').disabled = true;
    
    executeTypistStep();
}

function pauseTypistSession() {
    typistIsPaused = true;
    if (typistTimer) {
        clearTimeout(typistTimer);
        typistTimer = null;
    }
    document.getElementById('typist-status').textContent = "Paused";
    document.getElementById('typist-status').style.color = "#f59e0b";
    
    // Unlock visual state when paused
    const editor = document.getElementById('typist-editor');
    if (editor) editor.classList.remove('typing-active');
    
    document.getElementById('typist-play').disabled = false;
    document.getElementById('typist-pause').disabled = true;
    
    saveSimulationState();
}

function stopTypistSession() {
    typistIsPaused = false;
    if (typistTimer) {
        clearTimeout(typistTimer);
        typistTimer = null;
    }
    typistQueueIndex = 0;
    typistSimulatedTime = 0;
    typistErrorsCount = 0;
    
    document.getElementById('typist-status').textContent = "Idle";
    document.getElementById('typist-status').style.color = "#00e676";
    
    // Unlock visual state when stopped
    const editor = document.getElementById('typist-editor');
    if (editor) {
        editor.innerHTML = '';
        editor.classList.remove('typing-active');
    }
    
    updateEditorStats();
    updateTypistStatusDashboard();
    
    document.getElementById('typist-play').disabled = false;
    document.getElementById('typist-pause').disabled = true;
    document.getElementById('typist-stop').disabled = true;
    
    document.getElementById('typist-download-doc').disabled = true;
    document.getElementById('typist-download-log').disabled = true;
    document.getElementById('typist-download-cert').disabled = true;
    
    clearSimulationState();
}

function finishTypistSession() {
    if (typistTimer) {
        clearTimeout(typistTimer);
        typistTimer = null;
    }
    document.getElementById('typist-status').textContent = "Completed";
    document.getElementById('typist-status').style.color = "#10b981";
    
    // Unlock visual state when completed
    const editor = document.getElementById('typist-editor');
    if (editor) editor.classList.remove('typing-active');
    
    document.getElementById('typist-play').disabled = false;
    document.getElementById('typist-pause').disabled = true;
    
    // Enable Forensic downloads
    document.getElementById('typist-download-doc').disabled = false;
    document.getElementById('typist-download-log').disabled = false;
    document.getElementById('typist-download-cert').disabled = false;
    
    clearSimulationState();
    
    alert('Document retyping completed! You can now download the humanized document, export the forensic keystroke log, or print the drafting certificate.');
}

// Download forensic JSON log file
function downloadForensicLog() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(typistForensicLog, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `${typistFileName}_keystroke_log.json`);
    dlAnchorElem.click();
}

// Generate styled PDF-ready HTML Drafting Certificate
function downloadForensicCertificate() {
    const editorText = document.getElementById('typist-editor').innerText || "";
    const stats = calculateStats(editorText);
    const durationHrs = parseFloat(document.getElementById('typist-duration').value);
    
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Linguistic Development & Keystroke Certification</title>
    <style>
        body { font-family: 'Inter', sans-serif; background-color: #f3f4f6; color: #1f2937; margin: 40px; }
        .cert { background: #ffffff; border: 10px double #00e676; padding: 40px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); max-width: 800px; margin: 0 auto; text-align: center; }
        h1 { color: #00e676; font-size: 2rem; margin-bottom: 5px; }
        h2 { font-size: 1rem; color: #4b5563; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 30px; }
        .divider { height: 2px; background: linear-gradient(90deg, #007bff, #00e676); margin: 20px auto; width: 60%; }
        .metadata { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; text-align: left; margin: 40px auto; max-width: 600px; background: #fafbfc; padding: 20px; border-radius: 12px; border: 1px solid #e5e7eb; }
        .meta-item { display: flex; flex-direction: column; }
        .meta-label { font-size: 0.8rem; color: #6b7280; font-weight: 600; text-transform: uppercase; }
        .meta-val { font-size: 1rem; font-weight: 700; color: #111827; margin-top: 2px; }
        .footer-note { font-size: 0.85rem; color: #6b7280; margin-top: 40px; font-style: italic; }
        .seal { width: 100px; height: 100px; border-radius: 50%; background: rgba(0, 230, 118, 0.1); border: 2px dashed #00e676; display: flex; align-items: center; justify-content: center; margin: 30px auto; color: #00e676; font-weight: 800; font-size: 0.75rem; text-transform: uppercase; }
    </style>
</head>
<body>
    <div class="cert">
        <div class="seal">Veritas<br>Draft</div>
        <h1>Certificate of Human Composition</h1>
        <h2>Linguistic Forensic & Writing Cadence Verification</h2>
        <div class="divider"></div>
        <p>This document officially certifies that the literary composition referenced below has been drafted in a natural human fashion, characterized by character-by-character input speeds, backspace mistake corrections, and cognitive drafting pauses.</p>
        
        <div class="metadata">
            <div class="meta-item">
                <span class="meta-label">Document Title</span>
                <span class="meta-val">${typistFileName}</span>
            </div>
            <div class="meta-item">
                <span class="meta-label">Audit Timeframe</span>
                <span class="meta-val">${durationHrs} Hours (Simulated)</span>
            </div>
            <div class="meta-item">
                <span class="meta-label">Total Keypresses</span>
                <span class="meta-val">${typistForensicLog.length} Keystrokes</span>
            </div>
            <div class="meta-item">
                <span class="meta-label">Typing Corrections</span>
                <span class="meta-val">${typistErrorsCount} Backspaced Edits</span>
            </div>
            <div class="meta-item">
                <span class="meta-label">Composition Size</span>
                <span class="meta-val">${stats.words} Words / ${stats.characters} Characters</span>
            </div>
            <div class="meta-item">
                <span class="meta-label">Writing Cadence</span>
                <span class="meta-val">Natural QWERTY Distribution</span>
            </div>
        </div>
        
        <p class="footer-note">Forensic Log ID: ${Math.random().toString(36).substring(2, 15).toUpperCase()} | Authenticated dynamically on ${new Date().toLocaleDateString()}</p>
    </div>
</body>
</html>
    `;
    
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${typistFileName}_Composition_Certificate.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Forensic Typist Upload Document support
function initTypistFileUpload() {
    const uploadBtn = document.getElementById('typist-upload-btn');
    const fileInput = document.getElementById('typist-file-upload');
    const editor = document.getElementById('typist-editor');
    
    if (uploadBtn && fileInput) {
        uploadBtn.addEventListener('click', () => {
            fileInput.click();
        });
        
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const dotIndex = file.name.lastIndexOf('.');
                typistFileName = dotIndex > 0 ? file.name.substring(0, dotIndex) : file.name;
                
                if (file.name.endsWith('.txt')) {
                    typistFileFormat = 'txt';
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        typistOriginalText = e.target.result;
                        editor.innerHTML = '<span style="color:var(--brand-primary); font-style:italic;">Document uploaded cleanly! Click Play to begin simulated retyping.</span>';
                        updateEditorStats();
                    };
                    reader.readAsText(file);
                } else if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
                    typistFileFormat = 'docx';
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        // Store original .docx binary for format-preserving download
                        uploadedDocxArrayBuffer = e.target.result.slice(0);
                        mammoth.extractRawText({ arrayBuffer: e.target.result })
                            .then((result) => {
                                typistOriginalText = dehyphenateText(result.value);
                                editor.innerHTML = '<span style="color:var(--brand-primary); font-style:italic;">Document loaded cleanly! Click Play to begin simulated retyping.</span>';
                                updateEditorStats();
                            })
                            .catch((err) => {
                                console.error(err);
                                alert('Error extracting document.');
                            });
                    };
                    reader.readAsArrayBuffer(file);
                }
            }
        });
    }
}

// Rich Editor command executor
function initRichEditorCommands() {
    const buttons = document.querySelectorAll('.toolbar-btn[data-cmd]');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const cmd = btn.getAttribute('data-cmd');
            const val = btn.getAttribute('data-val') || null;
            document.execCommand(cmd, false, val);
            
            // Keep focus
            document.getElementById('typist-editor').focus();
            updateEditorStats();
        });
    });
}

// Save Active Typing Session to LocalStorage
function saveSimulationState() {
    if (typistQueue.length === 0 || typistQueueIndex >= typistQueue.length) {
        localStorage.removeItem('typist_state');
        return;
    }
    
    const state = {
        originalText: typistOriginalText,
        processedText: typistProcessedText,
        queueIndex: typistQueueIndex,
        elapsedTime: typistSimulatedTime,
        errorsCount: typistErrorsCount,
        fileName: typistFileName,
        fileFormat: typistFileFormat,
        startTime: typistStartTime ? typistStartTime.getTime() : Date.now(),
        forensicLog: typistForensicLog,
        duration: document.getElementById('typist-duration').value,
        dilation: document.getElementById('dilation-speed').value,
        errorRate: document.getElementById('error-rate').value
    };
    
    localStorage.setItem('typist_state', JSON.stringify(state));
}

// Clear Session State
function clearSimulationState() {
    localStorage.removeItem('typist_state');
}

// Verify and Restore Stalled Typing Sessions
function checkAndRestoreSimulationState() {
    const saved = localStorage.getItem('typist_state');
    if (!saved) return;
    
    try {
        const state = JSON.parse(saved);
        if (!state.originalText) return;
        
        const confirmRestore = confirm(`We detected an incomplete drafting session for "${state.fileName}". Would you like to restore this typing progress?`);
        if (confirmRestore) {
            typistOriginalText = state.originalText;
            typistProcessedText = state.processedText;
            typistQueueIndex = state.queueIndex;
            typistSimulatedTime = state.elapsedTime;
            typistErrorsCount = state.errorsCount;
            typistFileName = state.fileName;
            typistFileFormat = state.fileFormat;
            typistStartTime = new Date(state.startTime);
            typistForensicLog = state.forensicLog;
            
            // Restore Controls
            document.getElementById('typist-duration').value = state.duration;
            document.getElementById('dilation-speed').value = state.dilation;
            document.getElementById('dilation-val').textContent = `${state.dilation}x`;
            document.getElementById('error-rate').value = state.errorRate;
            document.getElementById('error-rate-val').textContent = `${state.errorRate}%`;
            
            // Trigger UI tab switch to Typist Editor
            const typistTab = document.getElementById('typist-tab');
            if (typistTab) typistTab.click();
            
            // Compile keystroke queue
            compileTypistQueue();
            
            // Fast-forward visual editor canvas up to the restored index
            const editor = document.getElementById('typist-editor');
            editor.innerHTML = '';
            
            let recoveredText = "";
            for (let i = 0; i < typistQueueIndex; i++) {
                const step = typistQueue[i];
                if (step.action === 'type') {
                    recoveredText += step.char;
                } else if (step.action === 'backspace') {
                    recoveredText = recoveredText.slice(0, -1);
                }
            }
            editor.innerText = recoveredText;
            
            typistIsPaused = true;
            document.getElementById('typist-status').textContent = "Restored & Paused";
            document.getElementById('typist-status').style.color = "#f59e0b";
            
            document.getElementById('typist-play').disabled = false;
            document.getElementById('typist-pause').disabled = true;
            document.getElementById('typist-stop').disabled = false;
            
            updateEditorStats();
            updateTypistStatusDashboard();
        } else {
            clearSimulationState();
        }
    } catch (err) {
        console.error("Error recovering typing state:", err);
        clearSimulationState();
    }
}

/* Brand Intro Splash Screen Animation */
function initBrandSplash() {
    const splash = document.getElementById('splash-screen');
    if (!splash) return;

    // If splash has already been shown in this session, and it is NOT a page reload, skip and remove it
    const isReload = performance.navigation.type === 1 || 
                     (performance.getEntriesByType && 
                      performance.getEntriesByType('navigation')[0] && 
                      performance.getEntriesByType('navigation')[0].type === 'reload');

    if (sessionStorage.getItem('splash_shown') === 'true' && !isReload) {
        splash.remove();
        return;
    }

    const brandPart = splash.querySelector('.brand-part');
    const techPart = splash.querySelector('.tech-part');

    if (!brandPart || !techPart) return;

    // Make sure splash screen is visible
    splash.style.display = 'flex';

    // Step 1: "EVANS" is displayed in HTML initially.
    // Step 2: After 1200ms, start the scrambler letter reversal to "SNAVE"
    setTimeout(() => {
        const endText = "SNAVE";
        const duration = 1000; // 1 second total scramble duration
        const intervalTime = 50; // scramble every 50ms
        const totalSteps = duration / intervalTime;
        let currentStep = 0;

        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

        const scrambleInterval = setInterval(() => {
            currentStep++;
            let currentText = "";
            
            // Reconstruct the 5-letter name index-by-index
            for (let i = 0; i < 5; i++) {
                // Determine lock-in timing threshold for each letter from left to right
                const lockStep = (i + 1) * (totalSteps / 5);
                if (currentStep >= lockStep) {
                    currentText += endText[i];
                } else {
                    currentText += chars[Math.floor(Math.random() * chars.length)];
                }
            }

            brandPart.textContent = currentText;

            if (currentStep >= totalSteps) {
                clearInterval(scrambleInterval);
                brandPart.textContent = endText; // Hard lock exactly to SNAVE
                
                // Step 3: Wait 300ms, then slide in and reveal "Tech"
                setTimeout(() => {
                    techPart.classList.add('show');

                    // Step 4: After displaying "Snave Tech" for 1200ms, fade out splash overlay
                    setTimeout(() => {
                        splash.classList.add('fade-out');
                        sessionStorage.setItem('splash_shown', 'true');

                        // Remove overlay element from DOM after transition completes to restore clicks
                        setTimeout(() => {
                            splash.remove();
                        }, 800);
                    }, 1200);
                }, 300);
            }
        }, intervalTime);
    }, 1200);
}

/* Interactive Letter-by-Letter Heading Animation */
function initInteractiveHeading() {
    const heading = document.querySelector('.hero h1');
    if (!heading) return;

    // Helper function to recursively wrap text characters while preserving element hierarchy and preventing word breaks
    function wrapTextNodes(node) {
        // If it's a text node, wrap its characters grouping words to prevent awkward wrapping
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent;
            const fragment = document.createDocumentFragment();
            
            // Split text on whitespace boundaries to preserve words
            const tokens = text.split(/(\s+)/);
            
            tokens.forEach(token => {
                if (!token) return;
                
                // If it is whitespace, append as space/break elements
                if (/^\s+$/.test(token)) {
                    for (let char of token) {
                        if (char === '\n' || char === '\r') {
                            continue;
                        }
                        const charSpan = document.createElement('span');
                        charSpan.className = 'hover-char';
                        if (char === ' ') {
                            charSpan.innerHTML = '&nbsp;';
                        } else {
                            charSpan.textContent = char;
                        }
                        fragment.appendChild(charSpan);
                    }
                } else {
                    // It is a word, wrap the whole token in a nowrap inline-block container
                    const wordSpan = document.createElement('span');
                    wordSpan.className = 'word-wrap';
                    
                    for (let char of token) {
                        const charSpan = document.createElement('span');
                        charSpan.className = 'hover-char';
                        charSpan.textContent = char;
                        wordSpan.appendChild(charSpan);
                    }
                    fragment.appendChild(wordSpan);
                }
            });
            
            return fragment;
        }

        // If it's an element node (except br), recurse into its children
        if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.tagName.toLowerCase() === 'br') {
                return node.cloneNode(true);
            }
            
            const newElement = node.cloneNode(false); // shallow clone
            
            // Recurse on children and append to cloned parent
            const children = Array.from(node.childNodes);
            children.forEach(child => {
                const processed = wrapTextNodes(child);
                if (processed) {
                    newElement.appendChild(processed);
                }
            });
            return newElement;
        }
        
        return node.cloneNode(true);
    }

    // Process all top-level child nodes of heading
    const originalChildren = Array.from(heading.childNodes);
    heading.innerHTML = ''; // clear original HTML
    
    originalChildren.forEach(child => {
        const wrapped = wrapTextNodes(child);
        if (wrapped) {
            heading.appendChild(wrapped);
        }
    });
}

/* Master Initialization */
function init() {
    initInteractiveHeading();
    initBrandSplash();
    initThemeToggle();

    // Initialize interactive motion background
    new MotionBackgroundEngine();

    // Initialize scroll entrance observer
    initScrollObserver();

    // Tool layout setup
    const inputText = document.getElementById('input-text');
    if (inputText) {
        // Initialize digital lexical scanner overlays
        setupLexicalScanOverlays();

        // Initialize typist live cadence oscilloscope canvas
        activeTypistVisualizer = new ForensicTypistVisualizer();

        const outputStats = document.getElementById('output-stats');

        inputText.addEventListener('input', () => {
            updateStats(inputText.value, document.getElementById('input-stats'));
            
            const score = calculateAILikelihood(inputText.value, false);
            updateGauge(score);
            
            const readability = calculateReadability(inputText.value);
            const scoreEl = document.getElementById('readability-score');
            const descEl = document.getElementById('readability-desc');
            if (scoreEl && descEl) {
                if (inputText.value.trim()) {
                    scoreEl.textContent = readability.grade;
                    descEl.textContent = readability.desc;
                } else {
                    scoreEl.textContent = "--";
                    descEl.textContent = "Please input some text to analyze";
                }
            }
        });

        // Initialize Stats Panels
        updateStats('', document.getElementById('input-stats'));
        updateStats('', document.getElementById('output-stats'));

        initFileUpload();
        initCompareModal();

        // Tabs
        const tabs = document.querySelectorAll('.tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                const mode = tab.getAttribute('data-mode');
                const normalDash = document.querySelector('.dashboard-grid');
                const normalTool = document.querySelector('.tool-container');
                const typistTool = document.getElementById('typist-container');
                
                if (mode === 'typist') {
                    if (normalDash) normalDash.style.display = 'none';
                    if (normalTool) normalTool.style.display = 'none';
                    if (typistTool) typistTool.style.display = 'block';
                } else {
                    if (normalDash) normalDash.style.display = 'grid';
                    if (normalTool) normalTool.style.display = 'grid';
                    if (typistTool) typistTool.style.display = 'none';
                }
            });
        });

        // Sliders Realtime Values Updates
        const homoglyphSlider = document.getElementById('homoglyph-strength');
        const homoglyphVal = document.getElementById('homoglyph-val');
        if (homoglyphSlider && homoglyphVal) {
            homoglyphSlider.addEventListener('input', () => {
                homoglyphVal.textContent = `${homoglyphSlider.value}%`;
                if (currentSegments.length > 0) renderPreview();
            });
        }

        const invisibleSlider = document.getElementById('invisible-strength');
        const invisibleVal = document.getElementById('invisible-val');
        if (invisibleSlider && invisibleVal) {
            invisibleSlider.addEventListener('input', () => {
                invisibleVal.textContent = `${invisibleSlider.value}%`;
                if (currentSegments.length > 0) renderPreview();
            });
        }

        // Toggles
        const homoglyphToggle = document.getElementById('homoglyph-toggle');
        if (homoglyphToggle) {
            homoglyphToggle.addEventListener('change', () => {
                if (currentSegments.length > 0) renderPreview();
            });
        }

        const invisibleToggle = document.getElementById('invisible-toggle');
        if (invisibleToggle) {
            invisibleToggle.addEventListener('change', () => {
                if (currentSegments.length > 0) renderPreview();
            });
        }

        // Typist Sliders Realtime
        const dilationSlider = document.getElementById('dilation-speed');
        const dilationVal = document.getElementById('dilation-val');
        if (dilationSlider && dilationVal) {
            dilationSlider.addEventListener('input', () => {
                dilationVal.textContent = `${dilationSlider.value}x`;
            });
        }

        const errorSlider = document.getElementById('error-rate');
        const errorVal = document.getElementById('error-rate-val');
        if (errorSlider && errorVal) {
            errorSlider.addEventListener('input', () => {
                errorVal.textContent = `${errorSlider.value}%`;
            });
        }

        // Process trigger
        document.getElementById('process-btn').addEventListener('click', processText);

        // Copy button
        document.getElementById('copy-btn').addEventListener('click', () => {
            copyToClipboard(getRawProcessedText());
        });

        // Fast paste
        document.getElementById('paste-btn').addEventListener('click', async () => {
            try {
                const text = await navigator.clipboard.readText();
                inputText.value = text;
                inputText.dispatchEvent(new Event('input'));
            } catch (err) {
                console.error('Failed to read: ', err);
                alert('Please paste manually using Ctrl+V inside the input text area.');
            }
        });

        // Delete (Clear) button
        document.getElementById('delete-btn').addEventListener('click', () => {
            inputText.value = '';
            document.getElementById('output-preview').innerHTML = 'Processed humanized text will appear here. Click on highlighted words to select alternative synonyms.';
            currentSegments = [];
            syncTextarea();
            
            uploadedFileType = 'txt';
            uploadedFileName = 'refined_text';
            uploadedDocxArrayBuffer = null;
            
            updateStats('', document.getElementById('input-stats'));
            updateStats('', document.getElementById('output-stats'));
            updateGauge(0);
            
            document.getElementById('readability-score').textContent = "--";
            document.getElementById('readability-desc').textContent = "Please input some text to analyze";
            document.getElementById('integrity-score').textContent = "100%";
            document.getElementById('ai-status').textContent = "Untested";
            document.getElementById('ai-status-desc').textContent = "Enter text to evaluate";
        });

        // Download trigger
        document.getElementById('download-btn').addEventListener('click', () => {
            const filename = prompt('Enter filename (without extension):', uploadedFileName + '_refined');
            if (filename) {
                downloadResult(getRawProcessedText(), filename);
            }
        });

        // Forensic Auto-Typist Listeners Hooks
        initTypistFileUpload();
        initRichEditorCommands();
        
        document.getElementById('typist-play').addEventListener('click', startTypistSession);
        document.getElementById('typist-pause').addEventListener('click', pauseTypistSession);
        document.getElementById('typist-stop').addEventListener('click', stopTypistSession);
        
        document.getElementById('typist-download-log').addEventListener('click', downloadForensicLog);
        document.getElementById('typist-download-cert').addEventListener('click', downloadForensicCertificate);
        
        document.getElementById('typist-download-doc').addEventListener('click', () => {
            const editorText = document.getElementById('typist-editor').innerText || "";
            downloadAsDocx(editorText, `${typistFileName}_humanized.docx`);
        });

        // Retyping stat change
        const typistEditor = document.getElementById('typist-editor');
        typistEditor.addEventListener('input', updateEditorStats);
        
        // Intercept real user clicks and physical keys to prevent cursor displacements during active timeline typing
        typistEditor.addEventListener('mousedown', (e) => {
            if (e.isTrusted && typistTimer && !typistIsPaused) {
                e.preventDefault();
                e.stopPropagation();
            }
        });
        typistEditor.addEventListener('keydown', (e) => {
            if (e.isTrusted && typistTimer && !typistIsPaused) {
                e.preventDefault();
                e.stopPropagation();
            }
        });

        // Detect and recover interrupted editing session
        setTimeout(checkAndRestoreSimulationState, 200);
    }

    // Contact form support
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Your query has been dispatched! We will reply to you as soon as possible.');
            contactForm.reset();
        });
    }

    // Interactive exit-warning listener to safeguard active timelines
    window.addEventListener('beforeunload', (e) => {
        if (typistTimer && !typistIsPaused && typistQueueIndex < typistQueue.length) {
            saveSimulationState();
            const msg = "An active humanizing retyping simulation is currently running. Closing this tab will pause the simulation, but your typing progress is auto-saved and will be restored immediately when you reopen the page.";
            e.returnValue = msg;
            return msg;
        }
    });
}

/* ==========================================================================
   Motion Background Engine Class
   ========================================================================== */
class MotionBackgroundEngine {
    constructor() {
        this.canvas = document.querySelector('.motion-canvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.waves = [];
        this.resizeCanvas();
        this.initWaves();
        this.bindEvents();
        this.animate();
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    initWaves() {
        const count = 5;
        this.waves = [];
        for (let i = 0; i < count; i++) {
            const radius = Math.min(window.innerWidth, window.innerHeight) * (0.35 + Math.random() * 0.25);
            this.waves.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.15,
                vy: (Math.random() - 0.5) * 0.15,
                radius: radius,
                phase: Math.random() * Math.PI * 2,
                phaseSpeed: 0.002 + Math.random() * 0.002,
                color: 'rgba(29, 185, 84, 0.015)'
            });
        }
    }

    bindEvents() {
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.initWaves();
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        if (!this.canvas) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw giant slow-drifting waves
        this.waves.forEach(w => {
            w.x += w.vx;
            w.y += w.vy;
            w.phase += w.phaseSpeed;

            // Soft wrap boundaries
            const buffer = w.radius;
            if (w.x - buffer > this.canvas.width) w.x = -buffer;
            if (w.x + buffer < 0) w.x = this.canvas.width + buffer;
            if (w.y - buffer > this.canvas.height) w.y = -buffer;
            if (w.y + buffer < 0) w.y = this.canvas.height + buffer;

            const dynamicRadius = w.radius * (1 + 0.08 * Math.sin(w.phase));
            const gradient = this.ctx.createRadialGradient(
                w.x, w.y, 0,
                w.x, w.y, dynamicRadius
            );
            gradient.addColorStop(0, w.color);
            gradient.addColorStop(1, 'rgba(18, 18, 18, 0)');

            this.ctx.beginPath();
            this.ctx.arc(w.x, w.y, dynamicRadius, 0, Math.PI * 2);
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
        });
    }
}

/* ==========================================================================
   Scroll Animation Observer
   ========================================================================== */
function initScrollObserver() {
    const anims = document.querySelectorAll('.animate-on-scroll');
    if (anims.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    anims.forEach(el => observer.observe(el));
}

/* ==========================================================================
   Digital Lexical Scan Manager
   ========================================================================== */
let activeScanInterval = null;

function setupLexicalScanOverlays() {
    const editors = document.querySelectorAll('.editor-container');
    editors.forEach(ed => {
        if (ed.querySelector('.scan-overlay')) return;

        const scanOverlay = document.createElement('div');
        scanOverlay.className = 'scan-overlay';

        const scanGrid = document.createElement('div');
        scanGrid.className = 'scan-grid';

        const scanLine = document.createElement('div');
        scanLine.className = 'scan-line';

        // Add character slots for the high tech cyber glow rain grid
        const charsCount = Math.floor((ed.offsetWidth * ed.offsetHeight) / 1600) || 50;
        const chars = ['0', '1', 'a', '\u0430', '\u200B', 'x', 'o', '*', '+', '-'];
        for (let i = 0; i < charsCount; i++) {
            const span = document.createElement('span');
            span.className = 'scan-char';
            span.textContent = chars[Math.floor(Math.random() * chars.length)];
            scanGrid.appendChild(span);
        }

        scanOverlay.appendChild(scanGrid);
        scanOverlay.appendChild(scanLine);
        ed.appendChild(scanOverlay);
    });
}

function startScanningAnimation() {
    setupLexicalScanOverlays();
    const overlays = document.querySelectorAll('.scan-overlay');
    overlays.forEach(overlay => overlay.classList.add('scanning'));

    const chars = document.querySelectorAll('.scan-char');
    if (chars.length === 0) return;

    if (activeScanInterval) clearInterval(activeScanInterval);
    activeScanInterval = setInterval(() => {
        // Randomly select and blink some characters
        for (let i = 0; i < 8; i++) {
            const randIdx = Math.floor(Math.random() * chars.length);
            const char = chars[randIdx];
            if (char) {
                char.classList.add('active');
                setTimeout(() => char.classList.remove('active'), 800);
            }
        }
    }, 150);
}

function stopScanningAnimation() {
    if (activeScanInterval) {
        clearInterval(activeScanInterval);
        activeScanInterval = null;
    }
    const overlays = document.querySelectorAll('.scan-overlay');
    overlays.forEach(overlay => overlay.classList.remove('scanning'));
}

/* ==========================================================================
   Forensic Typist rhythm Visualizer (Oscilloscope wave)
   ========================================================================== */
class ForensicTypistVisualizer {
    constructor() {
        this.canvas = document.querySelector('.typist-cadence-canvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.barCount = 32;
        this.amplitudes = Array(this.barCount).fill(0);
        this.animate();
    }

    addKeystroke(ms, isBackspace) {
        const peakVal = isBackspace ? 38 : 28;
        // Trigger a splash of peaks around a random center bar
        const center = Math.floor(Math.random() * this.barCount);
        for (let i = -2; i <= 2; i++) {
            const idx = (center + i + this.barCount) % this.barCount;
            const factor = 1 - Math.abs(i) * 0.35;
            this.amplitudes[idx] = Math.max(
                this.amplitudes[idx], 
                peakVal * factor * (0.85 + Math.random() * 0.3)
            );
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        if (!this.canvas) return;

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Spotify Green color palette
        const barColor = '#1db954';
        const decayRate = 0.93;

        const spacing = this.canvas.width / this.barCount;
        const barWidth = spacing * 0.7;

        for (let i = 0; i < this.barCount; i++) {
            // Decaying amplitude
            this.amplitudes[i] *= decayRate;
            if (this.amplitudes[i] < 0.1) this.amplitudes[i] = 0;

            // Minor ambient playback music noise
            const ambient = Math.sin(Date.now() * 0.002 + i * 0.5) * 1.5 + 2.5;
            const height = Math.min(this.canvas.height - 4, this.amplitudes[i] + ambient);

            const x = i * spacing + (spacing - barWidth) / 2;
            const y = this.canvas.height - height - 2;

            // Draw clean vertical rounded equalizer bar
            this.ctx.fillStyle = barColor;
            this.ctx.beginPath();
            
            // Draw a rounded rectangle for standard clean look
            if (typeof this.ctx.roundRect === 'function') {
                this.ctx.roundRect(x, y, barWidth, height, 2);
                this.ctx.fill();
            } else {
                this.ctx.rect(x, y, barWidth, height);
                this.ctx.fill();
            }
        }
    }
}

let activeTypistVisualizer = null;

// Master execution hooks
document.addEventListener('DOMContentLoaded', init);
