document.addEventListener('DOMContentLoaded', () => {
    const tempInput = document.getElementById('temp-input');
    const unitSelect = document.getElementById('unit-select');
    const convertBtn = document.getElementById('convert-btn');
    const errorMsg = document.getElementById('error-message');
    const resultsGrid = document.getElementById('results-grid');
    const tempStatusText = document.getElementById('temp-status-text');

    convertBtn.addEventListener('click', performConversion);
    unitSelect.addEventListener('change', performConversion);

    tempInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            performConversion();
        }
    });

    function performConversion() {
        errorMsg.textContent = '';
        const rawValue = tempInput.value.trim();

        if (rawValue === '' || isNaN(rawValue)) {
            errorMsg.textContent = 'Please enter a valid numeric temperature value.';
            clearOutputs();
            return;
        }

        const inputVal = parseFloat(rawValue);
        const selectedUnit = unitSelect.value;

        // Absolute Zero Guard
        if (
            (selectedUnit === 'C' && inputVal < -273.15) ||
            (selectedUnit === 'F' && inputVal < -459.67) ||
            (selectedUnit === 'K' && inputVal < 0)
        ) {
            errorMsg.textContent = 'Error: Temperature cannot be below Absolute Zero (-273.15°C / 0K).';
            clearOutputs();
            return;
        }

        // Calculations
        let c, f, k;
        if (selectedUnit === 'C') {
            c = inputVal;
            f = (c * 9/5) + 32;
            k = c + 273.15;
        } else if (selectedUnit === 'F') {
            f = inputVal;
            c = (f - 32) * 5/9;
            k = c + 273.15;
        } else if (selectedUnit === 'K') {
            k = inputVal;
            c = k - 273.15;
            f = (c * 9/5) + 32;
        }

        // Output grid excluding input unit
        resultsGrid.innerHTML = '';
        if (selectedUnit !== 'C') resultsGrid.appendChild(createResultCard('Celsius', `${c.toFixed(2)} °C`));
        if (selectedUnit !== 'F') resultsGrid.appendChild(createResultCard('Fahrenheit', `${f.toFixed(2)} °F`));
        if (selectedUnit !== 'K') resultsGrid.appendChild(createResultCard('Kelvin', `${k.toFixed(2)} K`));

        // Update state and the status
        updateThemeAndStatus(c);
    }

    function createResultCard(label, value) {
        const card = document.createElement('div');
        card.className = 'result-card';
        card.innerHTML = `
            <span class="unit-label">${label}</span>
            <span class="result-val">${value}</span>
        `;
        return card;
    }

    function updateThemeAndStatus(celsiusVal) {
        document.body.classList.remove('theme-cold', 'theme-warm', 'theme-hot');

        if (celsiusVal < 15) {
            document.body.classList.add('theme-cold');
            tempStatusText.textContent = 'COLD';
        } else if (celsiusVal >= 15 && celsiusVal <= 32) {
            document.body.classList.add('theme-warm');
            tempStatusText.textContent = 'WARM';
        } else {
            document.body.classList.add('theme-hot');
            tempStatusText.textContent = 'HOT';
        }
    }

    function clearOutputs() {
        document.body.classList.remove('theme-cold', 'theme-warm', 'theme-hot');
        resultsGrid.innerHTML = `
            <div class="result-card"><span class="unit-label">Output 1</span><span class="result-val">--</span></div>
            <div class="result-card"><span class="unit-label">Output 2</span><span class="result-val">--</span></div>
        `;
        tempStatusText.textContent = 'Enter a value to calculate state';
    }

    clearOutputs();
});