var appConfig = {};

appConfig.turnJsSettings = {
	acceleration: true,
	page: 2
};

appConfig.viewport = {
	gap: [40, 40],
	content: {
		'width': 'device-width',
		'initial-scale': '1',
		'maximum-scale': '2'
	}
};

appConfig.dimensions = {
	mattePadding: 29,
	page: [488, 660],
	pageMargins: [32, 35],
	pageMarginLeaniency: 1.7 // percentage that we will allow page contents to enter Y margin 
};

//the first one will be default, ordered by lowest priority when conditions are met
appConfig.modes = { 
	full: {
		maxW: (appConfig.dimensions.page[0]*2) +appConfig.dimensions.mattePadding,
	},
	single: {
		bookDouble: false,
		maxW: (appConfig.dimensions.page[0]*2) + (appConfig.dimensions.mattePadding*2)
	},
	scroll: {
		showBook: false,
		maxH: appConfig.dimensions.page[1],
		maxW: appConfig.dimensions.page[0] + (appConfig.dimensions.mattePadding*2),
		forcePhone: true,
		forcePortraitPad: true
	}
};

acaBookApp = (function($, window, appConfig, undefined){
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
		},

		resizeHandler = {
			funcs: [],

			onResize: function(){
				setWinD();
				$.each(this.funcs, function(i, funcInfo){
					if(typeof(funcInfo) == 'undefined')
						return;
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

		acaApp = {
			$whiteout: $('#whiteout'),
			$app: $('<div />').attr('id', 'app-wrap').appendTo($body),
			$bookwrap: $('#book-wrap'),
			$bookmatte: $('#book-matte'),
			$book: $('#book'),
			$toc: $('#toc'),
			$tocWrap: $('#toc .wrap'),
			$tocToggle: $('#toc-toggle'),
			$tabs: $('#side-tabs'),
			$scroll: false,

			targetLookup: {},
			modes: [],
			curViewer: false,
			curMode: false,
			scrollCurPage: 1,

			init: function(config){
				var app = this;

				app.isPad = ( navigator.userAgent.match(/(iPad)/g) ? true : false );
				app.isPhone = (function(a){return (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))})(navigator.userAgent||navigator.vendor||window.opera);

				//setup whiteout
				app.$whiteout.css({
					width: winD.w,
					height: winD.h
				});
				app.$bookwrap.show();


				// TOC bindings
				app.$toc.prependTo(app.$app);
				app.$tocToggle.prependTo(app.$app).show();

				app.$tocToggle.on('click', function(e){
					e.stopPropagation();
					app.tocToggle.call(app);
				});

				app.$toc.find('span').on('click', function(e){
					app.tocToggle.call(app);
				});

				app.config = config;

				$.each(config.modes, function(id, settings){
					app.modes.push(new Mode(id, settings, app));
				});

				// bind resize funcs
				$win.resize(function(){ resizeHandler.onResize.call(resizeHandler) });

				app.$app.on('click', 'li[data-target], span[data-target], a[data-target]', function(e){
					app.gotoPageByTarget.call(app, $(e.currentTarget).data('target'));
				});

				// auto-paginate divs that need it
				app.autoPaginate();

				// clone book contents into scroll for later
				// (since it gets modified by turn.js)
				app.$scroll = app.$book.clone(false).attr('id', 'scroll');
				app.$scroll.children().each(function(i, el){
					$(el).addClass('p'+(i+1));
				});

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

				// hasher
				hasher.changed.add(function(newHash, oldHash){
					var p = newHash.substring(newHash.indexOf('=') + 1);

					app.gotoPage(p, true);

				});
				hasher.init();


				// add to resizeFuncs
				resizeHandler.addFunc('viewportScale', app.viewportScale, app, 2);
				resizeHandler.addFunc('appSetMode', app.setMode, app, 3);
				resizeHandler.addFunc('tocSize', app.tocSize, app, 4);

				// initialize more dimensions
				app.config.dimensions.book = [0, app.config.dimensions.page[1]];
				app.config.dimensions.matte = [0, app.config.dimensions.page[1] + (appConfig.dimensions.mattePadding * 2)];
				app.config.dimensions.wrap = [0, app.config.dimensions.matte[1]];

			},

			tocToggle: function(){
				this.$tocToggle.toggle();
				this.$toc.toggle();
			},

			tocSize: function(){
				this.$toc.height(winD.h);
				this.$tocWrap.height(winD.h - 30);
			},

			go: function(){
				var app = this;
				$win.resize();

				// hack because functions are getting added to the resize stack by the time we "go"
				app.tocSize.call(app);

				app.$whiteout.fadeOut(500, function(){
					app.$whiteout.remove();
				});
			},

			appWrapSize: function(){
				this.$app.css({
					width: winD.w,
					height: winD.h
				});

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
						if(c.search(/^pg-[0-9]/) == -1)
							return

						pageNum = c.substring(3);
						return false;
					});

					$newPageTemplate.attr('class', classes.join(' ')).removeClass('pg-'+pageNum);

					breakHeight = app.config.dimensions.page[1] - (app.config.dimensions.pageMargins[1] * app.config.dimensions.pageMarginLeaniency);

					$children.each(function(j, child){
						var $child = $(child),
							cMargin,
							cHeight,
							formattedPageNum;

						cHeight = $child.outerHeight(true);
						cMargin = cHeight - $child.outerHeight(false);

						if(curHeight + cHeight - cMargin > breakHeight || $child.hasClass('page-break')){
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

			setHashSilently: function(hash){
				hasher.changed.active = false; //disable changed signal
				hasher.setHash(hash); //set hash without dispatching changed signal
				hasher.changed.active = true; //re-enable signal
			},

			setMode: function(modeID){
				var	app = this,
					newMode = app.modes[0],
					dim = app.config.dimensions
					hashVal = window.location.hash,
					p = hashVal.substring(hashVal.indexOf('=')+1);

				if(typeof(modeID)=='undefined'){
					$.each(app.modes, function(i, mode){
						if(mode.isShowable())
							newMode = mode;
					});
				}else
					newMode = app.modes[modeID];

				if(!app.curMode || app.curMode.id != newMode.id){

					// book or scroll?
					if(newMode.settings.showBook){

						// maybe initialize flipbook
						if(!app.$book.turn('is')){
							app.$book.turn(app.config.turnJsSettings);
						}

						// size dat book
						if(newMode.settings.bookDouble){
							dim.book[0] = dim.page[0] * 2;
							app.$book.turn('display', 'double');
							app.$app.removeClass('single').addClass('double');
						}else{
							dim.book[0] = dim.page[0];
							app.$book.turn('display', 'single');
							app.$app.removeClass('double').addClass('single');
						}
						app.$book.turn('size', dim.book[0], dim.book[1]);

						dim.matte[0] = dim.book[0];
						dim.wrap[0] = dim.book[0] + dim.mattePadding;

						app.$bookmatte.width(dim.matte[0]);
						app.$bookwrap.width(dim.wrap[0]);

						
						if(app.curViewer != 'book'){
							// hide scroller
							app.$scroll.detach();

							// resize binding
							resizeHandler.addFunc('appWrap', app.appWrapSize, app, 1);
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

							app.$app.addClass('book').removeClass('scroll');


							// kill book event listeners
							$win.off('scroll.book');

							// attach book
							app.$bookwrap.appendTo(app.$app);

							// scale and center it
							app.centerVertically.call(app);
							app.appWrapSize.call(app);

							//hash stuff
							app.$book.on('turned.hash', function(event, page, view){
								app.setHashSilently('page=' + page);
							});


							if(p.length > 0)
								app.$book.turn('page', p);
							
							
						}

						app.curViewer = 'book';

					}else{

						if(app.curViewer != 'scroll'){
							// hide book
							app.$bookwrap.detach();

							// kill resize binding
							resizeHandler.removeFunc('appWrap');
							resizeHandler.removeFunc('viewportScale');
							resizeHandler.removeFunc('centerVertically');

							// kill book event listeners
							$win.off('keydown.book');
							app.$book.off('end')

							app.$app.addClass('scroll').removeClass('book');

							// attach scroll
							app.$scroll.appendTo(app.$app);

							// hash stuff
							var curWaiting = false,
								dest = 0;

							
							if(p.length > 0){
								dest = $('.p'+p).position().top;
								app.scrollCurPage = parseInt(p);
							}


							app.$app.animate({
								scrollTop: dest
							}, 500, function(){
								app.$app.on('scroll.book', function(event){
									if(!curWaiting){
										curWaiting = true;
										setTimeout(function(){
											var curTestTop = $('.p'+ app.scrollCurPage).position().top

											while( curTestTop + app.config.dimensions.page[1] < 0){
												app.scrollCurPage++;
												curTestTop = $('.p'+ app.scrollCurPage).position().top;
											}

											while( curTestTop > 0){
												app.scrollCurPage--;
												curTestTop = $('.p'+ app.scrollCurPage).position().top;
											}

											app.setHashSilently('page=' + app.scrollCurPage);

											curWaiting = false;
										}, 250);
									}
								});
							});

							// relax wrapper size
							app.$app.css({
								width: 'auto',
								height: 'auto'
							});

							

						}

						app.curViewer = 'scroll';
					}


					app.curMode = newMode;
				}

			},

			// handles 'data-target' stuff.
			gotoPageByTarget: function(req){
				var app = this;

				app.gotoPage(app.targetLookup[req]);
			},

			gotoPage: function(p, noHashChange){
				var app = this;

				if(app.curViewer == 'book'){
					if(noHashChange){
						app.$book.off('turned.hash');
						app.$book.on('turned.hash-temp', function(){

							app.$book.on('turned.hash', function(event, page, view){
								app.setHashSilently('page=' + page);
								console.log('new');
							});
							app.$book.off('turned.hash-temp');
						})
					}
					app.$book.turn('page', p);
				}else{
					$('html, body').animate({
						scrollTop: $('.p'+p).position().top
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

				if(!this.isPad)
					return;

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
				forcePhone: false,
				forcePortraitPad: false,
				maxW: false,
				maxH: false
			};

			$.extend(this.settings, settings);
		};

	Mode.prototype.isShowable = function(){
		var isPortrait = winD.h > winD.w,
			wellIsIt = (this.settings.forcePortraitPad && isPortrait)
				|| (this.settings.forcePhone && this.app.isPhone)
				|| (
					(this.settings.maxW!==false && this.settings.maxW > winD.w) ||
					(this.settings.maxH!==false && this.settings.maxH > winD.h)
				);

		//alert(this.id + ' ' + wellIsIt);

		return	wellIsIt;
	};


	acaApp.util = {
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


	acaApp.init(appConfig);

	return acaApp;



})(jQuery, window, appConfig);
