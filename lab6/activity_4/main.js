let selectedCylinders = new Set();

function dataPreprocessor(row) {
    return {
        name: row['name'],
        economy: +row['economy (mpg)'],
        cylinders: +row['cylinders'],
        displacement: +row['displacement (cc)'],
        power: +row['power (hp)'],
        weight: +row['weight (lb)'],
        acceleration: +row['0-60 mph (s)'],
        year: +row['year']
    };
}

d3.csv('cars.csv', dataPreprocessor).then(function(data) {
    initScatterplot(data);
    initBarChart(data);
});

function initScatterplot(data) {
    const margin = { top: 20, right: 20, bottom: 40, left: 50 },
        width = 700 - margin.left - margin.right,
        height = 350 - margin.top - margin.bottom;

    const svg = d3.select("#scatterplot")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleLinear().range([0, width]);
    const yScale = d3.scaleLinear().range([height, 0]);

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .attr("class", "x axis");

    svg.append("g")
        .attr("class", "y axis");

    const brush = d3.brush()
        .extent([[0, 0], [width, height]])
        .on("brush", brushed)
        .on("end", brushEnded);

    svg.append("g")
        .attr("class", "brush")
        .call(brush);

    function brushed(event) {
        if (!event.selection) {
            selectedCylinders.clear();
            d3.selectAll(".bar").classed("highlighted", false);
            return;
        }
        const [[x0, y0], [x1, y1]] = event.selection;

        svg.selectAll(".dot")
            .classed("highlighted", d => x0 <= xScale(d.power) && xScale(d.power) <= x1 && y0 <= yScale(d.acceleration) && yScale(d.acceleration) <= y1);
    }

    function brushEnded(event) {
        if (!event.selection) svg.selectAll(".dot").classed("highlighted", false);
    }

    updateScatterplot(data, svg, xScale, yScale, width, height);

    d3.selectAll("#xAttrSelector, #yAttrSelector").on("change", function() {
        updateScatterplot(data, svg, xScale, yScale, width, height);
    });
}

function initBarChart(data) {
    const margin = { top: 20, right: 20, bottom: 40, left: 50 },
        width = 700 - margin.left - margin.right,
        height = 350 - margin.top - margin.bottom;

    const svg = d3.select("#barchart")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleBand().rangeRound([0, width]).padding(0.1);
    const yScale = d3.scaleLinear().range([height, 0]);

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .attr("class", "x axis");

    svg.append("g")
        .attr("class", "y axis");

    const cylindersCount = d3.rollup(data, v => v.length, d => d.cylinders);
    const cylindersData = Array.from(cylindersCount, ([key, value]) => ({ cylinder: key, count: value }));

    updateBarChart(cylindersData, svg, xScale, yScale, width, height);
}

function updateScatterplot(data, svg, xScale, yScale, width, height) {
    const xValue = d3.select("#xAttrSelector").node().value;
    const yValue = d3.select("#yAttrSelector").node().value;

    xScale.domain(d3.extent(data, d => d[xValue])).nice();
    yScale.domain(d3.extent(data, d => d[yValue])).nice();

    svg.select(".x.axis").transition().call(d3.axisBottom(xScale));
    svg.select(".y.axis").transition().call(d3.axisLeft(yScale));

    const dots = svg.selectAll(".dot")
        .data(data, d => d.name);

    dots.enter().append("circle")
        .attr("class", "dot")
        .attr("r", 3.5) 
        .merge(dots)
        .transition() 
        .attr("cx", d => xScale(d[xValue]))
        .attr("cy", d => yScale(d[yValue]))
        .style("fill", d => selectedCylinders.has(d.cylinders) ? "orange" : "#69b3a2");

    dots.exit().remove();
}

function updateBarChart(cylindersData, svg, xScale, yScale, width, height) {
    xScale.domain(cylindersData.map(d => d.cylinder));
    yScale.domain([0, d3.max(cylindersData, d => d.count)]).nice();

    svg.select(".x.axis").transition().call(d3.axisBottom(xScale));
    svg.select(".y.axis").transition().call(d3.axisLeft(yScale));

    const bars = svg.selectAll(".bar")
        .data(cylindersData, d => d.cylinder);

    bars.enter().append("rect")
        .attr("class", "bar")
        .merge(bars)
        .transition() 
        .attr("x", d => xScale(d.cylinder))
        .attr("y", d => yScale(d.count))
        .attr("width", xScale.bandwidth())
        .attr("height", d => height - yScale(d.count))
        .style("fill", d => selectedCylinders.has(d.cylinder) ? "orange" : "steelblue");

    bars.exit().remove();
}