class ChartManager {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.config = {
            margin: { top: 40, right: 40, bottom: 60, left: 100 },
            colors: {
                background: '#0f172a',
                baseline: '#3b82f6',
                text: '#94a3b8',
                eventText: '#f8fafc',
                axis: '#94a3b8'
            },
            barWidth: 5,
            barGap: 0.8,
            maxPizza: 250
        };
        this.monthlyData = [];
        this.hoveredEvent = null;
        this.playbackPosition = null;
        this.isHoverLocked = false; 
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseleave', () => this.handleMouseLeave());
        window.addEventListener('resize', () => this.draw());
    }

    update(activeCategories) {
        this.monthlyData = generateMonthlyData(activeCategories);
        this.draw();
    }

    updateWithYearRange(activeCategories, yearRange) {
        const allData = generateMonthlyData(activeCategories);
        this.monthlyData = allData.filter(d => {
            const year = parseInt(d.date.substring(0, 4));
            return year >= yearRange.start && year <= yearRange.end;
        });
        this.draw();
    }

    setHighlightedEvent(event) {
        this.hoveredEvent = event;
        this.draw();
    }

    draw() {
        if (!this.ctx) {
            return;
        }

        const dpr = window.devicePixelRatio || 1;
        const dataWidth = this.monthlyData.length * (this.config.barWidth + this.config.barGap);
        const totalWidth = dataWidth + this.config.margin.left + this.config.margin.right;
        const height = 600;

        this.canvas.width = totalWidth * dpr;
        this.canvas.height = height * dpr;
        this.ctx.scale(dpr, dpr);
        
        this.canvas.style.width = totalWidth + 'px';
        this.canvas.style.height = height + 'px';

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
        const topY = this.config.margin.top;
        const bottomY = this.config.margin.top + chartHeight;
        
        this.ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
        this.ctx.shadowBlur = 10;
        
        this.ctx.beginPath();
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 4;
        this.ctx.setLineDash([8, 4]);
        this.ctx.moveTo(x, topY);
        this.ctx.lineTo(x, bottomY);
        this.ctx.stroke();
        
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
        this.ctx.setLineDash([]);
        
        this.ctx.restore();
    }

    setPlaybackPosition(index) {
        this.playbackPosition = index;
        this.draw();
    }

    clearPlaybackLine() {
        this.playbackPosition = null;
        this.draw();
    }

    drawAxes(chartWidth, chartHeight) {
        this.ctx.save();
        
        this.ctx.font = '12px "Segoe UI"';
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
        this.ctx.translate(30, this.config.margin.top + chartHeight / 2 + 20);
        this.ctx.rotate(-Math.PI / 2);
        this.ctx.textAlign = 'center';
        this.ctx.font = 'bold 14px "Segoe UI"';
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
        if (this.monthlyData.length < 2) {
            return; 
        }

        this.ctx.save();

        const points = this.monthlyData.map((d, i) => ({
            x: this.config.margin.left + i * (this.config.barWidth + this.config.barGap) + this.config.barWidth / 2,
            y: this.config.margin.top + chartHeight - ((d.baseline || 0) / this.config.maxPizza) * chartHeight
        }));

        const path = new Path2D();
        const baseY = this.config.margin.top + chartHeight;

        path.moveTo(this.config.margin.left, baseY);
        path.lineTo(points[0].x, baseY);
        path.lineTo(points[0].x, points[0].y);

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

                const barWidth = isHighlighted ? this.config.barWidth + 2 : this.config.barWidth;
                const radius = barWidth / 2;

                this.ctx.beginPath();
                this.ctx.fillStyle = isHighlighted ? '#ffffff' : config.color;
                
                this.ctx.moveTo(x - barWidth/2, baseY);
                this.ctx.lineTo(x - barWidth/2, topY + radius);
                this.ctx.quadraticCurveTo(x - barWidth/2, topY, x - barWidth/2 + radius, topY);
                this.ctx.lineTo(x + barWidth/2 - radius, topY);
                this.ctx.quadraticCurveTo(x + barWidth/2, topY, x + barWidth/2, topY + radius);
                this.ctx.lineTo(x + barWidth/2, baseY);
                this.ctx.closePath();
                
                this.ctx.fill();

                d.renderX = x;
                d.renderBaseY = baseY;
                d.renderTopY = topY;
            }
        });

        this.ctx.restore();
    }

    async handleMouseMove(e) {
        if (this.isHoverLocked) {
            this.canvas.style.cursor = 'default';
            return;
        }

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
                // Se espera a que el audio se inicialice si es necesario
                await audioManager.playHoverSound(foundEvent);
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
        if (!event || !event.category) { 
            this.hideTooltip();
            return;
        }
        
        const config = categoryConfig[event.category];
        
        const monthIndex = getMonthIndex(event.date);
        if (monthIndex < 0 || monthIndex >= baselineData.length) {
            this.hideTooltip();
            return;
        }
        const baselineAtEvent = baselineData[monthIndex];
        const increase = baselineAtEvent > 0 ? Math.round(((event.crisis - baselineAtEvent) / baselineAtEvent) * 100) : 0;

        const iconMap = {
            'Invasiones Terrestres': 'assets/icons/militar.svg',
            'Bombardeos y Ataques Aéreos': 'assets/icons/bombardeo.svg',
            'Operaciones Especiales': 'assets/icons/espia.svg',
            'Atentados Terroristas': 'assets/icons/terrorista.svg',
            'Crisis Políticas': 'assets/icons/politica.svg',
            'Crisis Económicas': 'assets/icons/crisis.svg'
        };

        const iconSrc = iconMap[event.category] || '';

        tooltip.style.borderColor = config.color;

        tooltip.innerHTML = `
            <div class="tooltip-header" style="color: ${config.color};">
                <img src="${iconSrc}" alt="${event.category}" class="tooltip-icon">
                <h4>${event.event}</h4>
            </div>
            <div class="tooltip-body">
                <p><strong>Fecha:</strong> <span>${event.date}</span></p>
                <p><strong>Categoría:</strong> <span>${event.category}</span></p>
                <p><strong>Pizzas pedidas:</strong> <span>${event.crisis}</span></p>
                <p><strong>Promedio normal:</strong> <span>${baselineAtEvent}</span></p>
                <p><strong>Incremento:</strong> <span>+${increase}%</span></p>
            </div>
        `;

        tooltip.classList.add('visible');
        
        const tooltipRect = tooltip.getBoundingClientRect();
        const chartContainer = this.canvas.closest('.chart-container');
        const containerRect = chartContainer.getBoundingClientRect();

        const mouseXInContainer = clientX - containerRect.left;

        let left = mouseXInContainer + chartContainer.scrollLeft + 20;

        let top = clientY - containerRect.top - (tooltipRect.height / 2);

        if (mouseXInContainer + 20 + tooltipRect.width > containerRect.width) {
            left = mouseXInContainer + chartContainer.scrollLeft - tooltipRect.width - 20;
        }
        
        top = Math.max(10, Math.min(top, containerRect.height - tooltipRect.height - 10));
        
        tooltip.style.transform = 'none';
        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
    }

    hideTooltip() {
        const tooltip = document.getElementById('tooltip');
        if (tooltip.classList.contains('visible')) {
            this.isHoverLocked = true;
            setTimeout(() => {
                this.isHoverLocked = false;
            }, 100); 
        }
        tooltip.classList.remove('visible');
    }
}

