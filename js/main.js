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

				// add to resizeFuncs
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
				var	app = this,
					newMode = app.modes[0],
					dim = app.config.dimensions;

				$.each(app.modes, function(i, mode){
					if(mode.isShowable())
						newMode = mode;
				});

				if(!app.curMode || app.curMode.id != newMode.id){
					console.log(app.curMode, newMode);

					if(newMode.settings.showBook){

						// maybe initialize flipbook
						if(!app.$book.turn('is')){
							app.$book.turn();
						}

						// size dat book
						if(newMode.settings.bookDouble){
							dim.book[0] = dim.page[0] * 2;
							app.$book.turn('display', 'double');
							$body.removeClass('single').addClass('double');
						}else{
							dim.book[0] = dim.page[0];
							app.$book.turn('display', 'single');
							$body.removeClass('double').addClass('single');
						}
						app.$book.turn('size', dim.book[0], dim.book[1]);

						dim.matte[0] = dim.book[0];
						dim.wrap[0] = (newMode.settings.fullNav * dim.navW) + dim.book[0] + dim.mattePadding;

						app.$bookmatte.width(dim.matte[0]);
						app.$bookwrap.width(dim.wrap[0]);

						
						if(app.curViewer != 'book'){
							// hide scroller
							app.$scroll.detach();

							// resize binding
							resizeHandler.addFunc('viewportScale', app.viewportScale, app, 5);
							resizeHandler.addFunc('centerVertically', app.centerVertically, app, 10);

							// key bindings
							$win.on('keydown.book', function(e){
								if (e.target && e.target.tagName.toLowerCase()!='input')
									if (e.keyCode==37)
										app.$book.turn('previous');
									else if (e.keyCode==39)
										app.$book.turn('next');
							});

							$body.addClass('book').removeClass('scroll');

							// attach book
							app.$bookwrap.appendTo($body);

							// scale and center it
							app.centerVertically.call(app);
						}

						app.curViewer = 'book';

					}else{

						if(app.curViewer != 'scroll'){
							// hide book
							app.$bookwrap.detach();

							// kill resize binding
							resizeHandler.removeFunc('centerVertically');

							// kill event listeners
							$win.off('keydown.book');

							$body.addClass('scroll').removeClass('book');

							// attach scroll
							app.$scroll.appendTo($body);
						}

						app.curViewer = 'scroll';
					}


					//nav stuff
					if(newMode.settings.fullNav){

						app.$navs.prependTo(app.$bookmatte).addClass('fixed')
							.children('span').hide()
							.next('ul').show();

						// hide/show listener
						this.$navs.off('click.hideableNav');

					}else{
						app.$navs.prependTo($body).removeClass('fixed')
							.children('span').show()
							.next('ul').hide();

						// hide/show listener
						this.$navs.on('click.hideableNav', 'span', function(e){
							var $el = $(e.currentTarget);

							$el.hide().next('ul').show();
						}).on('click.hideableNav', 'ul', function(e){
							var $el = $(e.currentTarget);

							$el.hide().prev('span').show();
						});
					}

					app.curMode = newMode;
				}

			},

			centerVertically: function(){
				var adjuster;

				if(this.config.viewport.content['width'] == 'device-width')
					adjuster = this.config.viewport.content['initial-scale'];
				else
					adjuster = (winD.w/this.config.viewport.content['width']);

				this.$bookwrap.css('padding-top', Math.floor((((winD.h/2) - this.config.dimensions.wrap[1]/2))/ adjuster ));
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
