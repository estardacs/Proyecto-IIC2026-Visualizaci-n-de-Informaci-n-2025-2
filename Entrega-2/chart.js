class ChartManager {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.config = {
            margin: { top: 20, right: 0, bottom: 40, left: 80 }, 
            colors: {
                background: '#ffffff',
                baseline: '#0e7490',
                text: '#6b7280',
                eventText: '#111827',
                axis: '#6b7280'
            },
            barWidth: 5,
            barGap: 0.8,
            maxPizza: 250
        };
        this.monthlyData = [];
        this.hoveredEvent = null;
        this.playbackPosition = null;
        this.hoverCooldown = false;

        this.resizeTimer = null;
        this.isInitialized = false; 

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseleave', () => this.handleMouseLeave());

        window.addEventListener('resize', () => {
            clearTimeout(this.resizeTimer);
            this.resizeTimer = setTimeout(() => {
                this.draw(true); 
            }, 100); 
        });
    }

    darkenColor(color, percent) {
        const num = parseInt(color.replace("#",""), 16);
        const amt = Math.round(2.55 * percent * 100);
        const R = Math.max((num >> 16) - amt, 0);
        const G = Math.max((num >> 8 & 0x00FF) - amt, 0);
        const B = Math.max((num & 0x0000FF) - amt, 0);
        return "#" + (0x1000000 + (R * 0x10000) + (G * 0x100) + B).toString(16).slice(1);
    }

    update(activeCategories) {
        this.monthlyData = generateMonthlyData(activeCategories);

        if (!this.isInitialized) {
            setTimeout(() => {

                this.draw(true); 
                
                this.draw(true);
                
                this.isInitialized = true;
                
            }, 100);
        } else {
            this.draw(true); 
        }
    }

    updateWithYearRange(activeCategories, yearRange) {
        const allData = generateMonthlyData(activeCategories);
        this.monthlyData = allData.filter(d => {
            const year = parseInt(d.date.substring(0, 4));
            return year >= yearRange.start && year <= yearRange.end;
        });
        this.draw(true); 
    }

    setHighlightedEvent(event) {
        this.hoveredEvent = event;
        this.draw(false);
    }

    draw(resetScroll = false) { 
        if (!this.ctx) {
            console.error("Canvas context not found.");
            return;
        }

        const dpr = window.devicePixelRatio || 1;
        const container = this.canvas.parentElement;
        const containerHeight = container.clientHeight;
        
        let dataWidth = this.monthlyData.length * (this.config.barWidth + this.config.barGap);
        if (this.monthlyData.length > 0) {
            dataWidth -= this.config.barGap; 
        }
        
        const highlightBuffer = 1.5; 
        
        const totalWidth = dataWidth + this.config.margin.left + this.config.margin.right + highlightBuffer;
        
        const height = Math.max(containerHeight - 40, 400);

        this.canvas.width = totalWidth * dpr;
        this.canvas.height = height * dpr;
        this.ctx.scale(dpr, dpr);

        this.canvas.style.width = totalWidth + 'px';
        this.canvas.style.height = height + 'px';

        if (resetScroll && container.scrollWidth > container.clientWidth) {
            setTimeout(() => {
                container.scrollLeft = 0; 
            }, 0);
        }

        const chartHeight = height - this.config.margin.top - this.config.margin.bottom;

        this.ctx.fillStyle = this.config.colors.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawAxes(dataWidth, chartHeight);
        this.drawCrisisEvents(chartHeight);
        this.drawBaselineLine(chartHeight);

        if (this.playbackPosition !== null) {
            this.drawPlaybackLine(chartHeight);
        }
    }

    drawPlaybackLine(chartHeight) {
        if (this.playbackPosition === null || this.playbackPosition < 0 || this.playbackPosition >= this.monthlyData.length) return;

        this.ctx.save();

        const x = this.config.margin.left + this.playbackPosition * (this.config.barWidth + this.config.barGap) + this.config.barWidth / 2;
        const topY = this.config.margin.top + 15; 
        const bottomY = this.config.margin.top + chartHeight;

        this.ctx.beginPath();
        this.ctx.strokeStyle = '#1f2937';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([6, 3]);
        this.ctx.moveTo(x, topY);
        this.ctx.lineTo(x, bottomY);
        this.ctx.stroke();

        this.ctx.setLineDash([]);

        this.ctx.restore();
    }

    setPlaybackPosition(index) {
        this.playbackPosition = index;
        this.draw(false); 
    }

    clearPlaybackLine() {
        this.playbackPosition = null;
        this.draw(false); 
    }

    drawAxes(chartWidth, chartHeight) {
        this.ctx.save();

        this.ctx.font = '12px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
        this.ctx.fillStyle = this.config.colors.text;

        this.ctx.textAlign = 'right';
        this.ctx.textBaseline = 'middle';

        const tickCount = 5;
        for (let i = 0; i <= tickCount; i++) {
            const value = (this.config.maxPizza / tickCount) * i;
            const y = this.config.margin.top + chartHeight - (value / this.config.maxPizza) * chartHeight;

            this.ctx.fillText(Math.round(value), this.config.margin.left - 15, y);
        }

        this.ctx.save();
        this.ctx.translate(20, this.config.margin.top + chartHeight / 2);
        this.ctx.rotate(-Math.PI / 2);
        this.ctx.textAlign = 'center';
        this.ctx.font = '600 16px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
        this.ctx.fillStyle = this.config.colors.axis;
        this.ctx.fillText('Pizzas Pedidas', 0, 0);
        this.ctx.restore();

        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'top';

        this.monthlyData.forEach((d, i) => {
            if (d.date.endsWith('-01')) {
                const x = this.config.margin.left + i * (this.config.barWidth + this.config.barGap) + this.config.barWidth / 2;
                const y = this.config.margin.top + chartHeight + 15;
                const yearText = d.date.substring(0, 4);
                this.ctx.fillText(yearText, x, y);
            }
        });

        this.ctx.restore();
    }

    drawBaselineLine(chartHeight) {
        if (this.monthlyData.length < 2) return;

        this.ctx.save();

        const points = this.monthlyData.map((d, i) => ({
            x: this.config.margin.left + i * (this.config.barWidth + this.config.barGap) + this.config.barWidth / 2,
            y: this.config.margin.top + chartHeight - ((d.baseline || 0) / this.config.maxPizza) * chartHeight
        }));

        const path = new Path2D();
        const baseY = this.config.margin.top + chartHeight;

        path.moveTo(this.config.margin.left, baseY);
        
        path.lineTo(this.config.margin.left, points[0].y);

        for (let i = 0; i < points.length - 2; i++) {
            const xc = (points[i].x + points[i + 1].x) / 2;
            const yc = (points[i].y + points[i + 1].y) / 2;
            path.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
        }

        const lastPoint = points[points.length - 1];
        path.quadraticCurveTo(
            points[points.length - 2].x,
            points[points.length - 2].y,
            lastPoint.x,
            lastPoint.y
        );

        path.lineTo(lastPoint.x, baseY);
        path.lineTo(this.config.margin.left, baseY);
        path.closePath();

        this.ctx.fillStyle = this.config.colors.baseline + 'CC';
        this.ctx.fill(path);

        this.ctx.restore();
    }

    drawCrisisEvents(chartHeight) {
        this.ctx.save();
        const baseY = this.config.margin.top + chartHeight;

        this.monthlyData.forEach((d, i) => {
            if (d.excess > 0 && d.event && typeof d.baseline === 'number') {
                const x = this.config.margin.left + i * (this.config.barWidth + this.config.barGap) + this.config.barWidth / 2;
                const topY = this.config.margin.top + chartHeight - ((d.baseline + d.excess) / this.config.maxPizza) * chartHeight;

                const config = categoryConfig[d.event.category];
                const isHighlighted = this.hoveredEvent && this.hoveredEvent.date === d.event.date;

                const barWidth = isHighlighted ? this.config.barWidth + 3 : this.config.barWidth;
                const radius = barWidth / 2;

                this.ctx.beginPath();

                if (isHighlighted) {
                    this.ctx.fillStyle = this.darkenColor(config.color, 0.3);
                } else {
                    this.ctx.fillStyle = config.color;
                }

                this.ctx.moveTo(x - barWidth / 2, baseY);
                this.ctx.lineTo(x - barWidth / 2, topY + radius);
                this.ctx.quadraticCurveTo(x - barWidth / 2, topY, x - barWidth / 2 + radius, topY);
                this.ctx.lineTo(x + barWidth / 2 - radius, topY);
                this.ctx.quadraticCurveTo(x + barWidth / 2, topY, x + barWidth / 2, topY + radius);
                this.ctx.lineTo(x + barWidth / 2, baseY);
                this.ctx.closePath();

                this.ctx.fill();

                d.renderX = x;
                d.renderBaseY = baseY;
                d.renderTopY = topY;
            }
        });
        this.ctx.restore();
    }

    handleMouseMove(e) {
        if (this.hoverCooldown) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left);
        const y = (e.clientY - rect.top);

        let foundEvent = null;

        for (const d of this.monthlyData) {
            if (d.event && d.renderX && d.renderTopY && d.renderBaseY) {
                const distanceX = Math.abs(x - d.renderX);
                const isInYRange = y >= d.renderTopY && y <= d.renderBaseY;

                if (distanceX < 10 && isInYRange) {
                    foundEvent = d.event;
                    break;
                }
            }
        }

        if (foundEvent) {
            this.canvas.style.cursor = 'pointer';
            if (!this.hoveredEvent || this.hoveredEvent.date !== foundEvent.date) {
                audioManager.playHoverSound(foundEvent);
            }
            this.setHighlightedEvent(foundEvent);
            this.showTooltip(foundEvent, e.clientX, e.clientY);
        } else {
            this.canvas.style.cursor = 'default';
            this.setHighlightedEvent(null);
            this.hideTooltip();
        }
    }

    handleMouseLeave() {
        this.canvas.style.cursor = 'default';
        this.setHighlightedEvent(null);
        this.hideTooltip();
    }

    showTooltip(event, clientX, clientY) {
        const tooltip = document.getElementById('tooltip');
        const config = categoryConfig[event.category];
        const monthIndex = getMonthIndex(event.date);
        
        if (monthIndex < 0 || monthIndex >= baselineData.length) return;
        
        const baselineAtEvent = baselineData[monthIndex];
        const increase = Math.round(((event.crisis - baselineAtEvent) / baselineAtEvent) * 100);

        const iconMap = {
            'Invasiones Terrestres': 'assets/icons/militar.svg',
            'Bombardeos y Ataques Aéreos': 'assets/icons/bombardeo.svg',
            'Operaciones Especiales': 'assets/icons/espia.svg',
            'Atentados Terroristas': 'assets/icons/terrorista.svg',
            'Crisis Políticas': 'assets/icons/politica.svg',
            'Crisis Económicas': 'assets/icons/crisis.svg' 
        };
        const iconSrc = iconMap[event.category] || '';

        tooltip.innerHTML = `
            <div class="tooltip-header">
                <img src="${iconSrc}" alt="${event.category}" class="tooltip-icon" style="filter: none;">
                <h4 style="color: ${config.color};">${event.event}</h4>
            </div>
            <div class="tooltip-body">
                <p><strong>Fecha:</strong> <span>${event.date}</span></p>
                <p><strong>Categoría:</strong> <span>${event.category}</span></p>
                <p><strong>Pizzas pedidas:</strong> <span>${event.crisis}</span></p>
                <p><strong>Promedio normal:</strong> <span>${baselineAtEvent}</span></p>
                <p><strong>Incremento:</strong> <span style="color: ${config.color};">+${increase}%</span></p>
            </div>
        `;

        tooltip.classList.add('visible');

        const tooltipWidth = 240; 
        const tooltipHeight = tooltip.offsetHeight;
        const chartContainer = this.canvas.parentElement;
        const containerRect = chartContainer.getBoundingClientRect();

        const xInContainer = clientX - containerRect.left;
        const yInContainer = clientY - containerRect.top;

        let finalLeft;

        if ((containerRect.width - xInContainer) < (tooltipWidth + 20)) {
            finalLeft = chartContainer.scrollLeft + xInContainer - tooltipWidth - 20;
        } else {
            finalLeft = chartContainer.scrollLeft + xInContainer + 20;
        }

        let finalTop = yInContainer - tooltipHeight / 2;
        if (finalTop < 10) finalTop = 10;
        if (finalTop + tooltipHeight > containerRect.height - 10) {
            finalTop = containerRect.height - tooltipHeight - 10;
        }

        tooltip.style.left = `${finalLeft}px`;
        tooltip.style.top = `${finalTop}px`;
    }


    hideTooltip() {
        const tooltip = document.getElementById('tooltip');
        tooltip.classList.remove('visible');

        this.hoverCooldown = true;
        setTimeout(() => {
            this.hoverCooldown = false;
        }, 100);
    }
}








