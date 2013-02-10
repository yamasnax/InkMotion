var InkMotion = function(){
	
	var me = this;
	this.div = document.getElementById("InkMotion");
	
	this.page = new Page(window.innerWidth, window.innerHeight, this);
	this.foreground = new Layer(window.innerWidth, window.innerHeight);
	this.div.appendChild(this.foreground.canvas);
	
	this.menu = new Menu();
	this.menu.addItem("<img src='./Images/logo.png' height='19px' />");
	var file = this.menu.addItem("File");
	file.addItem("New").link.onclick = function(){ me._newPage(); };
	file.addItem("Open");
	file.addItem("Save");
	file.addItem("Export").link.onclick = function(){ me._exportPage(); };
	this.menu.init();
	
	this.listener = new Leap.Listener();
	this.listener.onConnect = function(controller){ me._onConnect(controller); };
	
	this.controller = new Leap.Controller("ws://localhost:6437/");
	this.controller.addListener(this.listener);
	
	this.brush = PressureBrush;
};

InkMotion.prototype = {
	
	_onFrame : function(controller) {
		
		var pointables = controller.frame().pointables();
		var count = pointables.count();
		
		var lastFrame = controller.frame(1);
		
		this.foreground.context.clearRect(0, 0, this.page.width, this.page.height);
		
		for(var index = 0; index < count; index++){
			var pointable = pointables[index];
			
			pointable.project = this.screen.intersect(pointable, true);
			
			if(pointable.project){
				// TODO: Determine which element the pointable is interacting with and propagate interaction
				var fade = (200-pointable.project.distance)/200;
				if(fade>1) fade = 1;
				else if(fade<0) fade = 0;
				
				this.foreground.context.beginPath();
				this.foreground.context.arc(pointable.project.position.x, pointable.project.position.y, 10*(1-fade), 0, 2 * Math.PI, false);
				this.foreground.context.fillStyle = 'rgba(0,0,0,'+fade+')';
				this.foreground.context.fill();
				this.foreground.context.beginPath();
				this.foreground.context.arc(pointable.project.position.x, pointable.project.position.y, 4*(1-fade), 0, 2 * Math.PI, false);
				this.foreground.context.fillStyle = 'rgba(255,255,255,'+fade*1.3+')';
				this.foreground.context.fill();
					
				var lastPointable = lastFrame.pointable(pointable.id());
				
				if(lastPointable.isValid() && lastPointable.project) this.brush.stroke(pointable, lastPointable, this.page.activeLayer().context, this.screen);
				else this.brush.start(pointable, this.page.activeLayer().context, this.screen);
			}
		}
	},
	
	_onConnect : function(controller) {
		var me = this;
		
		this.calibrate = new Leap.Calibrate(this.controller);
		this.calibrate.onComplete = function(screen){
			me.screen = screen;
			setTimeout(function(){ me.listener.onFrame = function(controller){ me._onFrame(controller); }; }, 1500);
		}
	},
	
	_newPage : function(){
		this.div.innerHTML = "";
		this.page = new Page(window.innerWidth, window.innerHeight, this);
	},
	
	_exportPage : function(){
		window.open(this.page.flatten().canvas.toDataURL('png'), '_blank');
	}
}