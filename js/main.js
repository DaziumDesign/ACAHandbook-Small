var appConfig = {
	pageSize: [900, 600],

	modes:{ //the first one will be default, ordered by lowest priority when conditions are met
		full: {
			fullNav: true
		},
		minNav: {
			fullNav: false,
			maxW: 1100
		},
		single: {
			fullNav: false,
			bookDouble: false,
			maxW: 900
		},
		scroll: {
			showBook: false,
			fullNav: false,
			maxH: 600
		}
	}
};

(function($, window, appConfig, undefined){
	var $win = $(window),
		$body = $('body'),
		winD = {
			h: $win.height(),
			w: $win.width()
		},
		resizeFuncs = [],
		onResize = function(){
			winD = {
				h: $win.height(),
				w: $win.width()
			};

			$.each(resizeFuncs, function(i, el){
				el.func.call(el.context);
			});
		},

		app = {
			$bookwrap: $('#book-wrap'),
			$book: $('#book'),
			$navs: $('nav'),
			$scroll: false,

			modes: [],
			curViewer: false,
			curMode: false,

			init: function(config){
				var app = this;

				this.config = config;

				$.each(config.modes, function(id, settings){
					app.modes.push(new Mode(id, settings, app));
				});

				// clone book contents into scroll for later
				// (since it gets modified by turn.js)
				this.$scroll = this.$book.clone(false).attr('id', 'scroll');

				resizeFuncs.push({
					func: this.setMode,
					context: this
				});

				this.setMode();
			},

			setMode: function(){
				var newMode = this.modes[0];

				$.each(this.modes, function(i, mode){
					if(mode.isShowable())
						newMode = mode;
				});

				console.log(this.curMode, newMode);

				if(!this.curMode || this.curMode.id != newMode.id){
					console.log(this.curMode, newMode);

					if(newMode.settings.showBook){

						// maybe initialize flipbook
						if(!this.$book.turn('is')){
							this.$book.turn({
								autoCenter: true,
								display: 'double'
							});
						}

						// size dat book
						if(newMode.settings.bookDouble){
							this.$book.turn('size', this.config.pageSize[0], this.config.pageSize[1]);
							this.$book.turn('display', 'double');
						}else{
							this.$book.turn('size', Math.floor(this.config.pageSize[0]/2), this.config.pageSize[1]);
							this.$book.turn('display', 'single');
						}


						
						if(this.curViewer != 'book'){
							// hide scroller
							this.$scroll.detach();

							// key bindings
							$win.on('keydown:book', function(e){
								if (e.target && e.target.tagName.toLowerCase()!='input')
									if (e.keyCode==37)
										$book.turn('previous');
									else if (e.keyCode==39)
										$book.turn('next');
							});

							$body.addClass('book').removeClass('scroll');

							// attach book
							this.$book.appendTo(this.$bookwrap);
						}

						this.curViewer = 'book';

					}else{

						if(this.curViewer != 'scroll'){
							// hide book
							this.$book.detach();
							$win.off(':book');

							$body.addClass('scroll').removeClass('book');

							// attach scroll
							this.$scroll.appendTo($body);
						}

						this.curViewer = 'scroll';
					}

					this.curMode = newMode;
				}

			}
		},

		Mode = function(id, settings, app){
			this.app = app;
			this.id = id;

			this.settings = {
				showBook: true,
				bookDouble: true,
				fullNav: false,
				maxW: false,
				maxH: false
			};

			$.extend(this.settings, settings);
		};

	Mode.prototype.isShowable = function(){
		return	(this.settings.maxW!==false && this.settings.maxW > winD.w) ||
				(this.settings.maxH!==false && this.settings.maxH > winD.h)
	};

	$win.resize(onResize);

	app.init(appConfig);



})(jQuery, window, appConfig);
