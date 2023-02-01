
class FieldData{
	constructor(svgBox, svgWidth, svgHeight, gridData ={'maxX': 100,
														'minX': -100,
														'maxY': 100,
														'minY': -100,
														'basicLineStepY': 10,
														'secondaryLineStepY': 10,
														'basicLineStepX': 10,
														'secondaryLineStepX': 10,
														'binding': 1,
														'padding': 0,}){
		for (let item in gridData) this[item] = gridData[item]
		
		this.svgBox = svgBox;
		this.width = this.maxX - this.minX;
		this.height = this.maxY - this.minY;
		
		this.svgWidth = svgWidth;
		this.svgHeight = svgHeight;
		
		this.scaleX = (this.svgWidth - this.padding) / this.width;
		this.scaleY = (this.svgHeight - this.padding) / this.height;
		
		this.zeroX = Math.abs(this.scaleX * this.minX) + this.padding / 2;
		this.zeroY = this.svgHeight - Math.abs(this.scaleY * this.minY) - this.padding / 2;
		this.Scale = new Scale(this.scaleX, this.scaleY);
		
		this.svgBox.SetAttr({
			'margine': '0px',
			'padding': '5px',
		});
		this.field = svgBox.AddSVG({
			'tag': "g", 
			'class': "field1", 
			'stroke': "black", 
			'stroke-width': "1", 
			'fill': "none",
			'margine': '0px',
			'padding': '0px',
			'transform': 'translate(' + this.zeroX + ', ' + this.zeroY + ')'
			});
		}
	
	CheckX(x){
		x = Math.round(Math.trunc(x/this.scaleX/this.binding) * this.binding * 10000)/10000; 
		if (x < this.minX) return this.minX;
		if (x > this.maxX) return this.maxX;
		return x;
	}
	
	CheckY(y){
		y = Math.round(Math.trunc(-y/this.scaleY/this.binding) * this.binding * 10000)/10000;
		if (y < this.minY) return this.minY;
		if (y > this.maxY) return this.maxY;
		return y;
	}
	
	CreateGrid(basicLineFormat, secondaryLineFormat, axisFormat, textFormat){
		if (this.maxX == this.minX && this.maxY == this.minY) return;
		this.grid = this.field.AddSVG({
			'tag': 'g', 
			'class': 'grid'
			});
		this.grid.appendChild(GetGridLine(this.Scale, 
									      this.minX, this.maxX, 
									      this.minY, this.maxY, 
									      this.basicLineStepX, this.secondaryLineStepX,
									      this.basicLineStepY, this.secondaryLineStepY,							 
									      basicLineFormat, secondaryLineFormat));
							
		this.grid.appendChild(GetAxisLine(this.Scale, 
										  this.minX, this.maxX, 
										  this.minY, this.maxY, 
									      this.basicLineStepX, this.basicLineStepY,
									      axisFormat, textFormat));
	}
}

class Scale{
	constructor(scaleX, scaleY){
		this.scaleX = scaleX;
		this.scaleY = scaleY
		}
	X(val)   {return  val * this.scaleX;}
	Y(val)   {return -val * this.scaleY;}
	reX(val) {return  val / this.scaleX;}
	reY(val) {return -val / this.scaleY;}
}


class Point{
	constructor(fieldData, x, y, textFormat, textFunc = (a, b) => `x= ${a} y=${b}`){
		this.box = fieldData.field.AddSVG({
			'tag': 'g', 
			'id': "point"
			});
		//this.point = this.box.AddSVG({
		//	'tag': 'circle', 
		//	'r': 3, 
		//	'fill': 'black'});
		this.marker = this.box.AddSVG({
			'tag': 'circle', 
			'r': 25, 
			'fill': 'silver', 
			'opacity': 0.25, 
			'stroke': 'none',
			'filter': "url(#shadowPoints)"
			});
		this.text = this.box.AddSVG({'tag': 'text'});
		this.text.SetAttr(textFormat);
		this.textFunc = textFunc;
		this.fieldData = fieldData;
		this.svgBox = fieldData.svgBox;
		this.SetHandlers(this.Handlers);
		this.Refresh(x, y);
	}
	
