# Tovi - The JavaScript image gallery and HTML slider

## Usage

```html
<script src="http://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js"></script>
<script type="text/javascript" src="http://tovi.ideawu.com/swipe.js"></script>
<script type="text/javascript" src="http://tovi.ideawu.com/tovi.js"></script>

<div id="player" style="margin: 10px auto; width: 400px; height: 300px; border: 1px solid #ccc;">
	<img src="http://images.apple.com/mac/home/images/promo_lead_macbookpro.jpg" />
	<div style="background: #bb8;">
		<h1>Thanks!</h1>
	</div>
</div>

<script type="text/javascript">
var tovi;
$(function(){
	$(document).ready(function(){
		tovi = new ToviViewer();
		tovi.init($('#player'));
	});
});
</script>
```

## Demo

http://tovi.udpwork.com/

## Screenshot

![](http://www.ideawu.com/blog/wp-content/uploads/2013/04/tovi.jpg)
