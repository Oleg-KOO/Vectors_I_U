function SetAttr(attr){
	for (let a in attr){
		if (!(a in this) && (a in this.style)){
			this.style[a] = attr[a];
			if (this.style[a] == attr[a]) continue;
		}
		this.setAttribute(a, attr[a]);
	}
}
	
function AddSVG(attr){
	return this.appendChild(CreateSVG(attr));
}

function CreateSVG(attr){
	if (typeof attr != "object") return document.createElementNS('http://www.w3.org/2000/svg', attr);
	let htmlItem = document.createElementNS('http://www.w3.org/2000/svg', attr.tag);
	if (attr.tag == 'text') { htmlItem.innerHTML = 'text' in attr ? attr.text: ''; delete attr.text; }
	delete attr.tag; htmlItem.SetAttr(attr);
	return htmlItem
}
	
function CreatescaleLine (command, startPoint, stopPoint, step){
	if ( startPoint * stopPoint > 0){
		for (let i = startPoint; i <= stopPoint; i+= step) command(i);
		return;	
	}
	for (let i = -step; i >= startPoint; i-= step) command(i);
	for (let i =  step; i <= stopPoint;  i+= step) command(i);
}

function GetGridLine(scale, minX, maxX, minY, maxY, basicStepX, secondaryStepX, basicStepY, secondaryStepY, basicLineFormat, secondaryLineFormat){
	let gridLine = CreateSVG({
		'tag': 'g', 
		'class': 'gridLine'
		});
	let basicLine = gridLine.AddSVG({
		'tag': 'g', 
		'class': 'basicLine'
		});
	let secondaryLine = gridLine.AddSVG({
		'tag': 'g', 
		'class': 'secondaryLine'
		});
		
	basicLine.SetAttr(basicLineFormat);
	secondaryLine.SetAttr(secondaryLineFormat);
	
	let scaleMaxX = scale.X(maxX);
	let scaleMinX = scale.X(minX);
	let scaleMaxY = scale.Y(maxY);
	let scaleMinY = scale.Y(minY);
	
	CreatescaleLine(function(i){
		let x = scale.X(i);
		secondaryLine.AddSVG({
			'tag': 'line', 
			'x1': x, 
			'y1': scaleMinY, 
			'x2': x, 
			'y2': scaleMaxY
			});
		}, minX, maxX, secondaryStepX);
	
	CreatescaleLine(function(i){
		let y = scale.Y(i);
		secondaryLine.AddSVG({
			'tag': 'line', 
			'x1': scaleMinX, 
			'y1': y, 
			'x2': scaleMaxX, 
			'y2': y
			});
		}, minY, maxY, secondaryStepY);
	
	CreatescaleLine(function(i){
		let x = scale.X(i);
		basicLine.AddSVG({
			'tag': 'line', 
			'x1': x, 
			'y1': scaleMinY, 
			'x2': x, 
			'y2': scaleMaxY
			});
		}, minX, maxX, basicStepX);
	
	CreatescaleLine(function(i){
		let y = scale.Y(i);
		basicLine.AddSVG({
			'tag': 'line', 
			'x1': scaleMinX, 
			'y1': y, 
			'x2': scaleMaxX, 
			'y2': y
			});
		}, minY, maxY, basicStepY);
	return gridLine;
}

function GetAxisLine(scale, minX, maxX, minY, maxY, basicStepX, basicStepY, axisFormat, textFormat){
	
	let axis = CreateSVG({'tag': 'g', 'class': 'axis'});
	let axisLine = axis.AddSVG({
		'tag': 'g', 
		'class': 'axisLine'
		});
	axisLine.SetAttr(axisFormat)
	axisLine.AddSVG({
		'tag': 'line', 
		'x1': scale.X(minX), 
		'y1': 0, 
		'x2': scale.X(maxX), 
		'y2': 0
		});
	axisLine.AddSVG({
		'tag': 'line', 
		'x1': 0, 
		'y1': scale.Y(minY), 
		'x2': 0, 
		'y2': scale.Y(maxY)
		});
	let axisDivizion = axis.AddSVG({
		'tag': 'g', 
		'class': 'axisDivizion'
		});
	let textDivizion = axis.AddSVG({
		'tag': 'g', 
		'class': 'textDivizion'
		});
	axisDivizion.SetAttr(axisFormat);
	textDivizion.SetAttr(textFormat);
	textDivizion.AddSVG({
		'tag': 'text', 
		'text': 0, 
		'transform': 'translate(-10, 15)'
		});
	
	CreatescaleLine(function(i){
		let x = scale.X(i);
		axisDivizion.AddSVG({
			'tag': 'line', 
			'x1': x, 
			'y1': -5, 
			'x2': x, 
			'y2': 5
			});
		textDivizion.AddSVG({
			'tag': 'text', 
			'text': i, 
			'transform': 'translate(' + (x - 10) + ', 25)'
			});
		}, minX, maxX, basicStepX);
		
	CreatescaleLine(function(i){
		let y = scale.Y(i);
		axisDivizion.AddSVG({
			'tag': 'line', 
			'x1': -5, 
			'y1': y, 
			'x2': 5, 
			'y2': y
			});
		textDivizion.AddSVG({
			'tag': 'text', 
			'text': i, 
			'transform': 'translate(-40, ' + (y + 5) + ')'
			});
		}, minY, maxY, basicStepY);
		
		return axis;
}	