	Handlers = {
		pointerenter:	function(){
				this.marker.style.fill = 'black'
				this.marker.style.cursor = 'grab'
				//this.text.style.visibility = 'visible';
		},
		pointerleave: function(){
				this.marker.style.fill = 'silver'
				this.marker.style.cursor = ''
				//this.text.style.visibility = 'hidden';
		},
		pointerdown: function(event){
				this.marker.style.cursor = 'grabbing'
				this.MovePoint(event, this);
		},
	}
	
	SetHandlers(handlers){
		for (let handler in handlers){
			this.marker.addEventListener(handler, handlers[handler].bind(this));
		}
	}
	
	Refresh(x, y){
		this.x = x; this.y = y;
		let x1 = this.fieldData.Scale.X(x); let y1 = this.fieldData.Scale.Y(y);
		this.x1 = x1; this.y1 = y1;
		//this.point.setAttribute('cx', x1);
		//this.point.setAttribute('cy', y1);
		this.marker.setAttribute('cx', x1);
		this.marker.setAttribute('cy', y1);
		this.text.innerHTML = this.textFunc(x, y);
		let shiftX = x1 < 0 ? -130: 5; let shiftY = y1 > 20 ? 35: -25;
		this.text.setAttribute('transform', `translate(${x1 + shiftX}, ${y1 + shiftY})`);
	}
	
	MovePoint(args){
		let target = args.target;
		target.setPointerCapture(event.pointerId);
		let clientRect = this.svgBox.getBoundingClientRect();
		let dx = args.offsetX * this.fieldData.svgWidth / clientRect.width - this.fieldData.zeroX - args.currentTarget.attributes.cx.value;
		let dy = args.offsetY * this.fieldData.svgWidth / clientRect.width - this.fieldData.zeroY - args.currentTarget.attributes.cy.value;
		
		function SetNewCoordinate(args){
			let x = args.offsetX * this.fieldData.svgWidth / clientRect.width - dx - this.fieldData.zeroX;
			let y = args.offsetY * this.fieldData.svgWidth / clientRect.width - dy - this.fieldData.zeroY;
			x = this.fieldData.CheckX(x, this.last);
			y = this.fieldData.CheckY(y);
			this.Refresh(x, y);
			this.box.dispatchEvent(new CustomEvent("movePoint", {detail:{ 'x': x, 'y': y, 'x1': this.x1, 'y1': this.y1}}));
		}
		
		function ResetMove(args){
			target.onpointermove = null;
			target.style.cursor = 'grab';
			this.box.dispatchEvent(new CustomEvent("finishMove"));
		}
		target.onpointermove = SetNewCoordinate.bind(this);
		target.onpointerup = ResetMove.bind(this);
	}
}

class Vector{
	constructor(field, point, auxFormat, shadowName = ''){
		this.point = point;
		let lineXY = field.AddSVG({'tag': 'g'});
		lineXY.SetAttr(auxFormat);
		this.lineX = lineXY.AddSVG({
			'tag': 'line', 
			'y1': '0',
		});
		this.lineY = lineXY.AddSVG({
			'tag': 'line', 
			'x1': '0',
		});
		this.htmlItem = field.AddSVG({
			'tag': 'line', 
			'x1': '0',
			'y1': '0',
			'filter': shadowName == '' ? '' : 'url(#'+ shadowName +')',
		});
		this.Refresh();
		point.box.addEventListener('movePoint', this.Refresh.bind(this));
	}
	
