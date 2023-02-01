SVGElement. prototype.SetAttr = SetAttr;
HTMLElement.prototype.SetAttr = SetAttr;
SVGElement. prototype.AddSVG = AddSVG;
HTMLElement.prototype.AddSVG = AddSVG;
SVGElement. prototype.CreateSVG = CreateSVG;

let svgBox1 = document.getElementById('_svgBox1');
let svgBox2 = document.getElementById('_svgBox2');

let fieldData = 
[            
	[svgBox1, 700,  700,  1    * 100 + '%', ' 70%', gridData1],
	[svgBox1, 1000, 700,  10/7 * 100 + '%', '100%', gridData2],
	[svgBox2, 700,  150,  1    * 100 + '%', ' 70%'           ],
	[svgBox2, 1000, 150,  10/7 * 100 + '%', '100%'           ],
	
].map((arg) => CreateFieldData(arg));

let defs1 = fieldData[0].svgBox.AddSVG({'tag': 'defs'});
let defs2 = fieldData[1].svgBox.AddSVG({'tag': 'defs'});

defs1.appendChild(GetShadowFilter('shadowPoints',   fieldData[0].Scale.X(fieldData[0].minX), fieldData[0].Scale.Y(fieldData[0].maxY), 5, 5, 5));
defs1.appendChild(GetShadowFilter('shadowVectors',  fieldData[0].Scale.X(fieldData[0].minX), fieldData[0].Scale.Y(fieldData[0].maxY), 3, 3, 4));
defs2.appendChild(GetShadowFilter('shadowHarmonic', fieldData[1].Scale.X(fieldData[1].minX), fieldData[1].Scale.Y(fieldData[1].maxY), 5, 5, 5));

fieldData[0].CreateGrid(basicLineFormat, secondaryLineFormat, axisFormat, axisTextFormat);
fieldData[1].CreateGrid(basicLineFormat, secondaryLineFormat, axisFormat, axisTextFormat);

let vectorGeneral = [fieldData[0], fieldData[1], vectorAuxLine, vectorTextFormat, 'shadowVectors', 'shadowHarmonic'];
let vectors = 
[
	['I', {'X': 0.75, 'Y': 0.75}, (x, y) => `I=${y}${x > 0 ? '+': '-'}j·${Math.abs(x)}`, vectorIformat ],
	['U', {'X': 0.00, 'Y': 1.00}, (x, y) => `U=${y}${x > 0 ? '+': '-'}j·${Math.abs(x)}`, vectorUformat ],
	
].map((arg) => CreateVector(arg.concat(vectorGeneral)));

let angels = 
[
	['1', fieldData[0], vectors[0].vector,   vectors[1].vector,   7, (a) => new VectorAngel(a)],
	['2', fieldData[1], vectors[0].harmonic, vectors[1].harmonic, 0, (a) => new HarmonicAngel(a)],
	
].map((arg) => CreateAngel(arg.concat([angelFormat, 0.6])));

let rubric = new Rubric([fieldData[2], fieldData[3]], angels[0], 15, vectorTextFormat);

let mainBox = document.getElementsByClassName('box')[0];
mainBox.addEventListener('pointermove', new ResizeBox(mainBox), true, true, false);
svgBox1.addEventListener('pointermove', new ResizeBox(svgBox1));
svgBox2.addEventListener('pointermove', new ResizeBox(svgBox2), true, true, false);