function GetShadowFilter(name, startX, startY, dx, dy, dev, color = false){
	let defs = CreateSVG('defs');
	let filter = defs.AddSVG({
		'tag': 'filter',
		'id': name,
		'filterUnits': 'userSpaceOnUse',
		'x': startX,
		'y': startY,
		
		'width': "100%", 
		'height': "100%"
		});
	filter.AddSVG({
		'tag': 'feOffset',
		'result': 'offOut',
		'in': color ? 'SourceGraphic' : 'SourceAlpha',
		'dx': dx, 
		'dy': dy 
		});
	filter.AddSVG({
		'tag': 'feGaussianBlur',
		'result': 'blurOut',
		'in': 'offOut',
		'stdDeviation': dev, 
		});
	filter.AddSVG({
		'tag': 'feBlend',
		'in': 'SourceGraphic',
		'in2': 'blurOut',
		'mode': 'normal', 
		});
	return filter;
}

function CreateMarker(htmlBox, name, size, transform = ''){

	let defs = htmlBox.getElementsByTagName('defs');
	let def;
	if (defs.length > 0) def = defs[0]
	else def = htmlBox.AddSVG({
		'tag': 'defs'
		});
	
	let path = def.AddSVG({
		'tag': 'path', 
		'id': name + "Path", 
		'd': 'M 0 0 L -' + 30 * size + ' ' + 6 * size + ' L -' + 30 * size + ' -' + 6 * size +' z',
		});
	path.setAttribute('transform', transform);
	let marker = htmlBox.AddSVG({
		'tag': 'marker', 
		'id': name, 
		'orient': 'auto', 
		'markerWidth': 100 * size, 
		'markerHeight': 100 * size, 
		'viewBox': '-' + 30 * size + ' -' + 30 * size + ' ' + 100 * size + ' ' + 100 * size, 
		'stroke-width': "1", 
		'markerUnits': "userSpaceOnUse",
		});
		
	marker.AddSVG({
		'tag': 'use', 
		'href': "#" + name + "Path"
		});
};

function CreateFieldData([svgBox, fieldWidth, fieldHeight, svgWidth, svgHeight, fieldData]){
	let newfieldData = new FieldData(svgBox, fieldWidth, fieldHeight, fieldData);
	newfieldData.svgBox = svgBox.AddSVG({
		'tag': 'svg', 
		'width': svgWidth, 
		'height': svgHeight,
		'viewBox': '0 0 ' + newfieldData.svgWidth + ' ' + newfieldData.svgHeight,
	});
	newfieldData.svgBox.appendChild(newfieldData.field);
	return newfieldData;
}

function CreateVector([name, startPoint, textPoint, lineFormat, vectorField, harmonicField, auxLineFormat, textFormat, vectorShadow, harmonicShadow]){
	let point = new Point(vectorField, startPoint.X, startPoint.Y, textFormat, textPoint);
	let vectorBox = vectorField.field.AddSVG({
		'tag': 'g',
		'marker-end': "url(#marker" + name + ")",
	});
	let harmonicBox = harmonicField.field.AddSVG({
		'tag': 'g',
		'filter': 'url(#' + harmonicShadow + ')',
	});
	CreateMarker(vectorBox, 'marker' + name, 1.0);
	vectorBox.SetAttr(lineFormat);
	harmonicBox.SetAttr(lineFormat);
	let vector = new Vector(vectorBox, point, vectorAuxLine, vectorShadow);
	let harmonic = new Harmonic(harmonicBox, vector, harmonicField);
	return {'point': point, 'vector': vector, 'harmonic': harmonic};
}

function CreateAngel([name, angelField, item1, item2, rotateMarker, angelClass, angelFormat, markerDimention]){
	let field = angelField.field.AddSVG({'tag': 'g'});
	CreateMarker(field, 'markerAngelEnd' + name, markerDimention, 'rotate(' + rotateMarker + ')');
	CreateMarker(field, 'markerAngelStart' + name, markerDimention, 'rotate(' + (180 - rotateMarker) + ')');
	field.SetAttr(angelFormat);
	return angelClass([field, angelField, vectorTextFormat, item1, item2, 'url(#markerAngelStart' + name + ')', 'url(#markerAngelEnd' + name + ')']);
}
