/**
 * @author: ideawu
 * @link: http://www.ideawu.com/
 * Tovi - A JavaScript image and html slider, with iPhone swipe effect.
 */
function ToviViewer(){
	var self = this;
	var dom = null;
	var last_pos = {x: 0, y: 0};
	self.flip_thresh = 3/10;
	self.cell_padding = 100; // actually it is border
	self.cell_padding_color = '#eee';
	self.cell_border = '';//'1px solid #00f';
	
	self.width = 0;
	self.height = 0;
	
	self.index = 0;
	self.cells = [];
	self.in_animation = false;
	
	self.onchange = function(index, cell){}
	self.onscale = function(index, cell){};
	
	function intval(v){
		return parseInt(v, 10) || 0;
	}
	
	function Cell(width, height){
		this.sizing = 'best'; // best, fill
		this.type = null;
		this.dom = null;
		this.url = '';
		this.title = '';
		this.content = null;
		this.marginTop = 0;
		this.marginLeft = 0;
		this.paddingTop = 0;
		this.paddingLeft = 0;
		this.origin_width = width;
		this.origin_height = height;
		this.width = width;
		this.height = height;
		this.midx = 0;
		this.midy = 0;
		this.overflow = function(){
			if(this.is_image() || this.type == 'video'){
				return (this.width > self.width || this.height > self.height);
			}else{
				return (this.width > self.width || this.height > self.height);
				//return (this.content.width() > self.width || this.content.height() > self.height);
			}
		}
		this.scaled = function(){
			if(this.is_image() || this.type == 'video'){
				return (this.width > this.origin_width || this.height > this.origin_height);
			}else{
				return false;
			}
		}
		this.is_image = function(){
			return this.type == 'img';
		}
		this.autosize = function(){
			// all img elements in a text cell must provide width and height attributes
			// or here will get the wrong size
			this.content.css({
				margin: 0,
				padding: 0,
				width: 'auto',
				height: 'auto'
			});
			this.origin_width = this.content.width();
			this.origin_height = this.content.height();
			this.width = Math.min(self.width, this.origin_width);
			this.height = Math.min(self.height, this.origin_height);
		}
		this.centerX = function(){
			this.marginLeft = intval((self.width - this.width)/2);
		}
		this.centerY = function(){
			this.marginTop = intval((self.height - this.height)/2);
		}
		this.center = function(){
			this.centerX();
			this.centerY();
		}
		this.isCenterX = function(){
			var r = Math.abs(this.marginLeft / ((self.width - this.width)/2));
			// %15 of width or 10 pixels
			return Math.abs(1-r) < 0.15 || Math.abs(self.width - this.width) < 10;
		}
		this.isCenterY = function(){
			var r = Math.abs(this.marginTop / ((self.height - this.height)/2));
			return Math.abs(1-r) < 0.15 || Math.abs(self.height - this.height) < 10;
		}
		this.isCenter = function(){
			return this.isCenterX() && this.isCenterY();
		}
		this.autocenter = function(){
			var r = Math.abs(this.marginLeft / ((self.width - this.width)/2));
			if(this.isCenterX()){
				this.centerX();
			}
			if(this.isCenterY()){
				this.centerY();
			}
		}
		this.scale = function(rate){
			if(Math.abs(this.width * rate - this.width) < 1){
				//return;
			}
			var a = this.height;
			this.width = this.width * rate;
			this.height = this.origin_height * this.width/this.origin_width;
			if(rate > 1){
				this.width = Math.ceil(this.width);
				this.height = Math.ceil(this.height);
			}else{
				this.width = Math.floor(this.width);
				this.height = Math.floor(this.height);
			}
		}
		this.autodock = function(){
			var thresh = 6;
			if(Math.abs(self.width - this.width) < thresh){
				var nw = self.width;
				var nh = intval(this.origin_height * nw/this.origin_width);
				this.width = nw;
				this.height =  nh;
			}else if(Math.abs(self.height - this.height) < thresh){
				var nh = self.height;
				var nw = intval(this.origin_width * nh/this.origin_height);
				this.width = nw;
				this.height =  nh;
			}
		}
		this.bestsize = function(){
			var w = this.origin_width;
			var h = this.origin_height;
			if(w == 0 || h == 0){
				return;
			}
			if(self.width/self.height > this.origin_width/this.origin_height){
				var nh = Math.min(self.height, h);
				var nw = intval(this.origin_width * nh/this.origin_height);
			}else{
				var nw = Math.min(self.width, w);
				var nh = intval(this.origin_height * nw/this.origin_width);
			}
			this.width = Math.min(self.width, nw);
			this.height =  Math.min(self.height, nh);
		}
		this.fillsize = function(){
			var w = this.width;
			var h = this.height;
			if(w == 0 || h == 0){
				return;
			}
			if(self.width/self.height > this.origin_width/this.origin_height){
				var nh = self.height;
				var nw = intval(this.origin_width * nh/this.origin_height);
			}else{
				var nw = self.width;
				var nh = intval(this.origin_height * nw/this.origin_width);
			}
			this.width = Math.min(self.width, nw);
			this.height =  Math.min(self.height, nh);
		}
		this.actual_size = function(){
			this.width = this.origin_width;
			this.height = this.origin_height;
		}
	}
	
	self.seek = function(index, animation){
		var animate_speed = (animation==undefined||animation)? 400 : 0;
		if(index < 0){
			if(!self.in_animation){
				self.in_animation = true;
				$(dom).find('.tovi_row').animate({
					marginLeft: 0
				}, animate_speed/2, function(){
					self.in_animation = false;
					self.seek(0);
				});
			}
			return;
		}
		if(index >= self.cells.length){
			if(!self.in_animation){
				self.in_animation = true;
				var total_width = $(dom).find('.tovi_row').width();
				$(dom).find('.tovi_row').animate({
					marginLeft: -total_width + self.width + 1
				}, animate_speed/2, function(){
					self.in_animation = false;
					self.seek(self.cells.length - 1);
				});
			}
			return;
		}
		
		self.onchange(index, self.cells[index]);
		self.index = index;
		var cell = self.cells[self.index];

		var lower_x = 0;
		for(var i=0; i<self.index; i++){
			lower_x += self.width;
		}
		var offset = (self.cell_padding * self.index * 2) + self.width * self.index + self.cell_padding;
		self.in_animation = true;
		var row = $(dom).find('.tovi_row');
		if(animation == 'fade'){
			row.css({
				marginLeft: -offset
			});
			row.hide().fadeIn(animate_speed, function(){
				self.in_animation = false;
			});
		}else if(animation == 'slideDown'){
			row.css({
				marginLeft: -offset
			});
			row.hide().slideDown(animate_speed, function(){
				self.in_animation = false;
			});
		}else{
			row.animate({
				marginLeft: -offset
			}, animate_speed, function(){
				self.in_animation = false;
			});
		}
	}
	
	self.next = function(){		
		self.seek(self.index + 1);
	}
	
	self.prev = function(){
		self.seek(self.index - 1);
	}
	
	self.scale = function(delta, e){
		var cell = self.cells[self.index];
		// only allow to scale images and video
		if(!cell.is_image() && cell.type != 'video'){
			return;
		}
		// got focus point of the image
		//e.clientX = e.clientX || e.originalEvent.clientX;
		//e.clientY = e.clientY || e.originalEvent.clientY;
		if(e && e.clientX != undefined && cell.overflow()){
			var fx = e.clientX - cell.marginLeft - intval($(dom).offset().left);
			var fy = e.clientY - cell.marginTop - intval($(dom).offset().top);
		}else{
			var fx = cell.width/2;
			var fy = cell.height/2;
		}
		//debug(e.clientX, e.clientY, fx, fy);
		
		var ow = cell.width;
		var oh = cell.height;
		cell.width = intval(Math.max(20, cell.width * (delta + 1)));
		cell.height = intval((cell.width/cell.origin_width) * cell.origin_height);
		
		if(cell.overflow()){
			var dx = cell.width - ow;
			var dy = cell.height - oh;
			cell.marginTop = intval(cell.marginTop - dy*(fy/oh));
			cell.marginLeft = intval(cell.marginLeft - dx*(fx/ow));
		}
		
		cell.autodock();
		self.layout();
		self.onscale(self.index, cell);
	}
	
	self.resize = function(width, height){
		width = intval(width);
		height = intval(height);
		var dx = width - self.width;
		var dy = height - self.height;
		var old = [];
		for(var i=0; i<self.cells.length; i++){
			var cell = self.cells[i];
			old[i] = {
				scaled: cell.scaled(),
				overflow: cell.overflow()
			};
		}
		var old_width = self.width;
		var old_height = self.height;
		self.width = width;
		self.height = height;
		
		for(var i=0; i<self.cells.length; i++){
			var cell = self.cells[i];
			if(cell.is_image() || cell.type == 'video'){
				if(dx > 0){
					if(cell.marginLeft < self.width - (cell.marginLeft + cell.width)){
						var m = cell.marginLeft;
						cell.marginLeft += dx;
						if(m <= 0 && cell.marginLeft > 0){
							cell.marginLeft = 0;
						}
					}else{
						//
					}
				}else{
					if(cell.marginLeft < self.width - (cell.marginLeft + cell.width)){
						//
					}else{
						cell.marginLeft += dx;
					}
				}
				if(dy > 0){
					if(cell.marginTop < self.height - (cell.marginTop + cell.height)){
						var m = cell.marginLeft;
						cell.marginTop += dy;
						if(m <= 0 && cell.marginTop > 0){
							cell.marginTop = 0;
						}
					}else{
						//
					}
				}else{
					if(cell.marginTop < self.height - (cell.marginTop + cell.height)){
						//
					}else{
						cell.marginTop += dy;
					}
				}
								
				// 1. scale
				if(cell.height == old_height && cell.width <= old_width ||
						cell.width == old_width && cell.height <= old_height
				){
					if(i != self.index && !cell.overflow()){
						// ignore others if they still fit the window.
					}else{
					}
						cell.fillsize();
				}else if(old[i].overflow != cell.overflow()){
					if(i != self.index && !cell.overflow()){
						// ignore others if they still fit the window.
					}else{
					}
						cell.fillsize();
				}else if(!old[i].overflow && !cell.overflow()){
					if(dx > 0 && old[i].scaled){
						cell.scale(self.width / old_width);
						if(old[i].scaled && !cell.scaled()){
							cell.actual_size();
						}
					}
				}
				
				// 2. do some auto positioning
				cell.autodock();
				cell.autocenter();
				
				// 3. fix
				if(!old[i].scaled && cell.scaled()){
					cell.bestsize();
				}
			}else{
				cell.autosize();
			}
		}
		self.layout();
	}
	
	self.layout = function(index, animate){
		$(dom).width(self.width).height(self.height);
		var total_width = (self.width + 2 * self.cell_padding) * self.cells.length;
		$(dom).find('.tovi_row').width(total_width);
		if(self.index >= 0){
			var m = (self.cell_padding * self.index * 2) + self.width * self.index + self.cell_padding;
			$(dom).find('.tovi_row').css('marginLeft', -m);
		}
		$(dom).find('.tovi_cell').css({
			width: self.width,
			height: self.height,
			borderColor: self.cell_padding_color,
			borderStyle: 'solid',
			borderWidth: 0,
			borderBottomWidth: 0,
			borderLeftWidth: self.cell_padding,
			borderRightWidth: self.cell_padding
		});
		
		for(var i=0; i<self.cells.length; i++){
			if(index >= 0 && index != i){
				continue;
			}
			var cell = self.cells[i];
			if(cell.is_image() || cell.type == 'video'){
				if(cell.overflow()){
					cell.content.css({
						cursor: 'move'
					});
				}else{
					cell.center();
					cell.content.css({
						cursor: 'auto'
					});
				}
				if(i == self.index && animate != undefined && animate > 0){
					cell.content.animate({
						width: cell.width,
						height: cell.height,
						marginTop: cell.marginTop,
						marginLeft: cell.marginLeft
					}, animate);
				}else{
					cell.content.css({
						width: cell.width,
						height: cell.height,
						marginTop: cell.marginTop,
						marginLeft: cell.marginLeft
					});
				}
			}else{
				if(!cell.overflow()){
					cell.paddingTop = intval((self.height - cell.height - 2*intval(cell.content.css('borderLeftWidth')))/2);
					cell.paddingLeft = intval((self.width - cell.width - 2*intval(cell.content.css('borderTopWidth')))/2);
					cell.content.css({
						width: self.width - 2*cell.paddingLeft - 2*intval(cell.content.css('borderLeftWidth')),
						height: self.height - 2*cell.paddingTop - 2*intval(cell.content.css('borderTopWidth')),
						margin: 0,
						paddingTop: cell.paddingTop,
						paddingBottom: cell.paddingTop,
						paddingLeft: cell.paddingLeft,
						paddingRight: cell.paddingLeft
					});
					if(cell.content[0].scrollHeight > self.height){
						cell.height = cell.content[0].scrollHeight - 2*intval(cell.content.css('borderTopWidth'));
					}
				}else{
					/*
					cell.height = cell.content[0].scrollHeight - 2*intval(cell.content.css('borderTopWidth'));
					cell.content.css({
						width: cell.width - 2*intval(cell.content.css('borderLeftWidth')),
						height: cell.height - 2*intval(cell.content.css('borderTopWidth')),
						margin: 0
					});
					*/
				}
			}
		}
		self.onchange(self.index, self.cells[self.index]);
	}
	
	self.move = function(dx, dy){
		//duration = 0;
		dx = intval(dx); dy = intval(dy);
		var cell = self.cells[self.index];
		if(!cell.overflow()){
			self.slide(dx);
		}else{
			cell.marginLeft += dx;
			cell.marginTop += dy;
			self.layout(self.index);
		}
	}
	
	self.slide = function(delta, duration){
		var margin = intval($(dom).find('.tovi_row').css('marginLeft'));
		margin += delta;
		var total_width = $(dom).find('.tovi_row').width();
		if(margin > 0){
			margin = 0;
		}
		if(margin < -total_width + self.width + 1){
			margin = -total_width + self.width + 1;
		}
		if(duration != undefined && duration > 0){
			$(dom).find('.tovi_row').animate({
				'marginLeft': margin
			}, duration);
		}else{
			$(dom).find('.tovi_row').css('marginLeft', margin);
		}
		
		var lower_x = (self.width + 2 * self.cell_padding) * self.index + self.cell_padding;
		var upper_x = lower_x + self.width;
		margin = Math.abs(margin);

		if(delta > 0){ // right
			if(lower_x - margin > self.width * self.flip_thresh){
				self.index -= 1;
				self.onchange(self.index, self.cells[self.index]);
			}
		}else{
			if(margin - lower_x > self.width * self.flip_thresh){
				self.index += 1;
				self.onchange(self.index, self.cells[self.index]);
			}
		}
		self.index = Math.max(self.index, 0);
		self.index = Math.min(self.index, self.cells.length - 1);
	}

	function move(e){
		var x = e.pageX;
		if(last_pos.x == 0){
			last_pos.x = x;
		}
		// vertical drag
		var y = e.pageY;
		if(last_pos.y == 0){
			last_pos.y = y;
		}
		self.move(x - last_pos.x, y - last_pos.y);
		last_pos.x = x;
		last_pos.y = y;
	}

	function init_nav_button(){
		var prev = $(dom).find('.tovi_prev');
		var next = $(dom).find('.tovi_next');
		var opacity = 0.12;
		prev.mousedown(function(){
			$(this).fadeTo('fast', opacity/2).fadeTo('fast', opacity);
		}).click(function(){
			self.prev();
		});
		next.mousedown(function(){
			$(this).fadeTo('fast', opacity/2).fadeTo('fast', opacity);
		}).click(function(){
			self.next();
		});
		var w = 36;
		var h = w;
		$(dom).find('.tovi_prev, .tovi_next').css({
			position: 'absolute',
			color: '#666',
			fontWeight: 'bold',
			background: '#000',
			opacity: opacity,
			cursor: 'pointer',
			'font-family': 'arial',
			'font-size': w,
			'border-radius': 8,
			'text-align': 'center',
			border: '1px solid #999',
			padding: 2,
			width: w,
			lineHeight: w + 'px',
			height: w
		});
		$(dom).bind('mousemove mouseleave', function(e){
			var x = e.pageX - $(dom).offset().left;
			var y = e.pageY - $(dom).offset().top;
			var l = 3;
			var t = (self.height - h)/2.1;
			var vt = self.height * 1/4;
			var vb = self.height * 3/4;
			var showed = false;
			if(x > l && x < w && y > vt && y < vb){
				showed = true;
			}
			x = self.width - x;
			if(x > l && x < w && y > vt && y < vb){
				showed = true;
			}
			prev.css({
				top: t,
				left: l
			});
			next.css({
				top: t,
				right: l
			});
			if(!showed){
				prev.fadeOut();
				next.fadeOut();
			}else{
				prev.fadeIn('normal');
				next.fadeIn('normal');
			}
		});
	}

	function init_drag(cell){
		$(dom).on('dragstart', function(e){e.preventDefault();});
		cell.dom.bind('mousedown', function(e){
			$(dom).bind('mousemove', move);
			$(dom).bind('mouseup mouseout', function(e){
				var offset = $(dom).offset();
				if(e.type == 'mouseout'){
					if(e.pageX > offset.left && e.pageX < offset.left + $(dom).width()
						&& e.pageY > offset.top && e.pageY < offset.top + $(dom).height()){
						return;
					}
				}
				$(dom).unbind('mousemove', move);
				$(dom).unbind('mouseup mouseout');
				self.seek(self.index);
				last_pos = {x: 0, y: 0};
			});
		});
	}
	
	function init_swipe(){
		var swipe = new Swipe($(dom));
		swipe.onswipe = function(e){
			e.preventDefault();
			var dx = e.dx;
			var dy = e.dy;
			if(Math.abs(dy) > Math.abs(dx)){
				self.scale(dy/1000, e);
			}else{
				self.slide(parseInt(dx/3, 10));
			}
		}
		swipe.onend = function(e){
			self.seek(self.index);
		}
	}
	
	self.clear = function(){
		self.cells = [];
		self.index = 0;
		$(dom).find('.tovi_row').html('');
		self.onchange(-1, null);
	}
	
	self.add = function(e){
		self.insert(self.cells.length, e);
	}
	
	self.insert = function(index, e){
		index = Math.min(self.cells.length, Math.max(0, index));
		var cell = new Cell(self.width, self.height);
		var str = '<div class="tovi_cell"></div>';
		cell.dom = $(str);
		cell.content = $(e);
		cell.type = cell.content[0].tagName.toLowerCase();
		cell.dom.html(cell.content);
		self.cells.splice(index, 0, cell);
		
		if(cell.content.attr('title')){
			cell.title = cell.content.attr('title');
		}else if(cell.is_image()){
			var url = cell.content.attr('src');
			if(url.lastIndexOf('/') == -1){
				cell.title = url;
			}else{
				cell.title = url.substr(url.lastIndexOf('/') + 1);
			}
		}else{
			cell.title = '' + (index + 1);
		}
		cell.content.attr('title', '');
		
		$(cell.dom).css({
			overflow: 'hidden',
			float: 'left',
			margin: 0,
			padding: 0
		});
		cell.content.css({
			float: 'left',
			margin: 0,
			padding: 0,
			border: 0
		});
		if(index == 0){
			$(dom).find('.tovi_row').prepend(cell.dom);
		}else{
			$($(dom).find('.tovi_cell')[index-1]).after(cell.dom);
		}
		
		if(cell.is_image()){
			var url = $(e).attr('src');
			$(e).hide();
			cell.url = url;
			// the exact way to get image width and height
			var ni = new Image();
			ni.index_ = index;
			ni.onload = function(){
				var cell = self.cells[this.index_];
				cell.origin_width = this.width;
				cell.origin_height = this.height;
				cell.width = this.width;
				cell.height = this.height;
				cell.bestsize();
				cell.center();
				cell.content.css({
					width: cell.width,
					height: cell.height
				}).fadeIn('fast');
				self.layout(this.index_);
			}
			ni.src = url;
		}else if(cell.type == 'video'){
			var url = $(e).attr('src');
			if(!url || url.length == 0){
				url = $(e).children('source')[0].src;
			}
			$(e).attr('tovi_index', index);
		    $(e).bind("loadedmetadata", function(e){
				var index = intval($(this).attr('tovi_index'));
				var cell = self.cells[index];
				cell.origin_width = this.videoWidth;
				cell.origin_height = this.videoHeight;
				cell.width = this.videoWidth;
				cell.height = this.videoHeight;
				cell.bestsize();
				cell.content.children().css({
					border: '1px solid #fff',
					width: cell.width,
					height: cell.height
				}).fadeIn('fast');
				self.layout(index);
		    });
		}else{
			cell.autosize();
		}
		init_drag(cell);
		if(index == self.index){
			self.layout();
		}
		self.onchange(self.index, self.cells[self.index]);
	}

	self.init = function(dom_or_id, width, height){
		dom = dom_or_id;
		if(typeof(dom) == 'string'){
			dom = $('#' + dom);
		}
		var elements = $(dom).children().clone();
		if(width > 0){
			$(dom).width(width);
		}
		if(height > 0){
			$(dom).height(height);
		}
		self.width = $(dom).width();
		self.height = $(dom).height();
		self.cells = [];
		
		var html = '';
		html += '<div class="tovi" style="position: relative">';
		html += '<div class="tovi_row"></div>';
		html += '<div class="tovi_prev" style="display: none;">&lt;</div>';
		html += '<div class="tovi_next" style="display: none;">&gt;</div>';
		html += '</div>';
		$(dom).html(html);

		$(dom).css({
			cursor: 'default',
			overflow: 'hidden',
			visibility: 'visible',
			padding: 0
		}).show();
		$(dom).find('.tovi_row').css({
			position: 'relative',
			marginLeft: -self.cell_padding
		});
		
		self.onscale = function(index, cell){
			cell.content.children().css({
				width: cell.width,
				height: cell.height
			});
			//self.onchange(self.index, self.cells[self.index]);
		}
		init_nav_button();
		init_swipe();
		
		elements.each(function(i, e){
			self.add(e);
		});
		self.layout();
	}
	
	self.autoplay_delay = -1;
	self.autoplay_timer = null;
	self.autoplay = function(delay){
		self.autoplay_delay = delay || 2000;
		function autoplay_bind(){
			if(self.autoplay_timer){
				clearTimeout(self.autoplay_timer);
			}
			self.autoplay_timer = setInterval(function(){
				if(self.index < 0 || self.index >= self.cells.length-1){
					self.seek(0, 0);
					self.slide(self.cell_padding);
					self.seek(0);
				}else{
					self.seek(self.index + 1);
				}
			}, self.autoplay_delay);
		}
		autoplay_bind();
		$(dom).bind('mouseenter', function(){
			if(self.autoplay_timer){
				clearTimeout(self.autoplay_timer);
				self.autoplay_timer = null;
			}
		}).bind('mouseleave', function(){
			if(self.autoplay_delay > 0){
				autoplay_bind();
			}
		});
	}
	
	self.stopAutoplay = function(){
		if(self.autoplay_timer){
			clearTimeout(self.autoplay_timer);
			self.autoplay_delay = -1;
			self.autoplay_timer = null;
		}
	}
	
	self.bestsize = function(){
		var cell = self.cells[self.index];
		cell.bestsize();
		self.layout();
	}
	
	self.fillsize = function(){
		var cell = self.cells[self.index];
		cell.fillsize();
		self.layout();
	}
	
	self.actual_size = function(){
		var cell = self.cells[self.index];
		cell.actual_size();
		self.layout();
	}
	
	self.flip_h = function(){
		var cell = self.cells[self.index];
		if(cell.is_image()){
			cell.flip_h = cell.flip_h == -1? 1 : -1;
			cell.content.css('transform', 'scaleX(' + cell.flip_h + ')');
		}
		self.layout();
	}
	
	self.flip_v = function(){
		var cell = self.cells[self.index];
		if(cell.is_image()){
			cell.flip_v = cell.flip_v == -1? 1 : -1;
			cell.content.css('transform', 'scaleY(' + cell.flip_v + ')');
		}
		self.layout();
	}
	
	self.rotate_left = function(){
		var cell = self.cells[self.index];
		if(cell.is_image()){
			cell.rotate = cell.rotate || 0;
			cell.rotate = (cell.rotate - 90) % 360;
			cell.content.css('transform', 'rotate(' + cell.rotate + 'deg)');
		}
		self.layout();
	}
	
	self.rotate_right = function(){
		var cell = self.cells[self.index];
		if(cell.is_image()){
			cell.rotate = cell.rotate || 0;
			cell.rotate = (cell.rotate + 90) % 360;
			cell.content.css('transform', 'rotate(' + cell.rotate + 'deg)');
		}
		self.layout();
	}

	function debug(){
		var d = $('#tovi_debug');
		if(d.length == 0){
			d = $('<div id="tovi_debug"></div>');
			d.css({
				margin: '0 auto',
				color: '#333',
				width: 300,
				height: 150,
				overflow: 'auto',
				textAlign: 'center',
				background: '#fff'
			});
			$(dom).after(d);
		}
		var arr = [];
		for(var i=0; i<arguments.length; i++){
			arr.push(arguments[i]);
		}
		d.prepend(arr.join(', ') + '<br/>').show();
	}
}

