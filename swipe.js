/**
 * @author: ideawu
 * @link: http://www.ideawu.com/
 * simulate swipe event
 */
var Swipe = function(jqobj){
	var s = this;
	var self = this;
	self.jqobj = jqobj;

	self.listen = function(){
		self.jqobj.bind('mousewheel DOMMouseScroll', function(e){
			self.trigger(e);
		});
	}
	
	self.cancel = function(){
		self.jqobj.unbind('mousewheel DOMMouseScroll');
		//self.jqobj.bind('mousewheel DOMMouseScroll', function(e){e.preventDefault();});
		if(s.timer != null){
			clearTimeout(s.timer);
		}
	}
	
	self.listen();

	s.status = null;
	s.event = {dx:0, dy:0};
	s.timer = null;

	s.onstart = null;
	s.onswipe = null;
	s.onend = null;

	function settimer(){
		if(s.timer != null){
			clearTimeout(s.timer);
		}
		s.timer = setTimeout(function(){
			s.status = null;
			clearTimeout(s.timer);
			if(s.onend != null){
				s.onend(s.event);
				s.event = {dx:0, dy:0};
			}
		}, 150);
	}
	// be called on mousewheel event
	s.trigger = function(e){
		var oe = e.originalEvent;
		// for firefox 
		e.pageX = oe.pageX;
		e.pageY = oe.pageY;
		e.dx = oe.wheelDeltaX || 0;
		e.dy = oe.wheelDeltaY || oe.wheelDelta || -oe.detail * 40;
		if(e.dx != 0){ // trackpad
			e.dx *= 3;
			e.dy *= 3;
		}
		s.event = e;
		if(s.status == null){
			s.status = 'start';
			if(s.onstart != null){
				s.onstart(s.event);
			}
		}
		settimer();
		if(s.onswipe != null){
			s.onswipe(e);
		}
	}
}
