/*
* jQuery File Upload Plugin
* version: 1.1 (2011/06/30)
* @requires jQuery v1.1 or later
*
* Examples at: 
* License:
*/
(function ($) {

    $.fn.upload = function (method) {
        return this.each(function (index) {
            var tthis = $(this);
            var settings = {
                beforeupload: function (target, evt) { },
                upload: function (target, evt) { }
            };
            var methods = {
                init: function (options) {
                    if (options) $.extend(settings, options);
					var container = $('<div style="display: inline-block;overflow:hidden;"></div>');
					var input = $('<input type="file" name="files[]" multiple="" style="float:left;position:relative;left:-19px;height:16px;width:18px;cursor:pointer;opacity:0;-moz-opacity:0; filter:alpha(opacity=20)" />');
					if (navigator && navigator.appCodeName == 'Mozilla') {
						input.css({'left':'-190px','height':'16px'});
					}
					var button = tthis.clone();
					button.css({position:'relative', float:'left', left:'0px'});
					container.append(button);
					container.append(input);
					container.mouseover(function(){button.addClass('ui-state-hover').css({'cursor':'pointer'});});
					container.mouseleave(function(){button.removeClass('ui-state-hover').css({'cursor':'default'});});
					tthis.after(container);
					container.css({overflow:'hidden'});
					tthis.remove();
                    input.change(function (evt) {
                        var fname = input.val().replace(/^.*\\/, '');
                        if (fname.length) {
							settings.upload(tthis, evt);
                        }
                    });
				}
            };
            if (methods[method]) {
                return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
            }
            else if (typeof (method) == 'object' || !method) {
                return methods.init(method);
            }
            else {
                $.error('Method ' + method + ' does not exist on jQuery.upload');
            }
        });
    }
})(jQuery);
