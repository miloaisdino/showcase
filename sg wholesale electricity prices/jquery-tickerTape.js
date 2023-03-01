(function($) {

  var _AjaxUrl;
  var _AjaxUrl2;
  var _AjaxHTML = "";
  var _AjaxHTML = "";
  var _Format;
  var _TickerContainerClone;
  var _TickerDataBuffer;
  var _TickerDataAdvisoriesBuffer;
  var _DATA_REFRESH_TIME = 2 * 60000; // 2 mins
  var _IsFirstAjaxRequest = true;
  var _AnimationPaused = false;
  var _AnimationPauseLock = false;
  var _Speed = 50;

  $.fn.tickerTape = function(options) {

    var options = $.extend({}, $.fn.tickerTape.defaults, options);
    if ((options.url != undefined) && (options.url != '')) {
      _AjaxUrl = options.url;
    }
    if ((options.url2 != undefined) && (options.url2 != '')) {
      _AjaxUrl2 = options.url2;
    }
    else if (options.data != undefined) {
      _TickerDataBuffer = $.parseJSON(options.data);
    }
    _Format = options.format;
    _Speed = options.speed;

    return this.each(function() {
      var rootNode = $(this);

      $.fn.tickerTape.CreateViewPort(rootNode);
      $.fn.tickerTape.RefreshTickerData(rootNode.attr("id"), options.direction);

      rootNode.mouseover(function() {
        if (!_AnimationPauseLock) {
          _AnimationPaused = true;
        }
      })

      rootNode.mouseout(function() {
        if (!_AnimationPauseLock) {
          _AnimationPaused = false;
        }
      })

      // Toggle locking the pause, if unlocking, restart immediately
      rootNode.mouseup(function() {
        _AnimationPauseLock = !_AnimationPauseLock;
        if (!_AnimationPauseLock) {
          _AnimationPaused = false;
        }
      })

    });
  };

  //
  // Refresh ticker data
  //
  $.fn.tickerTape.RefreshTickerData = function(id, direction) {

    // If no url then we are displaying fixed data
    if (_AjaxUrl == undefined) {
      $.fn.tickerTape.RefreshTicker(id, direction, null);
    } else {
      var randomStr = $.fn.tickerTape.RandomString(5);
      var url = _AjaxUrl
      if (url.indexOf("?") != -1) {
        url += "&p=" + randomStr;
      } else {
        url += "?p=" + randomStr;
      }

      $.getJSON(url, function(data) {
        if (data != null) {
          _TickerDataBuffer = data;

          if (_IsFirstAjaxRequest) {
            _IsFirstAjaxRequest = false;

            $.fn.tickerTape.RefreshTicker(id, direction, null);
          }
        }
      });

      if (_AjaxUrl2 != undefined) {
        var randomStr = $.fn.tickerTape.RandomString(5);
        var url2 = _AjaxUrl2
        if (url2.indexOf("?") != -1) {
          url += "&p=" + randomStr;
        } else {
          url += "?p=" + randomStr;
        }

        $.getJSON(url2, function(data) {
          if (data != null) {
            _TickerDataAdvisoriesBuffer = data;

            if (_IsFirstAjaxRequest) {
              _IsFirstAjaxRequest = false;

              $.fn.tickerTape.RefreshTicker(id, direction, null);
            }
          }
        });
      }
    }

    setTimeout("$.fn.tickerTape.RefreshTickerData('" + id + "', '" + direction + "', null);", _DATA_REFRESH_TIME);
  }

  //
  // RefreshTicker
  //
  $.fn.tickerTape.RefreshTicker = function(id, direction, width) {
    if (_TickerDataBuffer != null) {

      if (_Format == 'simple') {
        $.fn.tickerTape.UpdateSimpleTickerData(id);
      } else if (_Format == 'energy') {
        $.fn.tickerTape.UpdateEnergyTickerData(id);
      } else if (_Format == 'advisories') {
        $.fn.tickerTape.UpdateAdvisoryTickerData(id);
      }

      var width = $.fn.tickerTape.GetWidth(id);
      $("#" + id).css('width', (width * 2) + 'px');
    }

    $.fn.tickerTape.ScrollTicker(id, direction, width);
  }

  //
  // Scrolls the ticker
  //
  $.fn.tickerTape.ScrollTicker = function(id, direction, width) {
    var rootNode = $("#" + id);

    // If the whole ticker is smaller than the ticker area, no need to scroll it
    if (!$.fn.tickerTape.NeedsScrolling(id)) { return; }

    var leftVal = parseInt(rootNode.css("left"));
    if (isNaN(leftVal)) {
      leftVal = 0;
    }

    switch (direction) {
      case "right":
        if (!_AnimationPaused) {
          rootNode.css("left", (leftVal + 2) + "px");
        }
        if (leftVal >= 0) {
          rootNode.css("left", "-" + width + "px");
          $.fn.tickerTape.RefreshTicker(id, direction, width);
        } else {
          setTimeout('$.fn.tickerTape.ScrollTicker("' + id + '", "' + direction + '", ' + width + ');', _Speed);
        }
        break;
      default:
        if (!_AnimationPaused) {
          rootNode.css("left", (leftVal - 2) + "px");
        }
        if (leftVal <= -width) {
          rootNode.css("left", "0px");
          $.fn.tickerTape.RefreshTicker(id, direction, width);
        } else {
          setTimeout('$.fn.tickerTape.ScrollTicker("' + id + '", "' + direction + '", ' + width + ');', _Speed);
        }
        break;
    }
  }

  //
  // Return Ticker width
  //
  $.fn.tickerTape.GetWidth = function(id) {
    var rootNode = $("#" + id);
    var width = 0;

    rootNode.find('div.tickerItem').each(function(i) {
      width += $(this).outerWidth(true);
    });

    return Math.round(width / 2);  // Dont count the cloned duplicates. 
  }

  //
  // Return Ticker width
  //
  $.fn.tickerTape.NeedsScrolling = function(id) {
    return ($.fn.tickerTape.GetWidth(id) > $("#" + id).parent().width())
  }

  //
  // CreateViewPort
  //
  $.fn.tickerTape.CreateViewPort = function(rootNode) {
    var viewport = $('<div></div>');
    $(viewport).css('width', rootNode.css('width'));
    $(viewport).css('height', rootNode.css('height'));
    $(viewport).css('position', 'relative');
    //$(viewport).css('overflow', 'hidden');
    rootNode.css('position', 'absolute');
    rootNode.wrap(viewport);
  };

  //
  // UpdateSimpleTickerData
  // 
  $.fn.tickerTape.UpdateSimpleTickerData = function(id) {
    if (_TickerDataBuffer != null) {

      $('#ticker div.portletHeader-r').html('<h3><span>' + _TickerDataBuffer.Heading + '</span></h3>\r\n');

      var htmlStr = '';
      htmlStr += '<div class="tickerItem" style="float:left;">\r\n';
      htmlStr += '  <ul class="feed">\r\n';
      for (var i = 0; i < _TickerDataBuffer.Items.length; i++) {
        htmlStr += '    <li>' + _TickerDataBuffer.Items[i] + '</li>\r\n';
      }
      htmlStr += '  </ul>\r\n';
      htmlStr += '</div>\r\n';

      $("#" + id).html(htmlStr + htmlStr);
      _TickerDataBuffer = null;
    }
  };


  //
  // UpdateEnergyTickerData
  // 
  $.fn.tickerTape.UpdateEnergyTickerData = function(id) {
    if (_TickerDataBuffer != null) {
      $('#ticker div.portletHeader-r').html('<h3><span>' + _TickerDataBuffer.Title + '</span></h3>\r\n' +
                                            '<span>for Period <strong>' + _TickerDataBuffer.Period + ', ' + _TickerDataBuffer.Date + '</strong></span>');

      var htmlStr = $.fn.tickerTape.GetEnergyTickerHtml();

      $("#" + id).html(htmlStr + htmlStr);
      _TickerDataBuffer = null;
    }
  };

  $.fn.tickerTape.GetEnergyTickerHtml = function() {
    var htmlStr = '';
    $.each(_TickerDataBuffer.Sections, function(index, value) {
      htmlStr += '<div class="tickerItem" style="float:left;">\r\n';
      htmlStr += '  <ul class="feed energy">\r\n';
      htmlStr += '    <li><strong>' + value.Name + '</strong></li>\r\n';
      for (var i = 0; i < value.SectionData.length; i++) {
        htmlStr += '    <li>' + value.SectionData[i].Label + ': ' + value.SectionData[i].Value + '</li>\r\n';
      }
      htmlStr += '  </ul>\r\n';
      htmlStr += '</div>\r\n';
    });

    htmlStr += '<div class="tickerItem" style="float: left;">\r\n' +
                 '  <div class="tickerDisclaimer">\r\n' +
                 '    <p>' + _TickerDataBuffer.Disclaimer + '</p>\r\n' +
                 '  </div>\r\n' +
                 '</div>\r\n';

    return htmlStr;
  };

  //
  // UpdateAdvisoryTickerData
  //
  $.fn.tickerTape.UpdateAdvisoryTickerData = function(id) {
    // Two async ajax calls, so only act when both are completed
    if ((_TickerDataBuffer != null) && (_TickerDataAdvisoriesBuffer != null)) {
      $('#ticker div.portletHeader-r').html('<h3><span>Latest Advisories</span></h3>\r\n' +
                                            '<span>for <strong>' + _TickerDataBuffer['Advisory From Date'] + '</strong></span>');

      // Start with energy stats ticker and add advisories
      var htmlStr = $.fn.tickerTape.GetEnergyTickerHtml() + ' ';

      $.each(_TickerDataAdvisoriesBuffer.Sections, function(index, value) {
        htmlStr += '<div class="tickerItem" style="float:left;">\r\n';
        htmlStr += '  <ul class="feed energy">\r\n';
        // Reverse order so latest items are first, take latest two items
        for (var i = (value.SectionData.length - 1); (i >= 0 && (i >= (value.SectionData.length - 2))); i--) {
          var description = value.SectionData[i]['Description'];
          description.replace(/ *| */, ' ');
          htmlStr += '    <li>' + value.SectionData[i]['Title'] + ': ' + description + '</li>\r\n';
        }
        htmlStr += '  </ul>\r\n';
        htmlStr += '</div>\r\n';
      });

      $("#" + id).html(htmlStr + htmlStr);
      _TickerDataAdvisoriesBuffer = null;
    }
  };

  //
  // RandomString
  //
  $.fn.tickerTape.RandomString = function(length) {
    var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz'.split('');

    if (!length) {
      length = Math.floor(Math.random() * chars.length);
    }

    var str = '';
    for (var i = 0; i < length; i++) {
      str += chars[Math.floor(Math.random() * chars.length)];
    }
    return str;
  };

  //
  // Defaults
  //
  $.fn.tickerTape.defaults = {
    speed: 50,
    direction: 'left',
    url: '',
    url2: '',
    data: '{"Heading":"Ticker", "Items":["No information available"]}',
    text: '',
    format: 'simple'
  };

})(jQuery);