	Refresh(event){
		this.htmlItem.SetAttr({'x2': this.point.x1, 'y2': this.point.y1});
		this.lineX.SetAttr({'x1': this.point.x1, 'x2': this.point.x1, 'y2': this.point.y1});
		this.lineY.SetAttr({'y1': this.point.y1, 'x2': this.point.x1, 'y2': this.point.y1});
		
		this.x = this.point.x;
		this.y = this.point.y;
		this.module = Math.sqrt(this.x * this.x + this.y * this.y);
		this.angelRad = this.module == 0 ? 0 : this.y <= 0 ? Math.acos(this.x / this.module) : 2 * Math.PI - Math.acos(this.x / this.module);
		this.angelGrad = this.angelRad * 180 / Math.PI;
		this.htmlItem.dispatchEvent(new CustomEvent("moveVector", {detail:{ 'target': this }}));
	}
}

class VectorAngel{
	constructor([field, fieldData, textFormat, vector1, vector2, markerStart, markerEnd]){
		this.r = 0.35;
		this.fieldData = fieldData;
		this.markerStart = markerStart;
		this.markerEnd = markerEnd;
		this.text = field.AddSVG({'tag': 'text'});
		this.text.SetAttr(textFormat);
		this.path1 = field.AddSVG({
			'tag': 'path',
			'fill': 'none',
			});
		this.path2 = field.AddSVG({
			'tag': 'path',
			'fill': 'none',
			});
		this.vector1 = vector1;
		this.vector2 = vector2;
		this.SetPath();
		vector1.htmlItem.addEventListener('moveVector', this.SetPath.bind(this));
		vector2.htmlItem.addEventListener('moveVector', this.SetPath.bind(this));
	}
	
	SetPath(){
		let p1 = ''; let p2 = '';
		this.angel = this.vector1.angelGrad - this.vector2.angelGrad
		this.angel = this.angel > 180 ? this.angel - 360 : this.angel;
		this.angel = this.angel < -180 ? this.angel + 360 : this.angel;
		let x1 = this.vector1.module == 0 ? this.fieldData.Scale.X(this.r): this.fieldData.Scale.X(this.r * this.vector1.x / this.vector1.module);
		let x2 = this.vector2.module == 0 ? this.fieldData.Scale.X(this.r): this.fieldData.Scale.X(this.r * this.vector2.x / this.vector2.module);
		let y1 = this.vector1.module == 0 ? 0: this.fieldData.Scale.Y(this.r * this.vector1.y / this.vector1.module);
		let y2 = this.vector2.module == 0 ? 0: this.fieldData.Scale.Y(this.r * this.vector2.y / this.vector2.module);
		let newAngel = (this.vector2.angelGrad + this.angel/2) / 180 * Math.PI;
		let newAngelX = this.fieldData.Scale.X(this.r * Math.cos(newAngel)); 
		let newAngelY = this.fieldData.Scale.Y(-this.r * Math.sin(newAngel));
		let r1 = this.fieldData.Scale.X(this.r);
		this.path1.setAttribute('marker-end', '');
		this.path1.setAttribute('marker-start', '');
		this.path2.setAttribute('marker-end', '');
		this.path2.setAttribute('marker-start', '');
				
		if (this.angel > 0){
			p2 = 'M' + x1 + ' ' + y1 + ' A ' + r1 + ' ' + r1 + ' 0 0 0 ' + + newAngelX + ' ' + newAngelY;
			p1 = 'M' + newAngelX + ' ' + newAngelY + ' A ' + r1 + ' ' + r1 + ' 0 0 0 ' + + x2 + ' ' + y2;
			this.path1.setAttribute('marker-end', this.markerEnd);
			this.path2.setAttribute('marker-start', this.markerStart);
		} else {
			p1 = 'M' + x2 + ' ' + y2 + ' A ' + r1 + ' ' + r1 + ' 0 0 0 ' + + newAngelX + ' ' + newAngelY;
			p2 = 'M' + newAngelX + ' ' + newAngelY + ' A ' + r1 + ' ' + r1 + ' 0 0 0 ' + + x1 + ' ' + y1;
			this.path2.setAttribute('marker-end', this.markerEnd);
			this.path1.setAttribute('marker-start', this.markerStart);
		}
		this.path1.setAttribute('d', p1);
		this.path2.setAttribute('d', p2);
		let transX = newAngelX > 0 ? newAngelX + r1 *0.1: newAngelX - r1 * 0.6;
		let transY = newAngelY > 0 ? newAngelY + r1 * 0.27: newAngelY - r1 * 0.1;
		this.text.setAttribute('transform', 'translate('+ transX + ', ' + transY + ')');
		this.text.innerHTML = Math.round(this.angel) + '°';
		this.text.dispatchEvent(new CustomEvent("changeАngle", {detail:{ 'target': this }}));
	}
}

