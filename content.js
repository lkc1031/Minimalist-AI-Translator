let aiButton = null;
let translationTooltip = null;
let currentSelection = null;

function showAiButton(range) {
    removeAiButton();
    removeTranslationTooltip();

    aiButton = document.createElement('button');
    aiButton.textContent = 'AI';
    aiButton.id = 'ai-translate-button';

    const rect = range.getBoundingClientRect();

    const buttonTop = rect.bottom + window.scrollY + 5;
    const buttonLeft = rect.right + window.scrollX - aiButton.offsetWidth / 2;

    setTimeout(() => {
        const btnWidth = aiButton.offsetWidth || 30;
        const btnHeight = aiButton.offsetHeight || 20;
        const finalLeft = rect.right + window.scrollX - (btnWidth / 2);
        const finalTop = rect.bottom + window.scrollY + 5;

        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const adjustedLeft = Math.min(finalLeft, viewportWidth + window.scrollX - btnWidth - 5);
        const adjustedTop = Math.min(finalTop, viewportHeight + window.scrollY - btnHeight - 5);

        aiButton.style.position = 'absolute';
        aiButton.style.left = `${adjustedLeft}px`;
        aiButton.style.top = `${adjustedTop}px`;
        aiButton.style.zIndex = '9999';
    }, 0);

    aiButton.addEventListener('click', handleAiButtonClick);

    document.body.appendChild(aiButton);
}

function removeAiButton() {
    if (aiButton && aiButton.parentNode) {
        aiButton.removeEventListener('click', handleAiButtonClick);
        aiButton.parentNode.removeChild(aiButton);
        aiButton = null;
    }
}

function showTranslationTooltip(text, buttonRect) {
    removeTranslationTooltip();

    translationTooltip = document.createElement('div');
    translationTooltip.id = 'ai-translation-tooltip';
    translationTooltip.style.position = 'absolute';
    translationTooltip.style.zIndex = '10000';
    translationTooltip.style.background = '#fff';
    translationTooltip.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)';
    translationTooltip.style.padding = '16px 65px 12px 12px';
    translationTooltip.style.borderRadius = '6px';
    translationTooltip.style.maxWidth = '350px';
    translationTooltip.style.wordBreak = 'break-word';
    translationTooltip.style.minWidth = '120px';
    translationTooltip.style.minHeight = '32px';

    const translationText = document.createElement('span');
    translationText.textContent = text;
    translationText.id = 'ai-translation-text';
    translationText.style.display = 'inline-block';
    translationText.style.marginRight = '0';
    translationText.style.verticalAlign = 'middle';

    const copyBtn = document.createElement('button');
    copyBtn.textContent = 'Copy';
    copyBtn.style.position = 'absolute';
    copyBtn.style.top = '6px';
    copyBtn.style.right = '8px';
    copyBtn.style.cursor = 'pointer';
    copyBtn.style.fontSize = '0.9em';
    copyBtn.style.padding = '2px 8px';
    copyBtn.style.border = '1px solid #ccc';
    copyBtn.style.borderRadius = '4px';
    copyBtn.style.background = '#f5f5f5';
    copyBtn.style.zIndex = '10001';

    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(text).then(() => {
            copyBtn.textContent = 'Copied!';
            setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1200);
        });
    });

    chrome.storage.sync.get(['textColor'], (result) => {
        if (result.textColor) {
            translationText.style.color = result.textColor;
        } else {
            translationText.style.color = '#333';
        }
    });

    translationTooltip.appendChild(translationText);
    translationTooltip.appendChild(copyBtn);

    const tooltipTop = buttonRect.bottom + window.scrollY + 5;
    const tooltipLeft = buttonRect.left + window.scrollX;
    translationTooltip.style.left = `${tooltipLeft}px`;
    translationTooltip.style.top = `${tooltipTop}px`;

    document.body.appendChild(translationTooltip);
}

function removeTranslationTooltip() {
    if (translationTooltip && translationTooltip.parentNode) {
        translationTooltip.parentNode.removeChild(translationTooltip);
        translationTooltip = null;
    }
}

function handleAiButtonClick(event) {
    event.stopPropagation();

    if (currentSelection) {
        const selectedText = currentSelection.toString().trim();
        if (selectedText) {
            const buttonRect = aiButton.getBoundingClientRect();
            showTranslationTooltip('Translating...', buttonRect);

            chrome.runtime.sendMessage(
                { action: 'translate', text: selectedText },
                (response) => {
                    if (chrome.runtime.lastError) {
                        showTranslationTooltip(`Translation error: ${chrome.runtime.lastError.message}`, buttonRect);
                        return;
                    }

                    if (response) {
                        if (response.success) {
                            showTranslationTooltip(response.translation, buttonRect);
                        } else {
                            showTranslationTooltip(`Translation error: ${response.error}`, buttonRect);
                        }
                    } else {
                         showTranslationTooltip('Translation error: No response', buttonRect);
                    }
                }
            );
        }
    }
}

document.addEventListener('mouseup', (event) => {
    setTimeout(() => {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();

        if (aiButton && aiButton.contains(event.target)) {
            return;
        }
        if (translationTooltip && translationTooltip.contains(event.target)) {
            return;
        }

        if (selectedText.length > 0) {
            currentSelection = selection.getRangeAt(0);
            showAiButton(currentSelection);
        } else {
            removeAiButton();
            removeTranslationTooltip();
            currentSelection = null;
        }
    }, 10);
});

document.addEventListener('mousedown', (event) => {
    if (aiButton && !aiButton.contains(event.target) &&
        translationTooltip && !translationTooltip.contains(event.target))
    {
        removeAiButton();
        removeTranslationTooltip();
        currentSelection = null;
    } else if (aiButton && !aiButton.contains(event.target) && !translationTooltip) {
        removeAiButton();
        currentSelection = null;
    }
});
