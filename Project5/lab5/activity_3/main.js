// Global function called when select element is changed
function onCategoryChanged() {
    var select = d3.select('#categorySelect').node();
    console.log(select);
    console.log(select.selectedIndex);
    // Get current value of select element
    var category = select.options[select.selectedIndex].value;
    // Update chart with the selected category of letters
    updateChart(category);
}

// Recall that when data is loaded into memory, numbers are loaded as Strings
// This function converts numbers into Strings during data preprocessing
function dataPreprocessor(row) {
    return {
        letter: row.letter,
        frequency: +row.frequency
    };
}

var svg = d3.select('svg');

// Get layout parameters
var svgWidth = +svg.attr('width');
var svgHeight = +svg.attr('height');

var padding = {t: 60, r: 40, b: 30, l: 40};

// Compute chart dimensions
var chartWidth = svgWidth - padding.l - padding.r;
var chartHeight = svgHeight - padding.t - padding.b;

// Create a group element for appending chart elements
var chartG = svg.append('g')
    .attr('transform', 'translate('+[padding.l, padding.t]+')');

// Compute the spacing for bar bands based on all 26 letters
var barBand = chartHeight / 26;
var barHeight = barBand * 0.7;

// A map with arrays for each category of letter sets
var lettersMap = {
    'only-consonants': 'BCDFGHJKLMNPQRSTVWXZ'.split(''),
    'only-vowels': 'AEIOUY'.split(''),
    'all-letters': 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
};

var letters;
var xScale;

var main = document.getElementById('main');
d3.select(main)
        .append('p')
        .append('button')
        .style("border", "1px solid black")
        .text('Filter Data')
        .on('click', function() {
          var select = d3.select('#categorySelect').node();
          var category = select.options[select.selectedIndex].value;
          updateChart(category);
        });

d3.csv('letter_freq.csv', dataPreprocessor).then(function(dataset) {
    // Create global variables here and intialize the chart
    
    // **** Your JavaScript code goes here ****
    letters = dataset;
    var maxFrequency = d3.max(letters, function(d) { return d.frequency; });
    
    xScale = d3.scaleLinear()
        .domain([0, maxFrequency])
        .range([0, chartWidth]);
    
    svg.append('text')
        .attr('class', 'axis-label')
        .attr('transform', 'translate('+[svgWidth / 2, 30]+')')
        .text('Letter Frequency (%)');
        
    var formatPercent = function(d) {
      return d * 100 + '%';
    }
    
    svg.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate('+[padding.l, padding.t]+')')
        .call(d3.axisTop(xScale).ticks(6).tickFormat(formatPercent));

    svg.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate('+[padding.l, svgHeight - padding.b]+')')
        .call(d3.axisBottom(xScale).ticks(6).tickFormat(formatPercent));

    // Update the chart for all letters to initialize
    updateChart('all-letters');
});


function updateChart(filterKey) {
    var cutoff = parseFloat(document.getElementById('cutoff').value) / 100;
    // Create a filtered array of letters based on the filterKey
    var filteredLetters = letters.filter(function(d){
        return lettersMap[filterKey].indexOf(d.letter) >= 0 && d.frequency >= cutoff;
    });

    // **** Draw and Update your chart here ****
    
    var bars = chartG.selectAll('.bar')
        .data(filteredLetters, function(d){
            return d.letter;
        });
        
    var barsEnter = bars.enter()
        .append('g')
        .attr('class', 'bar');
        
    bars.merge(barsEnter)
        .attr('transform', function(d,i){
            return 'translate('+[0, i * barBand + 4]+')';
        });
    
    barsEnter.append('rect')
        .attr('height', barHeight)
        .attr('width', function(d){
            return xScale(d.frequency);
        });
        
    barsEnter.append('text')
        .attr('x', -20)
        .attr('dy', '0.9em')
        .text(function(d){
            return d.letter;
        });
    
    bars.exit().remove();
}

// Remember code outside of the data callback function will run before the data loads