class Harmonic{
	constructor(field, vector, fieldData){
		this.vector = vector;
		this.fieldData = fieldData;
		this.step = (fieldData.maxX - fieldData.minX)/fieldData.countPoint;
		this.path = field.AddSVG({
			'tag': 'polyline',
			'fill': 'none'
			});
		
		this.SetPath();
		vector.htmlItem.addEventListener('moveVector', this.SetPath.bind(this));
		
	}
	
	SetPath(){
		let p = '';
		for(let x = this.fieldData.minX; x <= this.fieldData.maxX; x += this.step){
			let y = -this.vector.module * Math.sin((x + this.vector.angelGrad) / 180 * Math.PI);
			p += this.fieldData.Scale.X(x) + ',' + this.fieldData.Scale.Y(y) + ' ';
		}
		this.lineX = - this.vector.angelGrad;
		this.path.setAttribute('points', p);
	}
	
}

class HarmonicAngel{
	constructor([field, fieldData, textFormat, harmonicOne, harmonicTwo, markerStart, markerEnd]){
		this.fieldData = fieldData;
		this.harmonicOne = harmonicOne;
		this.harmonicTwo = harmonicTwo;
		this.line1 = field.AddSVG({
			'tag': 'line', 
			'y1': '0',
			'y2': this.fieldData.Scale.Y(fieldData.maxY * 0.9),
		});
		this.line2 = field.AddSVG({
			'tag': 'line', 
			'y1': '0',
			'y2': this.fieldData.Scale.Y(fieldData.maxY * 0.9),
		});
		this.line3 = field.AddSVG({
			'tag': 'line', 
			'y1': this.fieldData.Scale.Y(fieldData.maxY * 0.85),
			'y2': this.fieldData.Scale.Y(fieldData.maxY * 0.85),
			'marker-start': markerStart,
			'marker-end': markerEnd,
		});
		
		this.text = field.AddSVG({
			'tag': 'text',
			'text-anchor': 'middle',
		});
		this.text.SetAttr(textFormat);
		
		this.harmonicOne.vector.htmlItem.addEventListener('moveVector', this.SetAngel.bind(this));
		this.harmonicTwo.vector.htmlItem.addEventListener('moveVector', this.SetAngel.bind(this));
		this.SetAngel();
		
	}
	
	SetAngel(){
		let one = this.harmonicOne.lineX; 
		let two = this.harmonicTwo.lineX;
		this.angel = one - two;
		this.angel = this.angel > 180 ? this.angel - 360 : this.angel;
		this.angel = this.angel < -180 ? this.angel + 360 : this.angel;
		while (one < 0 || two < 0 || Math.abs(one - two) > 180){
			one += 180; two += 180;
			one = one < 360 ? one: one - 360; two = two < 360 ? two: two - 360;
		}
		one = this.fieldData.Scale.X(one);
		two = this.fieldData.Scale.X(two);
		this.line1.setAttribute('x1', one);
		this.line1.setAttribute('x2', one);
		this.line2.setAttribute('x1', two);
		this.line2.setAttribute('x2', two);
		this.line3.setAttribute('x1', one);
		this.line3.setAttribute('x2', two);
		
		this.text.setAttribute('transform', 'translate('+ (one + (two - one) / 2) + ', ' + this.fieldData.Scale.Y(this.fieldData.maxY * 0.87) + ')');
		this.text.innerHTML = Math.round(-this.angel) + '°';
	}
}

