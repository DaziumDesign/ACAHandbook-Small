var appConfig = {};

appConfig.viewport = {
	gap: [40, 40],
	content: {
		'width': 'device-width',
		'initial-scale': '1',
		'maximum-scale': '2'
	}
}

appConfig.dimensions = {
	navW: 216,
	mattePadding: 29,
	page: [500, 666]
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

		setWinD = function(){
			winD = {
				h: $win.height(),
				w: $win.width()
			};
		}

		resizeHandler = {
			funcs: [],

			onResize: function(){
				setWinD();
				$.each(this.funcs, function(i, funcInfo){
					funcInfo.f.call(funcInfo.context);
				});
			},

			addFunc: function(id, f, context, priority){
				var newFunc = {
					id: id,
					f: f,
					context: context,
					priority: priority===undefined ? 10 : priority
				};

				arrSpot = 0;
				while(this.funcs[arrSpot]!==undefined && this.funcs[arrSpot].priority <= priority)
					arrSpot++;

				this.funcs.splice(arrSpot, 0, newFunc);

				console.log(this.funcs);
			},

			removeFunc: function(id){
				var rHandler = this;
				$.each(this.funcs, function(i, el){
					if(el.id == id){
						rHandler.funcs.splice(i, 1);
						return false;
					}
				});
			}
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

				// bind resize funcs
				$win.resize(function(){ resizeHandler.onResize.call(resizeHandler) });

				// clone book contents into scroll for later
				// (since it gets modified by turn.js)
				this.$scroll = this.$book.clone(false).attr('id', 'scroll');

				// add setMode to resizeFuncs
				resizeHandler.addFunc('appSetMode', this.setMode, this, 2);

				resizeHandler.addFunc('viewportScale', this.viewportScale, this, 1);

				// initialize more dimensions
				this.config.dimensions.book = [0, this.config.dimensions.page[1]];
				this.config.dimensions.matte = [0, this.config.dimensions.page[1] + (appConfig.dimensions.mattePadding * 2)];
				this.config.dimensions.wrap = [0, this.config.dimensions.matte[1]];

				// set her up
				$win.resize();

			},

			setMode: function(){
				var newMode = this.modes[0],
					dim = this.config.dimensions;

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

							//add classes to each page
							$('div.page').each(function(i, el){
								$(el).addClass(i%2 ? 'left' : 'right');
							});
						}

						// size dat book
						if(newMode.settings.bookDouble){
							dim.book[0] = dim.page[0] * 2;
							this.$book.turn('display', 'double');
							$body.removeClass('single').addClass('double');
						}else{
							dim.book[0] = dim.page[0];
							this.$book.turn('display', 'single');
							$body.removeClass('double').addClass('single');
						}
						this.$book.turn('size', dim.book[0], dim.book[1]);

						dim.matte[0] = dim.book[0];
						dim.wrap[0] = (newMode.settings.fullNav * dim.navW) + dim.book[0] + dim.mattePadding;

						this.$bookmatte.width(dim.matte[0]);
						this.$bookwrap.width(dim.wrap[0]);


						//nav stuff
						if(newMode.settings.fullNav)
							this.$navs.addClass('fixed');
						else
							this.$navs.removeClass('fixed');



						
						if(this.curViewer != 'book'){
							// hide scroller
							this.$scroll.detach();

							// resize binding
							resizeHandler.addFunc('viewportScale', this.viewportScale, this, 5);
							resizeHandler.addFunc('centerVertically', this.centerVertically, this, 10);

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
							this.$bookwrap.appendTo($body);

							// scale and center it
							this.centerVertically.call(this);
						}

						this.curViewer = 'book';

					}else{

						if(this.curViewer != 'scroll'){
							// hide book
							this.$bookwrap.detach();

							// kill resize binding
							resizeHandler.removeFunc('centerVertically');

							// kill event listeners
							$win.off(':book');

							$body.addClass('scroll').removeClass('book');

							// attach scroll
							this.$scroll.appendTo($body);
						}

						this.curViewer = 'scroll';
					}

					this.curMode = newMode;
				}

			},

			centerVertically: function(){
				var adjuster;

				if(this.config.viewport.content['width'] == 'device-width')
					adjuster = this.config.viewport.content['initial-scale'];
				else
					adjuster = (winD.w/this.config.viewport.content['width']);

				this.$bookwrap.css('margin-top', Math.floor(((winD.h/2) - this.config.dimensions.wrap[1]/2))/ adjuster );
			},

			viewportScale: function(){
				var isPortrait = winD.h > winD.w,
					newContent = '',
					hDiff = winD.h - this.config.dimensions.page[1],
					wDiff = winD.w - this.config.dimensions.page[0];


				if(isPortrait){
					this.config.viewport.content['width'] = this.config.dimensions.page[0] + (this.config.dimensions.mattePadding*2); //Math.floor((winD.w / this.config.dimensions.page[0]) * 10) / 10;
				}else if(!isPortrait){
					this.config.viewport.content['width'] = (this.config.dimensions.page[0]*2) + (this.config.dimensions.mattePadding*2);
				}

				if(this.config.viewport.content['width'] > winD.w){
					this.config.viewport.content['initial-scale'] = Math.floor(winD.w / this.config.viewport.content['width'] * 10) / 10;
					this.config.viewport.content['width'] = 'device-width';
				}


				// alert(this.config.viewport.content['initial-scale'] + ' ' + winD.w );

				//update meta tag
				$.each(this.config.viewport.content, function(i, el){
					if(el!==false)
						newContent += i + '=' + el + ', ';
				});
				if(newContent.length>0)
					newContent = newContent.substring(0, newContent.length-2);

				$('meta[name="viewport"]').attr('content', newContent);

				setWinD();
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


	app.init(appConfig);



})(jQuery, window, appConfig);
