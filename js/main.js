var appConfig = {
	dimensions: {},
	modes: {}
};



appConfig.dimensions = {
	navW: 216,
	mattePadding: 29,
	page: [500, 666],
};

//the first one will be default, ordered by lowest priority when conditions are met
appConfig.modes = { 
	full: {
		fullNav: true
	},
	minNav: {
		fullNav: false,
		maxW: (appConfig.dimensions.page[0]*2) + appConfig.dimensions.navW + appConfig.dimensions.mattePadding
	},
	single: {
		fullNav: false,
		bookDouble: false,
		maxW: (appConfig.dimensions.page[0]*2) + (appConfig.dimensions.mattePadding*2)
	},
	scroll: {
		showBook: false,
		fullNav: false,
		maxH: appConfig.dimensions.page[1],
		maxW: appConfig.dimensions.page[0] + (appConfig.dimensions.mattePadding*2)
	}
};

(function($, window, appConfig, undefined){
	var $win = $(window),
		$body = $('body'),
		winD = {
			h: $win.height(),
			w: $win.width()
		},
		resizeFuncs = {},
		onResize = function(){
			winD = {
				h: $win.height(),
				w: $win.width()
			};

			$.each(resizeFuncs, function(id, funcInfo){
				funcInfo.func.call(funcInfo.context);
			});
		},

		app = {
			$bookwrap: $('#book-wrap'),
			$bookmatte: $('#book-matte'),
			$book: $('#book'),
			$navs: $('nav'),
			$scroll: false,

			modes: [],
			curViewer: false,
			curMode: false,
			curSect: 0,

			init: function(config){
				var app = this;

				this.config = config;

				$.each(config.modes, function(id, settings){
					app.modes.push(new Mode(id, settings, app));
				});

				// clone book contents into scroll for later
				// (since it gets modified by turn.js)
				this.$scroll = this.$book.clone(false).attr('id', 'scroll');

				resizeFuncs.appSetMode = {
					func: this.setMode,
					context: this
				};

				// initialize static dimensions (height)
				this.config.dimensions.matte = [0, this.config.dimensions.page[1] + (appConfig.dimensions.mattePadding * 2)];
				this.config.dimensions.wrap = [0, this.config.dimensions.matte[1]];

				// set her up
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
							this.$book.turn();

						}

						// size dat book
						if(newMode.settings.bookDouble){
							this.config.dimensions.bookW = this.config.dimensions.page[0] * 2;
							this.$book.turn('display', 'double');
						}else{
							this.config.dimensions.bookW = this.config.dimensions.page[0];
							this.$book.turn('display', 'single');
						}
						this.config.dimensions.bookH = this.config.dimensions.page[1];

						this.$book.turn('size', this.config.dimensions.bookW, this.config.dimensions.bookH);
						this.$bookmatte.width(this.config.dimensions.bookW);
						this.$bookwrap.width((newMode.settings.fullNav * this.config.dimensions.navW) + bookW + this.config.dimensions.mattePadding);

						//nav stuff
						if(newMode.settings.fullNav)
							this.$navs.addClass('fixed');
						else
							this.$navs.removeClass('fixed');



						
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
							this.$book.appendTo(this.$bookmatte);
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