class Rubric{
	constructor(fieldsData, vectorAngel, x, textFormat){
		this.fieldsData = fieldsData;
		this.vectorAngel = vectorAngel;
		this.currentMarking = '';
		this.textFormat = textFormat;
		this.x = x;
		this.startPath = ' M' + (-10 * x) + ' 0 a' + (x * 0.5) + ' ' + (x * 0.5) + ' 0 0 1 ' + (x) + ' 0' + ' a' + (x * 0.5) + ' ' + (x * 0.5) + ' 0 0 1 ' + 
						(-x) + ' 0' + ' m' + x + ' 0 h' + (x * 1);
		this.endPath = ' h' + (x * 1) + ' a' + (x * 0.5) + ' ' + (x * 0.5) + ' 0 0 1 ' + (x) + ' 0' + ' a' + (x * 0.5) + ' ' + (x * 0.5) + ' 0 0 1 ' + (-x) + ' 0';
		this.elements = {
		'R': ' h' + (x * 1.5) + ' v' + (-x * 1) + ' h' + (x * 5) + ' v' + 2 * x + ' h' + (-x * 5) + ' v' + (-x * 1) + ' m' + (5 * x) +' 0 h' + (x * 1.5),
		'L': ' h' + (x) + ' a' + x + ' ' + x + ' 0 0 1 ' + (x * 2) + ' 0' + ' a' + x + ' ' + x + ' 0 0 1 ' + (x * 2) + ' 0' + ' a' + x + ' ' + x + 
				' 0 0 1 ' + (x * 2) + ' 0' + ' h' + (x),
		'C': ' h' + (x * 3.25) + ' v' + (-x * 1.5) + ' h' + (x * 0.75) + ' v' + (3 * x) + ' h' + (-x * 0.75) + ' v' + (-x * 1.5) + ' m' + (1.5 * x) + 
				' 0 v' + (-x * 1.5) + ' h' + (x * 0.75) + ' v' + (3 * x) + ' h' + (-x * 0.75) + ' v' + (-x * 1.5) + ' m' + (0.75 * x) + ' 0 h' + (x * 2.5),
		'E': ' h'  + (x * 2) + ' a' + (x * 2) + ' ' + (x * 2) + ' 0 0 1 ' + (x * 4) + ' 0' + ' a' + (x * 2) + ' ' + (x * 2) + ' 0 0 1 ' + (-x * 4) + 
				' 0 m' + (x * 0.75) + ' 0 h' + (x * 2.5) + ' m' + (-x) + ' ' + (0.5 * x) + ' l' + (x) + ' ' + (-0.5 * x) + ' m' + (-x) + ' ' + (-0.5 * x) + 
				' l' + (x) + ' ' + (0.5 * x) +  ' m' + (x * 0.75) + ' 0 h' + (x * 2),
		'W': ' h'  + (x * 4),
		
		'E1': ' h'  + (x * 2.5) + ' a' + (x * 1.5) + ' ' + (x * 1.5) + ' 0 0 1 ' + (x * 3) + ' 0' + ' a' + (x * 1.5) + ' ' + (x * 1.5) + ' 0 0 1 ' + (-x * 3) + 
				' 0 m' + (x * 0.5) + ' 0 h' + (x * 2) + ' m' + (-x) + ' ' + (0.5 * x) + ' l' + (x) + ' ' + (-0.5 * x) + ' m' + (-x) + ' ' + (-0.5 * x) + 
				' l' + (x) + ' ' + (0.5 * x) +  ' m' + (x * 0.5) + ' 0 h' + (x * 2.5),
		};
		this.vectorAngel.text.addEventListener("changeАngle", this.Refresh.bind(this));
		this.fieldsData.forEach((fieldData)=>{
			fieldData.field.AddSVG({
				'tag': 'rect',
				'fill': 'none',
				'stroke-width': '1.0',
				'stroke': 'black',
				'x': fieldData.Scale.X(fieldData.minX) + 20,
				'y': fieldData.Scale.Y(fieldData.maxY ) + 5,
				'width': fieldData.Scale.X(fieldData.width) - 40,
				'height': -fieldData.Scale.Y(fieldData.height) - 10,
				'rx': 20,
			});
		});
		this.patch = fieldsData[0].field.AddSVG({
			'tag': 'path',
			'fill': 'none',
			'stroke-width': '2',
			'stroke': 'black',
		});
		this.marking1 = fieldsData[0].field.AddSVG({
			'tag': 'text',
			'text-anchor': 'middle',
			'transform': 'translate(' + (this.x * 1.1) +', ' + (-this.x * 1.7) + ')'
		});
		this.explanation1 = fieldsData[1].field.AddSVG({
			'tag': 'text',
			'text-anchor': 'middle',
			'transform': 'translate(0, ' + (-this.x * 2) + ')'
		});
		this.explanation2 = fieldsData[1].field.AddSVG({
			'tag': 'foreignObject',
			'x': fieldsData[1].Scale.X(fieldsData[1].minX) + 50,
			'y': (-this.x * 1) ,
			'width': fieldsData[1].Scale.X(fieldsData[1].width) - 100 ,
			'height': "200",
		});
		this.marking1.SetAttr(this.textFormat);
		this.explanation1.SetAttr(this.textFormat);
		this.explanation2.SetAttr(this.textFormat);
		this.explanation2 = this.explanation2.appendChild( document.createElement('div'));
		this.explanation2.style.textAlign = 'center';
		this.Refresh();
	}
	
