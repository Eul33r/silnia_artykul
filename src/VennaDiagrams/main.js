// Venn diagram rendering on canvas
(() => {
	const canvas = document.getElementById('myCanvas');
	const ctx = canvas.getContext('2d');

	// Geometry (centers and radius)
	const R = 120;
	const A = { x: 220, y: 260, r: R };
	const B = { x: 420, y: 260, r: R };
	const C = { x: 320, y: 150, r: R };

	const expressions = {
		A: { label: 'A', fn: (a,b,c)=>a, color: 'rgba(200,50,50,0.6)' },
		B: { label: 'B', fn: (a,b,c)=>b, color: 'rgba(50,80,200,0.6)' },
		C: { label: 'C', fn: (a,b,c)=>c, color: 'rgba(30,140,50,0.6)' },
		Aub: { label: 'A ∪ B', fn: (a,b,c)=>a||b, color:'rgba(160,60,200,0.5)' },
		Aib: { label: 'A ∩ B', fn: (a,b,c)=>a&&b, color:'rgba(200,120,40,0.5)' },
		Amb: { label: 'A \ B', fn: (a,b,c)=>a && !b, color:'rgba(100,160,40,0.5)' },
		Buc: { label: 'B ∪ C', fn: (a,b,c)=>b||c, color:'rgba(120,30,180,0.5)' },
		Auc: { label: 'A ∪ C', fn: (a,b,c)=>a||c, color:'rgba(180,50,80,0.5)' },
		Aubuc: { label: 'A ∪ B ∪ C', fn: (a,b,c)=>a||b||c, color:'rgba(90,160,160,0.45)' },
		Bic: { label: 'B ∩ C', fn: (a,b,c)=>b&&c, color:'rgba(60,140,60,0.5)' },
		Aic: { label: 'A ∩ C', fn: (a,b,c)=>a&&c, color:'rgba(200,80,140,0.45)' },
		Aibic: { label: 'A ∩ B ∩ C', fn: (a,b,c)=>a&&b&&c, color:'rgba(40,100,160,0.45)' },
		BminusC: { label: 'B \ C', fn: (a,b,c)=>b && !c, color:'rgba(80,110,190,0.45)' },
		AminusC: { label: 'A \ C', fn: (a,b,c)=>a && !c, color:'rgba(200,70,70,0.45)' },
		BminusA: { label: 'B \ A', fn: (a,b,c)=>b && !a, color:'rgba(70,120,90,0.45)' },
		CminusB: { label: 'C \ B', fn: (a,b,c)=>c && !b, color:'rgba(120,60,140,0.45)' },
		CminusA: { label: 'C \ A', fn: (a,b,c)=>c && !a, color:'rgba(90,160,80,0.45)' },
		// complements and omega
		Aprime: { label: "A'", fn: (a,b,c)=>!a, color:'rgba(120,120,120,0.5)' },
		Bprime: { label: "B'", fn: (a,b,c)=>!b, color:'rgba(100,100,140,0.5)' },
		Cprime: { label: "C'", fn: (a,b,c)=>!c, color:'rgba(140,100,100,0.5)' },
		AprimeBprime: { label: "A' ∩ B'", fn: (a,b,c)=>!a && !b, color:'rgba(110,90,140,0.45)' },
		AprimeCprime: { label: "A' ∩ C'", fn: (a,b,c)=>!a && !c, color:'rgba(140,90,110,0.45)' },
		BprimeCprime: { label: "B' ∩ C'", fn: (a,b,c)=>!b && !c, color:'rgba(90,140,110,0.45)' },
		AprimeBprimeCprime: { label: "A' ∩ B' ∩ C'", fn: (a,b,c)=>!a && !b && !c, color:'rgba(80,120,140,0.45)' },
		AprimeUnionBprime: { label: "A' ∪ B'", fn: (a,b,c)=>!a || !b, color:'rgba(120,80,160,0.45)' },
		Omega: { label: 'Ω', fn: ()=>true, color:'rgba(0,0,0,0.25)' },
		AuBminusC: { label: 'A ∪ (B \ C)', fn: (a,b,c)=>a || (b && !c), color:'rgba(0,140,160,0.45)' },
		AibUc: { label: 'A ∩ (B ∪ C)', fn: (a,b,c)=>a && (b||c), color:'rgba(200,40,140,0.45)' },
		'(Aib)minusC': { label: '(A ∩ B) \ C', fn: (a,b,c)=> (a && b) && !c, color:'rgba(40,100,200,0.45)' }
	};

	// Helpers
	function pointIn(circle, x, y){
		const dx = x - circle.x;
		const dy = y - circle.y;
		return dx*dx + dy*dy <= circle.r*circle.r;
	}

	function getSelectedKeys(){
		return Array.from(document.querySelectorAll('#expressions input[type=checkbox]'))
			.filter(ch => ch.checked)
			.map(ch => ch.dataset.key);
	}

	// Draw base circles (subtle fills and outline)
	function drawBase(){
		ctx.clearRect(0,0,canvas.width,canvas.height);
		// translucent fills
		ctx.fillStyle = 'rgba(255,0,0,0.12)';
		ctx.beginPath(); ctx.arc(A.x,A.y,A.r,0,Math.PI*2); ctx.fill();
		ctx.fillStyle = 'rgba(0,0,255,0.12)';
		ctx.beginPath(); ctx.arc(B.x,B.y,B.r,0,Math.PI*2); ctx.fill();
		ctx.fillStyle = 'rgba(0,128,0,0.12)';
		ctx.beginPath(); ctx.arc(C.x,C.y,C.r,0,Math.PI*2); ctx.fill();

		// outlines
		ctx.lineWidth = 2;
		ctx.strokeStyle = '#b03'; ctx.beginPath(); ctx.arc(A.x,A.y,A.r,0,Math.PI*2); ctx.stroke();
		ctx.strokeStyle = '#36c'; ctx.beginPath(); ctx.arc(B.x,B.y,B.r,0,Math.PI*2); ctx.stroke();
		ctx.strokeStyle = '#178'; ctx.beginPath(); ctx.arc(C.x,C.y,C.r,0,Math.PI*2); ctx.stroke();

		// labels
		ctx.fillStyle = '#000'; ctx.font = '16px sans-serif';
		ctx.fillText('A', A.x - 8, A.y - A.r + 18);
		ctx.fillText('B', B.x - 8, B.y - B.r + 18);
		ctx.fillText('C', C.x - 8, C.y - C.r + 18);
	}

	// Draw hatched pattern clipped to boolean region defined by exprFn
	function drawExpression(exprKey){
		const expr = expressions[exprKey];
		if(!expr) return;

		// create mask image data
		const w = canvas.width, h = canvas.height;
		const maskCanvas = document.createElement('canvas'); maskCanvas.width = w; maskCanvas.height = h;
		const mctx = maskCanvas.getContext('2d');
		const id = mctx.createImageData(w,h);
		const data = id.data;

		for(let y=0;y<h;y++){
			for(let x=0;x<w;x++){
				const idx = (y*w + x)*4;
				const a = pointIn(A,x,y);
				const b = pointIn(B,x,y);
				const c = pointIn(C,x,y);
				const include = expr.fn(a,b,c);
				data[idx] = 0; data[idx+1]=0; data[idx+2]=0; data[idx+3] = include ? 255 : 0;
			}
		}
		mctx.putImageData(id,0,0);

		// create hatch pattern
		const patCanvas = document.createElement('canvas'); patCanvas.width = w; patCanvas.height = h;
		const pctx = patCanvas.getContext('2d');
		// fill background transparent
		pctx.clearRect(0,0,w,h);
		pctx.strokeStyle = expr.color;
		pctx.lineWidth = 2;
		const gap = 8;
		for(let i=-h;i<w;i+=gap){
			pctx.beginPath(); pctx.moveTo(i,0); pctx.lineTo(i+h,h); pctx.stroke();
		}

		// clip pattern with mask using compositing
		const resultCanvas = document.createElement('canvas'); resultCanvas.width = w; resultCanvas.height = h;
		const rctx = resultCanvas.getContext('2d');
		rctx.drawImage(patCanvas,0,0);
		rctx.globalCompositeOperation = 'destination-in';
		rctx.drawImage(maskCanvas,0,0);
		rctx.globalCompositeOperation = 'source-over';

		// draw the result onto main canvas
		ctx.drawImage(resultCanvas,0,0);

		// also optionally stroke the boundary of the masked region
		// create boundary by drawing mask into composite and then stroke via alpha test
		// (Keep simple for now.)
	}

	function render(){
		drawBase();
		const keys = getSelectedKeys();
		// draw each selected expression with its hatched style
		for(const k of keys){
			drawExpression(k);
		}
	}

	// wire up controls
	document.querySelectorAll('#expressions input[type=checkbox]').forEach(ch => {
		ch.addEventListener('change', () => render());
	});
	document.getElementById('clearBtn').addEventListener('click', ()=>{
		document.querySelectorAll('#expressions input[type=checkbox]').forEach(ch=> ch.checked=false);
		render();
	});

	// initial render
	render();
})();