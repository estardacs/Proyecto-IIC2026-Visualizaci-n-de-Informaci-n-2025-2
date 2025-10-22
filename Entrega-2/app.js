class PizzaIndexApp {
    constructor() {
        this.activeCategories = new Set(Object.keys(categoryConfig));
        this.chartManager = null;
        this.isPlaying = false;
        this.yearRange = { start: 1983, end: 2025 };
        this.startSlider = null;
        this.endSlider = null;
    }

    init() {
        this.chartManager = new ChartManager('pizzaChart');
        this.createFilters();
        this.createYearRangeControls();
        this.setupSoundControls();
        this.updateStats();
        this.chartManager.update(this.activeCategories);
        this.setupResizeListener();
        this.setupAudioUnlockListener();
    }

    setupAudioUnlockListener() {
        const unlockAudio = async () => {
            await audioManager.init();
        };

        document.body.addEventListener('mousedown', unlockAudio, { once: true });
        document.body.addEventListener('touchstart', unlockAudio, { once: true });
    }

    createFilters() {
        const filterGroup = document.getElementById('filterGroup');
        const iconMap = {
            'Invasiones Terrestres': 'assets/icons/militar.svg',
            'Bombardeos y Ataques Aéreos': 'assets/icons/bombardeo.svg',
            'Operaciones Especiales': 'assets/icons/espia.svg',
            'Atentados Terroristas': 'assets/icons/terrorista.svg',
            'Crisis Políticas': 'assets/icons/politica.svg',
            'Crisis Económicas': 'assets/icons/crisis.svg'
        };

        Object.entries(categoryConfig).forEach(([category, config]) => {
            const button = document.createElement('button');
            button.className = 'filter-item active';
            button.style.color = config.color;
            button.setAttribute('data-category', category);

            const iconImg = document.createElement('img');
            iconImg.className = 'filter-icon-img';
            iconImg.src = iconMap[category];
            iconImg.alt = category;

            const colorBox = document.createElement('span');
            colorBox.className = 'color-indicator';
            colorBox.style.backgroundColor = config.color;

            const label = document.createElement('span');
            label.className = 'filter-label';
            label.textContent = category;

            button.appendChild(iconImg);
            button.appendChild(colorBox);
            button.appendChild(label);

            button.addEventListener('click', () => this.toggleCategory(category, button));
            filterGroup.appendChild(button);
        });
    }

    createYearRangeControls() {
        this.startSlider = document.getElementById('startYearSlider');
        this.endSlider = document.getElementById('endYearSlider');
        const startLabel = document.getElementById('startYearLabel');
        const endLabel = document.getElementById('endYearLabel');

        this.startSlider.addEventListener('input', (e) => {
            let startValue = parseInt(e.target.value);
            let endValue = parseInt(this.endSlider.value);

            if (startValue > endValue) {
                startValue = endValue;
                this.startSlider.value = startValue;
            }

            startLabel.textContent = startValue;
            this.yearRange.start = startValue;
            this.updateSliderProgress(startValue, endValue);
            this.updateStats();
            this.chartManager.updateWithYearRange(this.activeCategories, this.yearRange);
        });

        this.endSlider.addEventListener('input', (e) => {
            let endValue = parseInt(e.target.value);
            let startValue = parseInt(this.startSlider.value);

            if (endValue < startValue) {
                endValue = startValue;
                this.endSlider.value = endValue;
            }

            endLabel.textContent = endValue;
            this.yearRange.end = endValue;
            this.updateSliderProgress(startValue, endValue);
            this.updateStats();
            this.chartManager.updateWithYearRange(this.activeCategories, this.yearRange);
        });

        document.getElementById('resetYearRange').addEventListener('click', () => {
            this.resetYearRange();
        });

        this.updateSliderProgress(1983, 2025);
    }

    updateSliderProgress(startValue, endValue) {
        const wrapper = document.querySelector('.range-slider-wrapper');
        if (!wrapper) return;

        const min = 1983;
        const max = 2025;
        const range = max - min;

        if (!this.startSlider || !this.endSlider) return;

        const wrapperWidth = wrapper.offsetWidth;
        const padding = 60;
        const availableWidth = wrapperWidth - (padding * 2);

        const startPercent = (startValue - min) / range;
        const endPercent = (endValue - min) / range;

        const startPos = padding + (startPercent * availableWidth);
        const endPos = padding + (endPercent * availableWidth);

        wrapper.style.setProperty('--progress-left', `${startPos}px`);
        wrapper.style.setProperty('--progress-width', `${endPos - startPos}px`);
    }

    toggleCategory(category, element) {
        if (this.activeCategories.has(category)) {
            this.activeCategories.delete(category);
            element.classList.remove('active');
        } else {
            this.activeCategories.add(category);
            element.classList.add('active');
        }

        this.updateStats();
        this.chartManager.updateWithYearRange(this.activeCategories, this.yearRange);
    }

    updateStats() {
        const filtered = crisisEvents.filter(e => {
            const eventYear = parseInt(e.date.substring(0, 4));
            return this.activeCategories.has(e.category) &&
                eventYear >= this.yearRange.start &&
                eventYear <= this.yearRange.end;
        });

        const totalPizzas = filtered.reduce((sum, e) => sum + e.crisis, 0);
        const avgPizzas = filtered.length > 0 ?
            Math.round(totalPizzas / filtered.length) :
            0;
        const maxEvent = filtered.reduce(
            (max, e) => e.crisis > max.crisis ? e : max,
            filtered[0] || { crisis: 0, event: 'N/A' }
        );

        const statsContainer = document.getElementById('statsContainer');
        statsContainer.innerHTML = `
            <div class="stat-card">
                <h4>Total de Eventos</h4>
                <div class="value">${filtered.length}</div>
            </div>
            <div class="stat-card">
                <h4>Total de Pizzas</h4>
                <div class="value">${totalPizzas.toLocaleString()}</div>
            </div>
            <div class="stat-card">
                <h4>Promedio por Crisis</h4>
                <div class="value">${avgPizzas}</div>
            </div>
            <div class="stat-card">
                <h4>Evento Mayor</h4>
                <div class="value" style="font-size: 1rem;">${maxEvent.event}</div>
            </div>
        `;
    }

    resetYearRange() {
        this.yearRange = { start: 1983, end: 2025 };
        this.startSlider.value = 1983;
        this.endSlider.value = 2025;
        document.getElementById('startYearLabel').textContent = '1983';
        document.getElementById('endYearLabel').textContent = '2025';
        this.updateSliderProgress(1983, 2025);
        this.updateStats();
        this.chartManager.updateWithYearRange(this.activeCategories, this.yearRange);
    }

    setupSoundControls() {
        const playBtn = document.getElementById('playAllBtn');
        const stopBtn = document.getElementById('stopBtn');
        const resetBtn = document.getElementById('resetFiltersBtn');
        const volumeSlider = document.getElementById('volumeSlider');
        const volumeIconWrapper = document.getElementById('volumeIconWrapper');
        const volumeControl = volumeIconWrapper.parentElement;

        playBtn.addEventListener('click', () => this.playTimeline());
        stopBtn.addEventListener('click', () => this.stopTimeline());
        resetBtn.addEventListener('click', () => this.resetFilters());

        volumeSlider.addEventListener('input', (e) => {
            const volume = parseInt(e.target.value);
            audioManager.setVolume(volume);
            volumeControl.classList.toggle('is-muted', volume === 0);
        });

        volumeIconWrapper.addEventListener('click', () => {
            const { isMuted, volume } = audioManager.toggleMute();
            volumeSlider.value = isMuted ? 0 : volume;
            volumeControl.classList.toggle('is-muted', isMuted);
        });

        // Set initial volume
        const initialVolume = parseInt(volumeSlider.value);
        audioManager.setVolume(initialVolume);
        volumeControl.classList.toggle('is-muted', initialVolume === 0);
    }

    setupResizeListener() {
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                if (this.startSlider && this.endSlider) {
                    this.updateSliderProgress(
                        parseInt(this.startSlider.value),
                        parseInt(this.endSlider.value)
                    );
                }
            }, 100);
        });
    }

    async playTimeline() {
        if (this.isPlaying) return;

        const ready = await audioManager.init();
        if (!ready) {
            return;
        }

        this.isPlaying = true;
        const playBtn = document.getElementById('playAllBtn');
        const btnIcon = playBtn.querySelector('.btn-icon');
        const btnText = playBtn.querySelector('.btn-text');

        btnIcon.innerHTML = '⏸';
        btnIcon.classList.add('playing-indicator');
        btnText.textContent = 'Reproduciendo...';

        const monthlyData = this.chartManager.monthlyData;
        const chartContainer = document.querySelector('.chart-container');

        for (let i = 0; i < monthlyData.length && this.isPlaying; i++) {
            const data = monthlyData[i];

            this.chartManager.setPlaybackPosition(i);

            const barX = 100 + i * 5.8;
            chartContainer.scrollLeft = Math.max(0, barX - chartContainer.clientWidth / 2);

            if (data.event && data.excess > 0) {
                audioManager.playEventSound(data.event);

                this.chartManager.setHighlightedEvent(data.event);

                // --- INICIO DE LA CORRECCIÓN ---
                const canvasRect = this.chartManager.canvas.getBoundingClientRect();
                const clientX = canvasRect.left + (data.renderX || 0);
                const clientY = canvasRect.top + (data.renderTopY || 0);
                // --- FIN DE LA CORRECCIÓN ---

                this.chartManager.showTooltip(
                    data.event,
                    clientX,
                    clientY
                );

                await new Promise(resolve => setTimeout(resolve, 4000));
            } else {
                this.chartManager.setHighlightedEvent(null);
                this.chartManager.hideTooltip();

                await new Promise(resolve => setTimeout(resolve, 25));
            }
        }

        this.stopTimeline();
    }

    stopTimeline() {
        this.isPlaying = false;
        audioManager.stopAllSounds();

        const playBtn = document.getElementById('playAllBtn');
        const btnIcon = playBtn.querySelector('.btn-icon');
        const btnText = playBtn.querySelector('.btn-text');

        btnIcon.innerHTML = '▶';
        btnIcon.classList.remove('playing-indicator');
        btnText.textContent = 'Reproducir';

        this.chartManager.clearPlaybackLine();
        this.chartManager.setHighlightedEvent(null);
        this.chartManager.hideTooltip();
    }

    resetFilters() {
        this.activeCategories = new Set(Object.keys(categoryConfig));

        document.querySelectorAll('.filter-item').forEach(item => {
            item.classList.add('active');
        });

        this.updateStats();
        this.chartManager.updateWithYearRange(this.activeCategories, this.yearRange);
    }
}

let app;
window.addEventListener('DOMContentLoaded', () => {
    app = new PizzaIndexApp();
    app.init();
});

window.addEventListener('beforeunload', () => {
    if (audioManager) {
        audioManager.dispose();
    }
});

