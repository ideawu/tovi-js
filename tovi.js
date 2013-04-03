/**
 * @author: ideawu
 * @link: http://www.ideawu.com/
 * Tovi - A JavaScript image and html slider, with iPhone swipe effect.
 */
function ToviViewer(){
	var self = this;
	var dom = null;
	var last_pos = {x: 0, y: 0};
	self.flip_thresh = 1/3;
	self.cell_padding = 100; // actually it is border
	self.cell_padding_color = '#ddd';
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
		this.type = null;
		this.dom = null;
		this.url = '';
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
			if(this.is_image()){
				return (this.width > self.width || this.height > self.height);
			}else{
				return (this.width > self.width || this.height > self.height);
				//return (this.content.width() > self.width || this.content.height() > self.height);
			}
		}
		this.scaled = function(){
			if(this.is_image()){
				return (this.width > this.origin_width || this.height > this.origin_height);
			}else{
				return false;
			}
		}
		this.is_image = function(){
			return this.type == 'img';
		}
		this.autosize = function(){
			this.content.children().css({
				//overflow: 'hidden',
				margin: 0,
				padding: 0,
				width: 'auto',
				height: 'auto'
			});
			var child = $(this.content.children());
			this.origin_width = child.width();
			this.origin_height = child.height();
			this.width = Math.min(self.width, this.origin_width);
			this.height = Math.min(self.height, this.origin_height);
		}
		this.bestsize = function(){
			var w = this.origin_width;
			var h = this.origin_height;
			if(w == 0 || h == 0){
				return;
			}
			if(self.width/self.height > w/h){
				var nh = Math.min(self.height, h);
				var nw = parseInt(w * nh/h);
			}else{
				var nw = Math.min(self.width, w);
				var nh = parseInt(h * nw/w);
			}
			this.width = nw;
			this.height = nh;
			this.marginTop = 0;
			this.marginLeft = 0;
		}
		this.fillsize = function(){
			var w = this.width;
			var h = this.height;
			if(w == 0 || h == 0){
				return;
			}
			if(self.width/self.height > w/h){
				var nh = Math.min(self.height, h);
				var nw = parseInt(w * nh/h);
			}else{
				var nw = Math.min(self.width, w);
				var nh = parseInt(h * nw/w);
			}
			this.width = nw;
			this.height = nh;
			this.marginTop = 0;
			this.marginLeft = 0;
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

	function move(e){
		var cell = self.cells[self.index];
		var x = e.pageX;
		if(last_pos.x == 0){
			last_pos.x = x;
		}
		// vertical drag
		var y = e.pageY;
		if(last_pos.y == 0){
			last_pos.y = y;
		}
		
		if(!cell.overflow()){
			self.slide(x - last_pos.x);
			last_pos.x = x;
		}else{
			cell.marginLeft += (x - last_pos.x);
			last_pos.x = x;
		
			cell.marginTop += (y - last_pos.y);
			last_pos.y = y;
			self.layout();
		}
	}
	
	self.slide = function(delta){
		var margin = intval($(dom).find('.tovi_row').css('marginLeft'));
		margin += delta;
		var total_width = $(dom).find('.tovi_row').width();
		if(margin > 0){
			margin = 0;
		}
		if(margin < -total_width + self.width + 1){
			margin = -total_width + self.width + 1;
		}
		$(dom).find('.tovi_row').css('marginLeft', margin);
		
		var lower_x = (self.width + 2 * self.cell_padding) * self.index + self.cell_padding;
		var upper_x = lower_x + self.width;
		margin = Math.abs(margin);

		if(delta > 0){ // right
			if(lower_x - margin > self.width * self.flip_thresh){
				self.index -= 1;
				//self.onchange(self.index, self.cells[self.index]);
			}
		}else{
			if(margin - lower_x > self.width * self.flip_thresh){
				self.index += 1;
				//self.onchange(self.index, self.cells[self.index]);
			}
		}
		self.index = Math.max(self.index, 0);
		self.index = Math.min(self.index, self.cells.length - 1);
	}
	
	self.scale = function(delta){
		var cell = self.cells[self.index];
		// only allow to scale images
		if(!cell.is_image()){
			return;
		}
		cell.midx = cell.width/2 + cell.marginLeft;
		cell.midy = cell.height/2 + cell.marginTop;

		var dx = parseInt(self.width * delta);
		cell.width += dx;
		cell.width = Math.max(cell.width, 20);
		cell.height = parseInt((cell.width/cell.origin_width) * cell.origin_height);
		if(cell.overflow()){
			cell.marginTop = cell.midy - cell.height/2 + cell.paddingTop;
			cell.marginLeft = cell.midx - cell.width/2 + cell.paddingLeft;
			cell.paddingTop = 0;
			cell.paddingLeft = 0;
		}else{
			cell.marginTop = 0;
			cell.marginLeft = 0;
		}
		self.layout();
		self.onscale(self.index, cell);
	}
	
	self.resize = function(width, height){
		width = intval(width);
		height = intval(height);
		var rate_w = width/self.width;
		var rate_h = height/self.height;
		var old_overflow = [];
		for(var i=0; i<self.cells.length; i++){
			var cell = self.cells[i];
			old_overflow[i] = cell.overflow();
		}
		self.width = width;
		self.height = height;
		//self.layout();
		
		var rate = Math.max(rate_w, rate_h);
		for(var i=0; i<self.cells.length; i++){
			var cell = self.cells[i];
			if(cell.is_image()){
				if(rate > 1){
					cell.marginTop = intval(cell.marginTop / rate_h);
					cell.marginLeft = intval(cell.marginLeft / rate_w);
					if(cell.overflow()){
						//
					}else{
						if(cell.scaled()){
							cell.fillsize();
						}else{
							cell.bestsize();
						}
					}
				}else{
					rate = Math.min(rate_w, rate_h);
					if(old_overflow[i]){
						if(cell.marginTop > 0){
							cell.marginTop = intval(cell.marginTop * rate_h);
						}
						if(cell.marginLeft > 0){
							cell.marginLeft = intval(cell.marginLeft * rate_w);
						}
					}else{
						if(cell.overflow()){
							cell.fillsize();
						}
					}
				}
				cell.content.find('>img').css({
					width: cell.width,
					height: cell.height
				});
			}else{
				cell.autosize();
			}
		}
		self.layout();
	}
	
	self.layout = function(index){
		$(dom).width(self.width).height(self.height);
		var total_width = (self.width + 2 * self.cell_padding) * self.cells.length;
		$(dom).find('.tovi_row').width(total_width);
		if(self.index >= 0){
			var m = (self.cell_padding * self.index * 2) + self.width * self.index + self.cell_padding;
			$(dom).find('.tovi_row').css('marginLeft', -m);
		}
		$(dom).find('.tovi_block').css({
			width: self.width,
			height: self.height,
			borderColor: self.cell_padding_color,
			borderStyle: 'solid',
			borderTopWidth: 0,
			borderBottomWidth: 0,
			borderLeftWidth: self.cell_padding + 'px',
			borderRightWidth: self.cell_padding + 'px'
		});
		
		for(var i=0; i<self.cells.length; i++){
			if(index != undefined && index != i){
				continue;
			}
			var cell = self.cells[i];
			if(cell.is_image()){
				var w = cell.width;
				var h = cell.height;
				if(cell.overflow()){
					cell.content.css({
						cursor: 'move'
					});
				}else{
					cell.content.css({
						cursor: 'auto'
					});
					cell.paddingTop = parseInt((self.height - cell.height)/2);
					cell.paddingLeft = parseInt((self.width - cell.width)/2);
					w = self.width - 2*cell.paddingLeft;
					h = self.height - 2*cell.paddingTop;
				}
				cell.content.css({
					width: w - 2*intval(cell.content.css('borderLeftWidth')),
					height: h - 2*intval(cell.content.css('borderTopWidth')),
					margin: cell.marginTop + 'px ' + cell.marginLeft + 'px',
					padding: cell.paddingTop + 'px ' + cell.paddingLeft + 'px'
				});
			}else{
				var child = cell.content.children();
				if(!cell.overflow()){
					cell.paddingTop = intval((self.height - cell.height - 2*intval(cell.content.css('borderLeftWidth')))/2);
					cell.paddingLeft = intval((self.width - cell.width - 2*intval(cell.content.css('borderTopWidth')))/2);
					child.css({
						width: self.width - 2*cell.paddingLeft - 2*intval(cell.content.css('borderLeftWidth')),
						height: self.height - 2*cell.paddingTop - 2*intval(cell.content.css('borderTopWidth')),
						margin: 0,
						paddingTop: cell.paddingTop,
						paddingBottom: cell.paddingTop,
						paddingLeft: cell.paddingLeft,
						paddingRight: cell.paddingLeft
					});
					cell.content.css({
						marginTop: 0,
						marginLeft: 0
					});
					if(cell.content[0].scrollHeight > self.height){
						cell.height = cell.content[0].scrollHeight - 2*intval(cell.content.css('borderTopWidth'));
					}
				}else{
					cell.height = cell.content[0].scrollHeight - 2*intval(cell.content.css('borderTopWidth'));
					child.css({
						width: cell.width - 2*intval(cell.content.css('borderLeftWidth')),
						height: cell.height - 2*intval(cell.content.css('borderTopWidth')),
						margin: 0
					});
					cell.content.css({
						marginTop: cell.marginTop,
						marginLeft: cell.marginLeft
					});
				}
			}
		}
		self.onchange(self.index, self.cells[self.index]);
	}
	
	function init_nav_button(){
		var opacity = 0.2;
		$(dom).find('.tovi_prev').mousedown(function(){
			$(this).fadeTo('fast', opacity/2).fadeTo('fast', opacity);
		}).click(function(){
			self.prev();
		});
		$(dom).find('.tovi_next').mousedown(function(){
			$(this).fadeTo('fast', opacity/2).fadeTo('fast', opacity);
		}).click(function(){
			self.next();
		});
		var w = 34;
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
			width: w,
			lineHeight: w + 'px',
			height: w
		});
		$(dom).bind('mousemove mouseleave', function(e){
			var x = e.pageX - $(dom).offset().left;
			var y = e.pageY - $(dom).offset().top;
			var l = 3;
			var t = (self.height - h)/2;
			var showed = false;
			//$('.debug').html([x, y, t].join(' ')+'#<br>');
			if(x > l && x < w && y > t-h && y < (t+h*2)){
				showed = true;
			}
			x = self.width - x;
			if(x > l && x < w && y > t-h && y < (t+h*2)){
				showed = true;
			}
			if(!showed){
				$(dom).find('.tovi_prev,.tovi_next').fadeOut();
			}else{
				$(dom).find('.tovi_prev').css({
					top: t,
					left: l
				}).fadeIn('normal');
				$(dom).find('.tovi_next').css({
					top: t,
					right: l
				}).fadeIn('normal');
			}
		});
	}
	
	function init_drag(cell){
		$(dom).on('dragstart', function(e){e.preventDefault();});
		cell.content.bind('mousedown', function(e){
			$(dom).bind('mousemove', move);
			$(dom).bind('mouseup mouseout', function(e){
				var offset = $(dom).offset();
				//$('.debug').html([e.type, e.pageX, e.pageY, offset.left, offset.top].join(' ')+'#<br>');
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
				var delta = dy/120;
				if(dx == 0){ // mouse scroll
					self.scale(delta * 0.03);
				}else{
					self.scale(delta * 0.08);
				}
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
		e = $(e)[0];
		var cell = new Cell(self.width, self.height);
		var str = '<div class="tovi_block"><div class="tovi_cell"></div></div>';
		cell.dom = $(str);
		cell.content = cell.dom.children();
		cell.type = e.tagName.toLowerCase();
		cell.content.html(e);
		self.cells.splice(index, 0, cell);
		
		$(cell.dom).css({
			overflow: 'hidden',
			float: 'left',
			margin: 0,
			padding: 0
		});
		$(cell.content).css({
			overflow: 'hidden',
			float: 'left',
			margin: 0,
			padding: 0,
			border: self.cell_border
		});
		$(cell.content).children().css({
			float: 'left',
			border: 0
		});
		if(index == 0){
			$(dom).find('.tovi_row').prepend(cell.dom);
		}else{
			$($(dom).find('.tovi_block')[index-1]).after(cell.dom);
		}
		
		if(!cell.is_image()){
			cell.autosize();
		}else{
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
				cell.bestsize();
				cell.content.find('>img').css({
					width: cell.width,
					height: cell.height
				}).fadeIn('fast');
				self.layout();
			}
			ni.src = url;
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
					self.seek(-1);
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
		d.prepend(arr.join(', ') + '<br/>');
	}
}

