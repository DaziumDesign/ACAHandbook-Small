(function($) {
$(document).ready(function() {
	var $search = $('#searchable-content');
	var $book = $('#book');
	$book.bind('turn.turned', function(e) {
		setTooltip();
	});
	$book.bind('turn.start', function() {
		$('#tiptip_holder').fadeOut();
	})
	function setTooltip() {
		$('a.will-tooltip').each(function() {
			var data_ptr = $(this).data('content');
			var tip_content = $search.find('p.' + data_ptr).html();
			$(this).tipTip({
				content: tip_content
				,defaultPosition: 'right'
			});
		});
	}
});
})(jQuery);