// **** Example of how to create padding and spacing for trellis plot****
var svg = d3.select('svg');

// Hand code the svg dimensions, you can also use +svg.attr('width') or +svg.attr('height')
var svgWidth = +svg.attr('width');
var svgHeight = +svg.attr('height');

// Define a padding object
// This will space out the trellis subplots
var padding = {t: 20, r: 20, b: 60, l: 60};

// Compute the dimensions of the trellis plots, assuming a 2x2 layout matrix.
trellisWidth = svgWidth / 2 - padding.l - padding.r;
trellisHeight = svgHeight / 2 - padding.t - padding.b;

// As an example for how to layout elements with our variables
// Lets create .background rects for the trellis plots
svg.selectAll('.background')
    .data(['A', 'B', 'C', 'C']) // dummy data
    .enter()
    .append('rect') // Append 4 rectangles
    .attr('class', 'background')
    .attr('width', trellisWidth) // Use our trellis dimensions
    .attr('height', trellisHeight)
    .attr('transform', function(d, i) {
        // Position based on the matrix array indices.
        // i = 1 for column 1, row 0)
        var tx = (i % 2) * (trellisWidth + padding.l + padding.r) + padding.l;
        var ty = Math.floor(i / 2) * (trellisHeight + padding.t + padding.b) + padding.t;
        return 'translate('+[tx, ty]+')';
    });

var parseDate = d3.timeParse('%b %Y');
// To speed things up, we have already computed the domains for your scales
var dateDomain = [new Date(2000, 0), new Date(2010, 2)];
var priceDomain = [0, 223.02];


// **** How to properly load data ****

d3.csv('stock_prices.csv').then(function(dataset) {
    dataset.forEach(function(price) {
        price.date = parseDate(price.date);
    });
    var nested = d3.group(dataset, function(d) { return d.company; });

    console.log(nested);

    var trellisGroups = svg.selectAll('.trellis')
    .data(nested) // your nested data
    .enter()
    .append('g')
    .attr('class', 'trellis')
    .attr('transform', function(d, i) {
        var tx = (i % 2) * (trellisWidth + padding.l + padding.r) + padding.l;
        var ty = Math.floor(i / 2) * (trellisHeight + padding.t + padding.b) + padding.t;
        return 'translate(' + [tx, ty] + ')';
    });

    var xScale = d3.scaleTime()
        .range([0, trellisWidth])
        .domain(dateDomain);

    var yScale = d3.scaleLinear()
        .range([trellisHeight, 0])
        .domain(priceDomain);

    var xAxis = d3.axisBottom(xScale);
    var yAxis = d3.axisLeft(yScale);
        
    trellisGroups.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,' + trellisHeight + ')')
        .call(xAxis);
        
    trellisGroups.append('g')
        .attr('class', 'y axis')
        .call(yAxis);

    var companyNames = Array.from(nested.keys());
    var colorScale = d3.scaleOrdinal(d3.schemeDark2)
        .domain(companyNames);

    trellisGroups.append('text')
        .attr('class', 'company-label')
        .attr('transform', function(d, i) {
            // Calculating the center position of each subplot
            var centerX = trellisWidth / 2;
            var centerY = trellisHeight / 2;
            return 'translate(' + [centerX, centerY] + ')';
        })
        .attr('text-anchor', 'middle') // Center the text horizontally
        .style('fill', function(d) { return colorScale(d[0]); }) // Color same as the line
        .text(function(d) { return d[0]; }); // Company name

    trellisGroups.append('text')
        .attr('class', 'x axis-label')
        .attr('transform', 'translate('+[trellisWidth / 2, trellisHeight + 34]+')')
        .text('Date (by Month)');
    trellisGroups.append('text')
        .attr('class', 'y axis-label')
        .attr('transform', 'translate('+[-30, trellisHeight / 2]+') rotate(270)')
        .text('Stock Price (USD)');
    
    trellisGroups.select('.line-plot')
        .style('stroke', function(d) { return colorScale(d.key); });

    var xGrid = d3.axisTop(xScale)
        .tickSize(-trellisHeight, 0, 0)
        .tickFormat('');

    trellisGroups.append('g')
        .attr('class', 'x grid')
        .call(xGrid)
        .selectAll('.tick line')
        .attr('stroke', '#868686');

    var yGrid = d3.axisLeft(yScale)
        .tickSize(-trellisWidth, 0, 0)
        .tickFormat('');

    trellisGroups.append('g')
        .attr('class', 'y grid')
        .call(yGrid)
        .selectAll('.tick line')
        .attr('stroke', '#868686');



    trellisGroups.each(function(companyData) {
        var group = d3.select(this);
            
        var line = d3.line()
            .x(function(d) { return xScale(d.date); })
            .y(function(d) { return yScale(d.price); });
            
        group.append('path')
            .datum(companyData[1])
            .attr('class', 'line-plot')
            .attr('d', line)
            .style('stroke', function() { return colorScale(companyData[0]); }); // Use the key for color
    });

});

// Remember code outside of the data callback function will run before the data loads