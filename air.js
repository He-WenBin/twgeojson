(function(){
  var windowWidth, width, marginTop, height, canvas, svg, minLatitude, maxLatitude, minLongitude, maxLongitude, dy, dx, proj, drawTaiwan, ConvertDMSToDD, drawStations, drawSegment, addList, list, rainData, samples, distanceSquare, idwInterpolate, colorOf, yPixel, plotInterpolatedData, updateSevenSegment, drawHeatmap, drawAll, stations;
  windowWidth = $(window).width();
  if (windowWidth > 998) {
    width = $(window).height() / 4 * 3;
    width <= 687 || (width = 687);
    marginTop = '0px';
  } else {
    width = $(window).width();
    marginTop = '65px';
  }
  height = width * 4 / 3;
  canvas = d3.select('body').append('canvas').attr('width', width).attr('height', height).style('position', 'absolute').style('margin-top', marginTop).style('top', '0px').style('left', '0px')[0][0].getContext('2d');
  svg = d3.select('body').append('svg').attr('width', width).attr('height', height).style('position', 'absolute').style('top', '0px').style('left', '0px').style('margin-top', marginTop);
  $(document).ready(function(){
    var panelWidth;
    panelWidth = $('#main-panel').width();
    if (windowWidth - panelWidth > 1200) {
      $('#main-panel').css('margin-right', panelWidth);
    }
    $('.data.button').on('click', function(it){
      it.preventDefault();
      $('#main-panel').toggle();
      return $('#info-panel').hide();
    });
    $('.forcest.button').on('click', function(it){
      it.preventDefault();
      $('#info-panel').toggle();
      return $('#main-panel').hide();
    });
    return $('.launch.button').on('click', function(it){
      var sidebar;
      it.preventDefault();
      $('#info-panel').hide();
      sidebar = $('.sidebar');
      return sidebar.sidebar('toggle');
    });
  });
  minLatitude = 21.5;
  maxLatitude = 25.5;
  minLongitude = 119.5;
  maxLongitude = 122.5;
  dy = (maxLatitude - minLatitude) / height;
  dx = (maxLongitude - minLongitude) / width;
  proj = function(arg$){
    var x, y;
    x = arg$[0], y = arg$[1];
    return [(x - minLongitude) / dx, height - (y - minLatitude) / dy];
  };
  drawTaiwan = function(countiestopo){
    var counties, path, g;
    counties = topojson.feature(countiestopo, countiestopo.objects['twCounty2010.geo']);
    path = d3.geo.path().projection(proj);
    g = svg.append('g').attr('id', 'taiwan').attr('class', 'counties');
    return g.selectAll('path').data(counties.features).enter().append('path').attr('class', function(){
      return 'q-9-9';
    }).attr('d', path);
  };
  ConvertDMSToDD = function(days, minutes, seconds){
    var dd;
    days = +days;
    minutes = +minutes;
    seconds = +seconds;
    dd = minutes / 60 + seconds / (60 * 60);
    return days > 0
      ? days + dd
      : days - dd;
  };
  drawStations = function(stations){
    return svg.selectAll('circle').data(stations).enter().append('circle').style('stroke', 'black').style('fill', 'none').attr('r', 2).attr("transform", function(it){
      return "translate(" + proj([+it.lng, +it.lat]) + ")";
    });
  };
  drawSegment = function(d, i){
    var rawValue, ref$;
    d3.select('#station-name').text(d.name);
    if (rainData[d.name] != null && !isNaN(rainData[d.name]['PM10'])) {
      rawValue = parseInt(rainData[d.name]['PM10']) + "";
      return updateSevenSegment(repeatString$(" ", 0 > (ref$ = 4 - rawValue.length) ? 0 : ref$) + rawValue);
    } else {
      return updateSevenSegment("----");
    }
  };
  addList = function(stations){};
  list = d3.select('div.sidebar');
  list.selectAll('a').data(stations).enter().append('a').attr('class', 'item').text(function(it){
    return it.SITE;
  }).on('click', function(d, i){
    drawSegment(d, i);
    $('.launch.button').click();
    return $('#main-panel').css('display', 'block');
  });
  rainData = {};
  samples = {};
  distanceSquare = function(arg$, arg1$){
    var x1, y1, x2, y2;
    x1 = arg$[0], y1 = arg$[1];
    x2 = arg1$[0], y2 = arg1$[1];
    return Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2);
  };
  idwInterpolate = function(samples, power, point){
    var sum, sumWeight, i$, len$, s, d, weight;
    sum = 0.0;
    sumWeight = 0.0;
    for (i$ = 0, len$ = samples.length; i$ < len$; ++i$) {
      s = samples[i$];
      d = distanceSquare(s, point);
      if (d === 0.0) {
        return s[2];
      }
      weight = 1.0 / (d * d);
      sum = sum + weight;
      sumWeight = sumWeight + weight * (isNaN(s[2])
        ? 0
        : s[2]);
    }
    return sumWeight / sum;
  };
  colorOf = d3.scale.linear().domain([0, 50, 100, 200, 300]).range([d3.hsl(100, 1.0, 0.6), d3.hsl(60, 1.0, 0.6), d3.hsl(30, 1.0, 0.6), d3.hsl(0, 1.0, 0.6), d3.hsl(0, 1.0, 0.1)]);
  yPixel = 0;
  plotInterpolatedData = function(){
    var renderLine;
    yPixel = height;
    renderLine = function(){
      var i$, to$, xPixel, y, x, z, ref$;
      if (yPixel >= 0) {
        for (i$ = 0, to$ = width; i$ <= to$; i$ += 2) {
          xPixel = i$;
          y = minLatitude + dy * yPixel;
          x = minLongitude + dx * xPixel;
          z = 0 > (ref$ = idwInterpolate(samples, 4.0, [x, y])) ? 0 : ref$;
          canvas.fillStyle = colorOf(z);
          canvas.fillRect(xPixel, height - yPixel, 2, 2);
        }
        yPixel = yPixel - 2;
        return setTimeout(renderLine, 0);
      }
    };
    return renderLine();
  };
  updateSevenSegment = function(valueString){
    var pins, sevenSegmentCharMap;
    pins = "abcdefg";
    sevenSegmentCharMap = {
      ' ': 0x00,
      '-': 0x40,
      '0': 0x3F,
      '1': 0x06,
      '2': 0x5B,
      '3': 0x4F,
      '4': 0x66,
      '5': 0x6D,
      '6': 0x7D,
      '7': 0x07,
      '8': 0x7F,
      '9': 0x6F
    };
    return d3.selectAll('.seven-segment').data(valueString).each(function(d, i){
      var bite, i$, to$, bit, results$ = [];
      bite = sevenSegmentCharMap[d];
      for (i$ = 0, to$ = pins.length - 1; i$ <= to$; ++i$) {
        i = i$;
        bit = Math.pow(2, i);
        results$.push(d3.select(this).select("." + pins[i]).classed('on', (bit & bite) === bit));
      }
      return results$;
    });
  };
  function piped(url){
    return "http://datapipes.okfnlabs.org/csv/?url=" + escape(url);
  }
  drawHeatmap = function(stations){
    return d3.csv(piped('http://opendata.epa.gov.tw/ws/Data/AQX/?$orderby=SiteName&$skip=0&$top=1000&format=csv'), function(it){
      var res$, i$, len$, e, ref$, st, val, y, xOff, yOff, c, legend;
      res$ = {};
      for (i$ = 0, len$ = it.length; i$ < len$; ++i$) {
        e = it[i$];
        res$[e.SiteName] = e;
      }
      rainData = res$;
      d3.select('#rainfall-timestamp').text("DATE: " + it[0].PublishTime);
      d3.select('#station-name').text("已更新");
      updateSevenSegment("    ");
      res$ = [];
      for (i$ = 0, len$ = (ref$ = stations).length; i$ < len$; ++i$) {
        st = ref$[i$];
        if (rainData[st.name] != null) {
          val = parseFloat(rainData[st.name]['PM10']);
          if (isNaN(val)) {
            continue;
          }
          res$.push([+st.lng, +st.lat, val]);
        }
      }
      samples = res$;
      y = 0;
      xOff = width - 100 - 40;
      yOff = height - 32 * 5 - 40;
      svg.append('rect').attr('width', 100).attr('height', 32 * 5).attr('x', 20 + xOff).attr('y', 20 + yOff).style('fill', '#000000').style('stroke', '#555555').style('stroke-width', '2');
      for (i$ = 0, len$ = (ref$ = colorOf.domain()).length; i$ < len$; ++i$) {
        c = ref$[i$];
        y += 30;
        legend = svg.append('g');
        legend.append('rect').attr('width', 20).attr('height', 20).attr('x', 30 + xOff).attr('y', y + yOff).style('fill', colorOf(c));
        legend.append('text').attr('x', 55 + xOff).attr('y', y + 15 + yOff).attr('d', '.35em').text(c + ' μg/m³').style('fill', '#AAAAAA').style('font-size', '10px');
      }
      svg.selectAll('circle').data(stations).style('fill', function(st){
        if (rainData[st.name] != null && !isNaN(rainData[st.name]['PM10'])) {
          return colorOf(parseFloat(rainData[st.name]['PM10']));
        } else {
          return '#FFFFFF';
        }
      }).on('mouseover', function(d, i){
        return drawSegment(d, i);
      });
      return plotInterpolatedData();
    });
  };
  drawAll = function(stations){
    var res$, i$, len$, s;
    res$ = [];
    for (i$ = 0, len$ = stations.length; i$ < len$; ++i$) {
      s = stations[i$];
      s.lng = ConvertDMSToDD.apply(null, s.SITE_EAST_LONG.split(','));
      s.lat = ConvertDMSToDD.apply(null, s.SITE_NORTH_LAT.split(','));
      s.name = s.SITE;
      res$.push(s);
    }
    stations = res$;
    drawStations(stations);
    addList(stations);
    return drawHeatmap(stations);
  };
  if (localStorage.countiestopo && localStorage.stations) {
    console.log('draw from local storage');
    drawTaiwan(JSON.parse(localStorage.countiestopo));
    stations = JSON.parse(localStorage.stations);
    drawAll(stations);
  } else {
    d3.json("twCounty2010.topo.json", function(countiestopo){
      localStorage.countiestopo = JSON.stringify(countiestopo);
      drawTaiwan(countiestopo);
      return d3.csv("epa-site.csv", function(stations){
        localStorage.stations = JSON.stringify(stations);
        return drawAll(stations);
      });
    });
  }
  d3.csv(piped('http://opendata.epa.gov.tw/ws/Data/AQF/?$orderby=AreaName&$skip=0&$top=1000&format=csv'), function(forecast){
    var first;
    first = forecast[0];
    d3.select('#forecast').text(first.Content);
    return d3.select('#info-panel').text(first.Content);
  });
  function repeatString$(str, n){
    for (var r = ''; n > 0; (n >>= 1) && (str += str)) if (n & 1) r += str;
    return r;
  }
}).call(this);
