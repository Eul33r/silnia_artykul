/**
 * Wzory skróconego mnożenia - Interaktywna wizualizacja
 * 2D i 3D animacje pokazujące pochodzenie wzorów
 */

class BinomialVisualizer {
    constructor(canvasId, is3D = false) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.is3D = is3D;
        this.a = 60;
        this.b = 40;
        this.c = 30;
        this.padding = 40;
        this.colors = {
            a2: '#FF6B6B',
            b2: '#4ECDC4',
            ab: '#FFE66D',
            abc: '#95E1D3',
            abcSides: '#FF8C94',
            other: '#C7CEEA'
        };
        
        // Ustawianie rozmiaru canvas
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width - 20;
        this.canvas.height = 400;
    }

    drawSquare(a, b) {
        const startX = this.padding + 50;
        const startY = this.padding + 50;
        const totalSide = a + b;
        const scale = 200 / totalSide;

        // Duży kwadrat (zewnętrzny)
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(startX, startY, totalSide * scale, totalSide * scale);

        // Kwadrat a²
        this.ctx.fillStyle = this.colors.a2;
        this.ctx.fillRect(startX, startY, a * scale, a * scale);

        // Prostokąt ab (1)
        this.ctx.fillStyle = this.colors.ab;
        this.ctx.fillRect(startX + a * scale, startY, b * scale, a * scale);

        // Prostokąt ab (2)
        this.ctx.fillStyle = this.colors.ab;
        this.ctx.fillRect(startX, startY + a * scale, a * scale, b * scale);

        // Kwadrat b²
        this.ctx.fillStyle = this.colors.b2;
        this.ctx.fillRect(startX + a * scale, startY + a * scale, b * scale, b * scale);

        // Etykiety
        this.ctx.fillStyle = '#000';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        // Etykieta a²
        this.ctx.fillText('a²', startX + a * scale / 2, startY + a * scale / 2);

        // Etykieta ab
        this.ctx.fillText('ab', startX + a * scale + b * scale / 2, startY + a * scale / 2);
        this.ctx.fillText('ab', startX + a * scale / 2, startY + a * scale + b * scale / 2);

        // Etykieta b²
        this.ctx.fillText('b²', startX + a * scale + b * scale / 2, startY + a * scale + b * scale / 2);

        // Wymiary boczne
        this.ctx.font = '12px Arial';
        this.ctx.fillStyle = '#666';
        this.ctx.textAlign = 'right';
        this.ctx.fillText('a', startX - 15, startY + a * scale / 2);
        this.ctx.textAlign = 'left';
        this.ctx.fillText('b', startX + a * scale + 15, startY + a * scale / 2);
        this.ctx.textAlign = 'center';
        this.ctx.fillText('a', startX + a * scale / 2, startY - 15);
        this.ctx.fillText('b', startX + a * scale + b * scale / 2, startY - 15);
    }

    drawDifference(a, b) {
        const startX = this.padding + 50;
        const startY = this.padding + 50;
        const scale = 200 / a;

        // Duży kwadrat a²
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.fillStyle = this.colors.a2;
        this.ctx.fillRect(startX, startY, a * scale, a * scale);
        this.ctx.strokeRect(startX, startY, a * scale, a * scale);

        // Mały kwadrat b² (do odjęcia)
        this.ctx.fillStyle = this.colors.b2;
        this.ctx.fillRect(startX + a * scale - b * scale, startY, b * scale, b * scale);
        this.ctx.strokeRect(startX + a * scale - b * scale, startY, b * scale, b * scale);

        // Zaznaczenie obszaru a² - b²
        this.ctx.fillStyle = this.colors.ab;
        this.ctx.fillRect(startX, startY + b * scale, (a - b) * scale, (a - b) * scale);

        this.ctx.fillStyle = this.colors.ab;
        this.ctx.fillRect(startX + (a - b) * scale, startY + b * scale, b * scale, (a - b) * scale);

        // Etykiety
        this.ctx.fillStyle = '#000';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        this.ctx.fillText('(a-b)(a+b)', startX + a * scale / 2, startY + a * scale / 2);
    }

    drawCube(a, b) {
        const startX = 80;
        const startY = 80;
        const scale = 1.2;

        const drawCubeWithSplit = (x, y, side, colors) => {
            const s = side * scale;
            const offset = s * 0.3;

            // Front face
            this.ctx.fillStyle = colors[0];
            this.ctx.fillRect(x, y, side * scale, side * scale);
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(x, y, side * scale, side * scale);

            // Top face
            this.ctx.fillStyle = colors[1];
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(x + offset, y - offset);
            this.ctx.lineTo(x + s + offset, y - offset);
            this.ctx.lineTo(x + s, y);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.stroke();

            // Right face
            this.ctx.fillStyle = colors[2];
            this.ctx.beginPath();
            this.ctx.moveTo(x + s, y);
            this.ctx.lineTo(x + s + offset, y - offset);
            this.ctx.lineTo(x + s + offset, y + s - offset);
            this.ctx.lineTo(x + s, y + s);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.stroke();
        };

        // Sześcian a³ (front)
        drawCubeWithSplit(startX, startY, a, [
            this.colors.a2,
            '#ff9999',
            '#ffcccc'
        ]);

        // Sześciany i prostopadłościany b
        drawCubeWithSplit(startX + a * scale + 10, startY, b, [
            this.colors.b2,
            '#66dddd',
            '#99eeee'
        ]);

        // Legenda
        this.ctx.fillStyle = '#000';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('a³', startX + a * scale / 2 - 20, startY + a * scale + 30);
        this.ctx.fillText('b³', startX + a * scale + b * scale / 2 + 10, startY + b * scale + 30);
    }

    drawSquare3Variables(a, b, c) {
        const startX = this.padding + 20;
        const startY = this.padding + 20;
        const totalSide = a + b + c;
        const scale = 180 / totalSide;

        // Rysowanie głównego kwadratu
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(startX, startY, totalSide * scale, totalSide * scale);

        const colors = [this.colors.a2, this.colors.b2, this.colors.abc];
        const terms = [a, b, c];
        let xOffset = 0;

        // Rysowanie głównych kwadratów (a², b², c²)
        for (let i = 0; i < 3; i++) {
            this.ctx.fillStyle = colors[i];
            this.ctx.fillRect(
                startX + xOffset * scale,
                startY + xOffset * scale,
                terms[i] * scale,
                terms[i] * scale
            );

            // Linie dzielące
            this.ctx.strokeStyle = '#999';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(startX + xOffset * scale, startY);
            this.ctx.lineTo(startX + xOffset * scale, startY + totalSide * scale);
            this.ctx.moveTo(startX, startY + xOffset * scale);
            this.ctx.lineTo(startX + totalSide * scale, startY + xOffset * scale);
            this.ctx.stroke();

            xOffset += terms[i];
        }

        // Rysowanie prostokątów ab, bc, ca
        const ab_scale = this.colors.ab;
        xOffset = 0;

        // ab (u góry i z boku)
        this.ctx.fillStyle = ab_scale;
        this.ctx.fillRect(startX + a * scale, startY, b * scale, a * scale);
        this.ctx.fillRect(startX, startY + a * scale, a * scale, b * scale);

        // bc (u góry i z boku)
        this.ctx.fillStyle = this.colors.abcSides;
        this.ctx.fillRect(startX + (a + b) * scale, startY + a * scale, c * scale, b * scale);
        this.ctx.fillRect(startX + a * scale, startY + (a + b) * scale, b * scale, c * scale);

        // ca (u góry i z boku)
        this.ctx.fillStyle = '#FFA07A';
        this.ctx.fillRect(startX + (a + b) * scale, startY, c * scale, a * scale);
        this.ctx.fillRect(startX, startY + (a + b) * scale, a * scale, c * scale);

        // Etykiety
        this.ctx.fillStyle = '#000';
        this.ctx.font = 'bold 11px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        this.ctx.fillText('a²', startX + a * scale / 2, startY + a * scale / 2);
        this.ctx.fillText('b²', startX + a * scale + b * scale / 2, startY + a * scale + b * scale / 2);
        this.ctx.fillText('c²', startX + (a + b) * scale + c * scale / 2, startY + (a + b) * scale + c * scale / 2);

        this.ctx.font = '10px Arial';
        this.ctx.fillText('ab', startX + a * scale + b * scale / 2, startY + a * scale / 2);
        this.ctx.fillText('ab', startX + a * scale / 2, startY + a * scale + b * scale / 2);
        this.ctx.fillText('bc', startX + (a + b) * scale + c * scale / 2, startY + a * scale + b * scale / 2);
        this.ctx.fillText('bc', startX + a * scale + b * scale / 2, startY + (a + b) * scale + c * scale / 2);
        this.ctx.fillText('ca', startX + (a + b) * scale + c * scale / 2, startY + a * scale / 2);
        this.ctx.fillText('ca', startX + a * scale / 2, startY + (a + b) * scale + c * scale / 2);
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    render(type) {
        this.clear();
        switch (type) {
            case 'sum-square':
                this.drawSquare(this.a, this.b);
                break;
            case 'diff-square':
                this.drawDifference(this.a, this.b);
                break;
            case 'cube':
                this.drawCube(this.a, this.b);
                break;
            case 'triple-square':
                this.drawSquare3Variables(this.a, this.b, this.c);
                break;
        }
    }
}