	Refresh(){
		let newRubric = this.GetRubric();
		if (newRubric[0]){
			this.patch.setAttribute('d', newRubric[1]);
			this.marking1.innerHTML = newRubric[2]
			this.explanation1.innerHTML = newRubric[3][0];
			this.explanation2.innerHTML = newRubric[3][1];
		}
		
	};

	a = ['Потребление активной энергии, резистивная нагрузка.',  //0
		  'Потребляется активная мощность. Вектор тока совпадает с вектором напряжения.'];
	b = ['Потребление активной и реактивной энергии, индуктивно-резистивная нагрузка.',  //0...90
		  'Tок отстает от напряжения менее чем на 90 град за счет наличия в цепи как индуктивной так и активной нагрузки. Данный режим работы является основным для потребителя электроэнергии.'];
	c = ['Потребление индуктивной энергии, индуктивная нагрузка.', //90
		  'Ток отстает от напряжения на 90 град за счет самоиндукции. Работа на индуктивной нагрузке не совершается, активная мощность не расходуется.'];
	d = ['Генерация активной энергии и потребление реактивной энергии.', //90...180
		  'Ток  отстает от напряжения на угол 90-180 град. Такой режим работы характерен для генераторов работающий в режиме не до возбуждения. Нежелательный режим работы'];
	e = ['Генерация только активной энергии.', //180
		  'Tок  и напряжение совпадают по фазе но противоположны по направлению. Данный режим работы возможен когда у потребителя присутствует только активная нагрузка либо реактивная нагрузка полностью скомпенсирована.'];
	f = ['Потребление активной энергии и генерация реактивной энергии, резистивно-емкостная нагрузка.', //0...-90
		  'Ток опережает напряжение не более чем на 90 град за счет наличия в цепи емкостной и активной нагрузки. Данный режим работы возникает при перекомпенсации реактивной мощности у потребителя электроэнергии.'];			
	g = ['Генерация реактивной энергии, емкостная нагрузка.', //-90
		  'Ток опережает напряжение на 90 град за счет наличия в цепи чисто емкостной нагрузки. В данном режиме работают компенсаторы реактивной энергии.'];			
	h = ['Генерация активной и реактивной энергии.', //-90...-180
		  'Ток опережает напряжение на угол 90-180 град. Данный режим работы является основным для генераторов электрической энергии.'];
	w = ['\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0'];

