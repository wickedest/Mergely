/*
* jQuery Edit Plugin
* version: 1.0 (2011/06/30)
* @requires jQuery v1.1 or later
*
* Examples at: 
* License:
*/
(function ($) {

    $.fn.editable = function (method) {
        return this.each(function (index) {
            var tthis = $(this);
            var settings = {
				cancel: function (target) { },
				accept: function (target) { }
            };
			$(this).addClass('editable-default');
			$(this).mouseenter(function(){
				$(this).addClass('editable-hover').removeClass('editable-default').attr('contenteditable', 'true');
			}).mouseleave(function(){
				$(this).addClass('editable-default').removeClass('editable-hover').attr('contenteditable', 'false');
			});

            var methods = {
                init: function (options) {
                    if (options) $.extend(settings, options);
                }
            };
            if (methods[method]) {
                return methods[method].apply(this, Array.prototype.slice.call(method, 1));
            }
            else if (typeof (method) == 'object' || !method) {
                return methods.init(method);
            }
            else {
                $.error('Method ' + method + ' does not exist on jQuery.edit');
            }
        });
    }

})(jQuery);