// Inicjalizacja wizualizatorów
let visualizers = {};

document.addEventListener('DOMContentLoaded', () => {
    // Inicjalizacja karty (a+b)²
    const sumSquareCanvas = document.getElementById('canvas-sum-square');
    if (sumSquareCanvas) {
        visualizers['sum-square'] = new BinomialVisualizer('canvas-sum-square');
        
        const aSlider = document.getElementById('slider-a-sum');
        const bSlider = document.getElementById('slider-b-sum');
        
        if (aSlider && bSlider) {
            const updateDisplay = () => {
                visualizers['sum-square'].a = parseFloat(aSlider.value);
                visualizers['sum-square'].b = parseFloat(bSlider.value);
                document.getElementById('value-a-sum').textContent = aSlider.value;
                document.getElementById('value-b-sum').textContent = bSlider.value;
                visualizers['sum-square'].render('sum-square');
            };
            
            aSlider.addEventListener('input', updateDisplay);
            bSlider.addEventListener('input', updateDisplay);
            updateDisplay();
        }
    }

    // Inicjalizacja karty (a-b)²
    const diffSquareCanvas = document.getElementById('canvas-diff-square');
    if (diffSquareCanvas) {
        visualizers['diff-square'] = new BinomialVisualizer('canvas-diff-square');
        
        const aSlider = document.getElementById('slider-a-diff');
        const bSlider = document.getElementById('slider-b-diff');
        
        if (aSlider && bSlider) {
            const updateDisplay = () => {
                visualizers['diff-square'].a = parseFloat(aSlider.value);
                visualizers['diff-square'].b = parseFloat(bSlider.value);
                document.getElementById('value-a-diff').textContent = aSlider.value;
                document.getElementById('value-b-diff').textContent = bSlider.value;
                visualizers['diff-square'].render('diff-square');
            };
            
            aSlider.addEventListener('input', updateDisplay);
            bSlider.addEventListener('input', updateDisplay);
            updateDisplay();
        }
    }

    // Inicjalizacja karty (a+b)³
    const sumCubeCanvas = document.getElementById('canvas-sum-cube');
    if (sumCubeCanvas) {
        visualizers['sum-cube'] = new BinomialVisualizer('canvas-sum-cube');
        
        const aSlider = document.getElementById('slider-a-cube');
        const bSlider = document.getElementById('slider-b-cube');
        
        if (aSlider && bSlider) {
            const updateDisplay = () => {
                visualizers['sum-cube'].a = parseFloat(aSlider.value);
                visualizers['sum-cube'].b = parseFloat(bSlider.value);
                document.getElementById('value-a-cube').textContent = aSlider.value;
                document.getElementById('value-b-cube').textContent = bSlider.value;
                visualizers['sum-cube'].render('cube');
            };
            
            aSlider.addEventListener('input', updateDisplay);
            bSlider.addEventListener('input', updateDisplay);
            updateDisplay();
        }
    }

    // Inicjalizacja karty a² - b²
    const diffSquaresCanvas = document.getElementById('canvas-diff-squares');
    if (diffSquaresCanvas) {
        visualizers['diff-squares'] = new BinomialVisualizer('canvas-diff-squares');
        
        const aSlider = document.getElementById('slider-a-squares');
        const bSlider = document.getElementById('slider-b-squares');
        
        if (aSlider && bSlider) {
            const updateDisplay = () => {
                visualizers['diff-squares'].a = parseFloat(aSlider.value);
                visualizers['diff-squares'].b = parseFloat(bSlider.value);
                document.getElementById('value-a-squares').textContent = aSlider.value;
                document.getElementById('value-b-squares').textContent = bSlider.value;
                visualizers['diff-squares'].render('diff-square');
            };
            
            aSlider.addEventListener('input', updateDisplay);
            bSlider.addEventListener('input', updateDisplay);
            updateDisplay();
        }
    }

    // Inicjalizacja karty (a+b+c)²
    const tripleSquareCanvas = document.getElementById('canvas-triple-square');
    if (tripleSquareCanvas) {
        visualizers['triple-square'] = new BinomialVisualizer('canvas-triple-square');
        
        const aSlider = document.getElementById('slider-a-triple');
        const bSlider = document.getElementById('slider-b-triple');
        const cSlider = document.getElementById('slider-c-triple');
        
        if (aSlider && bSlider && cSlider) {
            const updateDisplay = () => {
                visualizers['triple-square'].a = parseFloat(aSlider.value);
                visualizers['triple-square'].b = parseFloat(bSlider.value);
                visualizers['triple-square'].c = parseFloat(cSlider.value);
                document.getElementById('value-a-triple').textContent = aSlider.value;
                document.getElementById('value-b-triple').textContent = bSlider.value;
                document.getElementById('value-c-triple').textContent = cSlider.value;
                visualizers['triple-square'].render('triple-square');
            };
            
            aSlider.addEventListener('input', updateDisplay);
            bSlider.addEventListener('input', updateDisplay);
            cSlider.addEventListener('input', updateDisplay);
            updateDisplay();
        }
    }

    // Obsługa zakładek
    const tabButtons = document.querySelectorAll('.wsm-tab-button');
    const tabContents = document.querySelectorAll('.wsm-tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');

            // Usunięcie aktywności z wszystkich
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Dodanie aktywności do wybranego
            button.classList.add('active');
            document.getElementById(`tab-${tabName}`).classList.add('active');

            // Przerysowanie canvas w nowej karcie
            setTimeout(() => {
                Object.values(visualizers).forEach(viz => {
                    if (viz.canvas && viz.canvas.offsetWidth > 0) {
                        viz.resizeCanvas();
                    }
                });
            }, 50);
        });
    });
});