	variants = 
	[
		[ (x) => (x ==  0               ), 'a', ['W', 'R', 'W'] ],
		[ (x) => (x  >  0   && x <   90 ), 'b', ['R', 'L'     ] ],
		[ (x) => (x ==  90              ), 'c', ['W', 'L', 'W'] ],
		[ (x) => (x  >  90  && x <   180), 'd', ['E', 'L'     ] ],
		[ (x) => (x ==  180 || x == -180), 'e', ['W', 'E', 'W'] ],
		[ (x) => (x  <  0   && x >  -90 ), 'f', ['R', 'C'     ] ],
		[ (x) => (x == -90              ), 'g', ['W', 'C', 'W'] ],
		[ (x) => (x  < -90  && x >  -180), 'h', ['E', 'C'     ] ],
	];

	
	GetRubric(){
		let angel = this.vectorAngel.angel;
		let patch = this.startPath;
		let marking = '';
		for (let arg of this.variants) {
			if (arg[0](angel) && this.currentMarking != arg[1]){
				arg[2].forEach((x) => {patch += this.elements[x]});
				arg[2].forEach((x) => {marking += x != 'W' ? x + this.w : ''});
				this.currentMarking == arg[1];
				return [true, patch + this.endPath, marking, this[arg[1]]];
			}
		};
		return [false, '', '', ''];
	}
}

class ResizeBox{
	constructor(box, move = true, resize = true, proportional = true){
		this.box = box;
		this.move = move;
		this.resize = resize;
		this.proportional = proportional;
		box.onpointerdown = this.ChoiceOfAction.bind(this);
		box.onpointerout = this.Reset.bind(this);
		box.onpointerup = this.Reset.bind(this);
		this.process = '';
		let propList = ['position', 'margin', 'width', 'height', 'left', 'top', 'boxShadow'];
		this.properties = {};
		propList.forEach(item => this.properties[item] = box.style[item]);
	}
		
	handleEvent(event){
		if (event.target != this.box) 
			return;
		this.CheckBorder(event, this.box);
	}
	
	ChoiceOfAction(event){
		if (this.box != event.target) 
			return;
		let check = this.CheckBorder(event, this.box);
		if (check == 'm' && this.move){
			this.Move(event); this.process = 'move';
		}
		else if (check != '' && this.resize){
			this.Resize(event, check); this.process = 'resize'
		}
		else this.Reset(event);
	}
	
	Reset(){
			this.box.style.cursor = '';
			this.box.onpointermove = null;
			this.box.ondragstart = null;
			if (this.process == 'move' && this.CheckTargetParent()) this.ResetFixedPosition(this.box);
			this.process = '';
	}
	
	CheckBorder(event, box){
		let re = 15;
		let bottom = box.clientHeight - event.offsetY < re;
		let right = box.clientWidth - event.offsetX < re;
		let top = event.offsetY < re;
		let left = event.offsetX < re;
		
		if (bottom && left || top && right) { box.style.cursor = 'nesw-resize'; return bottom && left ? 'bl' : 'tr'; }
		if (bottom && right || top && left) { box.style.cursor = 'nwse-resize'; return top && left ? 'tl' : 'br';}
		if (right || left || bottom || top) { box.style.cursor = 'move'; return 'm';}
		box.style.cursor = ''; 
		
		return '';
	}
	
