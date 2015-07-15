var root, index;
var margin = {top: 50, right: 60, bottom: 60, left: 40},
    width = 800 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom,
    barWidth = Math.floor(width / 19) - 1;

var parseDate = d3.time.format("%Y-%m").parse;

var x = d3.scale.ordinal().rangeRoundBands([width, 0], .1);
var y = d3.scale.linear().range([height, 0]);

var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom")
    .tickSize(1);
    // .tickFormat(d3.time.format("%Y-%m"));

var yAxis = d3.svg.axis()
    .scale(y)
    .orient("right")
    .tickSize(-width)
    .tickFormat(d3.format(", f"));


var svg = d3.select(".graph").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");



d3.json("accounts.json", function(error, data){
    root = data;
    var prop = "tu.utilization";
    root = d3.entries(data[prop]);
    var account = [], 
        utilData = [];

    root.forEach(function(d){
        d.value.available_credit = +d.value.available_credit;
        d.value.total_balance = +d.value.total_balance;
        d.value.accounts = +d.value.accounts;
        d.value.utilization = +d.value.utilization;
        account.push(d.value.accounts);
        utilData.push(d.value.utilization);
    });
    utilData = utilData.reverse();
    

    x.domain(root.map(function(d) { return d.key; }));
    y.domain([0, d3.max(root, function(d) { return d.value.available_credit; })]);
    // y0.domain(root.map(function(d) {return d.value.accounts}));

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .style('fill',"#707070")
        // .style('opacity', "0.7")
      .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", "-.55em")
        .attr("transform", "rotate(-90)" );

    svg.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(" + width + ",0)")
        .call(yAxis)
        .style('fill',"#444444")
     .selectAll("g")
      .filter(function(value) { return !value; })
      .classed("zero", true)
    .append("text")
      .attr("y", -400)
      .attr("x", 40)
      // .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Value ($)");


    // add rects
    svg.selectAll("bar")
        .data(root)
        .enter().append("rect")
          .attr("x", function(d) {return x(d.key)})
          .attr("width", x.rangeBand())
          .attr("y", function(d) {return y(d.value.available_credit)})
          .attr("height", function(d) {return height - y(d.value.available_credit);})

    svg.selectAll("bar0")
        .data(root)
        .enter().append("rect")
          .attr("x", function(d) {return x(d.key)})
          .attr("width", x.rangeBand())
          .attr("y", function(d) {return y(d.value.total_balance)})
          .attr("height", function(d) {return height - y(d.value.total_balance);})
          .attr("id", function(d) {return d.value.utilization})
          .style("fill", "#234785");


    /* profile part */
    
        var th =$(".utilization");


        var uW = th.width();
        var uH = th.height();
        var xMargin = 30, yMargin = 60;

        var uX = d3.scale.linear()
                    .domain([0, utilData.length -1])
                    .range([xMargin, uW-xMargin]);
                    // .domain([0, utilData.length -1])
                    
        var uY = d3.scale.linear()
                .domain([d3.min(utilData), d3.max(utilData)])
                .range([yMargin, uH, yMargin]);


        var gradientY = d3.scale.linear()
                        .domain([d3.min(utilData), d3.max(utilData)])
                        .range([th.data("range-low-color"), th.data("range-high-color")]);

        var percentageMargin = 100 / utilData.length;
        var percentageX = d3.scale.linear()
                              .domain([0, utilData.length - 1])
                              .range([percentageMargin, 100 - percentageMargin]);

        var container = d3.select(".utilization");
        var tooltip = container
            .append("div")
            .attr("class", "chart-tooltip");


        var vis = container
                    .append("svg")
                    .attr("width", uW)
                    .attr("height", uH);

        var g = vis.append("g")
              .attr("stroke", "url(#sparkline-gradient)")
              .attr("fill", "url(#sparkline-gradient)");
            
        var line = d3.svg.line()
            .interpolate("cardinal")
            .x(function(d, i) { return uX(i); })
            .y(function(d) { return uH - uY(d); });

        g.append("svg:path").attr("d", line(utilData));

        th.find(".chart-tooltip").data({
            calcY: uY,
            calcX: uX
        });


        vis.append("svg:defs")
            .append("svg:linearGradient")
            .attr("id", "sparkline-gradient")
            .attr("x1", "0%").attr("y1", "0%").attr("x2", "100%").attr("y2", "0%")
            .attr("gradientUnits", "userSpaceOnUse")
            .selectAll(".gradient-stop")
            .data(utilData)
            .enter()
            .append("svg:stop").attr('offset', function(d, i) {
                return ((percentageX(i))) + "%";
            }).attr("style", function(d) {
                return "stop-color:" + gradientY(d) + ";stop-opacity:1";
            });



        var rect = g.selectAll(".bar-rect")
            .data(utilData)
            .enter().append("svg:rect")
            .attr("class", "bar-rect")
            .attr("x", function(d, i) { return uX(i) - (uW / utilData.length / 2) })
            .attr("y", 0)
            .attr("width", uW / utilData.length)
            .attr("height", uH)
            .on("mouseenter", function(d, i) {
                // Calculate left position
                var $tooltip = $(this).closest(".utilization").find(".chart-tooltip")
                                      .html(formatTooltip(d, i)),
                    tooltipLeft = $tooltip.data("calcX")(i) - ($tooltip.width() / 2),
                    tooltipTop = uH - $tooltip.data("calcY")(d) - 40;
                   
                    index = d;


                    for (var j=0; j<$("rect").length; j++) {
                       
                            // console.log($("rect")[j].id);
                            var check = parseFloat($("rect")[j].id);
                            // console.log(typeof index +"; " + typeof $("rect")[j].id);
                        if (check === index) {
                            console.log(d3.select($("rect")[j]));
                            d3.select($("rect")[j])
                                .style("fill", "#b5e0e1");
                        } 
                    }


                    
                
                $tooltip.css({
                            left: tooltipLeft + "px",
                            top: tooltipTop + "px"
                        }).show();

                $(this).parent().parent().find('.point:eq(' + i + ')').attr('class', 'point hover');
            }).on("mouseleave", function(d, i) {
                var $tooltip = $(this).closest(".utilization").find(".chart-tooltip");

                $tooltip.hide();

                // Remove hover class from the targeted point
                $(this).parent().parent().find('.point:eq(' + i + ')').attr('class', 'point');

                for (var j=0; j<$("rect").length; j++) {
                    if ($("rect")[j].id) {
                        d3.select($("rect")[j]) 
                        .style("fill", "#234785");   
                    }
                }
            });

        function formatTooltip(d, i) {
            return '<div class="title">' + d + '</div>'
        }
       
});

