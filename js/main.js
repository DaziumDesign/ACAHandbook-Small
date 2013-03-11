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
	page: [500, 666],
	pageMargins: [32, 35],
	pageMarginLeaniency: .7 // percentage that we will allow page contents to enter pages' bottom margin 
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
			$tabs: $('#side-tabs'),
			$scroll: false,

			targetLookup: {},
			modes: [],
			curViewer: false,
			curMode: false,
			curSect: '',

			init: function(config){
				var app = this;

				this.config = config;

				$.each(config.modes, function(id, settings){
					app.modes.push(new Mode(id, settings, app));
				});

				// bind resize funcs
				$win.resize(function(){ resizeHandler.onResize.call(resizeHandler) });

				$body.on('click', 'li[data-target], span[data-target], a[data-target]', function(e){
					app.gotoPage.call(app, $(e.currentTarget).data('target'));
				});

				// auto-paginate divs that need it
				this.autoPaginate();

				// clone book contents into scroll for later
				// (since it gets modified by turn.js)
				this.$scroll = this.$book.clone(false).attr('id', 'scroll');

				// build targetLookup directory
				$('[data-target]').each(function(i, el){
					var target = el.attributes['data-target'].value,
						$el;

					if(app.targetLookup[target] !== undefined)
						return;

					$el = $(target);
					if(!$el.hasClass('page'))
						$el = $el.parents('.page');

					app.targetLookup[target] = $el.index() + 1;
				});

				console.log(app.targetLookup);

				// add to resizeFuncs
				resizeHandler.addFunc('appSetMode', this.setMode, this, 2);
				resizeHandler.addFunc('viewportScale', this.viewportScale, this, 1);

				// initialize more dimensions
				this.config.dimensions.book = [0, this.config.dimensions.page[1]];
				this.config.dimensions.matte = [0, this.config.dimensions.page[1] + (appConfig.dimensions.mattePadding * 2)];
				this.config.dimensions.wrap = [0, this.config.dimensions.matte[1]];

				// set her up
				this.setSect(0, true);
				$win.resize();
			},

			autoPaginate: function(){
				var app = this;

				app.$book.find('.page[data-auto-pagination]').each(function(i, el){
					var $pgAuto = $(el),
						$children = $pgAuto.children(),
						classes,
						pageNum = 0,
						$newPageTemplate = $('<div />'),
						$newPage,
						breakHeight,
						curHeight = 0,
						numberFormat = $pgAuto.attr('data-number-format');

					classes = $pgAuto.attr('class').split(' ');
					$.each(classes, function(j, c){
						if(c.search(/^pg-/) == -1)
							return

						pageNum = c.substring(3);
						return false;
					});

					$newPageTemplate.attr('class', classes.join(' ')).removeClass('pg-'+pageNum);

					breakHeight = app.config.dimensions.page[1] - (app.config.dimensions.pageMargins[1]);

					$children.each(function(j, child){
						var $child = $(child),
							cMargin,
							cHeight,
							formattedPageNum;

						cHeight = $child.outerHeight(true);
						cMargin = cHeight - $child.outerHeight(false);

						if(curHeight + cHeight - cMargin > breakHeight){
							$newPage.appendTo($pgAuto);

							pageNum++;
							curHeight = 0;
						}

						if(curHeight===0){
							if(numberFormat=='roman')
								formattedPageNum = app.util.romanize(pageNum);
							else
								formattedPageNum = pageNum;
							
							$newPage = $newPageTemplate.clone().addClass('pg-' + formattedPageNum)
											.append('<div style="height: ' + app.config.dimensions.pageMargins[1] + 'px"></div>');
						}

						curHeight += cHeight;
						$child.appendTo($newPage);

					});

					$pgAuto.children().unwrap();

				});
			},

			getSect: function(event, newPage){
				var classes,
					curSect,
					$newPage;

				if(newPage !== undefined){
					$newPage = $('div.p'+newPage);
					classes = $newPage.attr('class').split(' ');

					$.each(classes, function(i, el){
						if(el.substring(0, 4) == 'sect'){
							curSect = el.substring(5);
							return false;
						}
					});
				}else{
					//calculate based on scroll
					//TODO
				}

				console.log($newPage);
				this.setSect(curSect, $newPage.hasClass('show-all-tabs'));

			},

			setSect: function(sect, showAllTabs){
				//console.log(this.$navs).hasClass('.sect-' + sect));
				if(showAllTabs)
					this.$tabs.addClass('show-all');
				else
					this.$tabs.removeClass('show-all');

				if(sect !== this.curSect){

					// navs
					this.$navs.removeClass('cur')
						.filter('.sect-' + sect).addClass('cur');

					// tabs
					this.$tabs.removeClass('sect-0 sect-1 sect-2').addClass('sect-' + sect);

					this.curSect = sect;
				}

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

					// book or scroll?
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

							// turn binding for cursect
							app.$book.on('start', function(event, pageObject, corner){
								app.getSect.call(app, event, pageObject.next)
							});

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
							app.$book.off('start');

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

			// handles 'data-target' stuff.
			gotoPage: function(req){
				if(this.curViewer == 'book')
					this.$book.turn('page', this.targetLookup[req]);
				else{
					$('body, html').animate({
						scrollTop: $(req).offset().top
					}, 500);
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


	app.util = {
		romanize: function(num) {
			if (!+num)
				return false;
			var digits = String(+num).split(''),
				key = ['','C','CC','CCC','CD','D','DC','DCC','DCCC','CM',
					   '','X','XX','XXX','XL','L','LX','LXX','LXXX','XC',
					   '','I','II','III','IV','V','VI','VII','VIII','IX'],
				roman = '',
				i = 3;
			while (i--)
				roman = (key[+digits.pop() + (i * 10)] || '') + roman;
			return Array(+digits.join('') + 1).join('M') + roman;
		}
	};


	app.init(appConfig);



})(jQuery, window, appConfig);