	SetFixedPosition(box){
		
		let clientRect = box.getBoundingClientRect();
	
		let newX = clientRect.x;
		let newY = clientRect.y;
	
		let w = clientRect.width;
		let h = clientRect.height;
		
		box.style.position = 'fixed';
		box.style.margin = '0px';
		box.style.width = w + 'px';
		box.style.width = (w + w - box.offsetWidth) + 'px';
		if (!this.proportional){
			box.style.height = h + 'px';
			box.style.height = (h + h - box.offsetHeight) + 'px';
		}

		box.style.left = newX + 'px';
		box.style.top = newY + 'px';	
	}
	
	ResetFixedPosition(box){
		this.box.parentElement.style.boxShadow = '';
		for (let item in this.properties) box.style[item] = this.properties[item];
	}
		
	Move(event){
	
		let box = this.box;
		box.ondragstart = function(){ return false;};
		box.setPointerCapture(event.pointerId);
		if (box.style.position != 'fixed') this.SetFixedPosition(box);
		let dx = event.clientX - Number(box.style.left.replace('px', ''));
		let dy = event.clientY - Number(box.style.top.replace('px', ''));
		
		box.onpointermove = function(event){
			let box = event.target;
			box.style.left = (event.clientX - dx) + 'px';
			box.style.top = (event.clientY - dy) + 'px';
			if (this.CheckTargetParent()) box.parentElement.style.boxShadow = '0 0 15px 2px green';
			else box.parentElement.style.boxShadow = '';
		}.bind(this);
	};
	
	CheckTargetParent(){
		let v = this.box.style.visibility;
		this.box.style.visibility = 'hidden';
		let elemBelow = document.elementFromPoint(event.clientX, event.clientY);
		this.box.style.visibility = v;
		return (this.box.parentElement != null && this.box.parentElement == elemBelow)
	}
	
	Resize(event, check){
		
		let box = event.target;
		box.ondragstart = function(){ return false;};
		box.setPointerCapture(event.pointerId);
		if (box.style.position != 'fixed') this.SetFixedPosition(box);
		let dx = event.pageX - Number(box.style.left.replace('px', ''));
		dx = event.offsetX > box.offsetWidth / 2 ? dx - Number(box.style.width.replace('px', '')) : dx;
		
		let dy = event.pageY - Number(box.style.top.replace('px', ''));
		dy = event.offsetY > box.offsetHeight / 2 ? dy - Number(box.style.height.replace('px', '')) : dy ;

		let changeFunc = function(event1){this.ChangeSize(event1, check, {X: dx, Y: dy})};
		box.onpointermove = changeFunc.bind(this);
	}
	
	ChangeSize(event, check, start){
		let box = event.target;
		let l = Number(box.style.left.replace('px', ''));
		let t = Number(box.style.top.replace('px', ''));
		let w = Number(box.style.width.replace('px', ''));
		let h = Number(box.style.height.replace('px', ''));
		
		let startHeight = box.offsetHeight;
		let dWidth = event.clientX - start.X - l;
		
		switch (check) {
			case 'br':
				box.style.width = (event.clientX - start.X - l) + 'px';
				if (!this.proportional) box.style.height = (event.clientY - start.Y - t) + 'px';
				break;
			case 'bl':
				box.style.width = (w - dWidth) + 'px';
				box.style.left = (l + dWidth)  +'px';
				if (!this.proportional) box.style.height = (event.clientY - start.Y - t) + 'px';
				break;
			case 'tr':
				box.style.width = (event.clientX - start.X - l) + 'px';
				if (!this.proportional) box.style.height = (h - event.clientY + start.Y + t) + 'px';
				box.style.top = (t + startHeight - box.offsetHeight) + 'px';
				break;
			case 'tl':
				box.style.width = (w - dWidth) + 'px';
				box.style.left = (l + dWidth) +'px';
				if (!this.proportional) box.style.height = (h - event.clientY + start.Y + t) + 'px';
				box.style.top = (t + startHeight - box.offsetHeight) + 'px';
				break;
		}
	}
}
